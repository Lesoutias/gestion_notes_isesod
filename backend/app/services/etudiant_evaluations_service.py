from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import Cours, Etudiant, Evaluation, Note, StatutEvaluation
from app.schemas.etudiant_space import (
  CoursEvaluationsBrief,
  CoursEvaluationsResume,
  EtudiantEvaluationsResponse,
  EvaluationEtudiantItem,
)
from app.services.cahier_service import calculer_resultats_cours_etudiant

_STATUTS_EVALUATIONS_VISIBLES = (
  StatutEvaluation.publiee,
  StatutEvaluation.cloturee,
)


def _round2(value: float) -> float:
  return round(value, 2)


def _pourcentage_note(cote_obtenue: float, cote_maximale: float) -> float:
  if cote_maximale <= 0:
    return 0.0
  return _round2(cote_obtenue / cote_maximale * 100)


def _cours_brief(
  db: Session,
  cours: Cours,
  annee_academique_id: int,
  etudiant_id: int,
) -> CoursEvaluationsBrief:
  resultats = calculer_resultats_cours_etudiant(
    db, cours, annee_academique_id, etudiant_id
  )
  return CoursEvaluationsBrief(
    id=cours.id,
    intitule=cours.intitule,
    semestre=cours.semestre,
    credits=resultats["credits"],
    moyenne_sur_20=resultats["cote_finale_sur_20"],
    points_ponderes=resultats["points_ponderes"],
    points_max_ponderes=resultats["points_max_ponderes"],
  )


def _resume_cours(
  db: Session,
  cours: Cours,
  annee_academique_id: int,
  etudiant_id: int,
) -> CoursEvaluationsResume:
  resultats = calculer_resultats_cours_etudiant(
    db, cours, annee_academique_id, etudiant_id
  )
  return CoursEvaluationsResume(
    moyenne_sur_20=resultats["cote_finale_sur_20"],
    points_ponderes=resultats["points_ponderes"],
    points_max_ponderes=resultats["points_max_ponderes"],
    credits=resultats["credits"],
    cote_tj_sur_10=resultats["cote_tj_sur_10"],
    cote_examen_sur_10=resultats["cote_examen_sur_10"],
    appreciation=resultats["appreciation"],
  )


def _default_cours_id(
  db: Session,
  cours_list: list[Cours],
  annee_academique_id: int,
) -> int | None:
  if not cours_list:
    return None
  for cours in cours_list:
    has_evaluations = (
      db.query(Evaluation.id)
      .filter(
        Evaluation.cours_id == cours.id,
        Evaluation.annee_academique_id == annee_academique_id,
        Evaluation.statut.in_(_STATUTS_EVALUATIONS_VISIBLES),
      )
      .first()
    )
    if has_evaluations:
      return cours.id
  return cours_list[0].id


def lister_evaluations_etudiant(
  db: Session,
  etudiant: Etudiant,
  cours_id: int | None = None,
) -> EtudiantEvaluationsResponse:
  cours_list = (
    db.query(Cours)
    .filter(Cours.promotion_id == etudiant.promotion_id)
    .order_by(Cours.intitule)
    .all()
  )

  cours_briefs = [
    _cours_brief(db, cours, etudiant.annee_academique_id, etudiant.id)
    for cours in cours_list
  ]

  selected_id = cours_id or _default_cours_id(
    db, cours_list, etudiant.annee_academique_id
  )

  evaluations: list[EvaluationEtudiantItem] = []
  resume: CoursEvaluationsResume | None = None

  if selected_id is not None:
    cours = next((c for c in cours_list if c.id == selected_id), None)
    if cours is None:
      raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Cours introuvable",
      )

    evaluations_db = (
      db.query(Evaluation)
      .filter(
        Evaluation.cours_id == selected_id,
        Evaluation.annee_academique_id == etudiant.annee_academique_id,
        Evaluation.statut.in_(_STATUTS_EVALUATIONS_VISIBLES),
      )
      .order_by(Evaluation.date_evaluation, Evaluation.id)
      .all()
    )

    for evaluation in evaluations_db:
      note = (
        db.query(Note)
        .filter(
          Note.evaluation_id == evaluation.id,
          Note.etudiant_id == etudiant.id,
        )
        .first()
      )
      cote_obtenue = note.cote_obtenue if note else None
      pourcentage = (
        _pourcentage_note(cote_obtenue, evaluation.cote_maximale)
        if cote_obtenue is not None
        else None
      )
      evaluations.append(
        EvaluationEtudiantItem(
          id=evaluation.id,
          libelle=evaluation.libelle,
          type_evaluation=evaluation.type_evaluation,
          cote_maximale=evaluation.cote_maximale,
          date_evaluation=evaluation.date_evaluation,
          statut=evaluation.statut,
          cote_obtenue=cote_obtenue,
          pourcentage=pourcentage,
        )
      )

    resume = _resume_cours(db, cours, etudiant.annee_academique_id, etudiant.id)

  return EtudiantEvaluationsResponse(
    cours=cours_briefs,
    cours_selectionne_id=selected_id,
    evaluations=evaluations,
    resume=resume,
  )
