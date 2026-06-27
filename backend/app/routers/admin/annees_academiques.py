from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_admin
from app.models import AnneeAcademique, StatutAnneeAcademique, User
from app.schemas.academic import (
  AnneeAcademiqueCreate,
  AnneeAcademiqueResponse,
  AnneeAcademiqueUpdate,
)
from app.services.academic import (
  activate_annee_academique,
  apply_update,
  cloturer_annee_academique,
  get_or_404,
)

router = APIRouter(prefix="/annees-academiques", tags=["Admin — Années académiques"])


@router.post("/", response_model=AnneeAcademiqueResponse, status_code=status.HTTP_201_CREATED)
def create_annee_academique(
  payload: AnneeAcademiqueCreate,
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  if payload.date_fin < payload.date_debut:
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail="La date de fin doit être postérieure à la date de début",
    )

  annee = AnneeAcademique(**payload.model_dump())
  db.add(annee)
  db.flush()

  if annee.statut == StatutAnneeAcademique.active:
    return activate_annee_academique(db, annee)

  db.commit()
  db.refresh(annee)
  return annee


@router.get("/", response_model=list[AnneeAcademiqueResponse])
def list_annees_academiques(
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  return db.query(AnneeAcademique).order_by(AnneeAcademique.date_debut.desc()).all()


@router.get("/active", response_model=AnneeAcademiqueResponse)
def get_active_annee_academique(
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  annee = (
    db.query(AnneeAcademique)
    .filter(AnneeAcademique.statut == StatutAnneeAcademique.active)
    .first()
  )
  if not annee:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail="Aucune année académique active",
    )
  return annee


@router.put("/{annee_id}", response_model=AnneeAcademiqueResponse)
def update_annee_academique(
  annee_id: int,
  payload: AnneeAcademiqueUpdate,
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  annee = get_or_404(db, AnneeAcademique, annee_id, "Année académique")
  data = payload.model_dump(exclude_unset=True)

  date_debut = data.get("date_debut", annee.date_debut)
  date_fin = data.get("date_fin", annee.date_fin)
  if date_fin < date_debut:
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail="La date de fin doit être postérieure à la date de début",
    )

  new_statut = data.get("statut")
  apply_update(annee, payload)
  db.flush()

  if new_statut == StatutAnneeAcademique.active:
    return activate_annee_academique(db, annee)

  db.commit()
  db.refresh(annee)
  return annee


@router.patch("/{annee_id}/activer", response_model=AnneeAcademiqueResponse)
def activer_annee_academique(
  annee_id: int,
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  annee = get_or_404(db, AnneeAcademique, annee_id, "Année académique")
  return activate_annee_academique(db, annee)


@router.patch("/{annee_id}/cloturer", response_model=AnneeAcademiqueResponse)
def cloturer_annee_academique_route(
  annee_id: int,
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  annee = get_or_404(db, AnneeAcademique, annee_id, "Année académique")
  return cloturer_annee_academique(db, annee)
