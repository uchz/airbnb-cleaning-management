# Sistema de Gerenciamento de Limpeza para Airbnb

Web app para gerenciar escalas semanais de limpeza de apartamentos Airbnb, controle de execução com vídeo (check-in/check-out) e geração de relatórios de pagamento para funcionários.

## Funcionalidades

- **Administrador:**
  - Gestão de apartamentos e funcionários
  - Criação de escalas semanais (Sábado a Sexta)
  - Atribuição de tarefas (diária inteira ou meia diária)
  - Reagendamento de tarefas (com histórico e motivo)
  - Visualização dos vídeos de entrada/saída
  - Relatórios de pagamento por funcionário (CSV)
  - Dashboard com indicadores da operação

- **Funcionário:**
  - Visualização da própria escala semanal
  - Gravação de vídeo de entrada (estado inicial)
  - Gravação de vídeo de saída (estado final)
  - Marcação de limpeza como concluída

## Stack Tecnológica

| Camada | Tecnologia |
|--------|------------|
| Frontend | React + Vite + TailwindCSS |
| Backend | FastAPI + SQLAlchemy |
| Banco de Dados | PostgreSQL |
| Armazenamento de Vídeo | Supabase Storage (10GB free) |
| Autenticação | JWT |

## Estrutura

```
airbnb-cleaning-management/
├── backend/               # API FastAPI
│   ├── app/
│   │   ├── api/routes/    # Endpoints (auth, users, apartments, schedules, executions, reports)
│   │   ├── core/          # Config, security, storage, database
│   │   ├── models/        # Models SQLAlchemy
│   │   ├── schemas/       # Schemas Pydantic
│   │   └── main.py        # App principal
│   ├── alembic/           # Migrações
│   ├── seed.py            # Cria o admin inicial
│   └── smoke_test.py      # Testes de fumaça da API
│
└── frontend/              # SPA React
    └── src/
        ├── pages/         # Login, Admin (Dashboard, Apartamentos, Funcionários, Escalas, Relatórios), Funcionário (Escala, Execução)
        ├── components/    # Layout, UI (Button, Card, Input, Select, Badge, VideoRecorder)
        ├── services/      # Cliente da API
        ├── contexts/      # Autenticação
        └── utils/         # Formatação e helpers
```

## Configuração Local

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
source venv/bin/activate  # Linux/Mac

pip install -r requirements.txt

# Criar arquivo de configuração
copy .env.example .env   # Windows
cp .env.example .env     # Linux/Mac
# Editar o .env com as credenciais

# Criar as tabelas e o admin inicial
python seed.py

# Rodar o servidor
uvicorn app.main:app --reload --port 8000
```

API disponível em `http://localhost:8000` (documentação Swagger em `/docs`).

### Frontend

```bash
cd frontend
npm install
copy .env.example .env   # Windows
cp .env.example .env     # Linux/Mac
npm run dev
```

App disponível em `http://localhost:5173`.

## Deploy (Railway + Vercel)

### Backend no Railway
1. Crie um projeto no Railway a partir do repositório
2. Adicione um serviço PostgreSQL
3. Configure as variáveis de ambiente (conforme `.env.example`)
4. Deploy automático via GitHub

### Frontend no Vercel/Netlify
1. Importe a pasta `frontend`
2. Configure `VITE_API_URL` para a URL do backend no Railway
3. Build command: `npm run build` / Output: `dist`

## Variáveis de Ambiente

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | URL do PostgreSQL |
| `SECRET_KEY` | Chave secreta do JWT |
| `ALGORITHM` | Algoritmo JWT (padrão: HS256) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Expiração do token em minutos |
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_KEY` | Chave anon do Supabase |
| `SUPABASE_BUCKET` | Bucket de vídeos (padrão: videos) |
| `VITE_API_URL` | URL da API (frontend) |

## Fluxo de Uso

1. Admin cadastra apartamentos e funcionários
2. Admin cria a escala semanal (sábado a sexta) e atribui tarefas
3. Funcionário acessa a escala e vê suas tarefas do dia
4. No serviço, funciona grava o vídeo de entrada e marca início
5. Após limpar, grava o vídeo de saída e conclui
6. Admin acompanha execução, faz reagendamentos e gera relatórios de pagamento