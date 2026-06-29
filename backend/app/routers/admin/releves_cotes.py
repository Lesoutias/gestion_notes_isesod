from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.deps import require_admin
from app.models import ReleveCotes, User
from app.schemas.releve import (
  ReleveCotesDetailResponse,
  ReleveCotesGenerateResponse,
  ReleveCotesResponse,
  ReleveProclamationRequest,
  ReleveProclamationResponse,
)
from app.services.pdf_export_service import (
  export_bulletin_pdf_for_releve,
  export_releve_cotes_pdf,
  export_tous_releves_cotes_pdf,
)
from app.services.releve_cotes_service import (
  generer_releves_transaction,
  get_fiche_pour_releves,
  get_releve_or_404,
  proclamer_releves_cotes,
)

router = APIRouter(prefix="/releves-cotes", tags=["Admin — Relevés de cotes"])


def _load_releve_detail(db: Session, releve_id: int) -> ReleveCotes:
  releve = (
    db.query(ReleveCotes)
    .options(
      joinedload(ReleveCotes.lignes),
      joinedload(ReleveCotes.etudiant),
    )
    .filter(ReleveCotes.id == releve_id)
    .first()
  )
  if not releve:
    return get_releve_or_404(db, releve_id)
  return releve


@router.post(
  "/generer/{fiche_id}",
  response_model=ReleveCotesGenerateResponse,
  status_code=status.HTTP_201_CREATED,
)
def generer_releves_route(
  fiche_id: int,
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  get_fiche_pour_releves(db, fiche_id)
  releves = generer_releves_transaction(db, fiche_id)
  details = [_load_releve_detail(db, releve.id) for releve in releves]
  return ReleveCotesGenerateResponse(
    fiche_id=fiche_id,
    total_generes=len(details),
    releves=details,
  )


@router.get("/", response_model=list[ReleveCotesResponse])
def list_releves(
  promotion_id: int | None = Query(default=None),
  annee_academique_id: int | None = Query(default=None),
  fiche_id: int | None = Query(default=None),
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  query = db.query(ReleveCotes).options(joinedload(ReleveCotes.etudiant))
  if promotion_id is not None:
    query = query.filter(ReleveCotes.promotion_id == promotion_id)
  if annee_academique_id is not None:
    query = query.filter(ReleveCotes.annee_academique_id == annee_academique_id)
  if fiche_id is not None:
    query = query.filter(ReleveCotes.fiche_id == fiche_id)
  return query.order_by(ReleveCotes.rang, ReleveCotes.etudiant_id).all()


@router.patch("/proclamer", response_model=ReleveProclamationResponse)
def proclamer_releves_route(
  payload: ReleveProclamationRequest,
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  fiche_id, total = proclamer_releves_cotes(
    db,
    payload.promotion_id,
    payload.annee_academique_id,
  )
  return ReleveProclamationResponse(
    promotion_id=payload.promotion_id,
    annee_academique_id=payload.annee_academique_id,
    fiche_id=fiche_id,
    total_proclames=total,
  )


@router.get("/export/pdf")
def download_tous_releves_pdf(
  promotion_id: int = Query(...),
  annee_academique_id: int = Query(...),
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  return export_tous_releves_cotes_pdf(db, promotion_id, annee_academique_id)


@router.get("/{releve_id}/pdf")
def download_releve_pdf(
  releve_id: int,
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  return export_releve_cotes_pdf(db, releve_id)


@router.get("/{releve_id}/bulletin/pdf")
def download_bulletin_pdf(
  releve_id: int,
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  return export_bulletin_pdf_for_releve(db, releve_id)


@router.get("/{releve_id}", response_model=ReleveCotesDetailResponse)
def get_releve(
  releve_id: int,
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  return _load_releve_detail(db, releve_id)
