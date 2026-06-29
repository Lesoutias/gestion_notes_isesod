"""Seed ISESOD — données initiales (idempotent)."""

from datetime import date

from sqlalchemy.orm import Session, joinedload

from app.core.security import hash_password
from app.models import (
  AnneeAcademique,
  Cours,
  Cycle,
  Departement,
  Faculte,
  Filiere,
  Permission,
  Promotion,
  Role,
  RoleNom,
  StatutAnneeAcademique,
  StatutUser,
  User,
)

DEFAULT_VOLUME_HORAIRE = 45
POINTS_MAX_COURS = 20.0

ADMIN_LOGIN = "admin"
ADMIN_EMAIL = "admin@isesod.local"
ADMIN_PASSWORD = "admin123"

FACULTE_NOM = "Institut Supérieur d'Etudes Sociales et de l'Organisation du Développement"
DEPARTEMENT_NOM = "Direction Académique ISESOD"
ANNEE_LIBELLE = "2025-2026"

CYCLES_DATA = [
  {"nom": "Licence", "duree_annees": 3},
  {"nom": "Master", "duree_annees": 2},
]

LICENCE_FILIERES = [
  ("Réseau Informatique et Télécommunication", "RIT"),
  ("Logistique et Transport", "LT"),
  ("Gestion des Projets de Développement", "GPD"),
  ("Gestion des Microentreprises", "GME"),
  ("Communication et Résolution de Conflits", "CRC"),
  ("Gestion de l'Environnement", "GE"),
]

MASTER_FILIERES = [
  ("Réseaux Informatique", "RI"),
  ("Télécommunication", "TEL"),
  ("Génie Logiciel", "GL"),
  ("Gestion des Projets de Développement", "MGPD"),
  ("Étude du Genre", "EG"),
  ("Communication et Résolution des Conflits", "MCRC"),
  ("Gestion des Microentreprises", "MGME"),
]

LICENCE_PROMOTIONS = [("L1", 1), ("L2", 2), ("L3", 3)]
MASTER_PROMOTIONS = [("M1", 1), ("M2", 2)]

RIT_COURS: dict[str, list[str]] = {
  "L1": [
    "Algorithmes",
    "Mathématiques financières",
    "Programmation C++",
    "Programmation Web",
    "Statistiques",
    "Initiation au réseau informatique",
    "Électricité",
    "Électronique",
    "Initiation à la télécommunication",
    "Français",
    "Anglais",
  ],
  "L2": [
    "PHP",
    "Antenne et propagation du signal",
    "Maintenance de site et de télécommunications",
    "JavaScript",
    "Base de données avec SQL",
    "Gestion de stock",
  ],
  "L3": [
    "Administration et sécurité réseau",
    "Protocole et interconnexion réseau",
    "Transmission par faisceau hertzien",
    "Transmission par VSAT",
    "Transmission par fibre optique",
    "Gestion des ressources humaines",
    "Radio et système radar",
    "Techniques de communication",
    "Entrepreneuriat",
    "Génie logiciel",
  ],
}

PERMISSIONS_DATA: list[dict[str, str | None]] = [
  {"code": "cycles.read", "libelle": "Consulter les cycles", "module": "academic"},
  {"code": "cycles.manage", "libelle": "Gérer les cycles", "module": "academic"},
  {"code": "filieres.read", "libelle": "Consulter les filières", "module": "academic"},
  {"code": "filieres.manage", "libelle": "Gérer les filières", "module": "academic"},
  {"code": "promotions.read", "libelle": "Consulter les promotions", "module": "academic"},
  {"code": "promotions.manage", "libelle": "Gérer les promotions", "module": "academic"},
  {"code": "annees_academiques.read", "libelle": "Consulter les années académiques", "module": "academic"},
  {"code": "annees_academiques.manage", "libelle": "Gérer les années académiques", "module": "academic"},
  {"code": "etudiants.read", "libelle": "Consulter les étudiants", "module": "academic"},
  {"code": "etudiants.manage", "libelle": "Gérer les étudiants", "module": "academic"},
  {"code": "enseignants.read", "libelle": "Consulter les enseignants", "module": "academic"},
  {"code": "enseignants.manage", "libelle": "Gérer les enseignants", "module": "academic"},
  {"code": "cours.read", "libelle": "Consulter les cours", "module": "academic"},
  {"code": "cours.manage", "libelle": "Gérer les cours", "module": "academic"},
  {"code": "evaluations.read", "libelle": "Consulter les évaluations", "module": "evaluations"},
  {"code": "evaluations.create", "libelle": "Créer des évaluations", "module": "evaluations"},
  {"code": "evaluations.update", "libelle": "Modifier des évaluations", "module": "evaluations"},
  {"code": "notes.read", "libelle": "Consulter les notes", "module": "notes"},
  {"code": "notes.create", "libelle": "Encoder des notes", "module": "notes"},
  {"code": "notes.update", "libelle": "Modifier des notes", "module": "notes"},
  {"code": "notes.bulk_create", "libelle": "Encoder des notes en lot", "module": "notes"},
  {"code": "cahier.read", "libelle": "Consulter les cahiers de cotes", "module": "cahier"},
  {"code": "cahier.generate", "libelle": "Générer un cahier de cotes", "module": "cahier"},
  {"code": "cahier.validate", "libelle": "Valider un cahier de cotes", "module": "cahier"},
  {"code": "fiche.read", "libelle": "Consulter les fiches synthétiques", "module": "fiche"},
  {"code": "fiche.validate", "libelle": "Valider une fiche synthétique", "module": "fiche"},
  {"code": "bulletin.read", "libelle": "Consulter les bulletins", "module": "bulletin"},
  {"code": "bulletin.generate", "libelle": "Générer un bulletin", "module": "bulletin"},
  {"code": "users.manage", "libelle": "Gérer les utilisateurs", "module": "users"},
  {"code": "roles.manage", "libelle": "Gérer les rôles", "module": "users"},
  {"code": "permissions.manage", "libelle": "Gérer les permissions", "module": "users"},
]

ENSEIGNANT_PERMISSION_CODES = {
  "evaluations.read",
  "evaluations.create",
  "evaluations.update",
  "notes.read",
  "notes.create",
  "notes.update",
  "notes.bulk_create",
  "cahier.read",
  "cahier.generate",
  "cahier.validate",
  "fiche.read",
  "fiche.validate",
  "cours.read",
  "etudiants.read",
}

ETUDIANT_PERMISSION_CODES = {
  "notes.read",
  "bulletin.read",
}

ROLES_DATA = [
  (RoleNom.admin, "Administrateur", "Administrateur système — accès complet"),
  (RoleNom.enseignant, "Enseignant", "Enseignant — notes, évaluations, cahiers et fiches"),
  (RoleNom.etudiant, "Étudiant", "Étudiant — consultation des notes et bulletins personnels"),
]


def _get_or_create_cycle(db: Session, nom: str, duree_annees: int) -> Cycle:
  cycle = db.query(Cycle).filter_by(nom=nom).first()
  if cycle:
    return cycle
  cycle = Cycle(nom=nom, duree_annees=duree_annees)
  db.add(cycle)
  db.flush()
  return cycle


def _get_or_create_faculte(db: Session, nom: str) -> Faculte:
  faculte = db.query(Faculte).filter_by(nom=nom).first()
  if faculte:
    return faculte
  faculte = Faculte(nom=nom)
  db.add(faculte)
  db.flush()
  return faculte


def _get_or_create_departement(db: Session, nom: str, faculte_id: int) -> Departement:
  departement = (
    db.query(Departement)
    .filter_by(nom=nom, faculte_id=faculte_id)
    .first()
  )
  if departement:
    return departement
  departement = Departement(nom=nom, faculte_id=faculte_id)
  db.add(departement)
  db.flush()
  return departement


def _get_or_create_filiere(
  db: Session,
  nom: str,
  sigle: str,
  cycle_id: int,
  departement_id: int,
) -> Filiere:
  filiere = db.query(Filiere).filter_by(sigle=sigle).first()
  if filiere:
    return filiere
  filiere = Filiere(
    nom=nom,
    sigle=sigle,
    cycle_id=cycle_id,
    departement_id=departement_id,
  )
  db.add(filiere)
  db.flush()
  return filiere


def _get_or_create_promotion(
  db: Session,
  nom: str,
  niveau: int,
  cycle_id: int,
  filiere_id: int,
) -> Promotion:
  promotion = (
    db.query(Promotion)
    .filter_by(nom=nom, filiere_id=filiere_id)
    .first()
  )
  if promotion:
    return promotion
  promotion = Promotion(
    nom=nom,
    niveau=niveau,
    cycle_id=cycle_id,
    filiere_id=filiere_id,
  )
  db.add(promotion)
  db.flush()
  return promotion


def _get_or_create_annee_academique(db: Session) -> AnneeAcademique:
  from app.services.academic import activate_annee_academique

  annee = db.query(AnneeAcademique).filter_by(libelle=ANNEE_LIBELLE).first()
  if annee:
    if annee.statut != StatutAnneeAcademique.active:
      return activate_annee_academique(db, annee)
    return annee

  annee = AnneeAcademique(
    libelle=ANNEE_LIBELLE,
    date_debut=date(2025, 9, 1),
    date_fin=date(2026, 8, 31),
    statut=StatutAnneeAcademique.active,
  )
  db.add(annee)
  db.flush()
  return activate_annee_academique(db, annee)


def _get_or_create_cours(
  db: Session,
  intitule: str,
  promotion_id: int,
  volume_horaire: int = DEFAULT_VOLUME_HORAIRE,
  semestre: str | None = None,
) -> Cours | None:
  existing = (
    db.query(Cours)
    .filter_by(intitule=intitule, promotion_id=promotion_id)
    .first()
  )
  if existing:
    return existing

  cours = Cours(
    intitule=intitule,
    volume_horaire=volume_horaire,
    promotion_id=promotion_id,
    points_max=POINTS_MAX_COURS,
    semestre=semestre,
    type_cours="Cours magistral",
  )
  db.add(cours)
  db.flush()
  return cours


def _seed_permissions_and_roles(db: Session) -> None:
  permissions_by_code: dict[str, Permission] = {
    p.code: p for p in db.query(Permission).all()
  }

  for data in PERMISSIONS_DATA:
    if data["code"] not in permissions_by_code:
      permission = Permission(
        code=data["code"],
        libelle=data["libelle"],
        module=data["module"],
        description=data.get("description"),
      )
      db.add(permission)
      db.flush()
      permissions_by_code[permission.code] = permission

  for role_nom, _label, description in ROLES_DATA:
    role = db.query(Role).filter_by(nom=role_nom.value).first()
    if not role:
      role = Role(nom=role_nom.value, description=description)
      db.add(role)
      db.flush()

    if role_nom == RoleNom.admin:
      role.permissions = list(permissions_by_code.values())
    elif role_nom == RoleNom.enseignant:
      role.permissions = [
        permissions_by_code[code]
        for code in ENSEIGNANT_PERMISSION_CODES
        if code in permissions_by_code
      ]
    elif role_nom == RoleNom.etudiant:
      role.permissions = [
        permissions_by_code[code]
        for code in ETUDIANT_PERMISSION_CODES
        if code in permissions_by_code
      ]

  db.flush()


def _seed_admin_user(db: Session) -> None:
  if db.query(User).filter_by(login=ADMIN_LOGIN).first():
    return

  role_admin = db.query(Role).filter_by(nom=RoleNom.admin.value).first()
  if not role_admin:
    return

  user = User(
    login=ADMIN_LOGIN,
    email=ADMIN_EMAIL,
    mot_de_passe_hash=hash_password(ADMIN_PASSWORD),
    role_id=role_admin.id,
    statut=StatutUser.actif,
  )
  db.add(user)
  db.flush()


def _seed_filieres_and_promotions(
  db: Session,
  cycle_licence: Cycle,
  cycle_master: Cycle,
  departement_id: int,
) -> dict[str, Promotion]:
  promotions_by_key: dict[str, Promotion] = {}

  for nom, sigle in LICENCE_FILIERES:
    filiere = _get_or_create_filiere(
      db, nom, sigle, cycle_licence.id, departement_id
    )
    for promo_nom, niveau in LICENCE_PROMOTIONS:
      promotion = _get_or_create_promotion(
        db, promo_nom, niveau, cycle_licence.id, filiere.id
      )
      promotions_by_key[f"{sigle}-{promo_nom}"] = promotion

  for nom, sigle in MASTER_FILIERES:
    filiere = _get_or_create_filiere(
      db, nom, sigle, cycle_master.id, departement_id
    )
    for promo_nom, niveau in MASTER_PROMOTIONS:
      promotion = _get_or_create_promotion(
        db, promo_nom, niveau, cycle_master.id, filiere.id
      )
      promotions_by_key[f"{sigle}-{promo_nom}"] = promotion

  return promotions_by_key


def _seed_rit_cours(db: Session, promotions_by_key: dict[str, Promotion]) -> None:
  semestre_by_promo = {"L1": "S1", "L2": "S2", "L3": "S3"}
  for promo_nom, intitules in RIT_COURS.items():
    promotion = promotions_by_key.get(f"RIT-{promo_nom}")
    if not promotion:
      continue
    for intitule in intitules:
      _get_or_create_cours(
        db,
        intitule=intitule,
        promotion_id=promotion.id,
        semestre=semestre_by_promo.get(promo_nom),
      )


def _seed_academic_structure(db: Session) -> None:
  faculte = _get_or_create_faculte(db, FACULTE_NOM)
  departement = _get_or_create_departement(db, DEPARTEMENT_NOM, faculte.id)

  cycles: dict[str, Cycle] = {}
  for data in CYCLES_DATA:
    cycles[data["nom"]] = _get_or_create_cycle(db, data["nom"], data["duree_annees"])

  _get_or_create_annee_academique(db)
  promotions_by_key = _seed_filieres_and_promotions(
    db, cycles["Licence"], cycles["Master"], departement.id
  )
  _seed_rit_cours(db, promotions_by_key)


def seed_database(db: Session) -> None:
  _seed_permissions_and_roles(db)
  _seed_academic_structure(db)
  _seed_admin_user(db)
  db.commit()


def get_seed_status(db: Session) -> dict:
  """Compteurs pour vérifier le seed (sans données sensibles)."""
  rit_promo_ids = [
    p.id
    for p in db.query(Promotion)
    .join(Filiere, Promotion.filiere_id == Filiere.id)
    .filter(Filiere.sigle == "RIT")
    .all()
  ]
  cours_rit = (
    db.query(Cours).filter(Cours.promotion_id.in_(rit_promo_ids)).count()
    if rit_promo_ids
    else 0
  )
  admin = (
    db.query(User)
    .options(joinedload(User.role))
    .filter_by(login=ADMIN_LOGIN)
    .first()
  )

  return {
    "cycles": db.query(Cycle).count(),
    "filieres": db.query(Filiere).count(),
    "promotions": db.query(Promotion).count(),
    "cours_total": db.query(Cours).count(),
    "cours_rit": cours_rit,
    "roles": db.query(Role).count(),
    "permissions": db.query(Permission).count(),
    "admin_user": {
      "exists": admin is not None,
      "login": admin.login if admin else None,
      "email": admin.email if admin else None,
      "role": admin.role.nom if admin and admin.role else None,
    },
  }
