from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import (
  AnneeAcademique,
  Cours,
  Cycle,
  Etudiant,
  Filiere,
  Promotion,
  StatutAnneeAcademique,
)


def get_or_404(db: Session, model, entity_id: int, label: str):
  entity = db.query(model).filter(model.id == entity_id).first()
  if not entity:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail=f"{label} introuvable",
    )
  return entity


def apply_update(entity, payload) -> None:
  for field, value in payload.model_dump(exclude_unset=True).items():
    setattr(entity, field, value)


def ensure_filiere_sigle_unique_in_cycle(
  db: Session,
  cycle_id: int,
  sigle: str,
  exclude_id: int | None = None,
) -> None:
  query = db.query(Filiere).filter(
    Filiere.cycle_id == cycle_id,
    Filiere.sigle == sigle,
  )
  if exclude_id is not None:
    query = query.filter(Filiere.id != exclude_id)

  if query.first():
    raise HTTPException(
      status_code=status.HTTP_409_CONFLICT,
      detail="Une filière avec ce sigle existe déjà dans ce cycle",
    )


def ensure_cycle_exists(db: Session, cycle_id: int) -> Cycle:
  return get_or_404(db, Cycle, cycle_id, "Cycle")


def ensure_filiere_deletable(db: Session, filiere: Filiere) -> None:
  if db.query(Promotion).filter(Promotion.filiere_id == filiere.id).first():
    raise HTTPException(
      status_code=status.HTTP_409_CONFLICT,
      detail="Impossible de supprimer une filière qui contient des promotions",
    )


def ensure_promotion_deletable(db: Session, promotion: Promotion) -> None:
  if db.query(Etudiant).filter(Etudiant.promotion_id == promotion.id).first():
    raise HTTPException(
      status_code=status.HTTP_409_CONFLICT,
      detail="Impossible de supprimer une promotion qui contient des étudiants",
    )
  if db.query(Cours).filter(Cours.promotion_id == promotion.id).first():
    raise HTTPException(
      status_code=status.HTTP_409_CONFLICT,
      detail="Impossible de supprimer une promotion qui contient des cours",
    )


def ensure_cycle_deletable(db: Session, cycle: Cycle) -> None:
  if db.query(Filiere).filter(Filiere.cycle_id == cycle.id).first():
    raise HTTPException(
      status_code=status.HTTP_409_CONFLICT,
      detail="Impossible de supprimer un cycle qui contient des filières",
    )
  if db.query(Promotion).filter(Promotion.cycle_id == cycle.id).first():
    raise HTTPException(
      status_code=status.HTTP_409_CONFLICT,
      detail="Impossible de supprimer un cycle qui contient des promotions",
    )


def activate_annee_academique(db: Session, annee: AnneeAcademique) -> AnneeAcademique:
  db.query(AnneeAcademique).filter(
    AnneeAcademique.statut == StatutAnneeAcademique.active,
    AnneeAcademique.id != annee.id,
  ).update(
    {AnneeAcademique.statut: StatutAnneeAcademique.cloturee},
    synchronize_session=False,
  )
  annee.statut = StatutAnneeAcademique.active
  db.commit()
  db.refresh(annee)
  return annee


def get_active_annee_academique(db: Session) -> AnneeAcademique:
  annee = (
    db.query(AnneeAcademique)
    .filter(AnneeAcademique.statut == StatutAnneeAcademique.active)
    .first()
  )
  if not annee:
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail="Aucune année académique active. Activez une année avant de créer un étudiant.",
    )
  return annee


def ensure_promotion_exists(db: Session, promotion_id: int) -> Promotion:
  return get_or_404(db, Promotion, promotion_id, "Promotion")


def ensure_enseignant_exists(db: Session, enseignant_id: int):
  from app.models import Enseignant
  return get_or_404(db, Enseignant, enseignant_id, "Enseignant")


def ensure_etudiant_deletable(db: Session, etudiant: Etudiant) -> None:
  if etudiant.user_id:
    raise HTTPException(
      status_code=status.HTTP_409_CONFLICT,
      detail="Impossible de supprimer un étudiant qui possède un compte utilisateur",
    )
  from app.models import Note
  if db.query(Note).filter(Note.etudiant_id == etudiant.id).first():
    raise HTTPException(
      status_code=status.HTTP_409_CONFLICT,
      detail="Impossible de supprimer un étudiant qui possède des notes",
    )


def ensure_enseignant_deletable(db: Session, enseignant) -> None:
  if enseignant.user_id:
    raise HTTPException(
      status_code=status.HTTP_409_CONFLICT,
      detail="Impossible de supprimer un enseignant qui possède un compte utilisateur",
    )


def ensure_cours_deletable(db: Session, cours: Cours) -> None:
  from app.models import Evaluation
  if db.query(Evaluation).filter(Evaluation.cours_id == cours.id).first():
    raise HTTPException(
      status_code=status.HTTP_409_CONFLICT,
      detail="Impossible de supprimer un cours qui possède des évaluations",
    )


def cloturer_annee_academique(db: Session, annee: AnneeAcademique) -> AnneeAcademique:
  annee.statut = StatutAnneeAcademique.cloturee
  db.commit()
  db.refresh(annee)
  return annee
