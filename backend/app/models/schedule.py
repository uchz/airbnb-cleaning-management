from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Enum as SQLEnum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class ScheduleStatus(str, enum.Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class ScheduleType(str, enum.Enum):
    WEEKLY = "weekly"         # Semana fixa (Sábado a Sexta)
    DATE_RANGE = "date_range" # Período custom (ex: 01/09 a 15/09)
    AD_HOC = "ad_hoc"         # Free-lance / diárias avulsas (sem período fixo)


class Schedule(Base):
    """Escala flexível: semanal, por período, ou avulsa"""
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True, index=True)
    schedule_type = Column(SQLEnum(ScheduleType), default=ScheduleType.WEEKLY, nullable=False, index=True)
    
    # Período da escala
    # - WEEKLY: start_date = sábado, end_date = sexta
    # - DATE_RANGE: qualquer intervalo
    # - AD_HOC: opcional (pode ser null, tarefas avulsas não precisam de período)
    start_date = Column(Date, nullable=True, index=True)
    end_date = Column(Date, nullable=True)
    
    status = Column(SQLEnum(ScheduleStatus), default=ScheduleStatus.ACTIVE)
    notes = Column(Text)
    
    # Relacionamento com tarefas (nullable para tarefas ad_hoc)
    tasks = relationship("ScheduleTask", back_populates="schedule")
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())