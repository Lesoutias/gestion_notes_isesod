from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_admin
from app.models import Enseignant, User
from app.schemas.academic import EnseignantCreate, EnseignantResponse, EnseignantUpdate
from app.services.academic import apply_update, ensure_enseignant_deletable, get_or_404

router = APIRouter(prefix="/enseignants", tags=["Admin — Enseignants"])


@router.post("/", response_model=EnseignantResponse, status_code=status.HTTP_201_CREATED)
def create_enseignant(
  payload: EnseignantCreate,
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  enseignant = Enseignant(**payload.model_dump())
  db.add(enseignant)
  db.commit()
  db.refresh(enseignant)
  return enseignant


@router.get("/", response_model=list[EnseignantResponse])
def list_enseignants(
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  return db.query(Enseignant).order_by(Enseignant.nom, Enseignant.prenom).all()


@router.get("/{enseignant_id}", response_model=EnseignantResponse)
def get_enseignant(
  enseignant_id: int,
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  return get_or_404(db, Enseignant, enseignant_id, "Enseignant")


@router.put("/{enseignant_id}", response_model=EnseignantResponse)
def update_enseignant(
  enseignant_id: int,
  payload: EnseignantUpdate,
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  enseignant = get_or_404(db, Enseignant, enseignant_id, "Enseignant")
  apply_update(enseignant, payload)
  db.commit()
  db.refresh(enseignant)
  return enseignant


@router.delete("/{enseignant_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_enseignant(
  enseignant_id: int,
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  enseignant = get_or_404(db, Enseignant, enseignant_id, "Enseignant")
  ensure_enseignant_deletable(db, enseignant)
  db.delete(enseignant)
  db.commit()
