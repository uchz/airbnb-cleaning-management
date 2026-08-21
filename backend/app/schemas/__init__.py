from app.schemas.user import (
    UserBase,
    UserCreate,
    UserUpdate,
    UserResponse,
    UserLogin,
    Token,
    TokenData
)
from app.schemas.apartment import (
    ApartmentBase,
    ApartmentCreate,
    ApartmentUpdate,
    ApartmentResponse
)
from app.schemas.schedule import (
    ScheduleBase,
    ScheduleCreate,
    ScheduleUpdate,
    ScheduleResponse,
    ScheduleWithTasks,
    ScheduleTaskBase,
    ScheduleTaskCreate,
    ScheduleTaskUpdate,
    ScheduleTaskResponse,
    ScheduleTaskDetailResponse,
)
from app.schemas.execution import (
    TaskExecutionBase,
    CheckInRequest,
    CheckOutRequest,
    TaskExecutionResponse,
    VideoUploadResponse
)
from app.schemas.history import (
    TaskHistoryBase,
    TaskHistoryCreate,
    TaskHistoryResponse,
    RescheduleRequest
)
from app.schemas.report import (
    EmployeeReportRequest,
    EmployeeReportResponse,
    GeneralReportRequest,
    GeneralReportResponse,
    TaskSummary,
    EmployeeSummary
)

__all__ = [
    # User
    "UserBase", "UserCreate", "UserUpdate", "UserResponse",
    "UserLogin", "Token", "TokenData",
    # Apartment
    "ApartmentBase", "ApartmentCreate", "ApartmentUpdate", "ApartmentResponse",
    # Schedule
    "ScheduleBase", "ScheduleCreate", "ScheduleUpdate",
    "ScheduleResponse", "ScheduleWithTasks",
    "ScheduleTaskBase", "ScheduleTaskCreate",
    "ScheduleTaskUpdate", "ScheduleTaskResponse", "ScheduleTaskDetailResponse",
    # Execution
    "TaskExecutionBase", "CheckInRequest", "CheckOutRequest",
    "TaskExecutionResponse", "VideoUploadResponse",
    # History
    "TaskHistoryBase", "TaskHistoryCreate", "TaskHistoryResponse",
    "RescheduleRequest",
    # Report
    "EmployeeReportRequest", "EmployeeReportResponse",
    "GeneralReportRequest", "GeneralReportResponse",
    "TaskSummary", "EmployeeSummary"
]