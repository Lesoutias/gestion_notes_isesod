"""Un seul examen par cours et par année académique.

Revision ID: h8i9j0k1l2m3
Revises: g7h8i9j0k1l2
Create Date: 2026-06-27
"""

from alembic import op

revision = "h8i9j0k1l2m3"
down_revision = "g7h8i9j0k1l2"
branch_labels = None
depends_on = None


def upgrade() -> None:
  op.execute(
    """
    CREATE UNIQUE INDEX uq_evaluation_examen_cours_annee
    ON evaluations (cours_id, annee_academique_id)
    WHERE type_evaluation = 'EXAMEN'
    """
  )


def downgrade() -> None:
  op.drop_index("uq_evaluation_examen_cours_annee", table_name="evaluations")
