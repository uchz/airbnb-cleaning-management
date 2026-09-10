from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class AccessLog(Base):
    """Logs de acesso para auditoria LGPD"""
    __tablename__ = "access_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True, index=True)
    
    action = Column(String(50), nullable=False)  # VIEW_VIDEO, DOWNLOAD_REPORT, EXPORT_DATA, etc.
    resource_type = Column(String(50), nullable=False)  # video, report, user_data, etc.
    resource_id = Column(String(255), nullable=True)  # ID do recurso acessado
    
    ip_address = Column(String(45), nullable=True)  # IPv4 ou IPv6
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    
    # Relationships
    user = relationship("User")
    organization = relationship("Organization")
    
    def __repr__(self):
        return f"<AccessLog {self.action} by user {self.user_id} at {self.timestamp}>"
