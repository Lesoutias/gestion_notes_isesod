from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_admin
from app.models import Cours, User
from app.schemas.academic import CoursAdminCreate, CoursResponse, CoursUpdate
from app.services.academic import (
  apply_update,
  ensure_cours_deletable,
  ensure_enseignant_exists,
  ensure_promotion_exists,
  get_or_404,
)

router = APIRouter(prefix="/cours", tags=["Admin — Cours"])


@router.post("/", response_model=CoursResponse, status_code=status.HTTP_201_CREATED)
def create_cours(
  payload: CoursAdminCreate,
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  ensure_promotion_exists(db, payload.promotion_id)

  cours = Cours(**payload.model_dump())
  db.add(cours)
  db.commit()
  db.refresh(cours)
  return cours


@router.get("/", response_model=list[CoursResponse])
def list_cours(
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  return db.query(Cours).order_by(Cours.intitule).all()


@router.get("/{cours_id}", response_model=CoursResponse)
def get_cours(
  cours_id: int,
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  return get_or_404(db, Cours, cours_id, "Cours")


@router.put("/{cours_id}", response_model=CoursResponse)
def update_cours(
  cours_id: int,
  payload: CoursUpdate,
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  cours = get_or_404(db, Cours, cours_id, "Cours")
  data = payload.model_dump(exclude_unset=True)

  if "promotion_id" in data:
    ensure_promotion_exists(db, data["promotion_id"])
  if "enseignant_id" in data and data["enseignant_id"] is not None:
    ensure_enseignant_exists(db, data["enseignant_id"])

  apply_update(cours, payload)
  db.commit()
  db.refresh(cours)
  return cours


@router.delete("/{cours_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_cours(
  cours_id: int,
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  cours = get_or_404(db, Cours, cours_id, "Cours")
  ensure_cours_deletable(db, cours)
  db.delete(cours)
  db.commit()


@router.patch("/{cours_id}/affecter-enseignant/{enseignant_id}", response_model=CoursResponse)
def affecter_enseignant(
  cours_id: int,
  enseignant_id: int,
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  cours = get_or_404(db, Cours, cours_id, "Cours")
  ensure_enseignant_exists(db, enseignant_id)
  cours.enseignant_id = enseignant_id
  db.commit()
  db.refresh(cours)
  return cours


@router.patch("/{cours_id}/retirer-enseignant", response_model=CoursResponse)
def retirer_enseignant(
  cours_id: int,
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  cours = get_or_404(db, Cours, cours_id, "Cours")
  cours.enseignant_id = None
  db.commit()
  db.refresh(cours)
  return cours
