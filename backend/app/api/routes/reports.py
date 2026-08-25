from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
from app.core.database import get_db
from app.api.deps import get_current_active_admin
from app.models.user import User, UserRole
from app.models.task import ScheduleTask, TaskStatus, TaskType
from app.schemas.report import (
    EmployeeReportResponse,
    GeneralReportResponse,
    TaskSummary,
    EmployeeSummary,
    DashboardResponse,
    DayStat,
    StatusStat,
    ApartmentStat,
    EmployeeDiaria,
)
from app.services.export import (
    employee_report_pdf,
    general_report_pdf,
    employee_report_xlsx,
    general_report_xlsx,
)

router = APIRouter(prefix="/reports", tags=["Reports"])


def _count_diarias(tasks):
    """
    Conta diárias inteiras e meias por funcionário/dia.

    Regra de negócio: uma diária (inteira ou meia) é por DIA trabalhado, não por apartamento.
    Se no mesmo dia o funcionário faz 2+ apartamentos, conta apenas 1 diária.
    Se algum dos serviços do dia é "diária inteira", o dia conta como 1 diária inteira;
    caso contrário, se houver "meia diária", conta como 1 meia diária.

    Retorna (full_days, half_days).
    """
    days = {}  # (employee_id, scheduled_date) -> max(TaskType)
    for task in tasks:
        key = (task.employee_id, task.scheduled_date)
        # full_day tem precedência sobre half_day
        if task.task_type == TaskType.FULL_DAY:
            days[key] = TaskType.FULL_DAY
        elif task.task_type == TaskType.HALF_DAY and days.get(key) != TaskType.FULL_DAY:
            days[key] = TaskType.HALF_DAY

    full_days = sum(1 for t in days.values() if t == TaskType.FULL_DAY)
    half_days = sum(1 for t in days.values() if t == TaskType.HALF_DAY)
    return full_days, half_days


def _calculate_days_worked(tasks, period_start: date, period_end: date) -> int:
    """Calcula dias trabalhados no período (dias distintos com tarefas)"""
    days = set()
    for task in tasks:
        if period_start <= task.scheduled_date <= period_end:
            days.add(task.scheduled_date)
    return len(days)


@router.get("/employee/{employee_id}", response_model=EmployeeReportResponse)
def employee_report(
    employee_id: int,
    start_date: date,
    end_date: date,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Relatório de um funcionário no período (apenas Admin, mesma organização)"""
    org_id = current_user.organization_id or 1
    # Verificar funcionário (mesma org)
    employee = db.query(User).filter(User.id == employee_id, User.role == UserRole.EMPLOYEE, User.organization_id == org_id).first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Funcionário não encontrado"
        )

    # Buscar tarefas do funcionário no período (mesma org)
    tasks = db.query(ScheduleTask).filter(
        ScheduleTask.organization_id == org_id,
        ScheduleTask.employee_id == employee_id,
        ScheduleTask.scheduled_date >= start_date,
        ScheduleTask.scheduled_date <= end_date
    ).all()

    full_day_count, half_day_count = _count_diarias(tasks)
    completed_tasks = sum(1 for t in tasks if t.status == TaskStatus.COMPLETED)

    task_summaries = []
    for task in tasks:
        apartment_name = task.apartment.name if task.apartment else "Apartamento removido"

        task_summaries.append(TaskSummary(
            task_id=task.id,
            apartment_name=apartment_name,
            scheduled_date=task.scheduled_date,
            task_type=task.task_type,
            status=task.status.value,
            completed=task.status == TaskStatus.COMPLETED
        ))

    total_tasks = len(tasks)
    completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0

    return EmployeeReportResponse(
        employee_id=employee_id,
        employee_name=employee.full_name,
        period_start=start_date,
        period_end=end_date,
        total_days_worked=_calculate_days_worked(tasks, start_date, end_date),
        full_day_count=full_day_count,
        half_day_count=half_day_count,
        total_tasks=total_tasks,
        completed_tasks=completed_tasks,
        completion_rate=round(completion_rate, 2),
        tasks=task_summaries
    )


@router.get("/general", response_model=GeneralReportResponse)
def general_report(
    start_date: date,
    end_date: date,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Relatório geral no período (apenas Admin, mesma organização)"""
    org_id = current_user.organization_id or 1
    # Buscar todas as tarefas no período (mesma org)
    tasks = db.query(ScheduleTask).filter(
        ScheduleTask.organization_id == org_id,
        ScheduleTask.scheduled_date >= start_date,
        ScheduleTask.scheduled_date <= end_date
    ).all()

    # Agrupar por funcionário
    employees_map = {}
    full_days_by_emp = {}
    half_days_by_emp = {}

    org_id = current_user.organization_id or 1
    for task in tasks:
        emp_id = task.employee_id
        if emp_id not in employees_map:
            emp = db.query(User).filter(User.id == emp_id, User.organization_id == org_id).first()
            employees_map[emp_id] = {
                "id": emp_id,
                "name": emp.full_name if emp else f"Funcionário {emp_id}",
                "total_tasks": 0,
                "completed_tasks": 0,
            }
            full_days_by_emp[emp_id] = {}
            half_days_by_emp[emp_id] = {}

        employees_map[emp_id]["total_tasks"] += 1
        if task.status == TaskStatus.COMPLETED:
            employees_map[emp_id]["completed_tasks"] += 1

        # Contagem por dia (1 diária por dia trabalhado)
        day_key = task.scheduled_date
        if task.task_type == TaskType.FULL_DAY:
            full_days_by_emp[emp_id][day_key] = True
        elif task.task_type == TaskType.HALF_DAY and day_key not in full_days_by_emp[emp_id]:
            half_days_by_emp[emp_id][day_key] = True

    total_tasks = len(tasks)
    completed_tasks = sum(1 for t in tasks if t.status == TaskStatus.COMPLETED)
    completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0

    employees = [
        EmployeeSummary(
            employee_id=data["id"],
            employee_name=data["name"],
            total_tasks=data["total_tasks"],
            completed_tasks=data["completed_tasks"],
            full_day_count=len(full_days_by_emp[data["id"]]),
            half_day_count=len(half_days_by_emp[data["id"]]),
        )
        for data in employees_map.values()
    ]

    return GeneralReportResponse(
        period_start=start_date,
        period_end=end_date,
        total_employees=len(employees_map),
        total_tasks=total_tasks,
        completed_tasks=completed_tasks,
        completion_rate=round(completion_rate, 2),
        employees=employees
    )


@router.get("/dashboard", response_model=DashboardResponse)
def dashboard_data(
    start_date: date,
    end_date: date,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Dados agregados para o dashboard (apenas Admin, mesma organização)"""
    org_id = current_user.organization_id or 1
    tasks = db.query(ScheduleTask).filter(
        ScheduleTask.organization_id == org_id,
        ScheduleTask.scheduled_date >= start_date,
        ScheduleTask.scheduled_date <= end_date
    ).options(
        # Carregar relacionamentos
    ).all()

    # Tarefas por dia
    days_map = {}
    for task in tasks:
        day = task.scheduled_date
        if day not in days_map:
            days_map[day] = {"date": day, "total": 0, "completed": 0}
        days_map[day]["total"] += 1
        if task.status == TaskStatus.COMPLETED:
            days_map[day]["completed"] += 1

    tasks_by_day = [DayStat(**days_map[d]) for d in sorted(days_map)]

    # Tarefas por status
    status_counts = {
        TaskStatus.PENDING: 0,
        TaskStatus.IN_PROGRESS: 0,
        TaskStatus.COMPLETED: 0,
    }
    for task in tasks:
        status_counts[task.status] = status_counts.get(task.status, 0) + 1

    tasks_by_status = [
        StatusStat(status=s.value, count=c)
        for s, c in status_counts.items()
    ]

    # Tarefas por apartamento
    apt_map = {}
    for task in tasks:
        name = task.apartment.name if task.apartment else "Removido"
        if name not in apt_map:
            apt_map[name] = 0
        apt_map[name] += 1

    tasks_by_apartment = [
        ApartmentStat(apartment_name=name, count=c)
        for name, c in sorted(apt_map.items(), key=lambda x: x[1], reverse=True)[:8]
    ]

    # Diárias por funcionário (mesma org)
    emp_map = {}
    for task in tasks:
        emp_id = task.employee_id
        if emp_id not in emp_map:
            emp = db.query(User).filter(User.id == emp_id, User.organization_id == org_id).first()
            emp_map[emp_id] = {
                "name": emp.full_name if emp else f"Funcionário {emp_id}",
                "full_days": set(),
                "half_days": set(),
            }
        day_key = task.scheduled_date
        if task.task_type == TaskType.FULL_DAY:
            emp_map[emp_id]["full_days"].add(day_key)
        elif task.task_type == TaskType.HALF_DAY and day_key not in emp_map[emp_id]["full_days"]:
            emp_map[emp_id]["half_days"].add(day_key)

    employee_diarias = [
        EmployeeDiaria(
            employee_name=data["name"],
            full_days=len(data["full_days"]),
            half_days=len(data["half_days"]),
        )
        for data in emp_map.values()
    ]

    total_tasks = len(tasks)
    completed_tasks = sum(1 for t in tasks if t.status == TaskStatus.COMPLETED)
    completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0

    return DashboardResponse(
        period_start=start_date,
        period_end=end_date,
        total_tasks=total_tasks,
        completed_tasks=completed_tasks,
        completion_rate=round(completion_rate, 2),
        tasks_by_day=tasks_by_day,
        tasks_by_status=tasks_by_status,
        tasks_by_apartment=tasks_by_apartment,
        employee_diarias=employee_diarias,
    )


# ============= Exportação (PDF / Excel) =============

def _task_type_label(t):
    val = t.value if isinstance(t, TaskType) else str(t)
    return "Diária inteira" if val == "full_day" else "Meia diária"


def _task_status_label(s):
    val = s.value if isinstance(s, TaskStatus) else str(s)
    labels = {
        "pending": "Pendente",
        "in_progress": "Em andamento",
        "completed": "Concluída",
    }
    return labels.get(val, val)


@router.get("/export/employee/{employee_id}/pdf")
def export_employee_pdf(
    employee_id: int,
    start_date: date,
    end_date: date,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Exportar relatório do funcionário em PDF"""
    report = employee_report(employee_id, start_date, end_date, db, current_user)
    data = report.model_dump()
    for t in data["tasks"]:
        t["task_type"] = _task_type_label(t["task_type"])
        t["status"] = _task_status_label(t["status"])

    pdf = employee_report_pdf(data, report.employee_name, start_date, end_date)
    filename = f"relatorio_{report.employee_name.replace(' ', '_')}_{start_date}_{end_date}.pdf"
    return StreamingResponse(
        pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/export/employee/{employee_id}/xlsx")
def export_employee_xlsx(
    employee_id: int,
    start_date: date,
    end_date: date,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Exportar relatório do funcionário em Excel"""
    report = employee_report(employee_id, start_date, end_date, db, current_user)
    data = report.model_dump()
    for t in data["tasks"]:
        t["task_type"] = _task_type_label(t["task_type"])
        t["status"] = _task_status_label(t["status"])

    xlsx = employee_report_xlsx(data, report.employee_name, start_date, end_date)
    filename = f"relatorio_{report.employee_name.replace(' ', '_')}_{start_date}_{end_date}.xlsx"
    return StreamingResponse(
        xlsx,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/export/general/pdf")
def export_general_pdf(
    start_date: date,
    end_date: date,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Exportar relatório geral em PDF"""
    report = general_report(start_date, end_date, db, current_user)
    data = report.model_dump()

    pdf = general_report_pdf(data, start_date, end_date)
    filename = f"relatorio_geral_{start_date}_{end_date}.pdf"
    return StreamingResponse(
        pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/export/general/xlsx")
def export_general_xlsx(
    start_date: date,
    end_date: date,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Exportar relatório geral em Excel"""
    report = general_report(start_date, end_date, db, current_user)
    data = report.model_dump()

    xlsx = general_report_xlsx(data, start_date, end_date)
    filename = f"relatorio_geral_{start_date}_{end_date}.xlsx"
    return StreamingResponse(
        xlsx,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )