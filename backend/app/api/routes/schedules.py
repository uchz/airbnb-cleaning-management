from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import date, timedelta
from app.core.database import get_db
from app.api.deps import get_current_active_admin, get_current_user
from app.models.user import User, UserRole
from app.models.schedule import Schedule, ScheduleStatus, ScheduleType
from app.models.task import ScheduleTask, TaskStatus, TaskType
from app.models.apartment import Apartment
from app.schemas.schedule import (
    ScheduleCreate,
    ScheduleUpdate,
    ScheduleResponse,
    ScheduleWithTasks,
    ScheduleTaskCreate,
    ScheduleTaskUpdate,
    ScheduleTaskResponse,
    ScheduleTaskDetailResponse,
)
from app.services.notifications import notify_task_created

router = APIRouter(prefix="/schedules", tags=["Schedules"])


# ============= Task Routes =============

@router.get("/tasks/all", response_model=List[ScheduleTaskDetailResponse])
def get_all_tasks(
    skip: int = 0,
    limit: int = 100,
    employee_id: Optional[int] = None,
    apartment_id: Optional[int] = None,
    status_filter: Optional[TaskStatus] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Listar todas as tarefas com filtros"""
    query = db.query(ScheduleTask)

    # Funcionário só vê as próprias tarefas
    if current_user.role == UserRole.EMPLOYEE:
        query = query.filter(ScheduleTask.employee_id == current_user.id)

    # Aplicar filtros
    if employee_id and current_user.role == UserRole.ADMIN:
        query = query.filter(ScheduleTask.employee_id == employee_id)
    if apartment_id:
        query = query.filter(ScheduleTask.apartment_id == apartment_id)
    if status_filter:
        query = query.filter(ScheduleTask.status == status_filter)
    if start_date:
        query = query.filter(ScheduleTask.scheduled_date >= start_date)
    if end_date:
        query = query.filter(ScheduleTask.scheduled_date <= end_date)

    tasks = query.options(
        joinedload(ScheduleTask.employee),
        joinedload(ScheduleTask.apartment)
    ).order_by(ScheduleTask.scheduled_date, ScheduleTask.scheduled_time).offset(skip).limit(limit).all()

    # Converter para response com dados relacionados
    result = []
    for task in tasks:
        task_detail = ScheduleTaskDetailResponse(
            **task.__dict__,
            employee_name=task.employee.full_name if task.employee else None,
            apartment_name=task.apartment.name if task.apartment else None,
            apartment_address=task.apartment.address if task.apartment else None
        )
        result.append(task_detail)

    return result


@router.get("/tasks/{task_id}", response_model=ScheduleTaskDetailResponse)
def get_task_by_id(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obter tarefa por ID"""
    task = db.query(ScheduleTask).filter(ScheduleTask.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tarefa não encontrada"
        )

    # Funcionário só pode ver as próprias tarefas
    if current_user.role == UserRole.EMPLOYEE and task.employee_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado. Esta tarefa não é sua."
        )

    task_detail = ScheduleTaskDetailResponse(
        **task.__dict__,
        employee_name=task.employee.full_name if task.employee else None,
        apartment_name=task.apartment.name if task.apartment else None,
        apartment_address=task.apartment.address if task.apartment else None
    )

    return task_detail


def _validate_task_dates(db: Session, task_data, schedule_id: Optional[int]):
    """Validar se a data da tarefa está dentro do período da escala (se houver)"""
    if schedule_id:
        schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
        if not schedule:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Escala não encontrada"
            )
        
        if schedule.schedule_type == "weekly":
            if not (schedule.start_date <= task_data.scheduled_date <= schedule.end_date):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="A data da tarefa está fora do período da escala semanal"
                )
        elif schedule.schedule_type == "date_range":
            if not (schedule.start_date <= task_data.scheduled_date <= schedule.end_date):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="A data da tarefa está fora do período da escala"
                )
        # AD_HOC não tem validação de período


@router.post("/tasks", response_model=ScheduleTaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    task_data: ScheduleTaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Criar tarefa (pode ser avulsa ou vinculada a uma escala)"""
    # Validar escala se fornecida
    if task_data.schedule_id:
        _validate_task_dates(db, task_data, task_data.schedule_id)

    # Verificar se funcionário existe
    employee = db.query(User).filter(User.id == task_data.employee_id).first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Funcionário não encontrado"
        )

    # Verificar se apartamento existe
    apartment = db.query(Apartment).filter(Apartment.id == task_data.apartment_id).first()
    if not apartment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Apartamento não encontrado"
        )

    new_task = ScheduleTask(**task_data.model_dump())

    db.add(new_task)
    db.flush()  # garante task.id antes de criar notificação

    # Notificar funcionário sobre a nova tarefa
    notify_task_created(db, new_task)

    db.commit()
    db.refresh(new_task)

    return new_task


@router.put("/tasks/{task_id}", response_model=ScheduleTaskResponse)
def update_task(
    task_id: int,
    task_data: ScheduleTaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Atualizar tarefa (apenas Admin)"""
    task = db.query(ScheduleTask).filter(ScheduleTask.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tarefa não encontrada"
        )

    update_data = task_data.model_dump(exclude_unset=True)

    # Se for alterar a data ou schedule_id, validar
    new_schedule_id = update_data.get("schedule_id", task.schedule_id)
    new_date = update_data.get("scheduled_date", task.scheduled_date)
    
    if "schedule_id" in update_data or "scheduled_date" in update_data:
        if new_schedule_id is not None:
            _validate_task_dates(db, task_data, new_schedule_id)

    for field, value in update_data.items():
        setattr(task, field, value)

    db.commit()
    db.refresh(task)

    return task


@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Deletar tarefa (apenas Admin)"""
    task = db.query(ScheduleTask).filter(ScheduleTask.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tarefa não encontrada"
        )

    db.delete(task)
    db.commit()

    return None


# ============= Schedule Routes =============

@router.get("/", response_model=List[ScheduleResponse])
def get_all_schedules(
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[str] = None,
    schedule_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Listar escalas (filtro por status e tipo opcional)"""
    query = db.query(Schedule)
    if status_filter:
        query = query.filter(Schedule.status == status_filter)
    if schedule_type:
        query = query.filter(Schedule.schedule_type == schedule_type)
    schedules = query.offset(skip).limit(limit).all()
    return schedules


@router.get("/{schedule_id}", response_model=ScheduleResponse)
def get_schedule_by_id(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obter escala por ID (sem tarefas - use /tasks/all com filtro schedule_id)"""
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Escala não encontrada"
        )
    return schedule


@router.get("/{schedule_id}/with-tasks")
def get_schedule_with_tasks(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obter escala com todas as tarefas (Admin vê tudo, funcionário vê só dele)"""
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Escala não encontrada"
        )

    # Carregar tarefas com dados relacionados
    query = db.query(ScheduleTask).filter(ScheduleTask.schedule_id == schedule_id)

    # Se for funcionário, filtra só as tarefas dele
    if current_user.role == UserRole.EMPLOYEE:
        query = query.filter(ScheduleTask.employee_id == current_user.id)

    tasks = query.options(
        joinedload(ScheduleTask.employee),
        joinedload(ScheduleTask.apartment)
    ).all()

    # Retornar schedule + tasks manualmente
    return {
        **schedule.__dict__,
        "tasks": [
            {
                **task.__dict__,
                "employee_name": task.employee.full_name if task.employee else None,
                "apartment_name": task.apartment.name if task.apartment else None,
                "apartment_address": task.apartment.address if task.apartment else None
            }
            for task in tasks
        ]
    }


@router.post("/", response_model=ScheduleResponse, status_code=status.HTTP_201_CREATED)
def create_schedule(
    schedule_data: ScheduleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Criar escala (semanal, por período, ou avulsa)"""
    # Para weekly, garantir unicidade por semana
    if schedule_data.schedule_type == "weekly" and schedule_data.start_date:
        existing = db.query(Schedule).filter(
            Schedule.schedule_type == ScheduleType.WEEKLY,
            Schedule.start_date == schedule_data.start_date
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Já existe uma escala semanal para esta semana"
            )

    new_schedule = Schedule(**schedule_data.model_dump())

    db.add(new_schedule)
    db.commit()
    db.refresh(new_schedule)

    return new_schedule


@router.post("/{schedule_id}/duplicate", response_model=ScheduleResponse, status_code=status.HTTP_201_CREATED)
def duplicate_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Duplicar escala para o próximo período (mesma duração, mesmas tarefas deslocadas)"""
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Escala não encontrada"
        )
    if not schedule.start_date or not schedule.end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Escala sem período definido não pode ser duplicada"
        )

    tasks = db.query(ScheduleTask).filter(ScheduleTask.schedule_id == schedule_id).all()

    length = (schedule.end_date - schedule.start_date).days + 1
    new_start = schedule.end_date + timedelta(days=1)
    new_end = new_start + timedelta(days=length - 1)
    delta = new_start - schedule.start_date

    # Verificar se já não existe escala nesse novo período (qualquer tipo com datas iguais)
    clash = db.query(Schedule).filter(
        Schedule.start_date == new_start,
        Schedule.end_date == new_end,
    ).first()
    if clash:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Já existe escala de {new_start.strftime('%d/%m')} a {new_end.strftime('%d/%m')}"
        )

    new_schedule = Schedule(
        schedule_type=schedule.schedule_type,
        start_date=new_start,
        end_date=new_end,
        notes=schedule.notes,
    )
    db.add(new_schedule)
    db.flush()

    for t in tasks:
        db.add(ScheduleTask(
            schedule_id=new_schedule.id,
            employee_id=t.employee_id,
            apartment_id=t.apartment_id,
            scheduled_date=t.scheduled_date + delta,
            scheduled_time=t.scheduled_time,
            task_type=t.task_type,
            notes=t.notes,
        ))

    db.flush()
    for t in db.query(ScheduleTask).filter(ScheduleTask.schedule_id == new_schedule.id).all():
        notify_task_created(db, t)

    db.commit()
    db.refresh(new_schedule)
    return new_schedule


@router.put("/{schedule_id}", response_model=ScheduleResponse)
def update_schedule(
    schedule_id: int,
    schedule_data: ScheduleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Atualizar escala (apenas Admin)"""
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Escala não encontrada"
        )

    update_data = schedule_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(schedule, field, value)

    db.commit()
    db.refresh(schedule)

    return schedule


@router.delete("/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Deletar escala (apenas Admin)"""
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Escala não encontrada"
        )

    # Verificar se há tarefas
    task_count = db.query(ScheduleTask).filter(ScheduleTask.schedule_id == schedule_id).count()
    if task_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não é possível deletar escala com tarefas. Deletar as tarefas primeiro."
        )

    db.delete(schedule)
    db.commit()

    return None