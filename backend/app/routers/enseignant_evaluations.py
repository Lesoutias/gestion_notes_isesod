from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_enseignant
from app.models import Evaluation, User
from app.schemas.evaluation import (
  EvaluationEnseignantCreate,
  EvaluationEnseignantUpdate,
  EvaluationResponse,
)
from app.services.evaluations import (
  cloturer_evaluation,
  create_evaluation,
  delete_evaluation,
  get_enseignant_id,
  get_evaluation_for_enseignant,
  update_evaluation,
)

router = APIRouter(prefix="/evaluations", tags=["Espace enseignant — Évaluations"])


@router.post("/", response_model=EvaluationResponse, status_code=status.HTTP_201_CREATED)
def create_evaluation_route(
  payload: EvaluationEnseignantCreate,
  db: Session = Depends(get_db),
  current_user: User = Depends(require_enseignant),
):
  enseignant_id = get_enseignant_id(current_user)
  return create_evaluation(db, enseignant_id, payload)


@router.get("/", response_model=list[EvaluationResponse])
def list_evaluations(
  db: Session = Depends(get_db),
  current_user: User = Depends(require_enseignant),
):
  enseignant_id = get_enseignant_id(current_user)
  return (
    db.query(Evaluation)
    .filter(Evaluation.enseignant_id == enseignant_id)
    .order_by(Evaluation.date_evaluation.desc())
    .all()
  )


@router.get("/{evaluation_id}", response_model=EvaluationResponse)
def get_evaluation(
  evaluation_id: int,
  db: Session = Depends(get_db),
  current_user: User = Depends(require_enseignant),
):
  enseignant_id = get_enseignant_id(current_user)
  return get_evaluation_for_enseignant(db, evaluation_id, enseignant_id)


@router.put("/{evaluation_id}", response_model=EvaluationResponse)
def update_evaluation_route(
  evaluation_id: int,
  payload: EvaluationEnseignantUpdate,
  db: Session = Depends(get_db),
  current_user: User = Depends(require_enseignant),
):
  enseignant_id = get_enseignant_id(current_user)
  evaluation = get_evaluation_for_enseignant(db, evaluation_id, enseignant_id)
  return update_evaluation(db, evaluation, payload)


@router.patch("/{evaluation_id}/cloturer", response_model=EvaluationResponse)
def cloturer_evaluation_route(
  evaluation_id: int,
  db: Session = Depends(get_db),
  current_user: User = Depends(require_enseignant),
):
  enseignant_id = get_enseignant_id(current_user)
  evaluation = get_evaluation_for_enseignant(db, evaluation_id, enseignant_id)
  return cloturer_evaluation(db, evaluation)


@router.delete("/{evaluation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_evaluation_route(
  evaluation_id: int,
  db: Session = Depends(get_db),
  current_user: User = Depends(require_enseignant),
):
  enseignant_id = get_enseignant_id(current_user)
  evaluation = get_evaluation_for_enseignant(db, evaluation_id, enseignant_id)
  delete_evaluation(db, evaluation)
