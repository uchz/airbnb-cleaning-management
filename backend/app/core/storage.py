from pathlib import Path
from typing import Optional
import uuid
import shutil


class StorageService:
    """Serviço para gerenciar armazenamento local de vídeos"""

    def __init__(self):
        # Diretório base para uploads (dentro do backend)
        self.upload_dir = Path(__file__).parent.parent.parent / "uploads" / "videos"
        self.upload_dir.mkdir(parents=True, exist_ok=True)
    
    def upload_video(self, file_content: bytes, file_name: str, folder: str = "") -> str:
        """
        Upload de vídeo para armazenamento local
        
        Args:
            file_content: Conteúdo do arquivo em bytes
            file_name: Nome do arquivo
            folder: Pasta opcional para organização
        
        Returns:
            path relativo do arquivo
        """
        # Gera nome único para o arquivo
        unique_filename = f"{uuid.uuid4()}_{file_name}"
        
        # Define caminho completo
        if folder:
            target_dir = self.upload_dir / folder
            target_dir.mkdir(parents=True, exist_ok=True)
            file_path = target_dir / unique_filename
            relative_path = f"{folder}/{unique_filename}"
        else:
            file_path = self.upload_dir / unique_filename
            relative_path = unique_filename
        
        # Salva o arquivo
        with open(file_path, 'wb') as f:
            f.write(file_content)
        
        return relative_path
    
    def get_public_url(self, path: str) -> str:
        """Obtém URL pública do vídeo (servido pelo FastAPI)"""
        return f"/api/videos/{path}"
    
    def get_signed_url(self, path: str, expires_in: int = 3600) -> str:
        """
        Para compatibilidade com código existente.
        No armazenamento local, retorna a URL pública.
        """
        return self.get_public_url(path)
    
    def delete_video(self, path: str) -> bool:
        """Deleta vídeo do storage local"""
        try:
            file_path = self.upload_dir / path
            if file_path.exists():
                file_path.unlink()
                return True
            return False
        except Exception as e:
            print(f"Erro ao deletar vídeo: {e}")
            return False
    
    def get_file_path(self, path: str) -> Path:
        """Retorna o caminho físico completo do arquivo"""
        return self.upload_dir / path


# Instância global
storage_service = StorageService()
