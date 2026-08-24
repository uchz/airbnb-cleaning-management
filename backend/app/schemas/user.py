from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.user import UserRole


# ============= User Schemas =============

class UserBase(BaseModel):
    username: str
    full_name: str
    phone: Optional[str] = None
    role: UserRole
    payment_info: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    username: Optional[str] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None
    payment_info: Optional[str] = None
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    id: int
    is_active: bool
    organization_id: Optional[int] = None
    organization_name: Optional[str] = None
    organization_slug: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    user_id: Optional[int] = None
    username: Optional[str] = None
    role: Optional[str] = None