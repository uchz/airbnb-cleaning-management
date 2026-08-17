from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# ============= Apartment Schemas =============

class ApartmentBase(BaseModel):
    name: str
    address: str
    address_complement: Optional[str] = None
    city: str
    state: Optional[str] = None
    zipcode: Optional[str] = None
    estimated_cleaning_time: Optional[int] = None  # em minutos
    observations: Optional[str] = None


class ApartmentCreate(ApartmentBase):
    pass


class ApartmentUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    address_complement: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zipcode: Optional[str] = None
    estimated_cleaning_time: Optional[int] = None
    observations: Optional[str] = None


class ApartmentResponse(ApartmentBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
