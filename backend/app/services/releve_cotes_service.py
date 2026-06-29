from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models import (
  Cours,
  Etudiant,
  FicheSynthetique,
  FicheSynthetiqueLigne,
  ReleveCotes,
  ReleveCotesLigne,
  StatutFicheSynthetique,
  StatutReleveCotes,
  User,
)
from app.services.academic import get_or_404

POINTS_MAX_COURS = 20.0


def _round2(value: float) -> float:
  return round(value, 2)


def get_etudiant_id(user: User) -> int:
  if not user.etudiant_id:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail="Profil étudiant non lié à ce compte",
    )
  return user.etudiant_id


def calculer_mention(pourcentage: float) -> str:
  if pourcentage >= 80:
    return "Très bien"
  if pourcentage >= 70:
    return "Bien"
  if pourcentage >= 60:
    return "Assez bien"
  if pourcentage >= 50:
    return "Passable"
  return "Insuffisant"


def calculer_decision(pourcentage: float) -> str:
  return "Admis" if pourcentage >= 50 else "Ajourné"


def _lignes_par_etudiant(
  fiche: FicheSynthetique,
) -> dict[int, list[FicheSynthetiqueLigne]]:
  result: dict[int, list[FicheSynthetiqueLigne]] = {}
  for ligne in fiche.lignes:
    result.setdefault(ligne.etudiant_id, []).append(ligne)
  return result


def _calculer_totaux_etudiant(
  lignes_fiche: list[FicheSynthetiqueLigne],
) -> tuple[float, float, int, float]:
  total_points_obtenus = 0.0
  total_points_max = 0.0
  total_credits = 0

  for ligne in lignes_fiche:
    cote_sur_20 = ligne.cote_finale_sur_20
    points_ponderes = _round2(cote_sur_20 * ligne.credits)
    points_max_ponderes = _round2(POINTS_MAX_COURS * ligne.credits)
    total_points_obtenus += points_ponderes
    total_points_max += points_max_ponderes
    total_credits += ligne.credits

  pourcentage = (
    _round2(total_points_obtenus / total_points_max * 100)
    if total_points_max > 0
    else 0.0
  )
  return (
    _round2(total_points_obtenus),
    _round2(total_points_max),
    total_credits,
    pourcentage,
  )


def _attribuer_rangs(releves_data: list[dict]) -> None:
  sorted_data = sorted(
    releves_data,
    key=lambda item: (item["pourcentage"], item["total_points_obtenus"]),
    reverse=True,
  )
  rang = 0
  previous_key: tuple[float, float] | None = None
  for index, item in enumerate(sorted_data, start=1):
    current_key = (item["pourcentage"], item["total_points_obtenus"])
    if current_key != previous_key:
      rang = index
      previous_key = current_key
    item["rang"] = rang


def _verifier_fiche_generable(fiche: FicheSynthetique) -> None:
  if fiche.statut != StatutFicheSynthetique.validee:
    if fiche.statut != StatutFicheSynthetique.complete:
      raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=(
          f"La fiche n'est pas complète "
          f"({fiche.total_cours_recus}/{fiche.total_cours_attendus} cours reçus)"
        ),
      )
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail="La fiche synthétique doit être validée avant la génération des relevés",
    )

  if not fiche.lignes:
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail="La fiche synthétique ne contient aucune ligne",
    )


def releves_existants_pour_fiche(db: Session, fiche_id: int) -> bool:
  return (
    db.query(ReleveCotes).filter(ReleveCotes.fiche_id == fiche_id).first() is not None
  )


def generer_releves_depuis_fiche(
  db: Session,
  fiche: FicheSynthetique,
) -> list[ReleveCotes]:
  if releves_existants_pour_fiche(db, fiche.id):
    raise HTTPException(
      status_code=status.HTTP_409_CONFLICT,
      detail="Des relevés de cotes existent déjà pour cette fiche synthétique",
    )

  _verifier_fiche_generable(fiche)

  lignes_par_etudiant = _lignes_par_etudiant(fiche)
  if not lignes_par_etudiant:
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail="Aucune ligne étudiant trouvée dans la fiche synthétique",
    )

  etudiants = (
    db.query(Etudiant)
    .filter(Etudiant.promotion_id == fiche.promotion_id)
    .all()
  )

  releves_data: list[dict] = []
  for etudiant in etudiants:
    lignes_fiche = lignes_par_etudiant.get(etudiant.id)
    if not lignes_fiche:
      continue

    total_points_obtenus, total_points_max, total_credits, pourcentage = (
      _calculer_totaux_etudiant(lignes_fiche)
    )
    releves_data.append(
      {
        "etudiant": etudiant,
        "lignes_fiche": lignes_fiche,
        "total_points_obtenus": total_points_obtenus,
        "total_points_max": total_points_max,
        "total_credits": total_credits,
        "pourcentage": pourcentage,
        "mention": calculer_mention(pourcentage),
        "decision": calculer_decision(pourcentage),
      }
    )

  _attribuer_rangs(releves_data)

  cours_cache: dict[int, Cours] = {}
  releves_crees: list[ReleveCotes] = []

  for data in releves_data:
    releve = ReleveCotes(
      etudiant_id=data["etudiant"].id,
      promotion_id=fiche.promotion_id,
      annee_academique_id=fiche.annee_academique_id,
      fiche_id=fiche.id,
      total_points_obtenus=data["total_points_obtenus"],
      total_points_max=data["total_points_max"],
      total_credits=data["total_credits"],
      pourcentage=data["pourcentage"],
      mention=data["mention"],
      decision=data["decision"],
      rang=data["rang"],
      statut=StatutReleveCotes.genere,
      date_generation=datetime.now(timezone.utc).replace(tzinfo=None),
    )
    db.add(releve)
    db.flush()

    for ligne_fiche in data["lignes_fiche"]:
      if ligne_fiche.cours_id not in cours_cache:
        cours = db.query(Cours).filter(Cours.id == ligne_fiche.cours_id).first()
        cours_cache[ligne_fiche.cours_id] = cours

      cours = cours_cache[ligne_fiche.cours_id]
      cote_sur_20 = ligne_fiche.cote_finale_sur_20
      credits = ligne_fiche.credits

      db.add(
        ReleveCotesLigne(
          releve_id=releve.id,
          cours_id=ligne_fiche.cours_id,
          intitule_cours=cours.intitule if cours else f"Cours {ligne_fiche.cours_id}",
          credits=credits,
          cote_sur_20=cote_sur_20,
          points_ponderes=_round2(cote_sur_20 * credits),
          points_max_ponderes=_round2(POINTS_MAX_COURS * credits),
          appreciation=ligne_fiche.appreciation,
        )
      )

    releves_crees.append(releve)

  db.flush()
  return releves_crees


def get_fiche_pour_releves(db: Session, fiche_id: int) -> FicheSynthetique:
  fiche = (
    db.query(FicheSynthetique)
    .options(joinedload(FicheSynthetique.lignes))
    .filter(FicheSynthetique.id == fiche_id)
    .first()
  )
  if not fiche:
    get_or_404(db, FicheSynthetique, fiche_id, "Fiche synthétique")
  return fiche


def get_releve_or_404(db: Session, releve_id: int) -> ReleveCotes:
  return get_or_404(db, ReleveCotes, releve_id, "Relevé de cotes")


def generer_releves_transaction(db: Session, fiche_id: int) -> list[ReleveCotes]:
  fiche = get_fiche_pour_releves(db, fiche_id)
  try:
    releves = generer_releves_depuis_fiche(db, fiche)
    db.commit()
    for releve in releves:
      db.refresh(releve)
    return releves
  except HTTPException:
    db.rollback()
    raise
  except Exception:
    db.rollback()
    raise


def proclamer_releves_cotes(
  db: Session,
  promotion_id: int,
  annee_academique_id: int,
) -> tuple[int, int]:
  """Publie les relevés générés pour une promotion et une année académique."""
  fiche = (
    db.query(FicheSynthetique)
    .filter(
      FicheSynthetique.promotion_id == promotion_id,
      FicheSynthetique.annee_academique_id == annee_academique_id,
    )
    .first()
  )
  if not fiche:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail="Fiche synthétique introuvable pour cette promotion et cette année",
    )

  if fiche.statut != StatutFicheSynthetique.validee:
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail="La fiche synthétique doit être validée avant la proclamation des relevés",
    )

  releves = (
    db.query(ReleveCotes)
    .filter(
      ReleveCotes.fiche_id == fiche.id,
      ReleveCotes.statut == StatutReleveCotes.genere,
    )
    .all()
  )

  if not releves:
    deja_publies = (
      db.query(ReleveCotes)
      .filter(
        ReleveCotes.fiche_id == fiche.id,
        ReleveCotes.statut == StatutReleveCotes.publie,
      )
      .count()
    )
    if deja_publies > 0:
      raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail="Les relevés de cotes ont déjà été proclamés",
      )
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail="Aucun relevé de cotes à proclamer pour cette promotion",
    )

  for releve in releves:
    releve.statut = StatutReleveCotes.publie

  db.commit()
  return fiche.id, len(releves)
