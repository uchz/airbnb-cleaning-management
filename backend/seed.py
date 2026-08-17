"""Script para criar o usuário administrador inicial."""
import sys
from pathlib import Path

# Adicionar o diretório backend ao path
sys.path.insert(0, str(Path(__file__).parent))

from app.core.database import SessionLocal, engine, Base
from app.models.user import User, UserRole
from app.core.security import get_password_hash

import getpass


def create_admin():
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Verificar se já existe admin
        existing = db.query(User).filter(User.role == UserRole.ADMIN).first()
        if existing:
            print(f"Admin já existe: {existing.full_name} (@{existing.username})")
            return
        
        print("=== Criação do Administrador Inicial ===")
        username = input("Usuário: ").strip()
        full_name = input("Nome completo: ").strip()
        phone = input("Telefone (opcional): ").strip()
        password = getpass.getpass("Senha: ")
        confirm = getpass.getpass("Confirmar senha: ")
        
        if password != confirm:
            print("As senhas não conferem. Abortando.")
            return
        
        admin = User(
            username=username,
            hashed_password=get_password_hash(password),
            full_name=full_name,
            phone=phone if phone else None,
            role=UserRole.ADMIN,
            is_active=True,
        )
        
        db.add(admin)
        db.commit()
        print(f"Admin criado com sucesso: {full_name} (@{username})")
        
    finally:
        db.close()


if __name__ == "__main__":
    create_admin()