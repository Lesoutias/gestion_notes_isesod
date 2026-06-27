from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import (
  AnneeAcademique,
  CahierCotes,
  CahierCotesLigne,
  Cours,
  Etudiant,
  Evaluation,
  Note,
  StatutDocument,
  TypeEvaluation,
)
from app.services.academic import get_active_annee_academique, get_or_404
from app.services.evaluations import get_cours_affecte
from app.services.fiche_service import transferer_cahier_vers_fiche

POINTS_MAX_COURS = 20.0


def _round2(value: float) -> float:
  return round(value, 2)


def appreciation(cote_finale_sur_20: float) -> str:
  if cote_finale_sur_20 >= 16:
    return "Très bien"
  if cote_finale_sur_20 >= 14:
    return "Bien"
  if cote_finale_sur_20 >= 12:
    return "Assez bien"
  if cote_finale_sur_20 >= 10:
    return "Passable"
  return "Insuffisant"


def _compute_moyenne_type(
  db: Session,
  cours_id: int,
  annee_academique_id: int,
  etudiant_id: int,
  type_evaluation: TypeEvaluation,
) -> float:
  evaluations = (
    db.query(Evaluation)
    .filter(
      Evaluation.cours_id == cours_id,
      Evaluation.annee_academique_id == annee_academique_id,
      Evaluation.type_evaluation == type_evaluation,
    )
    .all()
  )
  if not evaluations:
    return 0.0

  total_obtenu = 0.0
  total_max = 0.0
  for evaluation in evaluations:
    total_max += evaluation.cote_maximale
    note = (
      db.query(Note)
      .filter(
        Note.evaluation_id == evaluation.id,
        Note.etudiant_id == etudiant_id,
      )
      .first()
    )
    total_obtenu += note.cote_obtenue if note else 0.0

  if total_max <= 0:
    return 0.0
  return _round2(total_obtenu / total_max * 100)


def _build_ligne_data(
  db: Session,
  cours: Cours,
  annee_academique_id: int,
  etudiant_id: int,
) -> dict:
  moyenne_tj = _compute_moyenne_type(
    db, cours.id, annee_academique_id, etudiant_id, TypeEvaluation.TJ
  )
  moyenne_examen = _compute_moyenne_type(
    db, cours.id, annee_academique_id, etudiant_id, TypeEvaluation.EXAMEN
  )

  cote_tj_sur_10 = _round2(moyenne_tj * 10 / 100)
  cote_examen_sur_10 = _round2(moyenne_examen * 10 / 100)
  cote_finale_sur_20 = _round2(cote_tj_sur_10 + cote_examen_sur_10)

  credits = cours.credits
  points_ponderes = _round2(cote_finale_sur_20 * credits)
  points_max_ponderes = _round2(POINTS_MAX_COURS * credits)

  return {
    "moyenne_tj": moyenne_tj,
    "moyenne_examen": moyenne_examen,
    "cote_tj_sur_10": cote_tj_sur_10,
    "cote_examen_sur_10": cote_examen_sur_10,
    "cote_finale_sur_20": cote_finale_sur_20,
    "moyenne_finale": cote_finale_sur_20,
    "credits": credits,
    "points_ponderes": points_ponderes,
    "points_max_ponderes": points_max_ponderes,
    "appreciation": appreciation(cote_finale_sur_20),
  }


def get_cahier_for_enseignant(
  db: Session,
  cahier_id: int,
  enseignant_id: int,
) -> CahierCotes:
  cahier = (
    db.query(CahierCotes)
    .filter(
      CahierCotes.id == cahier_id,
      CahierCotes.enseignant_id == enseignant_id,
    )
    .first()
  )
  if not cahier:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail="Cahier de cotes introuvable",
    )
  return cahier


def _get_etudiants_promotion(db: Session, promotion_id: int) -> list[Etudiant]:
  return (
    db.query(Etudiant)
    .filter(Etudiant.promotion_id == promotion_id)
    .order_by(Etudiant.nom, Etudiant.prenom)
    .all()
  )


def _regenerer_lignes(
  db: Session,
  cahier: CahierCotes,
  cours: Cours,
) -> None:
  db.query(CahierCotesLigne).filter(
    CahierCotesLigne.cahier_cotes_id == cahier.id
  ).delete(synchronize_session=False)

  etudiants = _get_etudiants_promotion(db, cours.promotion_id)
  for etudiant in etudiants:
    ligne_data = _build_ligne_data(db, cours, cahier.annee_academique_id, etudiant.id)
    db.add(CahierCotesLigne(cahier_cotes_id=cahier.id, etudiant_id=etudiant.id, **ligne_data))


def generer_cahier(
  db: Session,
  enseignant_id: int,
  cours_id: int,
  annee_academique_id: int | None = None,
) -> CahierCotes:
  cours = get_cours_affecte(db, cours_id, enseignant_id)

  if annee_academique_id:
    annee = get_or_404(db, AnneeAcademique, annee_academique_id, "Année académique")
  else:
    annee = get_active_annee_academique(db)

  existing = (
    db.query(CahierCotes)
    .filter(
      CahierCotes.cours_id == cours_id,
      CahierCotes.annee_academique_id == annee.id,
    )
    .first()
  )

  if existing and existing.statut == StatutDocument.valide:
    raise HTTPException(
      status_code=status.HTTP_409_CONFLICT,
      detail="Le cahier de cotes est déjà validé et ne peut pas être régénéré",
    )

  try:
    if existing:
      existing.date_generation = datetime.now(timezone.utc).replace(tzinfo=None)
      existing.enseignant_id = enseignant_id
      _regenerer_lignes(db, existing, cours)
      db.commit()
      db.refresh(existing)
      return existing

    cahier = CahierCotes(
      cours_id=cours.id,
      enseignant_id=enseignant_id,
      annee_academique_id=annee.id,
      promotion_id=cours.promotion_id,
      statut=StatutDocument.brouillon,
    )
    db.add(cahier)
    db.flush()
    _regenerer_lignes(db, cahier, cours)
    db.commit()
    db.refresh(cahier)
    return cahier
  except Exception:
    db.rollback()
    raise


def valider_cahier(db: Session, cahier: CahierCotes) -> CahierCotes:
  if cahier.statut == StatutDocument.valide:
    raise HTTPException(
      status_code=status.HTTP_409_CONFLICT,
      detail="Cahier de cotes déjà validé",
    )

  if not cahier.lignes:
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail="Le cahier ne contient aucune ligne",
    )

  try:
    cahier.statut = StatutDocument.valide
    cahier.date_validation = datetime.now(timezone.utc).replace(tzinfo=None)
    transferer_cahier_vers_fiche(db, cahier)
    db.commit()
    db.refresh(cahier)
    return cahier
  except HTTPException:
    db.rollback()
    raise
  except Exception:
    db.rollback()
    raise
