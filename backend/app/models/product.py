from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Product(Base):
    """Produto/material de limpeza para controle de estoque"""
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True, index=True)
    organization = relationship("Organization")
    name = Column(String, nullable=False)  # Nome do produto
    quantity = Column(Float, default=0)  # Quantidade atual
    unit = Column(String, default="un")  # un, ml, l, kg, pacote
    min_quantity = Column(Float, default=0)  # Quantidade mínima para alerta
    observations = Column(String)  # Observações
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())