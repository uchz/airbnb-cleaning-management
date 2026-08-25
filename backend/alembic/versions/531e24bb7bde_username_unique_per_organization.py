"""username unique per organization

Revision ID: 531e24bb7bde
Revises: ffc35eda2650
Create Date: 2026-08-25 19:56:34.624655

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '531e24bb7bde'
down_revision: Union[str, None] = 'ffc35eda2650'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # username era unique global, agora é unique por organization_id
    op.drop_index('ix_users_username', table_name='users')
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=False)
    op.create_unique_constraint('uq_user_org_username', 'users', ['organization_id', 'username'])


def downgrade() -> None:
    op.drop_constraint('uq_user_org_username', 'users', type_='unique')
    op.drop_index(op.f('ix_users_username'), table_name='users')
    op.create_index('ix_users_username', 'users', ['username'], unique=True)
