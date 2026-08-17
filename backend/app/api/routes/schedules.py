from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import date
from app.core.database import get_db
from app.api.deps import get_current_active_admin, get_current_user
from app.models.user import User, UserRole
from app.models.schedule import WeeklySchedule, ScheduleStatus
from app.models.task import ScheduleTask, TaskStatus, TaskType
from app.models.apartment import Apartment
from app.schemas.schedule import (
    WeeklyScheduleCreate,
    WeeklyScheduleUpdate,
    WeeklyScheduleResponse,
    WeeklyScheduleWithTasks,
    ScheduleTaskCreate,
    ScheduleTaskUpdate,
    ScheduleTaskResponse,
    ScheduleTaskDetailResponse,
)
from app.services.notifications import notify_task_created

router = APIRouter(prefix="/schedules", tags=["Schedules"])


# ============= Task Routes (definidas antes das rotas de schedule) =============

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


@router.post("/tasks", response_model=ScheduleTaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    task_data: ScheduleTaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Criar tarefa em uma escala (apenas Admin)"""
    # Verificar se escala existe
    schedule = db.query(WeeklySchedule).filter(WeeklySchedule.id == task_data.schedule_id).first()
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Escala não encontrada"
        )

    # Verificar se a data da tarefa está dentro da semana da escala
    if not (schedule.week_start <= task_data.scheduled_date <= schedule.week_end):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A data da tarefa está fora do período da escala"
        )

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

    # Se for alterar a data, verificar se continua dentro da semana
    if "scheduled_date" in update_data and update_data["scheduled_date"]:
        schedule = db.query(WeeklySchedule).filter(WeeklySchedule.id == task.schedule_id).first()
        if not (schedule.week_start <= update_data["scheduled_date"] <= schedule.week_end):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A data da tarefa está fora do período da escala"
            )

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


# ============= Weekly Schedule Routes =============

@router.get("/", response_model=List[WeeklyScheduleResponse])
def get_all_schedules(
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[ScheduleStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Listar escalas semanais (filtro por status opcional)"""
    query = db.query(WeeklySchedule)
    if status_filter:
        query = query.filter(WeeklySchedule.status == status_filter)
    schedules = query.offset(skip).limit(limit).all()
    return schedules


@router.get("/{schedule_id}", response_model=WeeklyScheduleWithTasks)
def get_schedule_by_id(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obter escala semanal com todas as tarefas (Admin vê tudo, funcionário vê só dele)"""
    schedule = db.query(WeeklySchedule).filter(WeeklySchedule.id == schedule_id).first()
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

    schedule.tasks = tasks
    return schedule


@router.post("/", response_model=WeeklyScheduleResponse, status_code=status.HTTP_201_CREATED)
def create_schedule(
    schedule_data: WeeklyScheduleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Criar escala semanal (apenas Admin)"""
    # Verificar se já existe escala para a mesma semana
    existing = db.query(WeeklySchedule).filter(
        WeeklySchedule.week_start == schedule_data.week_start
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Já existe uma escala para esta semana"
        )

    new_schedule = WeeklySchedule(**schedule_data.model_dump())

    db.add(new_schedule)
    db.commit()
    db.refresh(new_schedule)

    return new_schedule


@router.put("/{schedule_id}", response_model=WeeklyScheduleResponse)
def update_schedule(
    schedule_id: int,
    schedule_data: WeeklyScheduleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Atualizar escala semanal (apenas Admin)"""
    schedule = db.query(WeeklySchedule).filter(WeeklySchedule.id == schedule_id).first()
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
    """Deletar escala semanal (apenas Admin)"""
    schedule = db.query(WeeklySchedule).filter(WeeklySchedule.id == schedule_id).first()
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