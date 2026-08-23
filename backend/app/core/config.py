from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str
    
    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Supabase (legado - não utilizado no fluxo atual)
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    SUPABASE_BUCKET: str = "videos"
    
    # Frontend (origem permitida no CORS)
    FRONTEND_URL: str = "http://localhost:5173"
    
    # Uploads (para Railway Volume, apontar para o caminho do volume)
    UPLOAD_DIR: str = ""
    
    # Diretório do frontend buildado (produção - Railway)
    FRONTEND_DIST_DIR: str = ""
    
    # Environment
    ENVIRONMENT: str = "development"

    # Stripe (opcional - billing)
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    STRIPE_PRICE_BASIC: str = ""
    STRIPE_PRICE_PRO: str = ""
    STRIPE_SUCCESS_URL: str = ""
    STRIPE_CANCEL_URL: str = ""
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
