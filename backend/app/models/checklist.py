from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class ChecklistTemplate(Base):
    """Template de checklist para um apartamento"""
    __tablename__ = "checklist_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    apartment_id = Column(Integer, ForeignKey("apartments.id", ondelete="CASCADE"), nullable=False)
    item_name = Column(String, nullable=False)  # "Cama arrumada", "Toalhas trocadas"
    order = Column(Integer, default=0)  # ordem de exibição
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relacionamentos
    apartment = relationship("Apartment", backref="checklist_templates")


class ChecklistItem(Base):
    """Item de checklist marcado durante a execução da tarefa"""
    __tablename__ = "checklist_items"
    
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("schedule_tasks.id", ondelete="CASCADE"), nullable=False)
    item_name = Column(String, nullable=False)  # cópia do template no momento da execução
    is_checked = Column(Boolean, default=False)
    checked_at = Column(DateTime(timezone=True))
    
    # Relacionamentos
    task = relationship("ScheduleTask", backref="checklist_items")
