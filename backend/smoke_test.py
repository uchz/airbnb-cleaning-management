"""Teste de fumaça para validar o fluxo completo da API."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from fastapi.testclient import TestClient
from app.main import app
from app.core.database import Base, engine, SessionLocal
from app import models
from app.core.security import get_password_hash
from app.models.user import User, UserRole

# Criar tabelas
Base.metadata.create_all(bind=engine)

client = TestClient(app)


def create_admin():
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            admin = User(
                username="admin",
                hashed_password=get_password_hash("admin123"),
                full_name="Admin Teste",
                role=UserRole.ADMIN,
                is_active=True,
            )
            db.add(admin)
            db.commit()
    finally:
        db.close()


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    print("[OK] Health check")


def test_register_employee():
    data = {
        "username": "func",
        "password": "func123",
        "full_name": "Maria Limpadora",
        "phone": "11999999999",
        "role": "employee",
    }
    r = client.post("/api/auth/register", json=data)
    assert r.status_code == 201, r.text
    print("[OK] Registro de funcionário")


def test_login():
    r = client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    assert r.status_code == 200, r.text
    token = r.json()["access_token"]
    print("[OK] Login admin")
    return token


def test_login_employee():
    r = client.post("/api/auth/login", json={"username": "func", "password": "func123"})
    assert r.status_code == 200, r.text
    token = r.json()["access_token"]
    print("[OK] Login funcionário")
    return token


def test_create_apartment(token):
    data = {
        "name": "Apto Praia",
        "address": "Rua das Flores, 123",
        "address_complement": "Apto 45",
        "city": "Florianópolis",
        "state": "SC",
        "estimated_cleaning_time": 90,
    }
    headers = {"Authorization": f"Bearer {token}"}
    r = client.post("/api/apartments/", json=data, headers=headers)
    assert r.status_code == 201, r.text
    print("[OK] Criar apartamento")
    return r.json()["id"]


def test_employee_cannot_create_apartment(emp_token):
    data = {"name": "Apto X", "address": "Rua Y", "city": "Cidade"}
    headers = {"Authorization": f"Bearer {emp_token}"}
    r = client.post("/api/apartments/", json=data, headers=headers)
    assert r.status_code == 403, r.text
    print("[OK] Funcionário bloqueado de criar apartamento")


def test_create_schedule(token):
    from datetime import date, timedelta
    week_start = date(2026, 8, 22)  # Sábado
    week_end = date(2026, 8, 28)  # Sexta
    data = {"week_start": week_start.isoformat(), "week_end": week_end.isoformat()}
    headers = {"Authorization": f"Bearer {token}"}
    r = client.post("/api/schedules/", json=data, headers=headers)
    assert r.status_code == 201, r.text
    print("[OK] Criar escala semanal")
    return r.json()["id"]


def test_create_task(token, schedule_id, apartment_id, employee_id):
    data = {
        "schedule_id": schedule_id,
        "employee_id": employee_id,
        "apartment_id": apartment_id,
        "scheduled_date": "2026-08-24",
        "scheduled_time": "09:00:00",
        "task_type": "full_day",
    }
    headers = {"Authorization": f"Bearer {token}"}
    r = client.post("/api/schedules/tasks", json=data, headers=headers)
    assert r.status_code == 201, r.text
    print("[OK] Criar tarefa na escala")
    return r.json()["id"]


def test_task_date_out_of_week(token, schedule_id, apartment_id, employee_id):
    data = {
        "schedule_id": schedule_id,
        "employee_id": employee_id,
        "apartment_id": apartment_id,
        "scheduled_date": "2026-09-30",  # Fora da semana
        "scheduled_time": "09:00:00",
        "task_type": "half_day",
    }
    headers = {"Authorization": f"Bearer {token}"}
    r = client.post("/api/schedules/tasks", json=data, headers=headers)
    assert r.status_code == 400, r.text
    print("[OK] Data fora da semana rejeitada")


def test_employee_sees_only_own_tasks(emp_token, task_id):
    headers = {"Authorization": f"Bearer {emp_token}"}
    r = client.get("/api/schedules/tasks/all", headers=headers)
    assert r.status_code == 200
    tasks = r.json()
    assert all(t["employee_id"] == 2 for t in tasks), f"Funcionário viu tarefas de outros: {tasks}"
    print("[OK] Funcionário vê apenas tarefas próprias")


def test_report(token, employee_id):
    headers = {"Authorization": f"Bearer {token}"}
    r = client.get(
        f"/api/reports/employee/{employee_id}",
        params={"start_date": "2026-08-01", "end_date": "2026-08-31"},
        headers=headers,
    )
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["total_tasks"] == 1
    assert data["full_day_count"] == 1
    print("[OK] Relatório do funcionário gerado")


def test_reschedule(token, task_id):
    headers = {"Authorization": f"Bearer {token}"}
    r = client.post(
        f"/api/executions/reschedule?task_id={task_id}&new_date=2026-08-25&reason=teste",
        headers=headers,
    )
    assert r.status_code == 200, r.text
    print("[OK] Reagendamento realizado")


def test_reschedule_blocked_for_employee(emp_token, task_id):
    headers = {"Authorization": f"Bearer {emp_token}"}
    r = client.post(
        f"/api/executions/reschedule?task_id={task_id}&new_date=2026-08-26&reason=teste",
        headers=headers,
    )
    assert r.status_code == 403, r.text
    print("[OK] Funcionário bloqueado de reagendar")


if __name__ == "__main__":
    create_admin()
    test_health()
    test_register_employee()
    admin_token = test_login()
    emp_token = test_login_employee()

    # Obter ID do funcionário
    headers = {"Authorization": f"Bearer {admin_token}"}
    employees = client.get("/api/users/employees", headers=headers).json()
    employee_id = employees[0]["id"]

    apartment_id = test_create_apartment(admin_token)
    test_employee_cannot_create_apartment(emp_token)
    schedule_id = test_create_schedule(admin_token)
    task_id = test_create_task(admin_token, schedule_id, apartment_id, employee_id)
    test_task_date_out_of_week(admin_token, schedule_id, apartment_id, employee_id)
    test_employee_sees_only_own_tasks(emp_token, task_id)
    test_report(admin_token, employee_id)
    test_reschedule(admin_token, task_id)
    test_reschedule_blocked_for_employee(emp_token, task_id)

    print("\n=== TODOS OS TESTES PASSARAM ===")