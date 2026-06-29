from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

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


def _compute_total_points_type(
  db: Session,
  cours_id: int,
  annee_academique_id: int,
  etudiant_id: int,
  type_evaluation: TypeEvaluation,
) -> tuple[float, float]:
  """Somme les points obtenus et les points max de toutes les évaluations d'un type."""
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
    return 0.0, 0.0

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

  return _round2(total_obtenu), _round2(total_max)


def _cote_sur_10(total_obtenu: float, total_max: float) -> float:
  """Convertit un total de points en cote sur 10."""
  if total_max <= 0:
    return 0.0
  return _round2(total_obtenu / total_max * 10)


def _build_ligne_data(
  db: Session,
  cours: Cours,
  annee_academique_id: int,
  etudiant_id: int,
) -> dict:
  points_tj_obtenus, points_tj_max = _compute_total_points_type(
    db, cours.id, annee_academique_id, etudiant_id, TypeEvaluation.TJ
  )
  points_examen_obtenus, points_examen_max = _compute_total_points_type(
    db, cours.id, annee_academique_id, etudiant_id, TypeEvaluation.EXAMEN
  )

  cote_tj_sur_10 = _cote_sur_10(points_tj_obtenus, points_tj_max)
  cote_examen_sur_10 = _cote_sur_10(points_examen_obtenus, points_examen_max)
  cote_finale_sur_20 = _round2(cote_tj_sur_10 + cote_examen_sur_10)

  moyenne_tj = _round2(points_tj_obtenus / points_tj_max * 100) if points_tj_max > 0 else 0.0
  moyenne_examen = (
    _round2(points_examen_obtenus / points_examen_max * 100) if points_examen_max > 0 else 0.0
  )

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
    "points_tj_obtenus": points_tj_obtenus,
    "points_tj_max": points_tj_max,
    "points_examen_obtenus": points_examen_obtenus,
    "points_examen_max": points_examen_max,
  }


def _ligne_totaux_affichage(
  db: Session,
  cours: Cours,
  annee_academique_id: int,
  etudiant_id: int,
) -> dict:
  points_tj_obtenus, points_tj_max = _compute_total_points_type(
    db, cours.id, annee_academique_id, etudiant_id, TypeEvaluation.TJ
  )
  points_examen_obtenus, points_examen_max = _compute_total_points_type(
    db, cours.id, annee_academique_id, etudiant_id, TypeEvaluation.EXAMEN
  )
  return {
    "points_tj_obtenus": points_tj_obtenus,
    "points_tj_max": points_tj_max,
    "points_examen_obtenus": points_examen_obtenus,
    "points_examen_max": points_examen_max,
  }


def _lister_evaluations_tj(
  db: Session,
  cours_id: int,
  annee_academique_id: int,
) -> list[Evaluation]:
  return (
    db.query(Evaluation)
    .filter(
      Evaluation.cours_id == cours_id,
      Evaluation.annee_academique_id == annee_academique_id,
      Evaluation.type_evaluation == TypeEvaluation.TJ,
    )
    .order_by(Evaluation.date_evaluation.asc(), Evaluation.id.asc())
    .all()
  )


def _build_details_tj(
  db: Session,
  evaluations_tj: list[Evaluation],
  etudiant_id: int,
) -> list[dict]:
  details: list[dict] = []
  for evaluation in evaluations_tj:
    note = (
      db.query(Note)
      .filter(
        Note.evaluation_id == evaluation.id,
        Note.etudiant_id == etudiant_id,
      )
      .first()
    )
    details.append(
      {
        "evaluation_id": evaluation.id,
        "libelle": evaluation.libelle,
        "cote_obtenue": _round2(note.cote_obtenue if note else 0.0),
        "cote_maximale": _round2(evaluation.cote_maximale),
      }
    )
  return details


def _enrichir_details_tj(
  db: Session,
  cahier: CahierCotes,
  cours: Cours,
) -> None:
  evaluations_tj = _lister_evaluations_tj(db, cours.id, cahier.annee_academique_id)
  setattr(cahier, "evaluations_tj", evaluations_tj)
  for ligne in cahier.lignes:
    setattr(
      ligne,
      "details_tj",
      _build_details_tj(db, evaluations_tj, ligne.etudiant_id),
    )


def enrichir_cahier_detail(db: Session, cahier: CahierCotes) -> CahierCotes:
  """Recalcule les lignes à partir des évaluations restantes (cahier brouillon)."""
  cours = cahier.cours or db.query(Cours).filter(Cours.id == cahier.cours_id).first()
  if not cours:
    return cahier

  if cahier.statut == StatutDocument.brouillon:
    for ligne in cahier.lignes:
      ligne_data = _build_ligne_data(db, cours, cahier.annee_academique_id, ligne.etudiant_id)
      for key, value in ligne_data.items():
        setattr(ligne, key, value)
  else:
    for ligne in cahier.lignes:
      totaux = _ligne_totaux_affichage(db, cours, cahier.annee_academique_id, ligne.etudiant_id)
      for key, value in totaux.items():
        setattr(ligne, key, value)

  _enrichir_details_tj(db, cahier, cours)
  return cahier


def get_cahier_for_enseignant(
  db: Session,
  cahier_id: int,
  enseignant_id: int,
) -> CahierCotes:
  cahier = (
    db.query(CahierCotes)
    .options(joinedload(CahierCotes.lignes).joinedload(CahierCotesLigne.etudiant))
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
  return enrichir_cahier_detail(db, cahier)


def get_cahier_for_cours(
  db: Session,
  enseignant_id: int,
  cours_id: int,
  annee_academique_id: int | None = None,
) -> CahierCotes | None:
  get_cours_affecte(db, cours_id, enseignant_id)

  if annee_academique_id:
    annee_id = annee_academique_id
  else:
    annee = get_active_annee_academique(db)
    annee_id = annee.id

  cahier = (
    db.query(CahierCotes)
    .options(joinedload(CahierCotes.lignes).joinedload(CahierCotesLigne.etudiant))
    .filter(
      CahierCotes.cours_id == cours_id,
      CahierCotes.annee_academique_id == annee_id,
      CahierCotes.enseignant_id == enseignant_id,
    )
    .first()
  )
  if not cahier:
    return None
  return enrichir_cahier_detail(db, cahier)


def _get_etudiants_promotion(db: Session, promotion_id: int) -> list[Etudiant]:
  return (
    db.query(Etudiant)
    .filter(Etudiant.promotion_id == promotion_id)
    .order_by(Etudiant.nom, Etudiant.prenom)
    .all()
  )


def _actualiser_lignes(
  db: Session,
  cahier: CahierCotes,
  cours: Cours,
) -> None:
  etudiants = _get_etudiants_promotion(db, cours.promotion_id)
  etudiant_ids = {etudiant.id for etudiant in etudiants}

  if etudiant_ids:
    db.query(CahierCotesLigne).filter(
      CahierCotesLigne.cahier_cotes_id == cahier.id,
      CahierCotesLigne.etudiant_id.notin_(etudiant_ids),
    ).delete(synchronize_session=False)
  else:
    db.query(CahierCotesLigne).filter(
      CahierCotesLigne.cahier_cotes_id == cahier.id
    ).delete(synchronize_session=False)

  existing_lignes = {
    ligne.etudiant_id: ligne
    for ligne in db.query(CahierCotesLigne)
    .filter(CahierCotesLigne.cahier_cotes_id == cahier.id)
    .all()
  }

  for etudiant in etudiants:
    ligne_data = _build_ligne_data(db, cours, cahier.annee_academique_id, etudiant.id)
    ligne_data.pop("points_tj_obtenus", None)
    ligne_data.pop("points_tj_max", None)
    ligne_data.pop("points_examen_obtenus", None)
    ligne_data.pop("points_examen_max", None)

    existing = existing_lignes.get(etudiant.id)
    if existing:
      for key, value in ligne_data.items():
        setattr(existing, key, value)
    else:
      db.add(
        CahierCotesLigne(
          cahier_cotes_id=cahier.id,
          etudiant_id=etudiant.id,
          **ligne_data,
        )
      )


def generer_cahier(
  db: Session,
  enseignant_id: int,
  cours_id: int,
  annee_academique_id: int | None = None,
) -> tuple[CahierCotes, bool]:
  """Génère ou met à jour le cahier du cours. Retourne (cahier, created)."""
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
      detail="Le cahier de cotes est déjà validé et ne peut pas être modifié",
    )

  try:
    if existing:
      existing.date_generation = datetime.now(timezone.utc).replace(tzinfo=None)
      existing.enseignant_id = enseignant_id
      _actualiser_lignes(db, existing, cours)
      db.commit()
      db.refresh(existing)
      cahier = (
        db.query(CahierCotes)
        .options(joinedload(CahierCotes.lignes).joinedload(CahierCotesLigne.etudiant))
        .filter(CahierCotes.id == existing.id)
        .first()
      )
      return enrichir_cahier_detail(db, cahier), False

    cahier = CahierCotes(
      cours_id=cours.id,
      enseignant_id=enseignant_id,
      annee_academique_id=annee.id,
      promotion_id=cours.promotion_id,
      statut=StatutDocument.brouillon,
    )
    db.add(cahier)
    db.flush()
    _actualiser_lignes(db, cahier, cours)
    db.commit()
    db.refresh(cahier)
    cahier = (
      db.query(CahierCotes)
      .options(joinedload(CahierCotes.lignes).joinedload(CahierCotesLigne.etudiant))
      .filter(CahierCotes.id == cahier.id)
      .first()
    )
    return enrichir_cahier_detail(db, cahier), True
  except Exception:
    db.rollback()
    raise


def actualiser_cahier_brouillon(
  db: Session,
  cours_id: int,
  annee_academique_id: int,
) -> None:
  cahier = (
    db.query(CahierCotes)
    .filter(
      CahierCotes.cours_id == cours_id,
      CahierCotes.annee_academique_id == annee_academique_id,
      CahierCotes.statut == StatutDocument.brouillon,
    )
    .first()
  )
  if not cahier:
    return

  cours = db.query(Cours).filter(Cours.id == cours_id).first()
  if not cours:
    return

  _actualiser_lignes(db, cahier, cours)


def synchroniser_cahier_apres_notes(
  db: Session,
  cours_id: int,
  annee_academique_id: int,
) -> None:
  """Met à jour le cahier brouillon existant après encodage ou suppression de notes."""
  try:
    actualiser_cahier_brouillon(db, cours_id, annee_academique_id)
    db.commit()
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
