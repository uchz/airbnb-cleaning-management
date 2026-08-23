"""add billing fields to organizations

Revision ID: ffc35eda2650
Revises: f682848b9938
Create Date: 2026-08-23

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ffc35eda2650'
down_revision: Union[str, None] = 'f682848b9938'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('organizations', sa.Column('plan', sa.String(), nullable=True, server_default='free'))
    op.add_column('organizations', sa.Column('stripe_customer_id', sa.String(), nullable=True))
    op.add_column('organizations', sa.Column('stripe_subscription_id', sa.String(), nullable=True))
    op.add_column('organizations', sa.Column('subscription_status', sa.String(), nullable=True, server_default='inactive'))
    op.execute("UPDATE organizations SET plan='free' WHERE plan IS NULL")
    op.execute("UPDATE organizations SET subscription_status='inactive' WHERE subscription_status IS NULL")


def downgrade() -> None:
    op.drop_column('organizations', 'subscription_status')
    op.drop_column('organizations', 'stripe_subscription_id')
    op.drop_column('organizations', 'stripe_customer_id')
    op.drop_column('organizations', 'plan')
