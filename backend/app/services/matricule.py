from sqlalchemy.orm import Session

from app.models import Enseignant, Etudiant, User


def normalize_matricule(matricule: str) -> str:
  return matricule.strip().upper()


def find_etudiant_by_matricule(db: Session, matricule: str) -> Etudiant | None:
  normalized = normalize_matricule(matricule)
  return db.query(Etudiant).filter(Etudiant.matricule == normalized).first()


def find_enseignant_by_matricule(db: Session, matricule: str) -> Enseignant | None:
  normalized = normalize_matricule(matricule)
  return db.query(Enseignant).filter(Enseignant.matricule == normalized).first()


def etudiant_has_account(db: Session, etudiant: Etudiant) -> bool:
  if etudiant.user_id:
    return True
  return db.query(User).filter(User.etudiant_id == etudiant.id).first() is not None


def enseignant_has_account(db: Session, enseignant: Enseignant) -> bool:
  if enseignant.user_id:
    return True
  return db.query(User).filter(User.enseignant_id == enseignant.id).first() is not None
