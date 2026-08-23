from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Apartment(Base):
    __tablename__ = "apartments"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)  # Nome/código do apartamento
    address = Column(String, nullable=False)
    address_complement = Column(String)  # Complemento, número do apto
    city = Column(String, nullable=False)
    state = Column(String)
    zipcode = Column(String)
    
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True, index=True)
    organization = relationship("Organization")

    # Informações adicionais
    estimated_cleaning_time = Column(Integer)  # Tempo estimado em minutos
    observations = Column(Text)  # Observações gerais
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
