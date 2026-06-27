from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_admin
from app.models import Cycle, User
from app.schemas.academic import CycleCreate, CycleResponse, CycleUpdate
from app.services.academic import (
  apply_update,
  ensure_cycle_deletable,
  get_or_404,
)

router = APIRouter(prefix="/cycles", tags=["Admin — Cycles"])


@router.post("/", response_model=CycleResponse, status_code=status.HTTP_201_CREATED)
def create_cycle(
  payload: CycleCreate,
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  cycle = Cycle(**payload.model_dump())
  db.add(cycle)
  db.commit()
  db.refresh(cycle)
  return cycle


@router.get("/", response_model=list[CycleResponse])
def list_cycles(
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  return db.query(Cycle).order_by(Cycle.nom).all()


@router.get("/{cycle_id}", response_model=CycleResponse)
def get_cycle(
  cycle_id: int,
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  return get_or_404(db, Cycle, cycle_id, "Cycle")


@router.put("/{cycle_id}", response_model=CycleResponse)
def update_cycle(
  cycle_id: int,
  payload: CycleUpdate,
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  cycle = get_or_404(db, Cycle, cycle_id, "Cycle")
  apply_update(cycle, payload)
  db.commit()
  db.refresh(cycle)
  return cycle


@router.delete("/{cycle_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_cycle(
  cycle_id: int,
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  cycle = get_or_404(db, Cycle, cycle_id, "Cycle")
  ensure_cycle_deletable(db, cycle)
  db.delete(cycle)
  db.commit()
