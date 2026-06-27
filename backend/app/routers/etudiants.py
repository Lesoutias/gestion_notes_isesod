from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_admin
from app.models import Etudiant, User
from app.schemas.academic import EtudiantAdminCreate, EtudiantResponse
from app.services.academic import ensure_promotion_exists, get_active_annee_academique

router = APIRouter(prefix="/etudiants", tags=["Étudiants"])


@router.post(
  "/",
  response_model=EtudiantResponse,
  status_code=status.HTTP_201_CREATED,
  deprecated=True,
)
def create_etudiant(
  payload: EtudiantAdminCreate,
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  """Alias vers POST /api/admin/etudiants — conservé pour compatibilité."""
  annee = get_active_annee_academique(db)
  ensure_promotion_exists(db, payload.promotion_id)

  etudiant = Etudiant(
    **payload.model_dump(),
    annee_academique_id=annee.id,
  )
  db.add(etudiant)
  db.commit()
  db.refresh(etudiant)
  return etudiant
