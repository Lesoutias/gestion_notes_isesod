from datetime import datetime

from sqlalchemy import select
from sqlalchemy.engine import Connection

from app.models.cours import Cours
from app.models.departements import Departement
from app.models.enseignants import Enseignant
from app.models.etudiants import Etudiant
from app.models.facultes import Faculte
from app.models.filieres import Filiere
from app.models.promotions import Promotion


def _next_sequence(codes: list[str], prefix: str, width: int) -> str:
  numbers: list[int] = []
  for code in codes:
    if not code or not code.startswith(prefix):
      continue
    suffix = code[len(prefix) :]
    if suffix.isdigit():
      numbers.append(int(suffix))

  return f"{prefix}{max(numbers, default=0) + 1:0{width}d}"


def generate_faculte_code(connection: Connection) -> str:
  codes = connection.execute(select(Faculte.code)).scalars().all()
  return _next_sequence(codes, "FAC-", 3)


def generate_departement_code(connection: Connection, faculte_id: int) -> str:
  faculte_code = connection.execute(
    select(Faculte.code).where(Faculte.id == faculte_id)
  ).scalar_one()
  codes = connection.execute(
    select(Departement.code).where(Departement.faculte_id == faculte_id)
  ).scalars().all()
  prefix = f"{faculte_code}-D"
  return _next_sequence(codes, prefix, 2)


def generate_matricule(connection: Connection) -> str:
  year = datetime.now().year
  prefix = f"ETU-{year}-"
  codes = connection.execute(select(Etudiant.matricule)).scalars().all()
  return _next_sequence(codes, prefix, 4)


def generate_enseignant_matricule(connection: Connection) -> str:
  year = datetime.now().year
  prefix = f"ENS-{year}-"
  codes = connection.execute(select(Enseignant.matricule)).scalars().all()
  return _next_sequence(codes, prefix, 4)


def generate_cours_code(connection: Connection, promotion_id: int) -> str:
  filiere_sigle = connection.execute(
    select(Filiere.sigle)
    .join(Promotion, Promotion.filiere_id == Filiere.id)
    .where(Promotion.id == promotion_id)
  ).scalar_one()
  prefix = f"{filiere_sigle}-CRS-"
  codes = connection.execute(
    select(Cours.code).where(Cours.code.like(f"{prefix}%"))
  ).scalars().all()
  return _next_sequence(codes, prefix, 3)
