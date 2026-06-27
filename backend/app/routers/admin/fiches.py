from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.deps import require_admin
from app.models import FicheSynthetique, User
from app.schemas.fiche import FicheSynthetiqueDetailResponse, FicheSynthetiqueResponse
from app.services.fiche_service import get_fiche_or_404, valider_fiche

router = APIRouter(prefix="/fiches", tags=["Admin — Fiches synthétiques"])


@router.get("/", response_model=list[FicheSynthetiqueResponse])
def list_fiches(
  promotion_id: int | None = Query(default=None),
  annee_academique_id: int | None = Query(default=None),
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  query = db.query(FicheSynthetique)
  if promotion_id is not None:
    query = query.filter(FicheSynthetique.promotion_id == promotion_id)
  if annee_academique_id is not None:
    query = query.filter(FicheSynthetique.annee_academique_id == annee_academique_id)
  return query.order_by(FicheSynthetique.date_creation.desc()).all()


@router.get("/{fiche_id}", response_model=FicheSynthetiqueDetailResponse)
def get_fiche(
  fiche_id: int,
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  fiche = (
    db.query(FicheSynthetique)
    .options(joinedload(FicheSynthetique.lignes))
    .filter(FicheSynthetique.id == fiche_id)
    .first()
  )
  if not fiche:
    return get_fiche_or_404(db, fiche_id)
  return fiche


@router.patch("/{fiche_id}/valider", response_model=FicheSynthetiqueDetailResponse)
def valider_fiche_route(
  fiche_id: int,
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  fiche = (
    db.query(FicheSynthetique)
    .options(joinedload(FicheSynthetique.lignes))
    .filter(FicheSynthetique.id == fiche_id)
    .first()
  )
  if not fiche:
    return get_fiche_or_404(db, fiche_id)
  return valider_fiche(db, fiche)
