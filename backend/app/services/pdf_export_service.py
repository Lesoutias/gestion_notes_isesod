from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models import (
  AnneeAcademique,
  Bulletin,
  FicheSynthetique,
  FicheSynthetiqueLigne,
  Promotion,
  ReleveCotes,
)
from app.services.pdf import (
  generer_bulletin_pdf,
  generer_fiche_synthetique_pdf,
  generer_releve_cotes_pdf,
  generer_tous_releves_cotes_pdf,
  pdf_response,
)
from app.services.pdf.common import sanitize_filename
from app.services.releve_cotes_service import get_releve_or_404


def _load_promotion_context(db: Session, promotion_id: int):
  promotion = (
    db.query(Promotion)
    .options(joinedload(Promotion.filiere))
    .filter(Promotion.id == promotion_id)
    .first()
  )
  if not promotion:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Promotion introuvable")
  return promotion.filiere, promotion


def _load_annee(db: Session, annee_academique_id: int) -> AnneeAcademique:
  annee = db.query(AnneeAcademique).filter(AnneeAcademique.id == annee_academique_id).first()
  if not annee:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Année académique introuvable")
  return annee


def load_releve_for_pdf(db: Session, releve_id: int) -> ReleveCotes:
  releve = (
    db.query(ReleveCotes)
    .options(
      joinedload(ReleveCotes.lignes),
      joinedload(ReleveCotes.etudiant),
    )
    .filter(ReleveCotes.id == releve_id)
    .first()
  )
  if not releve:
    return get_releve_or_404(db, releve_id)
  return releve


def load_bulletin_for_releve(db: Session, releve: ReleveCotes) -> Bulletin:
  bulletin = (
    db.query(Bulletin)
    .options(
      joinedload(Bulletin.lignes),
      joinedload(Bulletin.etudiant),
    )
    .filter(
      Bulletin.etudiant_id == releve.etudiant_id,
      Bulletin.annee_academique_id == releve.annee_academique_id,
    )
    .first()
  )
  if not bulletin:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail="Bulletin introuvable pour cet étudiant",
    )
  return bulletin


def load_fiche_for_pdf(db: Session, fiche_id: int) -> FicheSynthetique:
  fiche = (
    db.query(FicheSynthetique)
    .options(
      joinedload(FicheSynthetique.lignes).joinedload(FicheSynthetiqueLigne.etudiant),
      joinedload(FicheSynthetique.lignes).joinedload(FicheSynthetiqueLigne.cours),
    )
    .filter(FicheSynthetique.id == fiche_id)
    .first()
  )
  if not fiche:
    from app.services.fiche_service import get_fiche_or_404

    return get_fiche_or_404(db, fiche_id)
  return fiche


def export_releve_cotes_pdf(db: Session, releve_id: int):
  releve = load_releve_for_pdf(db, releve_id)
  filiere, promotion = _load_promotion_context(db, releve.promotion_id)
  annee = _load_annee(db, releve.annee_academique_id)
  data = generer_releve_cotes_pdf(
    releve,
    filiere=filiere,
    promotion=promotion,
    annee_academique=annee,
  )
  matricule = releve.etudiant.matricule or f"etu_{releve.etudiant_id}"
  return pdf_response(data, f"releve_cotes_{matricule}.pdf")


def export_bulletin_pdf_for_releve(db: Session, releve_id: int):
  releve = load_releve_for_pdf(db, releve_id)
  bulletin = load_bulletin_for_releve(db, releve)
  filiere, promotion = _load_promotion_context(db, releve.promotion_id)
  annee = _load_annee(db, releve.annee_academique_id)
  data = generer_bulletin_pdf(
    bulletin,
    filiere=filiere,
    promotion=promotion,
    annee_academique=annee,
  )
  matricule = releve.etudiant.matricule or f"etu_{releve.etudiant_id}"
  return pdf_response(data, f"bulletin_{matricule}.pdf")


def export_tous_releves_cotes_pdf(
  db: Session,
  promotion_id: int,
  annee_academique_id: int,
):
  filiere, promotion = _load_promotion_context(db, promotion_id)
  annee = _load_annee(db, annee_academique_id)
  releves = (
    db.query(ReleveCotes)
    .options(
      joinedload(ReleveCotes.lignes),
      joinedload(ReleveCotes.etudiant),
    )
    .filter(
      ReleveCotes.promotion_id == promotion_id,
      ReleveCotes.annee_academique_id == annee_academique_id,
    )
    .order_by(ReleveCotes.rang, ReleveCotes.etudiant_id)
    .all()
  )
  if not releves:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail="Aucun relevé trouvé pour cette promotion et année académique",
    )
  data = generer_tous_releves_cotes_pdf(
    releves,
    filiere=filiere,
    promotion=promotion,
    annee_academique=annee,
  )
  promo_part = sanitize_filename(promotion.nom)
  annee_part = sanitize_filename(annee.libelle)
  return pdf_response(data, f"releves_cotes_{promo_part}_{annee_part}.pdf")


def export_fiche_synthetique_pdf(db: Session, fiche_id: int):
  fiche = load_fiche_for_pdf(db, fiche_id)
  filiere, promotion = _load_promotion_context(db, fiche.promotion_id)
  annee = _load_annee(db, fiche.annee_academique_id)
  data = generer_fiche_synthetique_pdf(
    fiche,
    filiere=filiere,
    promotion=promotion,
    annee_academique=annee,
  )
  return pdf_response(data, f"fiche_synthetique_{fiche.id}.pdf")
