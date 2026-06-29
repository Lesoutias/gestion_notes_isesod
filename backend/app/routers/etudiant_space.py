from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.deps import require_etudiant
from app.models import Etudiant, Promotion, ReleveCotes, StatutReleveCotes, User
from app.schemas.etudiant_space import EtudiantDashboardResponse, EtudiantEvaluationsResponse
from app.schemas.releve import ReleveCotesDetailResponse, ReleveCotesResponse
from app.schemas.academic import (
  AnneeAcademiqueResponse,
  EtudiantResponse,
  FiliereResponse,
  PromotionResponse,
)
from app.services.etudiant_evaluations_service import lister_evaluations_etudiant
from app.services.pdf_export_service import export_bulletin_pdf_for_releve, export_releve_cotes_pdf
from app.services.releve_cotes_service import get_etudiant_id, get_releve_or_404

router = APIRouter(prefix="/etudiant", tags=["Espace étudiant"])


def _load_etudiant_profil(db: Session, etudiant_id: int) -> Etudiant:
  etudiant = (
    db.query(Etudiant)
    .options(
      joinedload(Etudiant.promotion).joinedload(Promotion.filiere),
      joinedload(Etudiant.annee_academique),
    )
    .filter(Etudiant.id == etudiant_id)
    .first()
  )
  if not etudiant:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail="Profil étudiant introuvable",
    )
  return etudiant


def _load_releve_etudiant(
  db: Session,
  releve_id: int,
  etudiant_id: int,
) -> ReleveCotes:
  releve = (
    db.query(ReleveCotes)
    .options(joinedload(ReleveCotes.lignes))
    .filter(
      ReleveCotes.id == releve_id,
      ReleveCotes.etudiant_id == etudiant_id,
      ReleveCotes.statut == StatutReleveCotes.publie,
    )
    .first()
  )
  if not releve:
    existing = (
      db.query(ReleveCotes)
      .filter(
        ReleveCotes.id == releve_id,
        ReleveCotes.etudiant_id == etudiant_id,
      )
      .first()
    )
    if existing:
      if existing.statut != StatutReleveCotes.publie:
        raise HTTPException(
          status_code=status.HTTP_403_FORBIDDEN,
          detail="Ce relevé n'a pas encore été proclamé par l'administration",
        )
      raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Accès refusé — ce relevé ne vous appartient pas",
      )
    existing_any = db.query(ReleveCotes).filter(ReleveCotes.id == releve_id).first()
    if existing_any:
      raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Accès refusé — ce relevé ne vous appartient pas",
      )
    get_releve_or_404(db, releve_id)
  return releve


@router.get("/dashboard", response_model=EtudiantDashboardResponse)
def get_dashboard(
  db: Session = Depends(get_db),
  current_user: User = Depends(require_etudiant),
):
  etudiant_id = get_etudiant_id(current_user)
  etudiant = _load_etudiant_profil(db, etudiant_id)
  releves = (
    db.query(ReleveCotes)
    .filter(
      ReleveCotes.etudiant_id == etudiant_id,
      ReleveCotes.statut == StatutReleveCotes.publie,
    )
    .order_by(ReleveCotes.date_generation.desc())
    .all()
  )
  return EtudiantDashboardResponse(
    etudiant=EtudiantResponse.model_validate(etudiant),
    promotion=PromotionResponse.model_validate(etudiant.promotion),
    filiere=FiliereResponse.model_validate(etudiant.promotion.filiere),
    annee_academique=AnneeAcademiqueResponse.model_validate(etudiant.annee_academique),
    releves=[ReleveCotesResponse.model_validate(r) for r in releves],
  )


@router.get("/evaluations", response_model=EtudiantEvaluationsResponse)
def get_evaluations(
  cours_id: int | None = Query(default=None),
  db: Session = Depends(get_db),
  current_user: User = Depends(require_etudiant),
):
  etudiant_id = get_etudiant_id(current_user)
  etudiant = _load_etudiant_profil(db, etudiant_id)
  return lister_evaluations_etudiant(db, etudiant, cours_id)


@router.get("/mes-releves-cotes", response_model=list[ReleveCotesResponse])
def list_mes_releves(
  db: Session = Depends(get_db),
  current_user: User = Depends(require_etudiant),
):
  etudiant_id = get_etudiant_id(current_user)
  return (
    db.query(ReleveCotes)
    .filter(
      ReleveCotes.etudiant_id == etudiant_id,
      ReleveCotes.statut == StatutReleveCotes.publie,
    )
    .order_by(ReleveCotes.date_generation.desc())
    .all()
  )


@router.get("/mes-releves-cotes/{releve_id}/pdf")
def download_mon_releve_pdf(
  releve_id: int,
  db: Session = Depends(get_db),
  current_user: User = Depends(require_etudiant),
):
  etudiant_id = get_etudiant_id(current_user)
  _load_releve_etudiant(db, releve_id, etudiant_id)
  return export_releve_cotes_pdf(db, releve_id)


@router.get("/mes-releves-cotes/{releve_id}/bulletin/pdf")
def download_mon_bulletin_pdf(
  releve_id: int,
  db: Session = Depends(get_db),
  current_user: User = Depends(require_etudiant),
):
  etudiant_id = get_etudiant_id(current_user)
  _load_releve_etudiant(db, releve_id, etudiant_id)
  return export_bulletin_pdf_for_releve(db, releve_id)


@router.get("/mes-releves-cotes/{releve_id}", response_model=ReleveCotesDetailResponse)
def get_mon_releve(
  releve_id: int,
  db: Session = Depends(get_db),
  current_user: User = Depends(require_etudiant),
):
  etudiant_id = get_etudiant_id(current_user)
  return _load_releve_etudiant(db, releve_id, etudiant_id)
