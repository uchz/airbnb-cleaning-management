from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Date, Time
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class TaskHistory(Base):
    """Histórico de alterações de tarefas (reagendamentos, reatribuições)"""
    __tablename__ = "task_history"
    
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("schedule_tasks.id"), nullable=False)
    
    # Quem fez a alteração
    changed_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Tipo de alteração
    change_type = Column(String, nullable=False)  # "reschedule", "reassign", "cancel", etc
    
    # Valores antigos (JSON ou campos específicos)
    old_date = Column(Date)
    old_time = Column(Time)
    old_employee_id = Column(Integer)
    
    # Valores novos
    new_date = Column(Date)
    new_time = Column(Time)
    new_employee_id = Column(Integer)
    
    # Motivo da alteração
    reason = Column(Text)
    
    # Relacionamentos
    task = relationship("ScheduleTask", back_populates="history")
    admin = relationship("User", foreign_keys=[changed_by])
    
    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now())
