from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import (
  CahierCotes,
  Cours,
  Etudiant,
  Evaluation,
  Note,
  StatutDocument,
  StatutEvaluation,
  TypeEvaluation,
  User,
)
from app.schemas.evaluation import EvaluationEnseignantCreate, EvaluationEnseignantUpdate
from app.services.academic import get_active_annee_academique, get_or_404


def get_enseignant_id(user: User) -> int:
  if not user.enseignant_id:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail="Profil enseignant non lié à ce compte",
    )
  return user.enseignant_id


def get_cours_affecte(db: Session, cours_id: int, enseignant_id: int) -> Cours:
  cours = (
    db.query(Cours)
    .filter(Cours.id == cours_id, Cours.enseignant_id == enseignant_id)
    .first()
  )
  if not cours:
    raise HTTPException(
      status_code=status.HTTP_403_FORBIDDEN,
      detail="Vous n'êtes pas affecté à ce cours",
    )
  return cours


def get_evaluation_for_enseignant(
  db: Session,
  evaluation_id: int,
  enseignant_id: int,
) -> Evaluation:
  evaluation = (
    db.query(Evaluation)
    .filter(
      Evaluation.id == evaluation_id,
      Evaluation.enseignant_id == enseignant_id,
    )
    .first()
  )
  if not evaluation:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail="Évaluation introuvable",
    )
  return evaluation


def ensure_evaluation_modifiable(evaluation: Evaluation) -> None:
  if evaluation.statut == StatutEvaluation.cloturee:
    raise HTTPException(
      status_code=status.HTTP_409_CONFLICT,
      detail="Évaluation clôturée — modification impossible",
    )


def ensure_examen_unique(
  db: Session,
  cours_id: int,
  annee_academique_id: int,
  exclude_id: int | None = None,
) -> None:
  query = db.query(Evaluation).filter(
    Evaluation.cours_id == cours_id,
    Evaluation.annee_academique_id == annee_academique_id,
    Evaluation.type_evaluation == TypeEvaluation.EXAMEN,
  )
  if exclude_id is not None:
    query = query.filter(Evaluation.id != exclude_id)
  if query.first():
    raise HTTPException(
      status_code=status.HTTP_409_CONFLICT,
      detail="Un seul examen est autorisé par cours pour l'année académique en cours",
    )


def create_evaluation(
  db: Session,
  enseignant_id: int,
  payload: EvaluationEnseignantCreate,
) -> Evaluation:
  get_cours_affecte(db, payload.cours_id, enseignant_id)
  annee = get_active_annee_academique(db)

  if payload.type_evaluation == TypeEvaluation.EXAMEN:
    ensure_examen_unique(db, payload.cours_id, annee.id)

  evaluation = Evaluation(
    libelle=payload.libelle,
    type_evaluation=payload.type_evaluation,
    cote_maximale=payload.cote_maximale,
    date_evaluation=payload.date_evaluation,
    cours_id=payload.cours_id,
    enseignant_id=enseignant_id,
    annee_academique_id=annee.id,
    statut=StatutEvaluation.brouillon,
  )
  db.add(evaluation)
  try:
    db.commit()
  except IntegrityError as exc:
    db.rollback()
    if payload.type_evaluation == TypeEvaluation.EXAMEN:
      raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail="Un seul examen est autorisé par cours pour l'année académique en cours",
      ) from exc
    raise
  db.refresh(evaluation)
  return evaluation


def update_evaluation(
  db: Session,
  evaluation: Evaluation,
  payload: EvaluationEnseignantUpdate,
) -> Evaluation:
  ensure_evaluation_modifiable(evaluation)
  data = payload.model_dump(exclude_unset=True)

  new_type = data.get("type_evaluation", evaluation.type_evaluation)
  if new_type == TypeEvaluation.EXAMEN:
    ensure_examen_unique(
      db,
      evaluation.cours_id,
      evaluation.annee_academique_id,
      exclude_id=evaluation.id,
    )

  for field, value in data.items():
    setattr(evaluation, field, value)

  try:
    db.commit()
  except IntegrityError as exc:
    db.rollback()
    if new_type == TypeEvaluation.EXAMEN:
      raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail="Un seul examen est autorisé par cours pour l'année académique en cours",
      ) from exc
    raise
  db.refresh(evaluation)
  return evaluation


def compter_etudiants_evaluation(db: Session, evaluation: Evaluation) -> int:
  cours = get_or_404(db, Cours, evaluation.cours_id, "Cours")
  return (
    db.query(Etudiant)
    .filter(Etudiant.promotion_id == cours.promotion_id)
    .count()
  )


def compter_notes_evaluation(db: Session, evaluation_id: int) -> int:
  return db.query(Note).filter(Note.evaluation_id == evaluation_id).count()


def ensure_evaluation_peut_etre_cloturee(db: Session, evaluation: Evaluation) -> None:
  total_etudiants = compter_etudiants_evaluation(db, evaluation)
  notes_count = compter_notes_evaluation(db, evaluation.id)

  if total_etudiants == 0:
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail="Impossible de clôturer : aucun étudiant dans la promotion",
    )

  if notes_count == 0:
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail="Impossible de clôturer : aucun étudiant n'a été coté",
    )

  if notes_count < total_etudiants:
    manquants = total_etudiants - notes_count
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail=(
        f"Impossible de clôturer : {manquants} étudiant"
        f"{'s' if manquants > 1 else ''} non encore coté"
        f"{'s' if manquants > 1 else ''}"
      ),
    )


def cloturer_evaluation(db: Session, evaluation: Evaluation) -> Evaluation:
  if evaluation.statut == StatutEvaluation.cloturee:
    raise HTTPException(
      status_code=status.HTTP_409_CONFLICT,
      detail="Évaluation déjà clôturée",
    )
  ensure_evaluation_peut_etre_cloturee(db, evaluation)
  evaluation.statut = StatutEvaluation.cloturee
  db.commit()
  db.refresh(evaluation)
  return evaluation


def ensure_evaluation_peut_etre_supprimee(db: Session, evaluation: Evaluation) -> None:
  cahier_valide = (
    db.query(CahierCotes)
    .filter(
      CahierCotes.cours_id == evaluation.cours_id,
      CahierCotes.annee_academique_id == evaluation.annee_academique_id,
      CahierCotes.statut == StatutDocument.valide,
    )
    .first()
  )
  if cahier_valide:
    raise HTTPException(
      status_code=status.HTTP_409_CONFLICT,
      detail="Impossible de supprimer : le cahier de cotes est déjà validé pour ce cours",
    )


def delete_evaluation(db: Session, evaluation: Evaluation) -> None:
  from app.services.cahier_service import actualiser_cahier_brouillon

  ensure_evaluation_peut_etre_supprimee(db, evaluation)
  cours_id = evaluation.cours_id
  annee_id = evaluation.annee_academique_id

  try:
    db.query(Note).filter(Note.evaluation_id == evaluation.id).delete(
      synchronize_session=False
    )
    db.delete(evaluation)
    db.flush()
    actualiser_cahier_brouillon(db, cours_id, annee_id)
    db.commit()
  except Exception:
    db.rollback()
    raise
