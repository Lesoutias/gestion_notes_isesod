from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import StatutFicheSynthetique


class PromotionBriefResponse(BaseModel):
  model_config = ConfigDict(from_attributes=True)

  id: int
  nom: str


class AnneeAcademiqueBriefResponse(BaseModel):
  model_config = ConfigDict(from_attributes=True)

  id: int
  libelle: str


class EtudiantFicheBriefResponse(BaseModel):
  model_config = ConfigDict(from_attributes=True)

  id: int
  matricule: str | None
  nom: str
  postnom: str
  prenom: str


class CoursFicheBriefResponse(BaseModel):
  model_config = ConfigDict(from_attributes=True)

  id: int
  intitule: str
  credits: int


class FicheSynthetiqueResponse(BaseModel):
  model_config = ConfigDict(from_attributes=True)

  id: int
  promotion_id: int
  annee_academique_id: int
  statut: StatutFicheSynthetique
  total_cours_attendus: int
  total_cours_recus: int
  date_creation: datetime
  date_validation: datetime | None = None


class FicheSynthetiqueLigneResponse(BaseModel):
  model_config = ConfigDict(from_attributes=True)

  id: int
  fiche_synthetique_id: int
  etudiant_id: int
  cours_id: int
  enseignant_id: int
  credits: int
  cote_finale_sur_20: float
  moyenne_finale: float
  points_ponderes: float
  points_max_ponderes: float
  appreciation: str | None = None
  etudiant: EtudiantFicheBriefResponse | None = None
  cours: CoursFicheBriefResponse | None = None


class FicheSynthetiqueDetailResponse(FicheSynthetiqueResponse):
  promotion: PromotionBriefResponse | None = None
  annee_academique: AnneeAcademiqueBriefResponse | None = None
  lignes: list[FicheSynthetiqueLigneResponse] = Field(default_factory=list)
