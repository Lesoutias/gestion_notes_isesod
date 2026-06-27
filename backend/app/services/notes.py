from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import Cours, Etudiant, Evaluation, Note, StatutEvaluation
from app.schemas.note import NoteEnseignantBulkCreate, NoteEnseignantCreate, NoteUpdate
from app.services.academic import get_or_404
from app.services.evaluations import ensure_evaluation_modifiable, get_evaluation_for_enseignant


def _ensure_etudiant_in_cours_promotion(
  db: Session,
  etudiant_id: int,
  cours_id: int,
) -> Etudiant:
  etudiant = get_or_404(db, Etudiant, etudiant_id, "Étudiant")
  cours = get_or_404(db, Cours, cours_id, "Cours")
  if etudiant.promotion_id != cours.promotion_id:
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail="L'étudiant n'appartient pas à la promotion du cours",
    )
  return etudiant


def _commit_note(db: Session) -> None:
  try:
    db.commit()
  except ValueError as exc:
    db.rollback()
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail=str(exc),
    ) from exc
  except IntegrityError:
    db.rollback()
    raise HTTPException(
      status_code=status.HTTP_409_CONFLICT,
      detail="Une note existe déjà pour cet étudiant sur cette évaluation",
    ) from None


def get_note_for_enseignant(
  db: Session,
  note_id: int,
  enseignant_id: int,
) -> Note:
  note = (
    db.query(Note)
    .join(Evaluation, Note.evaluation_id == Evaluation.id)
    .filter(Note.id == note_id, Evaluation.enseignant_id == enseignant_id)
    .first()
  )
  if not note:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail="Note introuvable",
    )
  return note


def create_note(
  db: Session,
  evaluation: Evaluation,
  payload: NoteEnseignantCreate,
) -> Note:
  if evaluation.statut == StatutEvaluation.cloturee:
    raise HTTPException(
      status_code=status.HTTP_409_CONFLICT,
      detail="Évaluation clôturée — encodage impossible",
    )

  _ensure_etudiant_in_cours_promotion(db, payload.etudiant_id, evaluation.cours_id)

  note = Note(
    evaluation_id=evaluation.id,
    etudiant_id=payload.etudiant_id,
    cote_obtenue=payload.cote_obtenue,
  )
  db.add(note)
  try:
    db.flush()
  except ValueError as exc:
    db.rollback()
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

  _commit_note(db)
  db.refresh(note)
  return note


def create_notes_bulk(
  db: Session,
  evaluation: Evaluation,
  payload: NoteEnseignantBulkCreate,
) -> tuple[list[Note], list[str]]:
  if evaluation.statut == StatutEvaluation.cloturee:
    raise HTTPException(
      status_code=status.HTTP_409_CONFLICT,
      detail="Évaluation clôturée — encodage impossible",
    )

  created: list[Note] = []
  errors: list[str] = []

  for item in payload.notes:
    try:
      _ensure_etudiant_in_cours_promotion(db, item.etudiant_id, evaluation.cours_id)
      existing = (
        db.query(Note)
        .filter(
          Note.evaluation_id == evaluation.id,
          Note.etudiant_id == item.etudiant_id,
        )
        .first()
      )
      if existing:
        errors.append(
          f"Étudiant {item.etudiant_id} : une note existe déjà pour cette évaluation"
        )
        continue

      note = Note(
        evaluation_id=evaluation.id,
        etudiant_id=item.etudiant_id,
        cote_obtenue=item.cote_obtenue,
      )
      db.add(note)
      db.flush()
      created.append(note)
    except HTTPException as exc:
      errors.append(f"Étudiant {item.etudiant_id} : {exc.detail}")
    except ValueError as exc:
      errors.append(f"Étudiant {item.etudiant_id} : {exc}")

  if created:
    db.commit()
    for note in created:
      db.refresh(note)
  else:
    db.rollback()

  return created, errors


def update_note(
  db: Session,
  note: Note,
  payload: NoteUpdate,
) -> Note:
  evaluation = (
    db.query(Evaluation).filter(Evaluation.id == note.evaluation_id).first()
  )
  if evaluation:
    ensure_evaluation_modifiable(evaluation)

  if payload.cote_obtenue is None:
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail="Aucune donnée à modifier",
    )

  note.cote_obtenue = payload.cote_obtenue
  try:
    db.flush()
  except ValueError as exc:
    db.rollback()
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

  _commit_note(db)
  db.refresh(note)
  return note


def list_notes_for_evaluation(
  db: Session,
  evaluation_id: int,
  enseignant_id: int,
) -> list[Note]:
  evaluation = get_evaluation_for_enseignant(db, evaluation_id, enseignant_id)
  return (
    db.query(Note)
    .filter(Note.evaluation_id == evaluation.id)
    .order_by(Note.etudiant_id)
    .all()
  )
