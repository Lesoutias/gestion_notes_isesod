from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import Cours, Evaluation, Note, StatutEvaluation, User
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


def create_evaluation(
  db: Session,
  enseignant_id: int,
  payload: EvaluationEnseignantCreate,
) -> Evaluation:
  get_cours_affecte(db, payload.cours_id, enseignant_id)
  annee = get_active_annee_academique(db)

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
  except IntegrityError:
    db.rollback()
    raise HTTPException(
      status_code=status.HTTP_409_CONFLICT,
      detail="Une évaluation de ce type existe déjà pour ce cours et cette année académique",
    ) from None
  db.refresh(evaluation)
  return evaluation


def update_evaluation(
  db: Session,
  evaluation: Evaluation,
  payload: EvaluationEnseignantUpdate,
) -> Evaluation:
  ensure_evaluation_modifiable(evaluation)
  data = payload.model_dump(exclude_unset=True)

  for field, value in data.items():
    setattr(evaluation, field, value)

  try:
    db.commit()
  except IntegrityError:
    db.rollback()
    raise HTTPException(
      status_code=status.HTTP_409_CONFLICT,
      detail="Une évaluation de ce type existe déjà pour ce cours et cette année académique",
    ) from None
  db.refresh(evaluation)
  return evaluation


def cloturer_evaluation(db: Session, evaluation: Evaluation) -> Evaluation:
  if evaluation.statut == StatutEvaluation.cloturee:
    raise HTTPException(
      status_code=status.HTTP_409_CONFLICT,
      detail="Évaluation déjà clôturée",
    )
  evaluation.statut = StatutEvaluation.cloturee
  db.commit()
  db.refresh(evaluation)
  return evaluation


def delete_evaluation(db: Session, evaluation: Evaluation) -> None:
  ensure_evaluation_modifiable(evaluation)
  if db.query(Note).filter(Note.evaluation_id == evaluation.id).first():
    raise HTTPException(
      status_code=status.HTTP_409_CONFLICT,
      detail="Impossible de supprimer une évaluation qui contient des notes",
    )
  db.delete(evaluation)
  db.commit()
