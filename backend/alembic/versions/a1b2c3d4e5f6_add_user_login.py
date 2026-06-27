"""add_user_login

Revision ID: a1b2c3d4e5f6
Revises: 7d4a5f10b903
Create Date: 2026-06-27 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect

revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "7d4a5f10b903"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _column_names(table: str) -> set[str]:
  bind = op.get_bind()
  return {col["name"] for col in inspect(bind).get_columns(table)}


def upgrade() -> None:
  if "login" in _column_names("users"):
    return

  op.add_column("users", sa.Column("login", sa.String(length=50), nullable=True))
  op.execute(
    sa.text(
      "UPDATE users SET login = split_part(email, '@', 1) WHERE login IS NULL"
    )
  )
  op.alter_column("users", "login", nullable=False)
  op.create_unique_constraint("uq_users_login", "users", ["login"])


def downgrade() -> None:
  if "login" not in _column_names("users"):
    return

  op.drop_constraint("uq_users_login", "users", type_="unique")
  op.drop_column("users", "login")
