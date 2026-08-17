from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date, time
from app.models.schedule import ScheduleStatus
from app.models.task import TaskType, TaskStatus


# ============= Schedule Schemas =============

class WeeklyScheduleBase(BaseModel):
    week_start: date  # Sábado
    week_end: date  # Sexta
    notes: Optional[str] = None


class WeeklyScheduleCreate(WeeklyScheduleBase):
    pass


class WeeklyScheduleUpdate(BaseModel):
    notes: Optional[str] = None
    status: Optional[ScheduleStatus] = None


class WeeklyScheduleResponse(WeeklyScheduleBase):
    id: int
    status: ScheduleStatus
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# ============= Task Schemas =============

class ScheduleTaskBase(BaseModel):
    schedule_id: int
    employee_id: int
    apartment_id: int
    scheduled_date: date
    scheduled_time: time
    task_type: TaskType
    notes: Optional[str] = None


class ScheduleTaskCreate(ScheduleTaskBase):
    pass


class ScheduleTaskUpdate(BaseModel):
    employee_id: Optional[int] = None
    apartment_id: Optional[int] = None
    scheduled_date: Optional[date] = None
    scheduled_time: Optional[time] = None
    task_type: Optional[TaskType] = None
    status: Optional[TaskStatus] = None
    notes: Optional[str] = None


class ScheduleTaskResponse(ScheduleTaskBase):
    id: int
    status: TaskStatus
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# Resposta com dados relacionados (employee, apartment)
class ScheduleTaskDetailResponse(ScheduleTaskResponse):
    employee_name: Optional[str] = None
    apartment_name: Optional[str] = None
    apartment_address: Optional[str] = None


class WeeklyScheduleWithTasks(WeeklyScheduleResponse):
    tasks: List[ScheduleTaskDetailResponse] = []
