from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_enseignant
from app.models import Cours, User
from app.routers import enseignant_cahiers, enseignant_evaluations, enseignant_notes
from app.schemas.academic import CoursResponse

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
