"""add lgpd compliance fields

Revision ID: a1b2c3d4e5f6
Revises: 531e24bb7bde
Create Date: 2026-09-10

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '531e24bb7bde'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Usar bind para detectar conexão e fazer operações seguras
    conn = op.get_bind()
    
    # Add LGPD consent fields to users table (com try/except para evitar erro se já existir)
    from sqlalchemy import inspect
    inspector = inspect(conn)
    users_columns = [c['name'] for c in inspector.get_columns('users')]
    
    if 'privacy_consent_at' not in users_columns:
        op.add_column('users', sa.Column('privacy_consent_at', sa.DateTime(), nullable=True))
    if 'video_consent_at' not in users_columns:
        op.add_column('users', sa.Column('video_consent_at', sa.DateTime(), nullable=True))
    if 'deleted_at' not in users_columns:
        op.add_column('users', sa.Column('deleted_at', sa.DateTime(), nullable=True))
    if 'deletion_scheduled_for' not in users_columns:
        op.add_column('users', sa.Column('deletion_scheduled_for', sa.DateTime(), nullable=True))
    
    # Add trial period to organizations
    orgs_columns = [c['name'] for c in inspector.get_columns('organizations')]
    if 'trial_ends_at' not in orgs_columns:
        op.add_column('organizations', sa.Column('trial_ends_at', sa.DateTime(), nullable=True))
    
    # Create access_logs table for LGPD audit (verificar se já existe)
    existing_tables = inspector.get_table_names()
    if 'access_logs' not in existing_tables:
        op.create_table(
            'access_logs',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=True),
            sa.Column('action', sa.String(length=50), nullable=False),
            sa.Column('resource_type', sa.String(length=50), nullable=False),
            sa.Column('resource_id', sa.String(length=255), nullable=True),
            sa.Column('ip_address', sa.String(length=45), nullable=True),
            sa.Column('timestamp', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.Column('organization_id', sa.Integer(), nullable=True),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
            sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('ix_access_logs_user_id', 'access_logs', ['user_id'])
        op.create_index('ix_access_logs_timestamp', 'access_logs', ['timestamp'])
        op.create_index('ix_access_logs_organization_id', 'access_logs', ['organization_id'])


def downgrade() -> None:
    # Drop access_logs table
    op.drop_index('ix_access_logs_organization_id', 'access_logs')
    op.drop_index('ix_access_logs_timestamp', 'access_logs')
    op.drop_index('ix_access_logs_user_id', 'access_logs')
    op.drop_table('access_logs')
    
    # Remove trial fields from organizations (não drop created_at, já existia)
    op.drop_column('organizations', 'trial_ends_at')
    
    # Remove LGPD fields from users
    op.drop_column('users', 'deletion_scheduled_for')
    op.drop_column('users', 'deleted_at')
    op.drop_column('users', 'video_consent_at')
    op.drop_column('users', 'privacy_consent_at')
