from sqlalchemy.orm import Session

from app.models import Bulletin, BulletinLigne, Cours, Etudiant, FicheSynthetique, StatutDocument


def generer_bulletins_depuis_fiche(db: Session, fiche: FicheSynthetique) -> list[Bulletin]:
  etudiants = (
    db.query(Etudiant)
    .filter(Etudiant.promotion_id == fiche.promotion_id)
    .all()
  )

  bulletins_crees: list[Bulletin] = []

  for etudiant in etudiants:
    lignes_fiche = [
      ligne for ligne in fiche.lignes if ligne.etudiant_id == etudiant.id
    ]
    if not lignes_fiche:
      continue

    existing = (
      db.query(Bulletin)
      .filter(
        Bulletin.etudiant_id == etudiant.id,
        Bulletin.annee_academique_id == fiche.annee_academique_id,
      )
      .first()
    )
    if existing:
      continue

    total_credits = sum(ligne.credits for ligne in lignes_fiche)
    total_points = sum(ligne.points_ponderes for ligne in lignes_fiche)
    moyenne_generale = (
      round(total_points / total_credits, 2) if total_credits > 0 else 0.0
    )

    bulletin = Bulletin(
      etudiant_id=etudiant.id,
      annee_academique_id=fiche.annee_academique_id,
      promotion_id=fiche.promotion_id,
      fiche_synthetique_id=fiche.id,
      moyenne_generale=moyenne_generale,
      total_credits=total_credits,
      total_points_ponderes=round(total_points, 2),
      statut=StatutDocument.brouillon,
    )
    db.add(bulletin)
    db.flush()

    for ligne in lignes_fiche:
      cours = db.query(Cours).filter(Cours.id == ligne.cours_id).first()
      db.add(
        BulletinLigne(
          bulletin_id=bulletin.id,
          cours_id=ligne.cours_id,
          intitule=cours.intitule if cours else f"Cours {ligne.cours_id}",
          moyenne_finale=ligne.cote_finale_sur_20,
          credits=ligne.credits,
          points_ponderes=ligne.points_ponderes,
        )
      )

    bulletins_crees.append(bulletin)

  return bulletins_crees
