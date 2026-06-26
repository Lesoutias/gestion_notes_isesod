from datetime import datetime

from sqlalchemy import select
from sqlalchemy.engine import Connection

from app.models.entities import Cours, Departement, Etudiant, Faculte


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


def generate_cours_code(connection: Connection, departement_id: int) -> str:
  departement_code = connection.execute(
    select(Departement.code).where(Departement.id == departement_id)
  ).scalar_one()
  codes = connection.execute(
    select(Cours.code).where(Cours.departement_id == departement_id)
  ).scalars().all()
  prefix = f"{departement_code}-CRS-"
  return _next_sequence(codes, prefix, 3)
