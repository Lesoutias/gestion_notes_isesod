"""cahier_cotes_enseignant_fields

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-06-27 12:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect

revision: str = "c3d4e5f6a7b8"
down_revision: Union[str, Sequence[str], None] = "b2c3d4e5f6a7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _column_names(table: str) -> set[str]:
  bind = op.get_bind()
  return {col["name"] for col in inspect(bind).get_columns(table)}


def upgrade() -> None:
  cahier_cols = _column_names("cahiers_cotes")
  ligne_cols = _column_names("cahiers_cotes_lignes")

  if "enseignant_id" not in cahier_cols:
    op.add_column(
      "cahiers_cotes",
      sa.Column("enseignant_id", sa.Integer(), nullable=True),
    )
    op.execute(
      sa.text(
        """
        UPDATE cahiers_cotes cc
        SET enseignant_id = c.enseignant_id
        FROM cours c
        WHERE cc.cours_id = c.id AND c.enseignant_id IS NOT NULL
        """
      )
    )
    op.execute(
      sa.text(
        """
        UPDATE cahiers_cotes
        SET enseignant_id = (SELECT id FROM enseignants ORDER BY id LIMIT 1)
        WHERE enseignant_id IS NULL
        """
      )
    )
    op.alter_column("cahiers_cotes", "enseignant_id", nullable=False)
    op.create_foreign_key(
      "fk_cahiers_cotes_enseignant_id",
      "cahiers_cotes",
      "enseignants",
      ["enseignant_id"],
      ["id"],
    )

  if "date_validation" not in cahier_cols:
    op.add_column(
      "cahiers_cotes",
      sa.Column("date_validation", sa.DateTime(), nullable=True),
    )

  new_ligne_columns = [
    ("cote_tj_sur_10", sa.Float(), 0.0),
    ("cote_examen_sur_10", sa.Float(), 0.0),
    ("cote_finale_sur_20", sa.Float(), 0.0),
    ("credits", sa.Integer(), 0),
    ("points_ponderes", sa.Float(), 0.0),
    ("points_max_ponderes", sa.Float(), 0.0),
    ("appreciation", sa.String(length=30), None),
  ]
  for name, col_type, default in new_ligne_columns:
    if name not in ligne_cols:
      op.add_column(
        "cahiers_cotes_lignes",
        sa.Column(name, col_type, nullable=True),
      )
      if default is not None:
        op.execute(
          sa.text(f"UPDATE cahiers_cotes_lignes SET {name} = {default}")
        )
      if name != "appreciation":
        op.alter_column("cahiers_cotes_lignes", name, nullable=False)

  if "moyenne_tj" in ligne_cols:
    op.execute(
      sa.text(
        "UPDATE cahiers_cotes_lignes SET moyenne_tj = 0 WHERE moyenne_tj IS NULL"
      )
    )
    op.execute(
      sa.text(
        "UPDATE cahiers_cotes_lignes SET moyenne_examen = 0 WHERE moyenne_examen IS NULL"
      )
    )


def downgrade() -> None:
  ligne_cols = _column_names("cahiers_cotes_lignes")
  cahier_cols = _column_names("cahiers_cotes")

  for name in [
    "appreciation",
    "points_max_ponderes",
    "points_ponderes",
    "credits",
    "cote_finale_sur_20",
    "cote_examen_sur_10",
    "cote_tj_sur_10",
  ]:
    if name in ligne_cols:
      op.drop_column("cahiers_cotes_lignes", name)

  if "date_validation" in cahier_cols:
    op.drop_column("cahiers_cotes", "date_validation")

  if "enseignant_id" in cahier_cols:
    op.drop_constraint("fk_cahiers_cotes_enseignant_id", "cahiers_cotes", type_="foreignkey")
    op.drop_column("cahiers_cotes", "enseignant_id")
