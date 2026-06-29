from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_enseignant
from app.models import Evaluation, User
from app.schemas.academic import EtudiantResponse
from app.schemas.note import (
  NoteBulkResponse,
  NoteEnseignantBulkCreate,
  NoteEnseignantCreate,
  NoteResponse,
  NoteUpdate,
)
from app.services.cahier_service import synchroniser_cahier_apres_notes
from app.services.evaluations import get_enseignant_id, get_evaluation_for_enseignant
from app.services.notes import (
  create_note,
  create_notes_bulk,
  get_note_for_enseignant,
  list_etudiants_for_evaluation,
  list_notes_for_evaluation,
  update_note,
)

router = APIRouter(tags=["Espace enseignant — Notes"])


@router.post(
  "/evaluations/{evaluation_id}/notes",
  response_model=NoteResponse,
  status_code=status.HTTP_201_CREATED,
)
def create_note_route(
  evaluation_id: int,
  payload: NoteEnseignantCreate,
  db: Session = Depends(get_db),
  current_user: User = Depends(require_enseignant),
):
  enseignant_id = get_enseignant_id(current_user)
  evaluation = get_evaluation_for_enseignant(db, evaluation_id, enseignant_id)
  note = create_note(db, evaluation, payload)
  synchroniser_cahier_apres_notes(db, evaluation.cours_id, evaluation.annee_academique_id)
  return note


@router.post(
  "/evaluations/{evaluation_id}/notes/bulk",
  response_model=NoteBulkResponse,
  status_code=status.HTTP_201_CREATED,
)
def create_notes_bulk_route(
  evaluation_id: int,
  payload: NoteEnseignantBulkCreate,
  db: Session = Depends(get_db),
  current_user: User = Depends(require_enseignant),
):
  enseignant_id = get_enseignant_id(current_user)
  evaluation = get_evaluation_for_enseignant(db, evaluation_id, enseignant_id)
  created, errors = create_notes_bulk(db, evaluation, payload)
  synchroniser_cahier_apres_notes(db, evaluation.cours_id, evaluation.annee_academique_id)
  return NoteBulkResponse(created=created, errors=errors)


@router.get(
  "/evaluations/{evaluation_id}/etudiants",
  response_model=list[EtudiantResponse],
)
def list_etudiants_route(
  evaluation_id: int,
  db: Session = Depends(get_db),
  current_user: User = Depends(require_enseignant),
):
  enseignant_id = get_enseignant_id(current_user)
  return list_etudiants_for_evaluation(db, evaluation_id, enseignant_id)


@router.get(
  "/evaluations/{evaluation_id}/notes",
  response_model=list[NoteResponse],
)
def list_notes_route(
  evaluation_id: int,
  db: Session = Depends(get_db),
  current_user: User = Depends(require_enseignant),
):
  enseignant_id = get_enseignant_id(current_user)
  return list_notes_for_evaluation(db, evaluation_id, enseignant_id)


@router.put("/notes/{note_id}", response_model=NoteResponse)
def update_note_route(
  note_id: int,
  payload: NoteUpdate,
  db: Session = Depends(get_db),
  current_user: User = Depends(require_enseignant),
):
  enseignant_id = get_enseignant_id(current_user)
  note = get_note_for_enseignant(db, note_id, enseignant_id)
  evaluation = db.query(Evaluation).filter(Evaluation.id == note.evaluation_id).first()
  updated = update_note(db, note, payload)
  if evaluation:
    synchroniser_cahier_apres_notes(
      db, evaluation.cours_id, evaluation.annee_academique_id
    )
  return updated
