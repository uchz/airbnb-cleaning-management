# ============ STAGE 1: Build do frontend (Node) ============
FROM node:22-alpine AS frontend-build

WORKDIR /app/frontend

# Instala dependências (cache de camada)
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

# Build
COPY frontend/ ./
RUN npm run build

# ============ STAGE 2: Backend (Python) ============
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

# Dependências do backend
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Código do backend
COPY backend/app ./app
COPY backend/alembic ./alembic
COPY backend/alembic.ini ./alembic.ini
COPY backend/demo_seed.py ./demo_seed.py

# Frontend buildado
COPY --from=frontend-build /app/frontend/dist ./frontend-dist

# Healthcheck
HEALTHCHECK CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:' + __import__('os').environ.get('PORT', '8000') + '/health', timeout=5)"

EXPOSE 8000

CMD ["sh", "-c", "alembic upgrade head && python demo_seed.py && uvicorn app.main:app --host 0.0.0.0 --port $PORT"]
