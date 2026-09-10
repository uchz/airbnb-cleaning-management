"""add lgpd compliance fields

Revision ID: a1b2c3d4e5f6
Revises: ffc35eda2650
Create Date: 2026-09-10

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'ffc35eda2650'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add LGPD consent fields to users table
    op.add_column('users', sa.Column('privacy_consent_at', sa.DateTime(), nullable=True))
    op.add_column('users', sa.Column('video_consent_at', sa.DateTime(), nullable=True))
    op.add_column('users', sa.Column('deleted_at', sa.DateTime(), nullable=True))
    op.add_column('users', sa.Column('deletion_scheduled_for', sa.DateTime(), nullable=True))
    
    # Add trial period to organizations (created_at já existe, não adicionar)
    op.add_column('organizations', sa.Column('trial_ends_at', sa.DateTime(), nullable=True))
    
    # Create access_logs table for LGPD audit
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
