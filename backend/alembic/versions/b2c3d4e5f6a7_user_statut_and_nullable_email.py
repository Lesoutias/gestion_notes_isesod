"""user_statut_and_nullable_email

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-06-27 01:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect

revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, Sequence[str], None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _column_names(table: str) -> set[str]:
  bind = op.get_bind()
  return {col["name"] for col in inspect(bind).get_columns(table)}


def upgrade() -> None:
  columns = _column_names("users")

  if "statut" not in columns:
    op.add_column(
      "users",
      sa.Column("statut", sa.String(length=20), nullable=True),
    )
    if "is_active" in columns:
      op.execute(sa.text("UPDATE users SET statut = 'actif' WHERE is_active = true"))
      op.execute(sa.text("UPDATE users SET statut = 'inactif' WHERE is_active = false"))
    else:
      op.execute(sa.text("UPDATE users SET statut = 'actif'"))
    op.alter_column("users", "statut", nullable=False)

  if "is_active" in columns:
    op.drop_column("users", "is_active")

  op.alter_column("users", "email", existing_type=sa.String(length=120), nullable=True)


def downgrade() -> None:
  columns = _column_names("users")

  op.alter_column("users", "email", existing_type=sa.String(length=120), nullable=False)

  if "is_active" not in columns:
    op.add_column(
      "users",
      sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
    )
    if "statut" in columns:
      op.execute(sa.text("UPDATE users SET is_active = true WHERE statut = 'actif'"))
      op.execute(sa.text("UPDATE users SET is_active = false WHERE statut = 'inactif'"))

  if "statut" in columns:
    op.drop_column("users", "statut")
