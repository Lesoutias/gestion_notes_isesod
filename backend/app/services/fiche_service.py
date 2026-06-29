from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import distinct, func
from sqlalchemy.orm import Session

from app.models import (
  CahierCotes,
  Cours,
  FicheSynthetique,
  FicheSynthetiqueLigne,
  StatutFicheSynthetique,
)
from app.services.academic import get_or_404


def compter_cours_attendus(db: Session, promotion_id: int) -> int:
  return db.query(Cours).filter(Cours.promotion_id == promotion_id).count()


def compter_cours_recus(db: Session, fiche_id: int) -> int:
  result = (
    db.query(func.count(distinct(FicheSynthetiqueLigne.cours_id)))
    .filter(FicheSynthetiqueLigne.fiche_synthetique_id == fiche_id)
    .scalar()
  )
  return result or 0


def _mettre_a_jour_compteurs(db: Session, fiche: FicheSynthetique) -> None:
  fiche.total_cours_attendus = compter_cours_attendus(db, fiche.promotion_id)
  fiche.total_cours_recus = compter_cours_recus(db, fiche.id)

  if (
    fiche.statut == StatutFicheSynthetique.en_attente
    and fiche.total_cours_recus >= fiche.total_cours_attendus
    and fiche.total_cours_attendus > 0
  ):
    fiche.statut = StatutFicheSynthetique.complete


def rafraichir_compteurs_fiche(db: Session, fiche: FicheSynthetique) -> FicheSynthetique:
  """Recalcule les compteurs depuis la base (corrige les valeurs obsolètes)."""
  ancien_recus = fiche.total_cours_recus
  ancien_attendus = fiche.total_cours_attendus
  ancien_statut = fiche.statut
  _mettre_a_jour_compteurs(db, fiche)
  if (
    fiche.total_cours_recus != ancien_recus
    or fiche.total_cours_attendus != ancien_attendus
    or fiche.statut != ancien_statut
  ):
    db.commit()
    db.refresh(fiche)
  return fiche


def get_or_create_fiche(
  db: Session,
  promotion_id: int,
  annee_academique_id: int,
) -> FicheSynthetique:
  fiche = (
    db.query(FicheSynthetique)
    .filter(
      FicheSynthetique.promotion_id == promotion_id,
      FicheSynthetique.annee_academique_id == annee_academique_id,
    )
    .first()
  )

  if fiche:
    return fiche

  total_attendus = compter_cours_attendus(db, promotion_id)
  fiche = FicheSynthetique(
    promotion_id=promotion_id,
    annee_academique_id=annee_academique_id,
    statut=StatutFicheSynthetique.en_attente,
    total_cours_attendus=total_attendus,
    total_cours_recus=0,
  )
  db.add(fiche)
  db.flush()
  return fiche


def cours_deja_transfere(db: Session, fiche_id: int, cours_id: int) -> bool:
  return (
    db.query(FicheSynthetiqueLigne)
    .filter(
      FicheSynthetiqueLigne.fiche_synthetique_id == fiche_id,
      FicheSynthetiqueLigne.cours_id == cours_id,
    )
    .first()
    is not None
  )


def transferer_cahier_vers_fiche(db: Session, cahier: CahierCotes) -> FicheSynthetique:
  fiche = get_or_create_fiche(
    db,
    cahier.promotion_id,
    cahier.annee_academique_id,
  )

  if fiche.statut == StatutFicheSynthetique.validee:
    raise HTTPException(
      status_code=status.HTTP_409_CONFLICT,
      detail="La fiche synthétique est validée — transfert impossible",
    )

  if cours_deja_transfere(db, fiche.id, cahier.cours_id):
    raise HTTPException(
      status_code=status.HTTP_409_CONFLICT,
      detail="Ce cours a déjà été transféré dans la fiche synthétique",
    )

  for ligne in cahier.lignes:
    db.add(
      FicheSynthetiqueLigne(
        fiche_synthetique_id=fiche.id,
        etudiant_id=ligne.etudiant_id,
        cours_id=cahier.cours_id,
        enseignant_id=cahier.enseignant_id,
        credits=ligne.credits,
        cote_finale_sur_20=ligne.cote_finale_sur_20,
        moyenne_finale=ligne.cote_finale_sur_20,
        points_ponderes=ligne.points_ponderes,
        points_max_ponderes=ligne.points_max_ponderes,
        appreciation=ligne.appreciation,
      )
    )

  db.flush()
  _mettre_a_jour_compteurs(db, fiche)
  db.flush()
  return fiche


def get_fiche_or_404(db: Session, fiche_id: int) -> FicheSynthetique:
  return get_or_404(db, FicheSynthetique, fiche_id, "Fiche synthétique")


def enrichir_fiche_detail(fiche: FicheSynthetique) -> FicheSynthetique:
  """Trie les lignes pour l'affichage tableau croisé (cours × étudiants)."""
  fiche.lignes.sort(
    key=lambda ligne: (
      ligne.cours.intitule if ligne.cours else "",
      ligne.etudiant.nom if ligne.etudiant else "",
      ligne.etudiant.prenom if ligne.etudiant else "",
    )
  )
  return fiche


def valider_fiche(db: Session, fiche: FicheSynthetique):
  from app.services.bulletin_service import generer_bulletins_depuis_fiche
  from app.services.releve_cotes_service import generer_releves_depuis_fiche

  fiche = rafraichir_compteurs_fiche(db, fiche)

  if fiche.statut == StatutFicheSynthetique.validee:
    raise HTTPException(
      status_code=status.HTTP_409_CONFLICT,
      detail="Fiche synthétique déjà validée",
    )

  if fiche.statut != StatutFicheSynthetique.complete:
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail=(
        f"La fiche n'est pas complète "
        f"({fiche.total_cours_recus}/{fiche.total_cours_attendus} cours reçus)"
      ),
    )

  if not fiche.lignes:
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail="La fiche synthétique ne contient aucune ligne",
    )

  try:
    fiche.statut = StatutFicheSynthetique.validee
    fiche.date_validation = datetime.now(timezone.utc).replace(tzinfo=None)
    generer_bulletins_depuis_fiche(db, fiche)
    generer_releves_depuis_fiche(db, fiche)
    db.commit()
    db.refresh(fiche)
    for ligne in fiche.lignes:
      db.refresh(ligne)
    return fiche
  except HTTPException:
    db.rollback()
    raise
  except Exception:
    db.rollback()
    raise
