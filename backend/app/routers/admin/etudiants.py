from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_admin
from app.models import AnneeAcademique, Etudiant, ReleveCotes, User
from app.schemas.academic import (
  EtudiantAdminCreate,
  EtudiantResponse,
  EtudiantUpdate,
)
from app.schemas.releve import ReleveCotesResponse
from app.services.academic import (
  apply_update,
  ensure_etudiant_deletable,
  ensure_promotion_exists,
  get_active_annee_academique,
  get_or_404,
)

router = APIRouter(prefix="/etudiants", tags=["Admin — Étudiants"])


@router.post("/", response_model=EtudiantResponse, status_code=status.HTTP_201_CREATED)
def create_etudiant(
  payload: EtudiantAdminCreate,
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
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


@router.get("/", response_model=list[EtudiantResponse])
def list_etudiants(
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  return db.query(Etudiant).order_by(Etudiant.nom, Etudiant.prenom).all()


@router.get("/{etudiant_id}", response_model=EtudiantResponse)
def get_etudiant(
  etudiant_id: int,
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  return get_or_404(db, Etudiant, etudiant_id, "Étudiant")


@router.put("/{etudiant_id}", response_model=EtudiantResponse)
def update_etudiant(
  etudiant_id: int,
  payload: EtudiantUpdate,
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  etudiant = get_or_404(db, Etudiant, etudiant_id, "Étudiant")
  data = payload.model_dump(exclude_unset=True)
  if "promotion_id" in data:
    ensure_promotion_exists(db, data["promotion_id"])
  if "annee_academique_id" in data:
    get_or_404(db, AnneeAcademique, data["annee_academique_id"], "Année académique")

  apply_update(etudiant, payload)
  db.commit()
  db.refresh(etudiant)
  return etudiant


@router.delete("/{etudiant_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_etudiant(
  etudiant_id: int,
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  etudiant = get_or_404(db, Etudiant, etudiant_id, "Étudiant")
  ensure_etudiant_deletable(db, etudiant)
  db.delete(etudiant)
  db.commit()


@router.get("/{etudiant_id}/releves-cotes", response_model=list[ReleveCotesResponse])
def list_releves_etudiant(
  etudiant_id: int,
  db: Session = Depends(get_db),
  _: User = Depends(require_admin),
):
  get_or_404(db, Etudiant, etudiant_id, "Étudiant")
  return (
    db.query(ReleveCotes)
    .filter(ReleveCotes.etudiant_id == etudiant_id)
    .order_by(ReleveCotes.date_generation.desc())
    .all()
  )
