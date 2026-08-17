from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class TaskExecution(Base):
    """Registro de execução da tarefa (check-in/out e vídeos)"""
    __tablename__ = "task_executions"
    
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("schedule_tasks.id"), nullable=False, unique=True)
    
    # Check-in
    checkin_time = Column(DateTime(timezone=True))
    checkin_video_path = Column(String)  # Path do vídeo no Supabase
    checkin_video_url = Column(String)  # URL assinada do vídeo
    
    # Check-out
    checkout_time = Column(DateTime(timezone=True))
    checkout_video_path = Column(String)
    checkout_video_url = Column(String)
    
    # Observações do funcionário
    observations = Column(Text)
    
    # Relacionamento
    task = relationship("ScheduleTask", back_populates="execution")
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
