from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi import HTTPException
from app.api import api_router
from app.core.config import settings
from app.core.storage import storage_service

app = FastAPI(
    title="Airbnb Cleaning Management API",
    description="Sistema de gerenciamento de limpeza para Airbnb",
    version="1.0.0",
)

# CORS - permitir frontend
origins = [
    settings.FRONTEND_URL,
    "http://localhost:5173",  # Vite dev server
    "http://127.0.0.1:5173",  # Vite dev server (IP)
    "http://localhost:3000",
    "https://*.vercel.app",  # Frontend em produção
    "https://*.netlify.app",
    "https://*.up.railway.app",  # Railway
]

# Em produção, se FRONTEND_URL for a URL do Railway, adiciona automaticamente
if settings.ENVIRONMENT == "production" and settings.FRONTEND_URL:
    origins.append(settings.FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rotas da API
app.include_router(api_router)


@app.get("/")
def root():
    return {"message": "Airbnb Cleaning Management API", "status": "ok"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.get("/api/videos/{path:path}")
def serve_video(path: str):
    """Serve vídeos armazenados localmente"""
    file_path = storage_service.get_file_path(path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Vídeo não encontrado")
    return FileResponse(file_path, media_type="video/webm")