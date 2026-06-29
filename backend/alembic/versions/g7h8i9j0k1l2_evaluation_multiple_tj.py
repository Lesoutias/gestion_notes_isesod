"""Permettre plusieurs évaluations TJ par cours.

Revision ID: g7h8i9j0k1l2
Revises: f6a7b8c9d0e1
Create Date: 2026-06-27
"""

from alembic import op

revision = "g7h8i9j0k1l2"
down_revision = "f6a7b8c9d0e1"
branch_labels = None
depends_on = None


def upgrade() -> None:
  op.drop_constraint("uq_evaluation_cours_annee_type", "evaluations", type_="unique")


def downgrade() -> None:
  op.create_unique_constraint(
    "uq_evaluation_cours_annee_type",
    "evaluations",
    ["cours_id", "annee_academique_id", "type_evaluation"],
  )
