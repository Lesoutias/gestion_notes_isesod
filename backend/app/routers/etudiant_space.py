from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.deps import require_etudiant
from app.models import ReleveCotes, User
from app.schemas.releve import ReleveCotesDetailResponse, ReleveCotesResponse
from app.services.releve_cotes_service import get_etudiant_id, get_releve_or_404

router = APIRouter(prefix="/etudiant", tags=["Espace étudiant"])


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
    )
    .first()
  )
  if not releve:
    existing = db.query(ReleveCotes).filter(ReleveCotes.id == releve_id).first()
    if existing:
      raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Accès refusé — ce relevé ne vous appartient pas",
      )
    get_releve_or_404(db, releve_id)
  return releve


@router.get("/mes-releves-cotes", response_model=list[ReleveCotesResponse])
def list_mes_releves(
  db: Session = Depends(get_db),
  current_user: User = Depends(require_etudiant),
):
  etudiant_id = get_etudiant_id(current_user)
  return (
    db.query(ReleveCotes)
    .filter(ReleveCotes.etudiant_id == etudiant_id)
    .order_by(ReleveCotes.date_generation.desc())
    .all()
  )


@router.get("/mes-releves-cotes/{releve_id}", response_model=ReleveCotesDetailResponse)
def get_mon_releve(
  releve_id: int,
  db: Session = Depends(get_db),
  current_user: User = Depends(require_etudiant),
):
  etudiant_id = get_etudiant_id(current_user)
  return _load_releve_etudiant(db, releve_id, etudiant_id)
