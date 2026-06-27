from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_enseignant
from app.models import User
from app.schemas.note import (
  NoteBulkResponse,
  NoteEnseignantBulkCreate,
  NoteEnseignantCreate,
  NoteResponse,
  NoteUpdate,
)
from app.services.evaluations import get_enseignant_id, get_evaluation_for_enseignant
from app.services.notes import (
  create_note,
  create_notes_bulk,
  get_note_for_enseignant,
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
  return create_note(db, evaluation, payload)


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
  return NoteBulkResponse(created=created, errors=errors)


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
  return update_note(db, note, payload)
