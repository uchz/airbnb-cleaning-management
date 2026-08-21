from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session, joinedload
from datetime import datetime, timedelta
import hmac
import hashlib

from app.core.database import get_db
from app.api.deps import get_current_user
from app.core.config import settings
from app.models.user import User
from app.models.task import ScheduleTask

router = APIRouter(prefix="/calendar", tags=["Calendar"])

TIMEZONE_OFFSET_HOURS = 3  # America/Sao_Paulo (UTC-3, sem DST desde 2019)

TASK_TYPE_LABELS = {"full_day": "Diária", "half_day": "Meia diária"}
TASK_STATUS_LABELS = {
    "pending": "Pendente",
    "in_progress": "Em andamento",
    "completed": "Concluída",
    "cancelled": "Cancelada",
}


def _ics_token(user_id: int) -> str:
    msg = f"ics:{user_id}".encode()
    return hmac.new(settings.SECRET_KEY.encode(), msg, hashlib.sha256).hexdigest()[:32]


def _escape(text: str) -> str:
    if not text:
        return ""
    return (
        text.replace("\\", "\\\\")
        .replace(";", "\\;")
        .replace(",", "\\,")
        .replace("\n", "\\n")
    )


@router.get("/my-feed")
def get_my_feed_url(current_user: User = Depends(get_current_user)):
    """URL pessoal do feed de calendário (usar no Google Calendar > 'De URL')"""
    return {
        "url": f"/api/calendar/{current_user.id}/feed.ics?token={_ics_token(current_user.id)}"
    }


@router.get("/{user_id}/feed.ics", response_class=PlainTextResponse)
def get_calendar_feed(
    user_id: int,
    token: str,
    db: Session = Depends(get_db),
):
    """Feed iCalendar das tarefas do usuário (assinável no Google Calendar/Apple Calendar)"""
    if not hmac.compare_digest(token, _ics_token(user_id)):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Token inválido")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado")

    tasks = (
        db.query(ScheduleTask)
        .options(joinedload(ScheduleTask.apartment))
        .filter(ScheduleTask.employee_id == user_id)
        .order_by(ScheduleTask.scheduled_date, ScheduleTask.scheduled_time)
        .all()
    )

    now_utc = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Gestao Limpeza Airbnb//PT-BR//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        f"X-WR-CALNAME:{_escape('Escala · ' + user.full_name)}",
        "X-WR-TIMEZONE:America/Sao_Paulo",
    ]

    for t in tasks:
        apt = t.apartment
        start_local = datetime.combine(t.scheduled_date, t.scheduled_time)
        start_utc = start_local - timedelta(hours=TIMEZONE_OFFSET_HOURS)
        minutes = getattr(apt, "estimated_cleaning_time", None) or 90
        end_utc = start_utc + timedelta(minutes=minutes)

        status_label = TASK_STATUS_LABELS.get(t.status.value if hasattr(t.status, "value") else t.status, "")
        prefix = "✔ " if (t.status.value if hasattr(t.status, "value") else t.status) == "completed" else ""
        type_label = TASK_TYPE_LABELS.get(t.task_type.value if hasattr(t.task_type, "value") else t.task_type, "")

        summary = f"{prefix}{apt.name} · {type_label}"
        location_parts = [apt.address, getattr(apt, "address_complement", None), getattr(apt, "city", None)]
        location = ", ".join([p for p in location_parts if p])
        desc_lines = [f"Status: {status_label}"]
        if t.notes:
            desc_lines.append(t.notes)
        if getattr(apt, "observations", None):
            desc_lines.append(apt.observations)

        lines += [
            "BEGIN:VEVENT",
            f"UID:tarefa-{t.id}@gestao-limpeza",
            f"DTSTAMP:{now_utc}",
            f"DTSTART:{start_utc.strftime('%Y%m%dT%H%M%SZ')}",
            f"DTEND:{end_utc.strftime('%Y%m%dT%H%M%SZ')}",
            f"SUMMARY:{_escape(summary)}",
            f"LOCATION:{_escape(location)}",
            f"DESCRIPTION:{_escape(chr(10).join(desc_lines))}",
            "STATUS:CONFIRMED",
            "END:VEVENT",
        ]

    lines.append("END:VCALENDAR")

    ics = "\r\n".join(lines) + "\r\n"
    return PlainTextResponse(
        content=ics,
        media_type="text/calendar; charset=utf-8",
        headers={"Content-Disposition": 'inline; filename="escala.ics"'},
    )