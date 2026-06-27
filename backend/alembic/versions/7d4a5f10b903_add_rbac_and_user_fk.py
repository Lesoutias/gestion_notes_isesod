"""add_rbac_and_user_fk

Revision ID: 7d4a5f10b903
Revises:
Create Date: 2026-06-26 23:40:40.910412

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision: str = "7d4a5f10b903"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _table_names() -> set[str]:
  bind = op.get_bind()
  return set(inspect(bind).get_table_names())


def _has_fk(table: str, referred_table: str, column: str) -> bool:
  bind = op.get_bind()
  for fk in inspect(bind).get_foreign_keys(table):
    if (
      fk["referred_table"] == referred_table
      and column in fk["constrained_columns"]
    ):
      return True
  return False


def upgrade() -> None:
  tables = _table_names()

  if "permissions" not in tables:
    op.create_table(
      "permissions",
      sa.Column("id", sa.Integer(), nullable=False),
      sa.Column("code", sa.String(length=80), nullable=False),
      sa.Column("libelle", sa.String(length=150), nullable=False),
      sa.Column("module", sa.String(length=50), nullable=False),
      sa.Column("description", sa.Text(), nullable=True),
      sa.PrimaryKeyConstraint("id"),
      sa.UniqueConstraint("code"),
    )

  if "roles" not in tables:
    op.create_table(
      "roles",
      sa.Column("id", sa.Integer(), nullable=False),
      sa.Column("nom", sa.String(length=50), nullable=False),
      sa.Column("description", sa.Text(), nullable=True),
      sa.PrimaryKeyConstraint("id"),
      sa.UniqueConstraint("nom"),
    )

  if "role_permissions" not in tables:
    op.create_table(
      "role_permissions",
      sa.Column("role_id", sa.Integer(), nullable=False),
      sa.Column("permission_id", sa.Integer(), nullable=False),
      sa.ForeignKeyConstraint(["permission_id"], ["permissions.id"]),
      sa.ForeignKeyConstraint(["role_id"], ["roles.id"]),
      sa.PrimaryKeyConstraint("role_id", "permission_id"),
    )

  if "users" not in tables:
    op.create_table(
      "users",
      sa.Column("id", sa.Integer(), nullable=False),
      sa.Column("email", sa.String(length=120), nullable=False),
      sa.Column("mot_de_passe_hash", sa.String(length=255), nullable=False),
      sa.Column("role_id", sa.Integer(), nullable=False),
      sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
      sa.Column("etudiant_id", sa.Integer(), nullable=True),
      sa.Column("enseignant_id", sa.Integer(), nullable=True),
      sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
      sa.ForeignKeyConstraint(["enseignant_id"], ["enseignants.id"]),
      sa.ForeignKeyConstraint(["etudiant_id"], ["etudiants.id"]),
      sa.ForeignKeyConstraint(["role_id"], ["roles.id"]),
      sa.PrimaryKeyConstraint("id"),
      sa.UniqueConstraint("email"),
    )

  if not _has_fk("etudiants", "users", "user_id"):
    op.create_foreign_key(
      "etudiants_user_id_fkey",
      "etudiants",
      "users",
      ["user_id"],
      ["id"],
    )

  if not _has_fk("enseignants", "users", "user_id"):
    op.create_foreign_key(
      "enseignants_user_id_fkey",
      "enseignants",
      "users",
      ["user_id"],
      ["id"],
    )


def downgrade() -> None:
  if _has_fk("enseignants", "users", "user_id"):
    op.drop_constraint("enseignants_user_id_fkey", "enseignants", type_="foreignkey")

  if _has_fk("etudiants", "users", "user_id"):
    op.drop_constraint("etudiants_user_id_fkey", "etudiants", type_="foreignkey")

  tables = _table_names()

  if "users" in tables:
    op.drop_table("users")

  if "role_permissions" in tables:
    op.drop_table("role_permissions")

  if "roles" in tables:
    op.drop_table("roles")

  if "permissions" in tables:
    op.drop_table("permissions")
