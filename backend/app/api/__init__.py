from fastapi import APIRouter

api_router = APIRouter()

from app.api.routes import (
    auth_router,
    users_router,
    apartments_router,
    schedules_router,
    executions_router,
    reports_router,
    checklist_router,
    products_router,
    notifications_router,
    calendar_router,
    organizations_router,
)

api_router.include_router(auth_router, prefix="/api")
api_router.include_router(users_router, prefix="/api")
api_router.include_router(apartments_router, prefix="/api")
api_router.include_router(schedules_router, prefix="/api")
api_router.include_router(executions_router, prefix="/api")
api_router.include_router(reports_router, prefix="/api")
api_router.include_router(checklist_router, prefix="/api")
api_router.include_router(products_router, prefix="/api")
api_router.include_router(notifications_router, prefix="/api")
api_router.include_router(calendar_router, prefix="/api")
api_router.include_router(organizations_router, prefix="/api")