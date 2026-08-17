from sqlalchemy import Column, Integer, String, Date, Time, DateTime, ForeignKey, Enum as SQLEnum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class TaskType(str, enum.Enum):
    FULL_DAY = "full_day"  # Diária inteira
    HALF_DAY = "half_day"  # Meia diária


class TaskStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class ScheduleTask(Base):
    """Tarefa individual de limpeza dentro de uma escala"""
    __tablename__ = "schedule_tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Relacionamentos
    schedule_id = Column(Integer, ForeignKey("weekly_schedules.id"), nullable=False)
    employee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    apartment_id = Column(Integer, ForeignKey("apartments.id"), nullable=False)
    
    # Detalhes da tarefa
    scheduled_date = Column(Date, nullable=False, index=True)
    scheduled_time = Column(Time, nullable=False)
    task_type = Column(SQLEnum(TaskType), nullable=False)
    status = Column(SQLEnum(TaskStatus), default=TaskStatus.PENDING, index=True)
    
    # Observações
    notes = Column(Text)
    
    # Relacionamentos
    schedule = relationship("WeeklySchedule", back_populates="tasks")
    employee = relationship("User", foreign_keys=[employee_id])
    apartment = relationship("Apartment")
    execution = relationship("TaskExecution", back_populates="task", uselist=False)
    history = relationship("TaskHistory", back_populates="task")
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
