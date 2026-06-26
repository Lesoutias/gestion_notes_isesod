from sqlalchemy.orm import Session

from app.models import Cours, Departement, Etudiant, Faculte, Note


def seed_database(db: Session) -> None:
  if db.query(Faculte).first():
    return

  faculte_sciences = Faculte(nom="Faculté des Sciences")
  faculte_droit = Faculte(nom="Faculté de Droit")
  db.add_all([faculte_sciences, faculte_droit])
  db.flush()

  dept_info = Departement(nom="Informatique", faculte_id=faculte_sciences.id)
  dept_math = Departement(nom="Mathématiques", faculte_id=faculte_sciences.id)
  dept_droit_prive = Departement(nom="Droit privé", faculte_id=faculte_droit.id)
  db.add_all([dept_info, dept_math, dept_droit_prive])
  db.flush()

  etudiants = [
    Etudiant(
      nom="Kabila",
      prenom="Marie",
      email="marie.kabila@univ.local",
      departement_id=dept_info.id,
    ),
    Etudiant(
      nom="Mukendi",
      prenom="Jean",
      email="jean.mukendi@univ.local",
      departement_id=dept_info.id,
    ),
    Etudiant(
      nom="Tshilombo",
      prenom="Grace",
      email="grace.tshilombo@univ.local",
      departement_id=dept_math.id,
    ),
  ]
  db.add_all(etudiants)
  db.flush()

  cours = [
    Cours(intitule="Introduction à la programmation", credits=4, departement_id=dept_info.id),
    Cours(intitule="Bases de données", credits=5, departement_id=dept_info.id),
    Cours(intitule="Algèbre linéaire", credits=4, departement_id=dept_math.id),
  ]
  db.add_all(cours)
  db.flush()

  notes = [
    Note(valeur=15.5, session="Session 1", etudiant_id=etudiants[0].id, cours_id=cours[0].id),
    Note(valeur=14.0, session="Session 1", etudiant_id=etudiants[0].id, cours_id=cours[1].id),
    Note(valeur=12.5, session="Session 1", etudiant_id=etudiants[1].id, cours_id=cours[0].id),
    Note(valeur=16.0, session="Session 1", etudiant_id=etudiants[2].id, cours_id=cours[2].id),
  ]
  db.add_all(notes)
  db.commit()
