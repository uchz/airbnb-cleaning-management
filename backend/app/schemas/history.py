from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime, time


# ============= TaskHistory Schemas (alterações de tarefas) =============

class TaskHistoryBase(BaseModel):
    task_id: int
    change_type: str


class TaskHistoryCreate(TaskHistoryBase):
    changed_by: int
    old_date: Optional[date] = None
    old_time: Optional[time] = None
    old_employee_id: Optional[int] = None
    new_date: Optional[date] = None
    new_time: Optional[time] = None
    new_employee_id: Optional[int] = None
    reason: Optional[str] = None


class TaskHistoryResponse(TaskHistoryBase):
    id: int
    changed_by: int
    old_date: Optional[date] = None
    old_time: Optional[time] = None
    old_employee_id: Optional[int] = None
    new_date: Optional[date] = None
    new_time: Optional[time] = None
    new_employee_id: Optional[int] = None
    reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class RescheduleRequest(BaseModel):
    new_date: date
    new_time: Optional[time] = None
    reason: Optional[str] = None


# ============= Histórico por apartamento =============

class HistoryChecklistItem(BaseModel):
    item_name: str
    is_checked: bool


class ApartmentHistoryItem(BaseModel):
    task_id: int
    scheduled_date: date
    scheduled_time: Optional[str] = None
    employee_id: int
    employee_name: str
    task_type: str
    status: str
    checkin_time: Optional[datetime] = None
    checkout_time: Optional[datetime] = None
    checkin_video_url: Optional[str] = None
    checkout_video_url: Optional[str] = None
    observations: Optional[str] = None
    checklist: List[HistoryChecklistItem] = []


class ApartmentHistoryResponse(BaseModel):
    apartment_id: int
    apartment_name: str
    total_cleanings: int
    completed_cleanings: int
    last_cleaning: Optional[datetime] = None
    items: List[ApartmentHistoryItem] = []