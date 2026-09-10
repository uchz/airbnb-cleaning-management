from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models import ScheduleTask, TaskExecution
from app.core.storage import storage_service
from app.core.database import SessionLocal


def cleanup_old_videos():
    """
    Job para deletar vídeos de tarefas concluídas há mais de 30 dias
    Executar diariamente via cron ou scheduler
    """
    db = SessionLocal()
    
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=30)
        
        # Buscar tarefas concluídas há mais de 30 dias com vídeos
        old_executions = db.query(TaskExecution).join(ScheduleTask).filter(
            ScheduleTask.status == "COMPLETED",
            TaskExecution.checkout_time < cutoff_date,
            TaskExecution.checkin_video_path.isnot(None)
        ).all()
        
        deleted_count = 0
        
        for execution in old_executions:
            # Deletar vídeo de check-in
            if execution.checkin_video_path:
                try:
                    storage_service.delete_video(execution.checkin_video_path)
                    execution.checkin_video_path = None
                    execution.checkin_video_url = "[DELETADO - RETENÇÃO 30 DIAS]"
                    deleted_count += 1
                except Exception as e:
                    print(f"Erro ao deletar vídeo check-in {execution.checkin_video_path}: {e}")
            
            # Deletar vídeo de check-out
            if execution.checkout_video_path:
                try:
                    storage_service.delete_video(execution.checkout_video_path)
                    execution.checkout_video_path = None
                    execution.checkout_video_url = "[DELETADO - RETENÇÃO 30 DIAS]"
                    deleted_count += 1
                except Exception as e:
                    print(f"Erro ao deletar vídeo check-out {execution.checkout_video_path}: {e}")
        
        db.commit()
        
        print(f"Cleanup concluído: {deleted_count} vídeos deletados")
        return {"deleted_videos": deleted_count, "executions_processed": len(old_executions)}
    
    except Exception as e:
        db.rollback()
        print(f"Erro no cleanup de vídeos: {e}")
        raise
    
    finally:
        db.close()


def cleanup_deleted_users():
    """
    Job para deletar permanentemente usuários marcados para exclusão
    após 30 dias (LGPD - direito ao esquecimento)
    """
    from app.models import User, Notification
    
    db = SessionLocal()
    
    try:
        now = datetime.utcnow()
        
        # Buscar usuários com exclusão agendada que já passou o prazo
        users_to_delete = db.query(User).filter(
            User.deleted_at.isnot(None),
            User.deletion_scheduled_for <= now
        ).all()
        
        deleted_count = 0
        
        for user in users_to_delete:
            try:
                # Deletar notificações do usuário
                db.query(Notification).filter(Notification.user_id == user.id).delete()
                
                # Deletar o usuário permanentemente
                db.delete(user)
                deleted_count += 1
                
            except Exception as e:
                print(f"Erro ao deletar usuário {user.id}: {e}")
                continue
        
        db.commit()
        
        print(f"Cleanup de usuários concluído: {deleted_count} usuários deletados permanentemente")
        return {"deleted_users": deleted_count}
    
    except Exception as e:
        db.rollback()
        print(f"Erro no cleanup de usuários: {e}")
        raise
    
    finally:
        db.close()


def cleanup_old_access_logs():
    """
    Job para deletar logs de acesso com mais de 90 dias
    Mantém apenas logs recentes para auditoria
    """
    from app.models import AccessLog
    
    db = SessionLocal()
    
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=90)
        
        deleted_count = db.query(AccessLog).filter(
            AccessLog.timestamp < cutoff_date
        ).delete()
        
        db.commit()
        
        print(f"Cleanup de logs concluído: {deleted_count} logs deletados")
        return {"deleted_logs": deleted_count}
    
    except Exception as e:
        db.rollback()
        print(f"Erro no cleanup de logs: {e}")
        raise
    
    finally:
        db.close()


if __name__ == "__main__":
    """Executar manualmente para teste"""
    print("=== Iniciando cleanup de vídeos ===")
    result_videos = cleanup_old_videos()
    print(f"Resultado: {result_videos}")
    
    print("\n=== Iniciando cleanup de usuários ===")
    result_users = cleanup_deleted_users()
    print(f"Resultado: {result_users}")
    
    print("\n=== Iniciando cleanup de logs ===")
    result_logs = cleanup_old_access_logs()
    print(f"Resultado: {result_logs}")
