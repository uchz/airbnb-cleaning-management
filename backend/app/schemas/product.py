from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ProductBase(BaseModel):
    name: str
    quantity: float = 0
    unit: str = "un"
    min_quantity: float = 0
    observations: Optional[str] = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    min_quantity: Optional[float] = None
    observations: Optional[str] = None


class ProductResponse(ProductBase):
    id: int
    is_low_stock: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True