"""rename email to username

Revision ID: c9736e713f8a
Revises: b2209ad7c18e
Create Date: 2026-08-17 11:54:15.717934

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c9736e713f8a'
down_revision: Union[str, None] = 'b2209ad7c18e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Adicionar coluna username como nullable (SQLite exige valor para NOT NULL)
    op.add_column('users', sa.Column('username', sa.String(), nullable=True))

    # 2. Copiar os valores existentes de email para username
    op.execute("UPDATE users SET username = email WHERE username IS NULL")

    # 3. Criar índice único em username
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)

    # 4. Remover a coluna email (e seu índice)
    op.drop_index('ix_users_email', table_name='users')
    op.drop_column('users', 'email')


def downgrade() -> None:
    # 1. Adicionar coluna email como nullable
    op.add_column('users', sa.Column('email', sa.VARCHAR(), nullable=True))

    # 2. Copiar os valores de volta
    op.execute("UPDATE users SET email = username WHERE email IS NULL")

    # 3. Recriar índice único em email
    op.create_index('ix_users_email', 'users', ['email'], unique=True)

    # 4. Remover username
    op.drop_index(op.f('ix_users_username'), table_name='users')
    op.drop_column('users', 'username')