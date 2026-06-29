from datetime import date, datetime

from pydantic import BaseModel, ConfigDict
from app.models.enums import StatutDocument


class CahierGenererRequest(BaseModel):
  cours_id: int
  annee_academique_id: int | None = None


class EtudiantBriefResponse(BaseModel):
  model_config = ConfigDict(from_attributes=True)

  id: int
  matricule: str | None
  nom: str
  postnom: str
  prenom: str


class CahierEvaluationTjBrief(BaseModel):
  model_config = ConfigDict(from_attributes=True)

  id: int
  libelle: str
  cote_maximale: float
  date_evaluation: date


class CahierLigneTjDetail(BaseModel):
  evaluation_id: int
  libelle: str
  cote_obtenue: float
  cote_maximale: float


class CahierCotesLigneResponse(BaseModel):
  model_config = ConfigDict(from_attributes=True)

  id: int
  cahier_cotes_id: int
  etudiant_id: int
  moyenne_tj: float
  moyenne_examen: float
  cote_tj_sur_10: float
  cote_examen_sur_10: float
  cote_finale_sur_20: float
  moyenne_finale: float | None
  credits: int
  points_ponderes: float
  points_max_ponderes: float
  appreciation: str | None
  points_tj_obtenus: float | None = None
  points_tj_max: float | None = None
  points_examen_obtenus: float | None = None
  points_examen_max: float | None = None
  details_tj: list[CahierLigneTjDetail] = []
  etudiant: EtudiantBriefResponse | None = None


class CahierCotesResponse(BaseModel):
  model_config = ConfigDict(from_attributes=True)

  id: int
  cours_id: int
  enseignant_id: int
  annee_academique_id: int
  promotion_id: int
  statut: StatutDocument
  date_generation: datetime
  date_validation: datetime | None = None


class CahierCotesDetailResponse(CahierCotesResponse):
  evaluations_tj: list[CahierEvaluationTjBrief] = []
  lignes: list[CahierCotesLigneResponse] = []

class CahierCotesCreate(BaseModel):
  cours_id: int
  annee_academique_id: int
  promotion_id: int
  statut: StatutDocument = StatutDocument.brouillon


class CahierCotesUpdate(BaseModel):
  cours_id: int | None = None
  annee_academique_id: int | None = None
  promotion_id: int | None = None
  statut: StatutDocument | None = None


class CahierCotesLigneCreate(BaseModel):
  cahier_cotes_id: int
  etudiant_id: int
  moyenne_tj: float | None = None
  moyenne_examen: float | None = None
  moyenne_finale: float | None = None


class CahierCotesLigneUpdate(BaseModel):
  moyenne_tj: float | None = None
  moyenne_examen: float | None = None
  moyenne_finale: float | None = None


class CahierCotesGenerate(BaseModel):
  cours_id: int
  annee_academique_id: int


class CahierCotesValidate(BaseModel):
  cahier_cotes_id: int


class CahierCotesGenerateResponse(BaseModel):
  model_config = ConfigDict(from_attributes=True)

  id: int
  cours_id: int
  enseignant_id: int
  annee_academique_id: int
  promotion_id: int
  statut: StatutDocument
  date_generation: datetime
  date_validation: datetime | None = None
  evaluations_tj: list[CahierEvaluationTjBrief] = []
  lignes: list[CahierCotesLigneResponse] = []
  created: bool = True
