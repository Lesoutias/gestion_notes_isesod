from sqlalchemy import event

from app.core.generators import (
  generate_cours_code,
  generate_departement_code,
  generate_faculte_code,
  generate_matricule,
)
from app.models.entities import Cours, Departement, Etudiant, Faculte


@event.listens_for(Faculte, "before_insert")
def set_faculte_code(_mapper, connection, target):
  if not target.code:
    target.code = generate_faculte_code(connection)


@event.listens_for(Departement, "before_insert")
def set_departement_code(_mapper, connection, target):
  if not target.code:
    target.code = generate_departement_code(connection, target.faculte_id)


@event.listens_for(Etudiant, "before_insert")
def set_etudiant_matricule(_mapper, connection, target):
  if not target.matricule:
    target.matricule = generate_matricule(connection)


@event.listens_for(Cours, "before_insert")
def set_cours_code(_mapper, connection, target):
  if not target.code:
    target.code = generate_cours_code(connection, target.departement_id)
