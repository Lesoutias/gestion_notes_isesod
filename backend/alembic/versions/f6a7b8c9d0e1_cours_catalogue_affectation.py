"""cours_catalogue_affectation

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-06-27 18:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "f6a7b8c9d0e1"
down_revision: Union[str, Sequence[str], None] = "e5f6a7b8c9d0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
  op.add_column("cours", sa.Column("description", sa.Text(), nullable=True))
  op.add_column("cours", sa.Column("source_cours_id", sa.Integer(), nullable=True))
  op.create_foreign_key(
    "fk_cours_source_cours_id",
    "cours",
    "cours",
    ["source_cours_id"],
    ["id"],
    ondelete="SET NULL",
  )
  op.alter_column("cours", "promotion_id", existing_type=sa.Integer(), nullable=True)
  op.alter_column("cours", "volume_horaire", existing_type=sa.Integer(), nullable=True)


def downgrade() -> None:
  op.alter_column("cours", "volume_horaire", existing_type=sa.Integer(), nullable=False)
  op.alter_column("cours", "promotion_id", existing_type=sa.Integer(), nullable=False)
  op.drop_constraint("fk_cours_source_cours_id", "cours", type_="foreignkey")
  op.drop_column("cours", "source_cours_id")
  op.drop_column("cours", "description")
