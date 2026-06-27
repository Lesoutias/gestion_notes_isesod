from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_admin
from app.models import Filiere, User
from app.schemas.academic import FiliereCreate, FiliereResponse, FiliereUpdate
from app.services.academic import (
  apply_update,
  ensure_cycle_exists,
  ensure_filiere_deletable,
  ensure_filiere_sigle_unique_in_cycle,
  get_or_404,
)

router = APIRouter(prefix="/filieres", tags=["Admin — Filières"])


@router.post("/", response_model=FiliereResponse, status_code=status.HTTP_201_CREATED)
def create_filiere(
  payload: FiliereCreate,
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  ensure_cycle_exists(db, payload.cycle_id)
  ensure_filiere_sigle_unique_in_cycle(db, payload.cycle_id, payload.sigle)

  filiere = Filiere(**payload.model_dump())
  db.add(filiere)
  db.commit()
  db.refresh(filiere)
  return filiere


@router.get("/", response_model=list[FiliereResponse])
def list_filieres(
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  return db.query(Filiere).order_by(Filiere.nom).all()


@router.get("/{filiere_id}", response_model=FiliereResponse)
def get_filiere(
  filiere_id: int,
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  return get_or_404(db, Filiere, filiere_id, "Filière")


@router.put("/{filiere_id}", response_model=FiliereResponse)
def update_filiere(
  filiere_id: int,
  payload: FiliereUpdate,
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  filiere = get_or_404(db, Filiere, filiere_id, "Filière")
  data = payload.model_dump(exclude_unset=True)

  cycle_id = data.get("cycle_id", filiere.cycle_id)
  sigle = data.get("sigle", filiere.sigle)
  if "cycle_id" in data:
    ensure_cycle_exists(db, cycle_id)
  ensure_filiere_sigle_unique_in_cycle(db, cycle_id, sigle, exclude_id=filiere.id)

  apply_update(filiere, payload)
  db.commit()
  db.refresh(filiere)
  return filiere


@router.delete("/{filiere_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_filiere(
  filiere_id: int,
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  filiere = get_or_404(db, Filiere, filiere_id, "Filière")
  ensure_filiere_deletable(db, filiere)
  db.delete(filiere)
  db.commit()
