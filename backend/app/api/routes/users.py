from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.api.deps import get_current_active_admin, get_current_user
from app.models.user import User, UserRole
from app.models.organization import Organization
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.core.security import get_password_hash

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/", response_model=List[UserResponse])
def get_all_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Listar todos os usuários da organização (apenas Admin)"""
    org_id = current_user.organization_id or 1
    users = db.query(User).filter(User.organization_id == org_id).offset(skip).limit(limit).all()
    return users


@router.get("/employees", response_model=List[UserResponse])
def get_employees(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Listar apenas funcionários da organização (apenas Admin)"""
    org_id = current_user.organization_id or 1
    employees = db.query(User).filter(User.role == UserRole.EMPLOYEE, User.organization_id == org_id).offset(skip).limit(limit).all()
    return employees


@router.get("/me", response_model=UserResponse)
def get_current_user_info(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obter informações do usuário atual (com organização)"""
    # Carregar organização para serializar
    if current_user.organization_id:
        org = db.query(current_user.organization.__class__).filter_by(id=current_user.organization_id).first() if hasattr(current_user, 'organization') else None
        # fallback: query Organization diretamente
        from app.models.organization import Organization
        org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
        current_user.organization_name = org.name if org else None
        current_user.organization_slug = org.slug if org else None
    else:
        current_user.organization_name = None
        current_user.organization_slug = None
    return current_user


@router.get("/{user_id}", response_model=UserResponse)
def get_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Obter usuário por ID (apenas Admin, mesma organização)"""
    org_id = current_user.organization_id or 1
    user = db.query(User).filter(User.id == user_id, User.organization_id == org_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    return user


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Atualizar usuário (apenas Admin, mesma organização)"""
    org_id = current_user.organization_id or 1
    user = db.query(User).filter(User.id == user_id, User.organization_id == org_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    # Atualizar campos
    update_data = user_data.model_dump(exclude_unset=True)
    
    if "password" in update_data and update_data["password"]:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
    
    for field, value in update_data.items():
        setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Deletar usuário (apenas Admin, mesma organização)"""
    org_id = current_user.organization_id or 1
    user = db.query(User).filter(User.id == user_id, User.organization_id == org_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    db.delete(user)
    db.commit()
    
    return None
