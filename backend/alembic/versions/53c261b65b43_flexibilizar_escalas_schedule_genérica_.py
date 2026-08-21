"""flexibilizar escalas: Schedule genérica + tarefas avulsas

Revision ID: 53c261b65b43
Revises: be971f49074d
Create Date: 2026-08-21 11:33:18.993100

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '53c261b65b43'
down_revision: Union[str, None] = 'be971f49074d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Garantir enum scheduletype
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE scheduletype AS ENUM ('WEEKLY', 'DATE_RANGE', 'AD_HOC');
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END $$;
    """)
    
    # 2. Criar tabela schedules com SQL puro
    op.execute("""
        CREATE TABLE schedules (
            id SERIAL PRIMARY KEY,
            schedule_type scheduletype NOT NULL,
            start_date DATE,
            end_date DATE,
            status schedulestatus,
            notes TEXT,
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ
        )
    """)
    
    op.execute("CREATE INDEX ix_schedules_id ON schedules (id)")
    op.execute("CREATE INDEX ix_schedules_schedule_type ON schedules (schedule_type)")
    op.execute("CREATE INDEX ix_schedules_start_date ON schedules (start_date)")
    
    # Migrar dados de weekly_schedules para schedules
    op.execute("""
        INSERT INTO schedules (id, schedule_type, start_date, end_date, status, notes, created_at, updated_at)
        SELECT id, 'WEEKLY'::scheduletype, week_start, week_end, status, notes, created_at, updated_at
        FROM weekly_schedules
    """)
    
    # 3. Remover foreign key de schedule_tasks ANTES de dropar weekly_schedules
    op.execute("ALTER TABLE schedule_tasks DROP CONSTRAINT IF EXISTS schedule_tasks_schedule_id_fkey")
    
    # 4. Remover tabela antiga
    op.execute("DROP INDEX IF EXISTS ix_weekly_schedules_id")
    op.execute("DROP INDEX IF EXISTS ix_weekly_schedules_week_start")
    op.execute("DROP TABLE weekly_schedules")
    
    # 5. Alterar schedule_tasks
    op.execute("ALTER TABLE schedule_tasks ALTER COLUMN schedule_id DROP NOT NULL")
    op.execute("CREATE INDEX IF NOT EXISTS ix_schedule_tasks_schedule_id ON schedule_tasks (schedule_id)")
    op.execute("ALTER TABLE schedule_tasks ADD CONSTRAINT schedule_tasks_schedule_id_fkey FOREIGN KEY (schedule_id) REFERENCES schedules (id)")


def downgrade() -> None:
    # Reverter schedule_tasks
    op.execute("ALTER TABLE schedule_tasks DROP CONSTRAINT IF EXISTS schedule_tasks_schedule_id_fkey")
    op.execute("DROP INDEX IF EXISTS ix_schedule_tasks_schedule_id")
    op.execute("ALTER TABLE schedule_tasks ALTER COLUMN schedule_id SET NOT NULL")
    
    # Recriar weekly_schedules
    op.execute("""
        CREATE TABLE weekly_schedules (
            id SERIAL PRIMARY KEY,
            week_start DATE NOT NULL,
            week_end DATE NOT NULL,
            status schedulestatus,
            notes VARCHAR,
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ
        )
    """)
    op.execute("CREATE INDEX ix_weekly_schedules_week_start ON weekly_schedules (week_start)")
    op.execute("CREATE INDEX ix_weekly_schedules_id ON weekly_schedules (id)")
    
    # Remover schedules
    op.execute("DROP INDEX IF EXISTS ix_schedules_start_date")
    op.execute("DROP INDEX IF EXISTS ix_schedules_schedule_type")
    op.execute("DROP INDEX IF EXISTS ix_schedules_id")
    op.execute("DROP TABLE schedules")