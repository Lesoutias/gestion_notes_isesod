from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.deps import require_admin
from app.models import ReleveCotes, User
from app.schemas.releve import (
  ReleveCotesDetailResponse,
  ReleveCotesGenerateResponse,
  ReleveCotesResponse,
)
from app.services.releve_cotes_service import (
  generer_releves_transaction,
  get_fiche_pour_releves,
  get_releve_or_404,
)

router = APIRouter(prefix="/releves-cotes", tags=["Admin — Relevés de cotes"])


def _load_releve_detail(db: Session, releve_id: int) -> ReleveCotes:
  releve = (
    db.query(ReleveCotes)
    .options(joinedload(ReleveCotes.lignes))
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
  query = db.query(ReleveCotes)
  if promotion_id is not None:
    query = query.filter(ReleveCotes.promotion_id == promotion_id)
  if annee_academique_id is not None:
    query = query.filter(ReleveCotes.annee_academique_id == annee_academique_id)
  if fiche_id is not None:
    query = query.filter(ReleveCotes.fiche_id == fiche_id)
  return query.order_by(ReleveCotes.rang, ReleveCotes.etudiant_id).all()


@router.get("/{releve_id}", response_model=ReleveCotesDetailResponse)
def get_releve(
  releve_id: int,
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  return _load_releve_detail(db, releve_id)
