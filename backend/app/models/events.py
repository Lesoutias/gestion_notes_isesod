from sqlalchemy import event, select

from app.core.generators import (
  generate_cours_code,
  generate_departement_code,
  generate_enseignant_matricule,
  generate_faculte_code,
  generate_matricule,
)
from app.models.annees_academiques import AnneeAcademique
from app.models.cours import Cours
from app.models.departements import Departement
from app.models.enseignants import Enseignant
from app.models.enums import StatutAnneeAcademique
from app.models.etudiants import Etudiant
from app.models.evaluations import Evaluation
from app.models.facultes import Faculte
from app.models.notes import Note


@event.listens_for(Faculte, "before_insert")
def set_faculte_code(_mapper, connection, target):
  if not target.code:
    target.code = generate_faculte_code(connection)


@event.listens_for(Departement, "before_insert")
def set_departement_code(_mapper, connection, target):
  if not target.code:
    target.code = generate_departement_code(connection, target.faculte_id)


@event.listens_for(Etudiant, "before_insert")
def set_etudiant_matricule(_mapper, connection, target):
  if not target.matricule:
    target.matricule = generate_matricule(connection)


@event.listens_for(Enseignant, "before_insert")
def set_enseignant_matricule(_mapper, connection, target):
  if not target.matricule:
    target.matricule = generate_enseignant_matricule(connection)


def _apply_cours_fields(connection, target):
  if target.volume_horaire is not None and target.volume_horaire > 0:
    target.credits = round(target.volume_horaire / 15)
  if target.promotion_id and not target.code:
    target.code = generate_cours_code(connection, target.promotion_id)


@event.listens_for(Cours, "before_insert")
def set_cours_on_insert(_mapper, connection, target):
  _apply_cours_fields(connection, target)


@event.listens_for(Cours, "before_update")
def set_cours_on_update(_mapper, connection, target):
  _apply_cours_fields(connection, target)


def _validate_note(connection, target):
  cote_maximale = connection.execute(
    select(Evaluation.cote_maximale).where(Evaluation.id == target.evaluation_id)
  ).scalar_one()

  if target.cote_obtenue < 0 or target.cote_obtenue > cote_maximale:
    raise ValueError(
      f"La cote obtenue doit être comprise entre 0 et {cote_maximale}."
    )

  target.moyenne_obtenue = round((target.cote_obtenue / cote_maximale) * 100, 2)


@event.listens_for(Note, "before_insert")
def validate_note_on_insert(_mapper, connection, target):
  _validate_note(connection, target)


@event.listens_for(Note, "before_update")
def validate_note_on_update(_mapper, connection, target):
  _validate_note(connection, target)


def _ensure_single_active_year(connection, target):
  if target.statut != StatutAnneeAcademique.active:
    return

  stmt = select(AnneeAcademique.id).where(
    AnneeAcademique.statut == StatutAnneeAcademique.active
  )
  if target.id is not None:
    stmt = stmt.where(AnneeAcademique.id != target.id)

  if connection.execute(stmt).first():
    raise ValueError("Une seule année académique active est autorisée.")


@event.listens_for(AnneeAcademique, "before_insert")
def ensure_single_active_year_on_insert(_mapper, connection, target):
  _ensure_single_active_year(connection, target)


@event.listens_for(AnneeAcademique, "before_update")
def ensure_single_active_year_on_update(_mapper, connection, target):
  _ensure_single_active_year(connection, target)
