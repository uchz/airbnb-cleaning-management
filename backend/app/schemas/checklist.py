from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# ============= ChecklistTemplate Schemas =============

class ChecklistTemplateBase(BaseModel):
    item_name: str
    order: int = 0


class ChecklistTemplateCreate(ChecklistTemplateBase):
    apartment_id: int


class ChecklistTemplateResponse(ChecklistTemplateBase):
    id: int
    apartment_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============= ChecklistItem Schemas =============

class ChecklistItemBase(BaseModel):
    item_name: str
    is_checked: bool = False


class ChecklistItemCreate(ChecklistItemBase):
    task_id: int


class ChecklistItemUpdate(BaseModel):
    is_checked: bool


class ChecklistItemResponse(ChecklistItemBase):
    id: int
    task_id: int
    checked_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
