from pydantic import BaseModel
from typing import List, Optional
from datetime import date
from app.models.task import TaskType


# ============= Report Schemas =============

class EmployeeReportRequest(BaseModel):
    employee_id: int
    start_date: date
    end_date: date


class TaskSummary(BaseModel):
    task_id: int
    apartment_name: str
    scheduled_date: date
    task_type: TaskType
    status: str
    completed: bool


class EmployeeReportResponse(BaseModel):
    employee_id: int
    employee_name: str
    period_start: date
    period_end: date
    total_days_worked: int
    full_day_count: int
    half_day_count: int
    total_tasks: int
    completed_tasks: int
    completion_rate: float
    tasks: List[TaskSummary] = []


class GeneralReportRequest(BaseModel):
    start_date: date
    end_date: date


class EmployeeSummary(BaseModel):
    employee_id: int
    employee_name: str
    total_tasks: int
    completed_tasks: int
    full_day_count: int
    half_day_count: int


class GeneralReportResponse(BaseModel):
    period_start: date
    period_end: date
    total_employees: int
    total_tasks: int
    completed_tasks: int
    completion_rate: float
    employees: List[EmployeeSummary] = []


# ============= Dashboard Schemas =============

class DayStat(BaseModel):
    date: date
    total: int
    completed: int


class StatusStat(BaseModel):
    status: str
    count: int


class ApartmentStat(BaseModel):
    apartment_name: str
    count: int


class EmployeeDiaria(BaseModel):
    employee_name: str
    full_days: int
    half_days: int


class DashboardResponse(BaseModel):
    period_start: date
    period_end: date
    total_tasks: int
    completed_tasks: int
    completion_rate: float
    tasks_by_day: List[DayStat] = []
    tasks_by_status: List[StatusStat] = []
    tasks_by_apartment: List[ApartmentStat] = []
    employee_diarias: List[EmployeeDiaria] = []
