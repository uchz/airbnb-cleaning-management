from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.api.deps import get_current_active_admin, get_current_user
from app.models.apartment import Apartment
from app.models.user import User
from app.models.task import ScheduleTask, TaskStatus
from app.models.checklist import ChecklistItem
from app.schemas.apartment import ApartmentCreate, ApartmentUpdate, ApartmentResponse
from app.schemas.history import ApartmentHistoryResponse, ApartmentHistoryItem, HistoryChecklistItem

router = APIRouter(prefix="/apartments", tags=["Apartments"])


@router.get("/", response_model=List[ApartmentResponse])
def get_all_apartments(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Listar todos os apartamentos (da organização)"""
    org_id = current_user.organization_id or 1
    apartments = db.query(Apartment).filter(Apartment.organization_id == org_id).offset(skip).limit(limit).all()
    return apartments


@router.get("/{apartment_id}", response_model=ApartmentResponse)
def get_apartment_by_id(
    apartment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obter apartamento por ID"""
    org_id = current_user.organization_id or 1
    apartment = db.query(Apartment).filter(Apartment.id == apartment_id, Apartment.organization_id == org_id).first()
    if not apartment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Apartamento não encontrado"
        )
    return apartment


@router.get("/{apartment_id}/history", response_model=ApartmentHistoryResponse)
def get_apartment_history(
    apartment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Histórico de limpezas de um apartamento"""
    org_id = current_user.organization_id or 1
    apartment = db.query(Apartment).filter(Apartment.id == apartment_id, Apartment.organization_id == org_id).first()
    if not apartment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Apartamento não encontrado"
        )

    tasks = db.query(ScheduleTask).filter(
        ScheduleTask.apartment_id == apartment_id
    ).order_by(ScheduleTask.scheduled_date.desc()).all()

    items = []
    for task in tasks:
        exec_data = task.execution
        checklist = db.query(ChecklistItem).filter(
            ChecklistItem.task_id == task.id
        ).all()
        items.append(ApartmentHistoryItem(
            task_id=task.id,
            scheduled_date=task.scheduled_date,
            scheduled_time=str(task.scheduled_time)[:5] if task.scheduled_time else None,
            employee_id=task.employee_id,
            employee_name=task.employee.full_name if task.employee else "Removido",
            task_type=task.task_type.value,
            status=task.status.value,
            checkin_time=exec_data.checkin_time if exec_data else None,
            checkout_time=exec_data.checkout_time if exec_data else None,
            checkin_video_url=exec_data.checkin_video_url if exec_data else None,
            checkout_video_url=exec_data.checkout_video_url if exec_data else None,
            observations=exec_data.observations if exec_data else None,
            checklist=[
                HistoryChecklistItem(item_name=c.item_name, is_checked=c.is_checked)
                for c in checklist
            ],
        ))

    completed = sum(1 for i in items if i.status == TaskStatus.COMPLETED.value)
    last_checkout = None
    for task in tasks:
        if task.execution and task.execution.checkout_time:
            if last_checkout is None or task.execution.checkout_time > last_checkout:
                last_checkout = task.execution.checkout_time

    return ApartmentHistoryResponse(
        apartment_id=apartment.id,
        apartment_name=apartment.name,
        total_cleanings=len(items),
        completed_cleanings=completed,
        last_cleaning=last_checkout,
        items=items,
    )


@router.post("/", response_model=ApartmentResponse, status_code=status.HTTP_201_CREATED)
def create_apartment(
    apartment_data: ApartmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Criar novo apartamento (apenas Admin)"""
    org_id = current_user.organization_id or 1
    new_apartment = Apartment(**apartment_data.model_dump(), organization_id=org_id)
    
    db.add(new_apartment)
    db.commit()
    db.refresh(new_apartment)
    
    return new_apartment


@router.put("/{apartment_id}", response_model=ApartmentResponse)
def update_apartment(
    apartment_id: int,
    apartment_data: ApartmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Atualizar apartamento (apenas Admin)"""
    org_id = current_user.organization_id or 1
    apartment = db.query(Apartment).filter(Apartment.id == apartment_id, Apartment.organization_id == org_id).first()
    if not apartment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Apartamento não encontrado"
        )
    
    # Atualizar campos
    update_data = apartment_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(apartment, field, value)
    
    db.commit()
    db.refresh(apartment)
    
    return apartment


@router.delete("/{apartment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_apartment(
    apartment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Deletar apartamento (apenas Admin)"""
    org_id = current_user.organization_id or 1
    apartment = db.query(Apartment).filter(Apartment.id == apartment_id, Apartment.organization_id == org_id).first()
    if not apartment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Apartamento não encontrado"
        )
    
    db.delete(apartment)
    db.commit()
    
    return None
