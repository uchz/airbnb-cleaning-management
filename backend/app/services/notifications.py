from sqlalchemy.orm import Session
from typing import Optional
from app.models.notification import Notification
from app.models.user import User, UserRole


def create_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    notification_type: str = "info",
    link: Optional[str] = None,
) -> Notification:
    """Cria uma notificação in-app para um usuário"""
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        notification_type=notification_type,
        link=link,
    )
    db.add(notification)
    return notification


def notify_task_created(db: Session, task) -> None:
    """Notifica o funcionário quando uma tarefa é criada para ele"""
    from app.models.apartment import Apartment

    apartment = db.query(Apartment).filter(Apartment.id == task.apartment_id).first()
    apt_name = apartment.name if apartment else f"Apto #{task.apartment_id}"

    create_notification(
        db,
        user_id=task.employee_id,
        title="Nova tarefa atribuída",
        message=f"Você tem uma nova limpeza no {apt_name} em {task.scheduled_date.strftime('%d/%m/%Y')} às {task.scheduled_time.strftime('%H:%M')}.",
        notification_type="task_created",
        link=f"/task/{task.id}",
    )


def notify_task_completed(db: Session, task, completed_by: User) -> None:
    """Notifica todos os admins quando uma tarefa é concluída"""
    from app.models.apartment import Apartment

    apartment = db.query(Apartment).filter(Apartment.id == task.apartment_id).first()
    apt_name = apartment.name if apartment else f"Apto #{task.apartment_id}"

    admins = db.query(User).filter(User.role == UserRole.ADMIN).all()
    for admin in admins:
        create_notification(
            db,
            user_id=admin.id,
            title="Tarefa concluída",
            message=f"{completed_by.full_name} concluiu a limpeza do {apt_name} ({task.scheduled_date.strftime('%d/%m/%Y')}).",
            notification_type="task_completed",
            link=f"/task/{task.id}",
        )