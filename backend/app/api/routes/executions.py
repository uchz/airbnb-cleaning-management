from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from app.core.database import get_db
from app.api.deps import get_current_user, get_current_active_admin
from app.models.user import User, UserRole
from app.models.task import ScheduleTask, TaskStatus
from app.models.execution import TaskExecution
from app.models.history import TaskHistory
from app.models.schedule import WeeklySchedule
from app.schemas.execution import (
    CheckInRequest,
    CheckOutRequest,
    TaskExecutionResponse,
    VideoUploadResponse,
)
from app.core.storage import storage_service
from app.services.notifications import notify_task_completed
import os

router = APIRouter(prefix="/executions", tags=["Executions"])


@router.get("/task/{task_id}", response_model=TaskExecutionResponse)
def get_execution_by_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obter execução de uma tarefa"""
    execution = db.query(TaskExecution).filter(TaskExecution.task_id == task_id).first()
    if not execution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Execução não encontrada"
        )
    
    # Verificar permissão
    task = db.query(ScheduleTask).filter(ScheduleTask.id == task_id).first()
    if current_user.role == UserRole.EMPLOYEE and task.employee_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado"
        )
    
    return execution


@router.post("/checkin", response_model=TaskExecutionResponse)
async def checkin(
    task_id: int = Form(...),
    video: UploadFile = File(...),
    observations: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Check-in com vídeo de entrada
    - Grava o vídeo mostrando o estado inicial do apartamento
    - Registra o horário de entrada
    """
    # Verificar permissão e tarefa
    task = db.query(ScheduleTask).filter(ScheduleTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tarefa não encontrada")
    
    if current_user.role == UserRole.EMPLOYEE and task.employee_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso negado")
    
    # Verificar status da tarefa
    if task.status == TaskStatus.COMPLETED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tarefa já concluída")
    
    if task.status == TaskStatus.CANCELLED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tarefa cancelada")
    
    # Buscar ou criar execução
    execution = db.query(TaskExecution).filter(TaskExecution.task_id == task_id).first()
    if not execution:
        execution = TaskExecution(task_id=task_id)
        db.add(execution)
    
    # Verificar se já fez check-in
    if execution.checkin_time:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Check-in já realizado")
    
    # Ler conteúdo do vídeo
    video_content = await video.read()
    
    # Upload do vídeo para Supabase
    try:
        video_path = storage_service.upload_video(
            video_content,
            video.filename,
            folder=f"tasks/{task_id}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao fazer upload do vídeo: {str(e)}"
        )
    
    # Atualizar execução
    execution.checkin_time = datetime.utcnow()
    execution.checkin_video_path = video_path
    execution.checkin_video_url = storage_service.get_public_url(video_path)
    execution.observations = observations
    
    # Atualizar status da tarefa
    task.status = TaskStatus.IN_PROGRESS
    
    db.commit()
    db.refresh(execution)
    
    return execution


@router.post("/checkout", response_model=TaskExecutionResponse)
async def checkout(
    task_id: int = Form(...),
    video: UploadFile = File(...),
    observations: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Check-out com vídeo de saída
    - Grava o vídeo mostrando o estado final do apartamento
    - Registra o horário de saída
    - Marca a tarefa como concluída
    """
    # Verificar permissão e tarefa
    task = db.query(ScheduleTask).filter(ScheduleTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tarefa não encontrada")
    
    if current_user.role == UserRole.EMPLOYEE and task.employee_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso negado")
    
    if task.status == TaskStatus.COMPLETED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tarefa já concluída")
    
    # Buscar execução (deve ter feito check-in antes)
    execution = db.query(TaskExecution).filter(TaskExecution.task_id == task_id).first()
    if not execution or not execution.checkin_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="É necessário fazer check-in antes do check-out"
        )
    
    if execution.checkout_time:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Check-out já realizado")
    
    # Ler conteúdo do vídeo
    video_content = await video.read()
    
    # Upload do vídeo para Supabase
    try:
        video_path = storage_service.upload_video(
            video_content,
            video.filename,
            folder=f"tasks/{task_id}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao fazer upload do vídeo: {str(e)}"
        )
    
    # Atualizar execução
    execution.checkout_time = datetime.utcnow()
    execution.checkout_video_path = video_path
    execution.checkout_video_url = storage_service.get_public_url(video_path)
    if observations:
        execution.observations = observations
    
    # Marcar tarefa como concluída
    task.status = TaskStatus.COMPLETED

    # Notificar admins sobre a conclusão
    notify_task_completed(db, task, current_user)

    db.commit()
    db.refresh(execution)
    
    return execution


@router.post("/reschedule", status_code=status.HTTP_200_OK)
def reschedule_task(
    task_id: int,
    new_date: Optional[str] = None,
    new_time: Optional[str] = None,
    new_employee_id: Optional[int] = None,
    reason: str = "Reagendamento pelo administrador",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """
    Reagendar tarefa (apenas Admin)
    - Pode alterar data, horário e/ou funcionário
    - Registra histórico da alteração
    """
    task = db.query(ScheduleTask).filter(ScheduleTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tarefa não encontrada")
    
    from datetime import date as date_type, time as time_type
    from dateutil import parser
    
    old_date = task.scheduled_date
    old_time = task.scheduled_time
    old_employee = task.employee_id
    
    # Aplicar alterações
    if new_date:
        parsed_date = parser.parse(new_date).date()
        # Verificar se continua dentro da semana
        schedule = db.query(WeeklySchedule).filter(WeeklySchedule.id == task.schedule_id).first()
        if not (schedule.week_start <= parsed_date <= schedule.week_end):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A nova data está fora do período da escala"
            )
        task.scheduled_date = parsed_date
    
    if new_time:
        task.scheduled_time = parser.parse(new_time).time()
    
    if new_employee_id:
        employee = db.query(User).filter(User.id == new_employee_id).first()
        if not employee:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Funcionário não encontrado")
        task.employee_id = new_employee_id
    
    # Se ainda pendente, manter como pendente; se estava em progresso, resetar para pendente
    if task.status == TaskStatus.IN_PROGRESS:
        task.status = TaskStatus.PENDING
    
    # Registrar histórico
    history = TaskHistory(
        task_id=task.id,
        changed_by=current_user.id,
        change_type="reschedule",
        old_date=old_date,
        old_time=old_time,
        old_employee_id=old_employee,
        new_date=task.scheduled_date if new_date else None,
        new_time=task.scheduled_time if new_time else None,
        new_employee_id=new_employee_id,
        reason=reason
    )
    
    db.add(history)
    db.commit()
    db.refresh(task)
    
    return {"message": "Tarefa reagendada com sucesso", "task_id": task.id}
