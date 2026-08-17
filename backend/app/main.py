from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi import HTTPException
from pathlib import Path
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


# Servir frontend buildado (produção - Railway, mesmo domínio da API)
_dist_dir = settings.FRONTEND_DIST_DIR
if _dist_dir and Path(_dist_dir).exists():
    dist = Path(_dist_dir)

    # Assets estáticos (com hash)
    if (dist / "assets").is_dir():
        app.mount("/assets", StaticFiles(directory=dist / "assets"), name="assets")

    # Fallback SPA: qualquer outra rota não-API serve o index.html
    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_frontend(full_path: str):
        # Arquivo real que existe no dist (ex: favicon.svg)
        if full_path:
            requested = dist / full_path
            if requested.is_file():
                return FileResponse(requested)
        index = dist / "index.html"
        if index.exists():
            return FileResponse(index)
        return {"message": "Airbnb Cleaning Management API", "status": "ok"}