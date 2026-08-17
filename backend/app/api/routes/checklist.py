from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.core.database import get_db
from app.api.deps import get_current_user, get_current_active_admin
from app.models.user import User
from app.models.checklist import ChecklistTemplate, ChecklistItem
from app.models.task import ScheduleTask
from app.schemas.checklist import (
    ChecklistTemplateCreate,
    ChecklistTemplateResponse,
    ChecklistItemCreate,
    ChecklistItemUpdate,
    ChecklistItemResponse,
)

router = APIRouter(prefix="/checklist", tags=["Checklist"])


# ============= Checklist Templates (Admin) =============

@router.post("/templates", response_model=ChecklistTemplateResponse, status_code=status.HTTP_201_CREATED)
def create_template(
    data: ChecklistTemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Criar item de template de checklist para um apartamento (apenas Admin)"""
    template = ChecklistTemplate(**data.model_dump())
    db.add(template)
    db.commit()
    db.refresh(template)
    return template


@router.get("/templates/apartment/{apartment_id}", response_model=List[ChecklistTemplateResponse])
def get_apartment_templates(
    apartment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Listar templates de checklist de um apartamento"""
    templates = db.query(ChecklistTemplate).filter(
        ChecklistTemplate.apartment_id == apartment_id
    ).order_by(ChecklistTemplate.order).all()
    return templates


@router.delete("/templates/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Deletar item de template (apenas Admin)"""
    template = db.query(ChecklistTemplate).filter(ChecklistTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template não encontrado")
    db.delete(template)
    db.commit()
    return None


# ============= Checklist Items (Execução da tarefa) =============

@router.get("/tasks/{task_id}/items", response_model=List[ChecklistItemResponse])
def get_task_checklist(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obter checklist de uma tarefa (cria automaticamente se não existir)"""
    task = db.query(ScheduleTask).filter(ScheduleTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tarefa não encontrada")
    
    # Verificar se já existem itens
    existing_items = db.query(ChecklistItem).filter(ChecklistItem.task_id == task_id).all()
    if existing_items:
        return existing_items
    
    # Se não existir, criar a partir do template do apartamento
    templates = db.query(ChecklistTemplate).filter(
        ChecklistTemplate.apartment_id == task.apartment_id
    ).order_by(ChecklistTemplate.order).all()
    
    items = []
    for template in templates:
        item = ChecklistItem(
            task_id=task_id,
            item_name=template.item_name,
            is_checked=False
        )
        db.add(item)
        items.append(item)
    
    if items:
        db.commit()
        for item in items:
            db.refresh(item)
    
    return items


@router.patch("/items/{item_id}", response_model=ChecklistItemResponse)
def update_checklist_item(
    item_id: int,
    data: ChecklistItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Marcar/desmarcar item do checklist"""
    item = db.query(ChecklistItem).filter(ChecklistItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item não encontrado")
    
    item.is_checked = data.is_checked
    if data.is_checked:
        item.checked_at = datetime.utcnow()
    else:
        item.checked_at = None
    
    db.commit()
    db.refresh(item)
    return item
