from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.deps import require_enseignant
from app.models import CahierCotes, CahierCotesLigne, User
from app.schemas.cahier import (
  CahierCotesDetailResponse,
  CahierCotesGenerateResponse,
  CahierCotesResponse,
  CahierGenererRequest,
)
from app.services.cahier_service import (
  enrichir_cahier_detail,
  generer_cahier,
  get_cahier_for_cours,
  get_cahier_for_enseignant,
  valider_cahier,
)
from app.services.evaluations import get_enseignant_id

router = APIRouter(prefix="/cahiers", tags=["Espace enseignant — Cahiers de cotes"])


def _cahier_detail_query(db: Session):
  return db.query(CahierCotes).options(
    joinedload(CahierCotes.lignes).joinedload(CahierCotesLigne.etudiant)
  )


@router.post("/generer", response_model=CahierCotesGenerateResponse)
def generer_cahier_route(
  payload: CahierGenererRequest,
  response: Response,
  db: Session = Depends(get_db),
  current_user: User = Depends(require_enseignant),
):
  enseignant_id = get_enseignant_id(current_user)
  cahier, created = generer_cahier(
    db,
    enseignant_id,
    payload.cours_id,
    payload.annee_academique_id,
  )
  response.status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
  return CahierCotesGenerateResponse.model_validate(cahier).model_copy(
    update={"created": created}
  )


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


@router.get("/par-cours/{cours_id}", response_model=CahierCotesDetailResponse | None)
def get_cahier_par_cours(
  cours_id: int,
  annee_academique_id: int | None = None,
  db: Session = Depends(get_db),
  current_user: User = Depends(require_enseignant),
):
  enseignant_id = get_enseignant_id(current_user)
  return get_cahier_for_cours(db, enseignant_id, cours_id, annee_academique_id)


@router.get("/{cahier_id}", response_model=CahierCotesDetailResponse)
def get_cahier(
  cahier_id: int,
  db: Session = Depends(get_db),
  current_user: User = Depends(require_enseignant),
):
  enseignant_id = get_enseignant_id(current_user)
  return get_cahier_for_enseignant(db, cahier_id, enseignant_id)


@router.patch("/{cahier_id}/valider", response_model=CahierCotesDetailResponse)
def valider_cahier_route(
  cahier_id: int,
  db: Session = Depends(get_db),
  current_user: User = Depends(require_enseignant),
):
  enseignant_id = get_enseignant_id(current_user)
  cahier = _cahier_detail_query(db).filter(
    CahierCotes.id == cahier_id,
    CahierCotes.enseignant_id == enseignant_id,
  ).first()
  if not cahier:
    cahier = get_cahier_for_enseignant(db, cahier_id, enseignant_id)
  cahier = valider_cahier(db, cahier)
  cahier = _cahier_detail_query(db).filter(CahierCotes.id == cahier.id).first()
  return enrichir_cahier_detail(db, cahier)
