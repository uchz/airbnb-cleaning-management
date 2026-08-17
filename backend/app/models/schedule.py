from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class ScheduleStatus(str, enum.Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class WeeklySchedule(Base):
    """Escala semanal (Sábado a Sexta)"""
    __tablename__ = "weekly_schedules"
    
    id = Column(Integer, primary_key=True, index=True)
    week_start = Column(Date, nullable=False, index=True)  # Data do sábado inicial
    week_end = Column(Date, nullable=False)  # Data da sexta final
    status = Column(SQLEnum(ScheduleStatus), default=ScheduleStatus.ACTIVE)
    notes = Column(String)  # Observações gerais da semana
    
    # Relacionamento com tarefas
    tasks = relationship("ScheduleTask", back_populates="schedule")
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
