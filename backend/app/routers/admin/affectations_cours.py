from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_admin
from app.models import Cours, User
from app.schemas.academic import (
  AffectationCoursCreate,
  AffectationCoursUpdate,
  CoursResponse,
)
from app.services.academic import (
  apply_update,
  ensure_cours_deletable,
  ensure_enseignant_exists,
  ensure_promotion_exists,
  get_or_404,
)

router = APIRouter(prefix="/affectations-cours", tags=["Admin — Affectations cours"])


@router.post("/", response_model=CoursResponse, status_code=status.HTTP_201_CREATED)
def create_affectation(
  payload: AffectationCoursCreate,
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  catalogue = get_or_404(db, Cours, payload.cours_id, "Cours catalogue")
  if catalogue.promotion_id is not None:
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail="Le cours source doit être une entrée catalogue",
    )

  ensure_promotion_exists(db, payload.promotion_id)

  affectation = Cours(
    intitule=catalogue.intitule,
    description=catalogue.description,
    source_cours_id=catalogue.id,
    promotion_id=payload.promotion_id,
    volume_horaire=payload.volume_horaire,
    semestre=payload.semestre,
    type_cours=payload.type_cours,
    points_max=catalogue.points_max,
  )
  db.add(affectation)
  db.commit()
  db.refresh(affectation)
  return affectation


@router.get("/", response_model=list[CoursResponse])
def list_affectations(
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  return (
    db.query(Cours)
    .filter(Cours.promotion_id.isnot(None))
    .order_by(Cours.intitule)
    .all()
  )


@router.get("/{affectation_id}", response_model=CoursResponse)
def get_affectation(
  affectation_id: int,
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  affectation = get_or_404(db, Cours, affectation_id, "Affectation")
  if affectation.promotion_id is None:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail="Affectation introuvable",
    )
  return affectation


@router.put("/{affectation_id}", response_model=CoursResponse)
def update_affectation(
  affectation_id: int,
  payload: AffectationCoursUpdate,
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  affectation = get_or_404(db, Cours, affectation_id, "Affectation")
  if affectation.promotion_id is None:
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail="Affectation introuvable",
    )

  data = payload.model_dump(exclude_unset=True)
  if "promotion_id" in data and data["promotion_id"] is not None:
    ensure_promotion_exists(db, data["promotion_id"])

  apply_update(affectation, payload)
  db.commit()
  db.refresh(affectation)
  return affectation


@router.delete("/{affectation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_affectation(
  affectation_id: int,
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  affectation = get_or_404(db, Cours, affectation_id, "Affectation")
  if affectation.promotion_id is None:
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail="Affectation introuvable",
    )
  ensure_cours_deletable(db, affectation)
  db.delete(affectation)
  db.commit()


@router.patch("/{affectation_id}/enseignant/{enseignant_id}", response_model=CoursResponse)
def affecter_enseignant(
  affectation_id: int,
  enseignant_id: int,
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  affectation = get_or_404(db, Cours, affectation_id, "Affectation")
  if affectation.promotion_id is None:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Affectation introuvable")
  ensure_enseignant_exists(db, enseignant_id)
  affectation.enseignant_id = enseignant_id
  db.commit()
  db.refresh(affectation)
  return affectation


@router.patch("/{affectation_id}/retirer-enseignant", response_model=CoursResponse)
def retirer_enseignant(
  affectation_id: int,
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  affectation = get_or_404(db, Cours, affectation_id, "Affectation")
  if affectation.promotion_id is None:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Affectation introuvable")
  affectation.enseignant_id = None
  db.commit()
  db.refresh(affectation)
  return affectation
