from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_enseignant
from app.models import Cours, Promotion, User
from app.routers import enseignant_cahiers, enseignant_evaluations, enseignant_notes
from app.schemas.academic import CoursResponse, PromotionResponse

router = APIRouter(prefix="/enseignant", tags=["Espace enseignant"])
router.include_router(enseignant_evaluations.router)
router.include_router(enseignant_notes.router)
router.include_router(enseignant_cahiers.router)


@router.get("/mes-cours", response_model=list[CoursResponse])
def list_mes_cours(
  db: Session = Depends(get_db),
  current_user: User = Depends(require_enseignant),
):
  if not current_user.enseignant_id:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail="Profil enseignant non lié à ce compte",
    )

  return (
    db.query(Cours)
    .filter(Cours.enseignant_id == current_user.enseignant_id)
    .order_by(Cours.intitule)
    .all()
  )


@router.get("/mes-promotions", response_model=list[PromotionResponse])
def list_mes_promotions(
  db: Session = Depends(get_db),
  current_user: User = Depends(require_enseignant),
):
  if not current_user.enseignant_id:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail="Profil enseignant non lié à ce compte",
    )

  promotion_ids = (
    db.query(Cours.promotion_id)
    .filter(
      Cours.enseignant_id == current_user.enseignant_id,
      Cours.promotion_id.isnot(None),
    )
    .distinct()
    .all()
  )
  ids = [row[0] for row in promotion_ids]
  if not ids:
    return []

  return (
    db.query(Promotion)
    .filter(Promotion.id.in_(ids))
    .order_by(Promotion.nom)
    .all()
  )
