from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# ============= Execution Schemas =============

class TaskExecutionBase(BaseModel):
    task_id: int
    observations: Optional[str] = None


class CheckInRequest(BaseModel):
    task_id: int
    observations: Optional[str] = None


class CheckOutRequest(BaseModel):
    task_id: int
    observations: Optional[str] = None


class TaskExecutionResponse(BaseModel):
    id: int
    task_id: int
    checkin_time: Optional[datetime] = None
    checkin_video_url: Optional[str] = None
    checkout_time: Optional[datetime] = None
    checkout_video_url: Optional[str] = None
    observations: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class VideoUploadResponse(BaseModel):
    success: bool
    message: str
    video_url: Optional[str] = None
