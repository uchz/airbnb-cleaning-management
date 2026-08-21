from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime, date, time
from app.models.schedule import ScheduleStatus, ScheduleType
from app.models.task import TaskType, TaskStatus


# ============= Schedule Schemas =============

class ScheduleBase(BaseModel):
    schedule_type: ScheduleType = ScheduleType.WEEKLY
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    notes: Optional[str] = None

    @field_validator('start_date', 'end_date', mode='before')
    @classmethod
    def validate_dates(cls, v, info):
        if info.data.get('schedule_type') == ScheduleType.WEEKLY:
            if v is None:
                raise ValueError('start_date e end_date são obrigatórios para escala semanal')
        return v


class ScheduleCreate(ScheduleBase):
    pass


class ScheduleUpdate(BaseModel):
    schedule_type: Optional[ScheduleType] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    notes: Optional[str] = None
    status: Optional[ScheduleStatus] = None


class ScheduleResponse(ScheduleBase):
    id: int
    status: ScheduleStatus
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# ============= Task Schemas =============

class ScheduleTaskBase(BaseModel):
    schedule_id: Optional[int] = None
    employee_id: int
    apartment_id: int
    scheduled_date: date
    scheduled_time: time
    task_type: TaskType
    notes: Optional[str] = None


class ScheduleTaskCreate(ScheduleTaskBase):
    pass


class ScheduleTaskUpdate(BaseModel):
    schedule_id: Optional[int] = None
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


class ScheduleWithTasks(ScheduleResponse):
    tasks: List[ScheduleTaskDetailResponse] = []