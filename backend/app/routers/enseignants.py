from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_admin
from app.models import Enseignant, User
from app.schemas.academic import EnseignantCreate, EnseignantResponse

router = APIRouter(prefix="/enseignants", tags=["Enseignants"])


@router.post(
  "/",
  response_model=EnseignantResponse,
  status_code=status.HTTP_201_CREATED,
  deprecated=True,
)
def create_enseignant(
  payload: EnseignantCreate,
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  """Alias vers POST /api/admin/enseignants — conservé pour compatibilité."""
  enseignant = Enseignant(**payload.model_dump())
  db.add(enseignant)
  db.commit()
  db.refresh(enseignant)
  return enseignant
