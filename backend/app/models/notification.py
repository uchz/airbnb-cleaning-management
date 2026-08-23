from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Notification(Base):
    """Notificação in-app para um usuário"""
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True, index=True)
    organization = relationship("Organization")
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # Conteúdo
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    notification_type = Column(String, nullable=False, default="info")  # task_created, task_completed, ...
    link = Column(String)  # Rota do frontend para onde o clique leva (ex: /tasks/5)

    # Estado
    is_read = Column(Boolean, default=False, index=True)

    # Relacionamento
    user = relationship("User")

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())