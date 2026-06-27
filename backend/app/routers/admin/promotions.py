from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_admin
from app.models import Filiere, Promotion, User
from app.schemas.academic import PromotionCreate, PromotionResponse, PromotionUpdate
from app.services.academic import (
  apply_update,
  ensure_cycle_exists,
  ensure_promotion_deletable,
  get_or_404,
)

router = APIRouter(prefix="/promotions", tags=["Admin — Promotions"])


def _validate_promotion_refs(
  db: Session,
  cycle_id: int,
  filiere_id: int,
) -> None:
  ensure_cycle_exists(db, cycle_id)
  filiere = get_or_404(db, Filiere, filiere_id, "Filière")
  if filiere.cycle_id != cycle_id:
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail="La filière n'appartient pas au cycle indiqué",
    )


@router.post("/", response_model=PromotionResponse, status_code=status.HTTP_201_CREATED)
def create_promotion(
  payload: PromotionCreate,
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  _validate_promotion_refs(db, payload.cycle_id, payload.filiere_id)

  promotion = Promotion(**payload.model_dump())
  db.add(promotion)
  db.commit()
  db.refresh(promotion)
  return promotion


@router.get("/", response_model=list[PromotionResponse])
def list_promotions(
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  return db.query(Promotion).order_by(Promotion.filiere_id, Promotion.niveau).all()


@router.get("/{promotion_id}", response_model=PromotionResponse)
def get_promotion(
  promotion_id: int,
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  return get_or_404(db, Promotion, promotion_id, "Promotion")


@router.put("/{promotion_id}", response_model=PromotionResponse)
def update_promotion(
  promotion_id: int,
  payload: PromotionUpdate,
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  promotion = get_or_404(db, Promotion, promotion_id, "Promotion")
  data = payload.model_dump(exclude_unset=True)

  cycle_id = data.get("cycle_id", promotion.cycle_id)
  filiere_id = data.get("filiere_id", promotion.filiere_id)
  if "cycle_id" in data or "filiere_id" in data:
    _validate_promotion_refs(db, cycle_id, filiere_id)

  apply_update(promotion, payload)
  db.commit()
  db.refresh(promotion)
  return promotion


@router.delete("/{promotion_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_promotion(
  promotion_id: int,
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  promotion = get_or_404(db, Promotion, promotion_id, "Promotion")
  ensure_promotion_deletable(db, promotion)
  db.delete(promotion)
  db.commit()
