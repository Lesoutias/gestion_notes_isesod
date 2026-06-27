import enum


class StatutAnneeAcademique(str, enum.Enum):
  active = "active"
  cloturee = "cloturee"


class Sexe(str, enum.Enum):
  M = "M"
  F = "F"


class StatutEtudiant(str, enum.Enum):
  actif = "actif"
  suspendu = "suspendu"
  termine = "termine"


class StatutEnseignant(str, enum.Enum):
  actif = "actif"
  inactif = "inactif"


class TypeEvaluation(str, enum.Enum):
  TJ = "TJ"
  EXAMEN = "EXAMEN"


class StatutEvaluation(str, enum.Enum):
  brouillon = "brouillon"
  publiee = "publiee"
  cloturee = "cloturee"


class StatutDocument(str, enum.Enum):
  brouillon = "brouillon"
  valide = "valide"
  archive = "archive"


class StatutFicheSynthetique(str, enum.Enum):
  en_attente = "en_attente"
  complete = "complete"
  validee = "validee"


class StatutReleveCotes(str, enum.Enum):
  genere = "genere"
  publie = "publie"


class RoleNom(str, enum.Enum):
  admin = "admin"
  enseignant = "enseignant"
  etudiant = "etudiant"


class StatutUser(str, enum.Enum):
  actif = "actif"
  inactif = "inactif"
