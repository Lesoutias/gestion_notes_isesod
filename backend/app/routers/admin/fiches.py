from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.deps import require_admin
from app.models import FicheSynthetique, FicheSynthetiqueLigne, User
from app.schemas.fiche import FicheSynthetiqueDetailResponse, FicheSynthetiqueResponse
from app.services.fiche_service import (
  enrichir_fiche_detail,
  get_fiche_or_404,
  rafraichir_compteurs_fiche,
  valider_fiche,
)
from app.services.pdf_export_service import export_fiche_synthetique_pdf

router = APIRouter(prefix="/fiches", tags=["Admin — Fiches synthétiques"])


def _fiche_detail_query(db: Session):
  return db.query(FicheSynthetique).options(
    joinedload(FicheSynthetique.promotion),
    joinedload(FicheSynthetique.annee_academique),
    joinedload(FicheSynthetique.lignes).joinedload(FicheSynthetiqueLigne.etudiant),
    joinedload(FicheSynthetique.lignes).joinedload(FicheSynthetiqueLigne.cours),
  )


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
  fiches = query.order_by(FicheSynthetique.date_creation.desc()).all()
  return [rafraichir_compteurs_fiche(db, fiche) for fiche in fiches]


@router.get("/{fiche_id}/pdf")
def download_fiche_pdf(
  fiche_id: int,
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  return export_fiche_synthetique_pdf(db, fiche_id)


@router.get("/{fiche_id}", response_model=FicheSynthetiqueDetailResponse)
def get_fiche(
  fiche_id: int,
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  fiche = _fiche_detail_query(db).filter(FicheSynthetique.id == fiche_id).first()
  if not fiche:
    return get_fiche_or_404(db, fiche_id)
  fiche = rafraichir_compteurs_fiche(db, fiche)
  return enrichir_fiche_detail(fiche)


@router.patch("/{fiche_id}/valider", response_model=FicheSynthetiqueDetailResponse)
def valider_fiche_route(
  fiche_id: int,
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  fiche = _fiche_detail_query(db).filter(FicheSynthetique.id == fiche_id).first()
  if not fiche:
    return get_fiche_or_404(db, fiche_id)
  fiche = valider_fiche(db, fiche)
  fiche = _fiche_detail_query(db).filter(FicheSynthetique.id == fiche.id).first()
  return enrichir_fiche_detail(fiche)
