from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Dict, Any
import json

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models import User, AccessLog, ScheduleTask, TaskExecution, Notification
from app.core.storage import storage_service

router = APIRouter()


@router.post("/consent")
async def save_consent(
    consent_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Salva consentimento LGPD do usuário"""
    if consent_data.get("privacy_consent"):
        current_user.privacy_consent_at = datetime.utcnow()
    
    if consent_data.get("video_consent"):
        current_user.video_consent_at = datetime.utcnow()
    
    db.commit()
    
    return {
        "message": "Consentimento registrado com sucesso",
        "privacy_consent_at": current_user.privacy_consent_at,
        "video_consent_at": current_user.video_consent_at
    }


@router.get("/me/data")
async def get_my_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retorna todos os dados do usuário (direito de acesso LGPD)"""
    
    # Dados pessoais
    user_data = {
        "id": current_user.id,
        "username": current_user.username,
        "full_name": current_user.full_name,
        "phone": current_user.phone,
        "role": current_user.role,
        "payment_info": current_user.payment_info,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
        "privacy_consent_at": current_user.privacy_consent_at.isoformat() if current_user.privacy_consent_at else None,
        "video_consent_at": current_user.video_consent_at.isoformat() if current_user.video_consent_at else None,
    }
    
    # Tarefas atribuídas
    tasks = db.query(ScheduleTask).filter(
        ScheduleTask.employee_id == current_user.id
    ).all()
    
    tasks_data = []
    for task in tasks:
        task_info = {
            "id": task.id,
            "scheduled_date": task.scheduled_date.isoformat() if task.scheduled_date else None,
            "scheduled_time": str(task.scheduled_time) if task.scheduled_time else None,
            "task_type": task.task_type,
            "status": task.status,
            "apartment": task.apartment.name if task.apartment else None,
            "notes": task.notes
        }
        
        if task.execution:
            task_info["execution"] = {
                "checkin_time": task.execution.checkin_time.isoformat() if task.execution.checkin_time else None,
                "checkout_time": task.execution.checkout_time.isoformat() if task.execution.checkout_time else None,
                "checkin_video_url": task.execution.checkin_video_url,
                "checkout_video_url": task.execution.checkout_video_url,
                "observations": task.execution.observations
            }
        
        tasks_data.append(task_info)
    
    # Notificações
    notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).all()
    
    notifications_data = [{
        "id": n.id,
        "title": n.title,
        "message": n.message,
        "type": n.notification_type,
        "created_at": n.created_at.isoformat() if n.created_at else None,
        "is_read": n.is_read
    } for n in notifications]
    
    return {
        "user": user_data,
        "tasks": tasks_data,
        "notifications": notifications_data
    }


@router.get("/me/export")
async def export_my_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Exporta todos os dados do usuário em formato JSON (portabilidade LGPD)"""
    
    data = await get_my_data(current_user=current_user, db=db)
    
    # Adiciona metadados
    export_data = {
        "export_date": datetime.utcnow().isoformat(),
        "data_controller": "Verus Sweeply - GIOVANNA DE AZEVEDO DA SILVA",
        "cnpj": "59.608.874/0001-XX",
        "user_data": data
    }
    
    return export_data


@router.delete("/me/account")
async def request_account_deletion(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Solicita exclusão definitiva da conta (direito ao esquecimento LGPD)"""
    
    # Verificar se é o único admin da organização
    if current_user.role == "admin":
        admin_count = db.query(User).filter(
            User.organization_id == current_user.organization_id,
            User.role == "admin",
            User.deleted_at == None
        ).count()
        
        if admin_count <= 1:
            raise HTTPException(
                status_code=400,
                detail="Você é o único administrador. Adicione outro administrador antes de excluir sua conta."
            )
    
    # Marcar para exclusão (soft delete)
    current_user.deleted_at = datetime.utcnow()
    current_user.deletion_scheduled_for = datetime.utcnow() + timedelta(days=30)
    current_user.is_active = False
    
    # Deletar vídeos do usuário
    tasks = db.query(ScheduleTask).filter(
        ScheduleTask.employee_id == current_user.id
    ).all()
    
    for task in tasks:
        if task.execution:
            if task.execution.checkin_video_path:
                storage_service.delete_video(task.execution.checkin_video_path)
                task.execution.checkin_video_url = "[DELETADO - LGPD]"
                task.execution.checkin_video_path = None
            
            if task.execution.checkout_video_path:
                storage_service.delete_video(task.execution.checkout_video_path)
                task.execution.checkout_video_url = "[DELETADO - LGPD]"
                task.execution.checkout_video_path = None
    
    db.commit()
    
    return {
        "message": "Solicitação de exclusão registrada. Sua conta será permanentemente deletada em 30 dias.",
        "deletion_scheduled_for": current_user.deletion_scheduled_for.isoformat()
    }


@router.post("/me/cancel-deletion")
async def cancel_account_deletion(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancela solicitação de exclusão da conta"""
    
    if not current_user.deleted_at:
        raise HTTPException(status_code=400, detail="Não há solicitação de exclusão pendente")
    
    # Verificar se ainda está dentro do prazo
    if datetime.utcnow() > current_user.deletion_scheduled_for:
        raise HTTPException(status_code=400, detail="Prazo de cancelamento expirado")
    
    current_user.deleted_at = None
    current_user.deletion_scheduled_for = None
    current_user.is_active = True
    
    db.commit()
    
    return {"message": "Exclusão cancelada com sucesso"}


@router.get("/me/access-logs")
async def get_my_access_logs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 100
):
    """Retorna logs de acesso aos dados do usuário (auditoria LGPD)"""
    
    # Logs onde o usuário é o objeto (resource)
    logs = db.query(AccessLog).filter(
        AccessLog.resource_type == "user_data",
        AccessLog.resource_id == str(current_user.id)
    ).order_by(AccessLog.timestamp.desc()).limit(limit).all()
    
    logs_data = [{
        "action": log.action,
        "accessed_by": log.user.full_name if log.user else "Sistema",
        "timestamp": log.timestamp.isoformat() if log.timestamp else None,
        "ip_address": log.ip_address
    } for log in logs]
    
    return {"logs": logs_data}


def log_access(
    db: Session,
    user_id: int,
    action: str,
    resource_type: str,
    resource_id: str = None,
    ip_address: str = None,
    organization_id: int = None
):
    """Helper para registrar logs de acesso"""
    log = AccessLog(
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        ip_address=ip_address,
        organization_id=organization_id
    )
    db.add(log)
    db.commit()
