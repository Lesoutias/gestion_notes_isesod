"""fiche_synthetique_fields

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-06-27 14:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect

revision: str = "d4e5f6a7b8c9"
down_revision: Union[str, Sequence[str], None] = "c3d4e5f6a7b8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

STATUT_FICHE = sa.Enum(
  "en_attente",
  "complete",
  "validee",
  name="statutfichesynthetique",
)


def _column_names(table: str) -> set[str]:
  bind = op.get_bind()
  return {col["name"] for col in inspect(bind).get_columns(table)}


def _constraint_names(table: str) -> set[str]:
  bind = op.get_bind()
  inspector = inspect(bind)
  names: set[str] = set()
  for uc in inspector.get_unique_constraints(table):
    if uc.get("name"):
      names.add(uc["name"])
  pk = inspector.get_pk_constraint(table)
  if pk.get("name"):
    names.add(pk["name"])
  for fk in inspector.get_foreign_keys(table):
    if fk.get("name"):
      names.add(fk["name"])
  return names


def _column_udt_name(table: str, column: str) -> str | None:
  bind = op.get_bind()
  return bind.execute(
    sa.text(
      """
      SELECT udt_name
      FROM information_schema.columns
      WHERE table_name = :table AND column_name = :column
      """
    ),
    {"table": table, "column": column},
  ).scalar()


def upgrade() -> None:
  fiche_cols = _column_names("fiches_synthetiques")
  ligne_cols = _column_names("fiches_synthetiques_lignes")

  STATUT_FICHE.create(op.get_bind(), checkfirst=True)

  if "date_creation" not in fiche_cols and "date_generation" in fiche_cols:
    op.alter_column(
      "fiches_synthetiques",
      "date_generation",
      new_column_name="date_creation",
    )
    fiche_cols = _column_names("fiches_synthetiques")

  if "date_creation" not in fiche_cols:
    op.add_column(
      "fiches_synthetiques",
      sa.Column("date_creation", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )

  if "date_validation" not in fiche_cols:
    op.add_column(
      "fiches_synthetiques",
      sa.Column("date_validation", sa.DateTime(), nullable=True),
    )

  if "total_cours_attendus" not in fiche_cols:
    op.add_column(
      "fiches_synthetiques",
      sa.Column("total_cours_attendus", sa.Integer(), server_default="0", nullable=False),
    )

  if "total_cours_recus" not in fiche_cols:
    op.add_column(
      "fiches_synthetiques",
      sa.Column("total_cours_recus", sa.Integer(), server_default="0", nullable=False),
    )

  if _column_udt_name("fiches_synthetiques", "statut") == "statutdocument":
    op.execute(
      sa.text(
        """
        ALTER TABLE fiches_synthetiques
        ALTER COLUMN statut TYPE statutfichesynthetique
        USING (
          CASE statut::text
            WHEN 'valide' THEN 'validee'::statutfichesynthetique
            WHEN 'brouillon' THEN 'en_attente'::statutfichesynthetique
            ELSE 'en_attente'::statutfichesynthetique
          END
        )
        """
      )
    )

  op.execute(
    sa.text(
      """
      UPDATE fiches_synthetiques
      SET statut = 'en_attente'::statutfichesynthetique
      WHERE statut::text NOT IN ('en_attente', 'complete', 'validee')
      """
    )
  )

  op.execute(
    sa.text(
      """
      UPDATE fiches_synthetiques f
      SET total_cours_attendus = (
        SELECT COUNT(*) FROM cours c WHERE c.promotion_id = f.promotion_id
      )
      """
    )
  )

  op.execute(
    sa.text(
      """
      UPDATE fiches_synthetiques f
      SET total_cours_recus = (
        SELECT COUNT(DISTINCT l.cours_id)
        FROM fiches_synthetiques_lignes l
        WHERE l.fiche_synthetique_id = f.id
      )
      """
    )
  )

  new_ligne_columns = [
    ("enseignant_id", sa.Integer(), None),
    ("cote_finale_sur_20", sa.Float(), "moyenne_finale"),
    ("points_max_ponderes", sa.Float(), None),
    ("appreciation", sa.String(length=30), None),
  ]
  for name, col_type, copy_from in new_ligne_columns:
    if name not in ligne_cols:
      op.add_column(
        "fiches_synthetiques_lignes",
        sa.Column(name, col_type, nullable=True),
      )
      if copy_from:
        op.execute(
          sa.text(
            f"UPDATE fiches_synthetiques_lignes SET {name} = {copy_from}"
          )
        )
      if name != "appreciation":
        if name == "enseignant_id":
          op.execute(
            sa.text(
              """
              UPDATE fiches_synthetiques_lignes l
              SET enseignant_id = c.enseignant_id
              FROM cours c
              WHERE l.cours_id = c.id AND c.enseignant_id IS NOT NULL
              """
            )
          )
          op.execute(
            sa.text(
              """
              UPDATE fiches_synthetiques_lignes
              SET enseignant_id = (SELECT id FROM enseignants ORDER BY id LIMIT 1)
              WHERE enseignant_id IS NULL
              """
            )
          )
        if name == "points_max_ponderes":
          op.execute(
            sa.text(
              """
              UPDATE fiches_synthetiques_lignes
              SET points_max_ponderes = credits * 20.0
              """
            )
          )
        op.alter_column("fiches_synthetiques_lignes", name, nullable=False)
        if name == "enseignant_id":
          op.create_foreign_key(
            "fk_fiches_lignes_enseignant_id",
            "fiches_synthetiques_lignes",
            "enseignants",
            ["enseignant_id"],
            ["id"],
          )

  fiche_constraints = _constraint_names("fiches_synthetiques")
  ligne_constraints = _constraint_names("fiches_synthetiques_lignes")

  if "uq_fiche_promotion_annee" not in fiche_constraints:
    op.create_unique_constraint(
      "uq_fiche_promotion_annee",
      "fiches_synthetiques",
      ["promotion_id", "annee_academique_id"],
    )
  if "uq_fiche_ligne_etudiant_cours" not in ligne_constraints:
    op.create_unique_constraint(
      "uq_fiche_ligne_etudiant_cours",
      "fiches_synthetiques_lignes",
      ["fiche_synthetique_id", "etudiant_id", "cours_id"],
    )


def downgrade() -> None:
  ligne_cols = _column_names("fiches_synthetiques_lignes")
  fiche_cols = _column_names("fiches_synthetiques")

  op.drop_constraint("uq_fiche_ligne_etudiant_cours", "fiches_synthetiques_lignes", type_="unique")
  op.drop_constraint("uq_fiche_promotion_annee", "fiches_synthetiques", type_="unique")

  if "enseignant_id" in ligne_cols:
    op.drop_constraint("fk_fiches_lignes_enseignant_id", "fiches_synthetiques_lignes", type_="foreignkey")
    op.drop_column("fiches_synthetiques_lignes", "enseignant_id")

  for name in ["appreciation", "points_max_ponderes", "cote_finale_sur_20"]:
    if name in ligne_cols:
      op.drop_column("fiches_synthetiques_lignes", name)

  if "total_cours_recus" in fiche_cols:
    op.drop_column("fiches_synthetiques", "total_cours_recus")
  if "total_cours_attendus" in fiche_cols:
    op.drop_column("fiches_synthetiques", "total_cours_attendus")
  if "date_validation" in fiche_cols:
    op.drop_column("fiches_synthetiques", "date_validation")

  op.execute(
    sa.text(
      "ALTER TABLE fiches_synthetiques ALTER COLUMN statut TYPE statutdocument "
      "USING CASE statut::text "
      "WHEN 'validee' THEN 'valide'::statutdocument "
      "ELSE 'brouillon'::statutdocument END"
    )
  )

  if "date_creation" in fiche_cols:
    op.alter_column(
      "fiches_synthetiques",
      "date_creation",
      new_column_name="date_generation",
    )

  STATUT_FICHE.drop(op.get_bind(), checkfirst=True)
