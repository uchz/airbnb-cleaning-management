from app.api.routes.auth import router as auth_router
from app.api.routes.users import router as users_router
from app.api.routes.apartments import router as apartments_router
from app.api.routes.schedules import router as schedules_router
from app.api.routes.executions import router as executions_router
from app.api.routes.reports import router as reports_router
from app.api.routes.checklist import router as checklist_router
from app.api.routes.products import router as products_router

__all__ = [
    "auth_router",
    "users_router",
    "apartments_router",
    "schedules_router",
    "executions_router",
    "reports_router",
    "checklist_router",
    "products_router",
]