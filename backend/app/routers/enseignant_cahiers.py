from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.deps import require_enseignant
from app.models import CahierCotes, User
from app.schemas.cahier import (
  CahierCotesDetailResponse,
  CahierCotesGenerateResponse,
  CahierCotesResponse,
  CahierGenererRequest,
)
from app.services.cahier_service import generer_cahier, get_cahier_for_enseignant, valider_cahier
from app.services.evaluations import get_enseignant_id

router = APIRouter(prefix="/cahiers", tags=["Espace enseignant — Cahiers de cotes"])


@router.post("/generer", response_model=CahierCotesGenerateResponse, status_code=status.HTTP_201_CREATED)
def generer_cahier_route(
  payload: CahierGenererRequest,
  db: Session = Depends(get_db),
  current_user: User = Depends(require_enseignant),
):
  enseignant_id = get_enseignant_id(current_user)
  cahier = generer_cahier(
    db,
    enseignant_id,
    payload.cours_id,
    payload.annee_academique_id,
  )
  return cahier


@router.get("/", response_model=list[CahierCotesResponse])
def list_cahiers(
  db: Session = Depends(get_db),
  current_user: User = Depends(require_enseignant),
):
  enseignant_id = get_enseignant_id(current_user)
  return (
    db.query(CahierCotes)
    .filter(CahierCotes.enseignant_id == enseignant_id)
    .order_by(CahierCotes.date_generation.desc())
    .all()
  )


@router.get("/{cahier_id}", response_model=CahierCotesDetailResponse)
def get_cahier(
  cahier_id: int,
  db: Session = Depends(get_db),
  current_user: User = Depends(require_enseignant),
):
  enseignant_id = get_enseignant_id(current_user)
  cahier = (
    db.query(CahierCotes)
    .options(joinedload(CahierCotes.lignes))
    .filter(
      CahierCotes.id == cahier_id,
      CahierCotes.enseignant_id == enseignant_id,
    )
    .first()
  )
  if not cahier:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail="Cahier de cotes introuvable",
    )
  return cahier


@router.patch("/{cahier_id}/valider", response_model=CahierCotesDetailResponse)
def valider_cahier_route(
  cahier_id: int,
  db: Session = Depends(get_db),
  current_user: User = Depends(require_enseignant),
):
  enseignant_id = get_enseignant_id(current_user)
  cahier = (
    db.query(CahierCotes)
    .options(joinedload(CahierCotes.lignes))
    .filter(
      CahierCotes.id == cahier_id,
      CahierCotes.enseignant_id == enseignant_id,
    )
    .first()
  )
  if not cahier:
    cahier = get_cahier_for_enseignant(db, cahier_id, enseignant_id)
  cahier = valider_cahier(db, cahier)
  db.refresh(cahier)
  return cahier
