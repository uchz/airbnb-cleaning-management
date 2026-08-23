from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import re
from app.core.database import get_db
from app.api.deps import get_current_user, get_current_active_admin
from app.models.organization import Organization
from app.models.user import User, UserRole
from app.schemas.organization import OrganizationCreate, OrganizationUpdate, OrganizationResponse, SignupOrgRequest
from app.schemas.user import Token
from app.core.security import get_password_hash, create_access_token
from datetime import timedelta
from app.core.config import settings

router = APIRouter(prefix="/organizations", tags=["Organizations"])


def _slugify(name: str) -> str:
    slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
    return slug or "org"


@router.get("/me", response_model=OrganizationResponse)
def get_my_organization(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obter organização do usuário logado"""
    org_id = current_user.organization_id or 1
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organização não encontrada")
    return org


@router.get("/", response_model=List[OrganizationResponse])
def list_organizations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Listar organizações (apenas para debug/admin global - filtra pela do usuário por enquanto)"""
    # MVP: retorna apenas a org do usuário
    org_id = current_user.organization_id or 1
    org = db.query(Organization).filter(Organization.id == org_id).first()
    return [org] if org else []


@router.post("/", response_model=OrganizationResponse, status_code=status.HTTP_201_CREATED)
def create_organization(
    org_data: OrganizationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Criar nova organização (apenas admin) - para testes"""
    existing = db.query(Organization).filter(Organization.slug == org_data.slug).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Slug já em uso")
    org = Organization(**org_data.model_dump())
    db.add(org)
    db.commit()
    db.refresh(org)
    return org


@router.post("/signup", response_model=Token, status_code=status.HTTP_201_CREATED)
def signup_organization(
    data: SignupOrgRequest,
    db: Session = Depends(get_db)
):
    """Onboarding self-service: cria organização + admin em um passo (sem auth)"""
    slug = _slugify(data.org_slug or data.org_name)
    if db.query(Organization).filter(Organization.slug == slug).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nome da organização já em uso, tente outro slug")
    if db.query(User).filter(User.username == data.admin_username).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Usuário já cadastrado")

    org = Organization(name=data.org_name, slug=slug)
    db.add(org)
    db.flush()

    admin = User(
        organization_id=org.id,
        username=data.admin_username,
        hashed_password=get_password_hash(data.admin_password),
        full_name=data.admin_full_name,
        phone=data.admin_phone,
        role=UserRole.ADMIN,
        is_active=True
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(admin.id), "username": admin.username, "role": admin.role.value},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.put("/{org_id}", response_model=OrganizationResponse)
def update_organization(
    org_id: int,
    org_data: OrganizationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Atualizar organização (apenas da própria org)"""
    if (current_user.organization_id or 1) != org_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso negado a outra organização")
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organização não encontrada")
    update_data = org_data.model_dump(exclude_unset=True)
    if "slug" in update_data and update_data["slug"]:
        update_data["slug"] = _slugify(update_data["slug"])
        if db.query(Organization).filter(Organization.slug == update_data["slug"], Organization.id != org_id).first():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Slug já em uso")
    for field, value in update_data.items():
        setattr(org, field, value)
    db.commit()
    db.refresh(org)
    return org
