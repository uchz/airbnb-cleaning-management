"""flexibilizar escalas: Schedule genérica + tarefas avulsas

Revision ID: 53c261b65b43
Revises: be971f49074d
Create Date: 2026-08-21 11:33:18.993100

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '53c261b65b43'
down_revision: Union[str, None] = 'be971f49074d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Garantir que enum scheduletype existe (criar se não existir)
    # Usar raw SQL para evitar problemas de create_type
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE scheduletype AS ENUM ('WEEKLY', 'DATE_RANGE', 'AD_HOC');
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END $$;
    """)
    
    # Criar tabela schedules usando enums existentes (schedulestatus já existe, scheduletype também)
    op.create_table('schedules',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('schedule_type', sa.Enum('WEEKLY', 'DATE_RANGE', 'AD_HOC', name='scheduletype', create_type=False), nullable=False),
        sa.Column('start_date', sa.Date(), nullable=True),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('status', sa.Enum('ACTIVE', 'COMPLETED', 'CANCELLED', name='schedulestatus', create_type=False), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_schedules_id'), 'schedules', ['id'], unique=False)
    op.create_index(op.f('ix_schedules_schedule_type'), 'schedules', ['schedule_type'], unique=False)
    op.create_index(op.f('ix_schedules_start_date'), 'schedules', ['start_date'], unique=False)
    
    # Migrar dados de weekly_schedules para schedules (manter dados existentes)
    op.execute("""
        INSERT INTO schedules (id, schedule_type, start_date, end_date, status, notes, created_at, updated_at)
        SELECT id, 'WEEKLY'::scheduletype, week_start, week_end, status, notes, created_at, updated_at
        FROM weekly_schedules
    """)
    
    op.drop_index('ix_weekly_schedules_id', table_name='weekly_schedules')
    op.drop_index('ix_weekly_schedules_week_start', table_name='weekly_schedules')
    op.drop_table('weekly_schedules')
    
    op.alter_column('schedule_tasks', 'schedule_id',
               existing_type=sa.INTEGER(),
               nullable=True)
    op.create_index(op.f('ix_schedule_tasks_schedule_id'), 'schedule_tasks', ['schedule_id'], unique=False)
    op.drop_constraint('schedule_tasks_schedule_id_fkey', 'schedule_tasks', type_='foreignkey')
    op.create_foreign_key(None, 'schedule_tasks', 'schedules', ['schedule_id'], ['id'])


def downgrade() -> None:
    op.drop_constraint(None, 'schedule_tasks', type_='foreignkey')
    op.create_foreign_key('schedule_tasks_schedule_id_fkey', 'schedule_tasks', 'weekly_schedules', ['schedule_id'], ['id'])
    op.drop_index(op.f('ix_schedule_tasks_schedule_id'), table_name='schedule_tasks')
    op.alter_column('schedule_tasks', 'schedule_id',
               existing_type=sa.INTEGER(),
               nullable=False)
    
    op.create_table('weekly_schedules',
        sa.Column('id', sa.INTEGER(), autoincrement=True, nullable=False),
        sa.Column('week_start', sa.DATE(), autoincrement=False, nullable=False),
        sa.Column('week_end', sa.DATE(), autoincrement=False, nullable=False),
        sa.Column('status', postgresql.ENUM('ACTIVE', 'COMPLETED', 'CANCELLED', name='schedulestatus', create_type=False), autoincrement=False, nullable=True),
        sa.Column('notes', sa.VARCHAR(), autoincrement=False, nullable=True),
        sa.Column('created_at', postgresql.TIMESTAMP(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), autoincrement=False, nullable=True),
        sa.Column('updated_at', postgresql.TIMESTAMP(timezone=True), autoincrement=False, nullable=True),
        sa.PrimaryKeyConstraint('id', name='weekly_schedules_pkey')
    )
    op.create_index('ix_weekly_schedules_week_start', 'weekly_schedules', ['week_start'], unique=False)
    op.create_index('ix_weekly_schedules_id', 'weekly_schedules', ['id'], unique=False)
    op.drop_index(op.f('ix_schedules_start_date'), table_name='schedules')
    op.drop_index(op.f('ix_schedules_schedule_type'), table_name='schedules')
    op.drop_index(op.f('ix_schedules_id'), table_name='schedules')
    op.drop_table('schedules')