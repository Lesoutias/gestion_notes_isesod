"""releves_cotes_tables

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-06-27 16:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "e5f6a7b8c9d0"
down_revision: Union[str, Sequence[str], None] = "d4e5f6a7b8c9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

STATUT_RELEVE = sa.Enum("genere", "publie", name="statutrelevecotes", create_type=False)


def upgrade() -> None:
  bind = op.get_bind()
  STATUT_RELEVE.create(bind, checkfirst=True)

  inspector = sa.inspect(bind)
  if "releves_cotes" in inspector.get_table_names():
    return

  op.create_table(
    "releves_cotes",
    sa.Column("id", sa.Integer(), nullable=False),
    sa.Column("etudiant_id", sa.Integer(), nullable=False),
    sa.Column("promotion_id", sa.Integer(), nullable=False),
    sa.Column("annee_academique_id", sa.Integer(), nullable=False),
    sa.Column("fiche_id", sa.Integer(), nullable=False),
    sa.Column("total_points_obtenus", sa.Float(), nullable=False, server_default="0"),
    sa.Column("total_points_max", sa.Float(), nullable=False, server_default="0"),
    sa.Column("total_credits", sa.Integer(), nullable=False, server_default="0"),
    sa.Column("pourcentage", sa.Float(), nullable=False, server_default="0"),
    sa.Column("mention", sa.String(length=30), nullable=False),
    sa.Column("decision", sa.String(length=20), nullable=False),
    sa.Column("rang", sa.Integer(), nullable=False),
    sa.Column(
      "statut",
      STATUT_RELEVE,
      nullable=False,
      server_default="genere",
    ),
    sa.Column("date_generation", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    sa.ForeignKeyConstraint(["annee_academique_id"], ["annees_academiques.id"]),
    sa.ForeignKeyConstraint(["etudiant_id"], ["etudiants.id"]),
    sa.ForeignKeyConstraint(["fiche_id"], ["fiches_synthetiques.id"]),
    sa.ForeignKeyConstraint(["promotion_id"], ["promotions.id"]),
    sa.PrimaryKeyConstraint("id"),
    sa.UniqueConstraint("etudiant_id", "fiche_id", name="uq_releve_etudiant_fiche"),
  )

  op.create_table(
    "releves_cotes_lignes",
    sa.Column("id", sa.Integer(), nullable=False),
    sa.Column("releve_id", sa.Integer(), nullable=False),
    sa.Column("cours_id", sa.Integer(), nullable=False),
    sa.Column("intitule_cours", sa.String(length=150), nullable=False),
    sa.Column("credits", sa.Integer(), nullable=False),
    sa.Column("cote_sur_20", sa.Float(), nullable=False),
    sa.Column("points_ponderes", sa.Float(), nullable=False),
    sa.Column("points_max_ponderes", sa.Float(), nullable=False),
    sa.Column("appreciation", sa.String(length=30), nullable=True),
    sa.ForeignKeyConstraint(["cours_id"], ["cours.id"]),
    sa.ForeignKeyConstraint(["releve_id"], ["releves_cotes.id"], ondelete="CASCADE"),
    sa.PrimaryKeyConstraint("id"),
  )


def downgrade() -> None:
  op.drop_table("releves_cotes_lignes")
  op.drop_table("releves_cotes")
  STATUT_RELEVE.drop(op.get_bind(), checkfirst=True)
