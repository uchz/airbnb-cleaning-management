"""Script de demonstração: cria admin, funcionária, apartamentos e uma escala semanal com tarefas."""
import sys
from pathlib import Path
from datetime import date, time, timedelta

sys.path.insert(0, str(Path(__file__).parent))

from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.apartment import Apartment
from app.models.schedule import Schedule, ScheduleType
from app.models.task import ScheduleTask, TaskType
from app import models  # noqa: F401

db = SessionLocal()
try:
    Base.metadata.create_all(bind=engine)

    # Admin
    if not db.query(User).filter(User.username == "admin").first():
        admin = User(
            username="admin",
            hashed_password=get_password_hash("admin123"),
            full_name="Dono da Empresa",
            phone="(11) 99999-0000",
            role=UserRole.ADMIN,
            is_active=True,
        )
        db.add(admin)
        print("Admin criado: admin / admin123")

    # Funcionária
    if not db.query(User).filter(User.username == "maria").first():
        maria = User(
            username="maria",
            hashed_password=get_password_hash("maria123"),
            full_name="Maria Limpadora",
            phone="(11) 98888-7777",
            role=UserRole.EMPLOYEE,
            is_active=True,
            payment_info="PIX: maria",
        )
        db.add(maria)
        print("Funcionária criada: maria / maria123")
    db.commit()

    maria = db.query(User).filter(User.username == "maria").first()

    # Apartamentos
    aptos_data = [
        {"name": "Apto Praia Azul", "address": "Av. Beira Mar, 1200", "address_complement": "Apto 34", "city": "Florianópolis", "state": "SC", "estimated_cleaning_time": 90, "observations": "Senha da portaria: 1234"},
        {"name": "Apto Centro", "address": "Rua XV de Novembro, 450", "address_complement": "Apto 12", "city": "Florianópolis", "state": "SC", "estimated_cleaning_time": 60, "observations": "Chave no cofre da portaria"},
        {"name": "Apto Lagoa", "address": "Rua dos Anjos, 80", "address_complement": "Apto 07", "city": "Florianópolis", "state": "SC", "estimated_cleaning_time": 120, "observations": "Limpeza profunda a cada 15 dias"},
        {"name": "Apto Campeche", "address": "Rua do Campeche, 210", "address_complement": "Casa 3", "city": "Florianópolis", "state": "SC", "estimated_cleaning_time": 90, "observations": ""},
        {"name": "Apto Ingleses", "address": "Av. dos Ingleses, 950", "address_complement": "Apto 21", "city": "Florianópolis", "state": "SC", "estimated_cleaning_time": 75, "observations": "Tem máquina de lavar"},
        {"name": "Apto Canasvieiras", "address": "Rua da Praia, 330", "address_complement": "Apto 15", "city": "Florianópolis", "state": "SC", "estimated_cleaning_time": 60, "observations": ""},
    ]
    if db.query(Apartment).count() == 0:
        for data in aptos_data:
            db.add(Apartment(**data))
        db.commit()
        print(f"{len(aptos_data)} apartamentos criados")

    # Escala semanal (WEEKLY): a partir do próximo sábado
    if db.query(Schedule).filter(Schedule.schedule_type == ScheduleType.WEEKLY).count() == 0:
        today = date.today()
        days_until_sat = (5 - today.weekday()) % 7  # sábado = 5 na iso (seg=0)
        if days_until_sat == 0:
            days_until_sat = 7
        week_start = today + timedelta(days=days_until_sat)
        week_end = week_start + timedelta(days=6)

        schedule = Schedule(
            schedule_type=ScheduleType.WEEKLY,
            start_date=week_start,
            end_date=week_end,
            notes="Escala de demonstração (semanal)"
        )
        db.add(schedule)
        db.commit()
        print(f"Escala criada: {week_start} a {week_end}")

        apartamentos = db.query(Apartment).all()
        tasks_data = [
            (0, "09:00", TaskType.FULL_DAY),
            (1, "13:00", TaskType.HALF_DAY),
            (2, "09:00", TaskType.FULL_DAY),
            (3, "13:00", TaskType.HALF_DAY),
            (4, "09:00", TaskType.FULL_DAY),
            (5, "13:00", TaskType.HALF_DAY),
        ]
        for idx, (apt_idx, time_str, ttype) in enumerate(tasks_data):
            task_date = week_start + timedelta(days=idx)
            h, m = map(int, time_str.split(":"))
            db.add(ScheduleTask(
                schedule_id=schedule.id,
                employee_id=maria.id,
                apartment_id=apartamentos[apt_idx].id,
                scheduled_date=task_date,
                scheduled_time=time(h, m),
                task_type=ttype,
            ))
        db.commit()
        print("6 tarefas criadas na escala")

    print("\n=== Dados de demonstração prontos ===")
    print("Admin:       admin / admin123")
    print("Funcionária: maria / maria123")
finally:
    db.close()