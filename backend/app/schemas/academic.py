from datetime import date

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.enums import (
  Sexe,
  StatutAnneeAcademique,
  StatutEnseignant,
  StatutEtudiant,
)


# --- Cycle ---

class CycleCreate(BaseModel):
  nom: str = Field(max_length=50)
  duree_annees: int = Field(ge=1)


class CycleUpdate(BaseModel):
  nom: str | None = Field(default=None, max_length=50)
  duree_annees: int | None = Field(default=None, ge=1)


class CycleResponse(BaseModel):
  model_config = ConfigDict(from_attributes=True)

  id: int
  nom: str
  duree_annees: int


# --- Filiere ---

class FiliereCreate(BaseModel):
  nom: str = Field(max_length=120)
  sigle: str = Field(max_length=10)
  cycle_id: int
  departement_id: int
  description: str | None = None


class FiliereUpdate(BaseModel):
  nom: str | None = Field(default=None, max_length=120)
  sigle: str | None = Field(default=None, max_length=10)
  cycle_id: int | None = None
  departement_id: int | None = None
  description: str | None = None


class FiliereResponse(BaseModel):
  model_config = ConfigDict(from_attributes=True)

  id: int
  nom: str
  sigle: str
  cycle_id: int
  departement_id: int
  description: str | None


# --- Promotion ---

class PromotionCreate(BaseModel):
  nom: str = Field(max_length=10)
  niveau: int = Field(ge=1)
  cycle_id: int
  filiere_id: int


class PromotionUpdate(BaseModel):
  nom: str | None = Field(default=None, max_length=10)
  niveau: int | None = Field(default=None, ge=1)
  cycle_id: int | None = None
  filiere_id: int | None = None


class PromotionResponse(BaseModel):
  model_config = ConfigDict(from_attributes=True)

  id: int
  nom: str
  niveau: int
  cycle_id: int
  filiere_id: int


# --- AnneeAcademique ---

class AnneeAcademiqueCreate(BaseModel):
  libelle: str = Field(max_length=20)
  date_debut: date
  date_fin: date
  statut: StatutAnneeAcademique = StatutAnneeAcademique.cloturee


class AnneeAcademiqueUpdate(BaseModel):
  libelle: str | None = Field(default=None, max_length=20)
  date_debut: date | None = None
  date_fin: date | None = None
  statut: StatutAnneeAcademique | None = None


class AnneeAcademiqueResponse(BaseModel):
  model_config = ConfigDict(from_attributes=True)

  id: int
  libelle: str
  date_debut: date
  date_fin: date
  statut: StatutAnneeAcademique


# --- Etudiant ---

class EtudiantAdminCreate(BaseModel):
  """Création admin : promotion obligatoire, année active assignée automatiquement."""
  nom: str = Field(max_length=80)
  postnom: str = Field(max_length=80)
  prenom: str = Field(max_length=80)
  sexe: Sexe
  email: EmailStr | None = None
  telephone: str | None = Field(default=None, max_length=30)
  promotion_id: int
  statut: StatutEtudiant = StatutEtudiant.actif


class EtudiantCreate(BaseModel):
  nom: str = Field(max_length=80)
  postnom: str = Field(max_length=80)
  prenom: str = Field(max_length=80)
  sexe: Sexe
  email: EmailStr | None = None
  telephone: str | None = Field(default=None, max_length=30)
  promotion_id: int
  annee_academique_id: int
  statut: StatutEtudiant = StatutEtudiant.actif


class EtudiantUpdate(BaseModel):
  nom: str | None = Field(default=None, max_length=80)
  postnom: str | None = Field(default=None, max_length=80)
  prenom: str | None = Field(default=None, max_length=80)
  sexe: Sexe | None = None
  email: EmailStr | None = None
  telephone: str | None = Field(default=None, max_length=30)
  promotion_id: int | None = None
  annee_academique_id: int | None = None
  statut: StatutEtudiant | None = None


class EtudiantResponse(BaseModel):
  model_config = ConfigDict(from_attributes=True)

  id: int
  matricule: str | None
  nom: str
  postnom: str
  prenom: str
  sexe: Sexe
  email: str | None
  telephone: str | None
  promotion_id: int
  annee_academique_id: int
  user_id: int | None
  statut: StatutEtudiant


# --- Enseignant ---

class EnseignantCreate(BaseModel):
  nom: str = Field(max_length=80)
  postnom: str = Field(max_length=80)
  prenom: str = Field(max_length=80)
  sexe: Sexe
  email: EmailStr | None = None
  telephone: str | None = Field(default=None, max_length=30)
  statut: StatutEnseignant = StatutEnseignant.actif


class EnseignantUpdate(BaseModel):
  nom: str | None = Field(default=None, max_length=80)
  postnom: str | None = Field(default=None, max_length=80)
  prenom: str | None = Field(default=None, max_length=80)
  sexe: Sexe | None = None
  email: EmailStr | None = None
  telephone: str | None = Field(default=None, max_length=30)
  statut: StatutEnseignant | None = None


class EnseignantResponse(BaseModel):
  model_config = ConfigDict(from_attributes=True)

  id: int
  matricule: str | None
  nom: str
  postnom: str
  prenom: str
  sexe: Sexe
  email: str | None
  telephone: str | None
  user_id: int | None
  statut: StatutEnseignant


# --- Cours ---

class CoursAdminCreate(BaseModel):
  """Création admin : code et crédits générés automatiquement."""
  intitule: str = Field(max_length=150)
  volume_horaire: int = Field(ge=1)
  promotion_id: int
  semestre: str | None = Field(default=None, max_length=20)
  type_cours: str | None = Field(default=None, max_length=50)
  points_max: float = 20.0


class CoursCreate(BaseModel):
  intitule: str = Field(max_length=150)
  volume_horaire: int = Field(ge=1)
  promotion_id: int
  enseignant_id: int | None = None
  semestre: str | None = Field(default=None, max_length=20)
  type_cours: str | None = Field(default=None, max_length=50)
  points_max: float = 20.0


class CoursUpdate(BaseModel):
  intitule: str | None = Field(default=None, max_length=150)
  volume_horaire: int | None = Field(default=None, ge=1)
  promotion_id: int | None = None
  enseignant_id: int | None = None
  semestre: str | None = Field(default=None, max_length=20)
  type_cours: str | None = Field(default=None, max_length=50)
  points_max: float | None = None


class CoursResponse(BaseModel):
  model_config = ConfigDict(from_attributes=True)

  id: int
  code: str | None
  intitule: str
  volume_horaire: int
  credits: int
  points_max: float
  promotion_id: int
  enseignant_id: int | None
  semestre: str | None
  type_cours: str | None
