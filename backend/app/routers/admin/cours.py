from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_admin
from app.models import Cours, User
from app.schemas.academic import (
  CoursCatalogueCreate,
  CoursCatalogueUpdate,
  CoursResponse,
)
from app.services.academic import apply_update, ensure_cours_deletable, get_or_404

router = APIRouter(prefix="/cours", tags=["Admin — Cours"])


@router.post("/", response_model=CoursResponse, status_code=status.HTTP_201_CREATED)
def create_cours_catalogue(
  payload: CoursCatalogueCreate,
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  if payload.code and db.query(Cours).filter(Cours.code == payload.code).first():
    raise HTTPException(
      status_code=status.HTTP_409_CONFLICT,
      detail="Ce code de cours est déjà utilisé",
    )

  cours = Cours(
    intitule=payload.intitule,
    code=payload.code,
    description=payload.description,
    volume_horaire=0,
    credits=0,
    promotion_id=None,
  )
  db.add(cours)
  db.commit()
  db.refresh(cours)
  return cours


@router.get("/", response_model=list[CoursResponse])
def list_cours_catalogue(
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  return (
    db.query(Cours)
    .filter(Cours.promotion_id.is_(None))
    .order_by(Cours.intitule)
    .all()
  )


@router.get("/{cours_id}", response_model=CoursResponse)
def get_cours_catalogue(
  cours_id: int,
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  cours = get_or_404(db, Cours, cours_id, "Cours")
  if cours.promotion_id is not None:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail="Cours catalogue introuvable",
    )
  return cours


@router.put("/{cours_id}", response_model=CoursResponse)
def update_cours_catalogue(
  cours_id: int,
  payload: CoursCatalogueUpdate,
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  cours = get_or_404(db, Cours, cours_id, "Cours")
  if cours.promotion_id is not None:
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail="Ce cours est une affectation, pas une entrée catalogue",
    )

  data = payload.model_dump(exclude_unset=True)
  if data.get("code"):
    existing = db.query(Cours).filter(Cours.code == data["code"], Cours.id != cours_id).first()
    if existing:
      raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail="Ce code de cours est déjà utilisé",
      )

  apply_update(cours, payload)
  db.commit()
  db.refresh(cours)
  return cours


@router.delete("/{cours_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_cours_catalogue(
  cours_id: int,
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  cours = get_or_404(db, Cours, cours_id, "Cours")
  if cours.promotion_id is not None:
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail="Supprimez l'affectation depuis la page dédiée",
    )
  ensure_cours_deletable(db, cours)
  db.delete(cours)
  db.commit()
