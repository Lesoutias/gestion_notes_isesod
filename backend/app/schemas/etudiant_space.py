from datetime import date

from pydantic import BaseModel, Field

from app.models.enums import StatutEvaluation, TypeEvaluation
from app.schemas.academic import (
  AnneeAcademiqueResponse,
  EtudiantResponse,
  FiliereResponse,
  PromotionResponse,
)
from app.schemas.releve import ReleveCotesResponse


class EtudiantDashboardResponse(BaseModel):
  etudiant: EtudiantResponse
  promotion: PromotionResponse
  filiere: FiliereResponse
  annee_academique: AnneeAcademiqueResponse
  releves: list[ReleveCotesResponse] = Field(default_factory=list)


class CoursEvaluationsBrief(BaseModel):
  id: int
  intitule: str
  semestre: str | None = None
  credits: int
  moyenne_sur_20: float
  points_ponderes: float
  points_max_ponderes: float


class EvaluationEtudiantItem(BaseModel):
  id: int
  libelle: str
  type_evaluation: TypeEvaluation
  cote_maximale: float
  date_evaluation: date
  statut: StatutEvaluation
  cote_obtenue: float | None = None
  pourcentage: float | None = None


class CoursEvaluationsResume(BaseModel):
  moyenne_sur_20: float
  points_ponderes: float
  points_max_ponderes: float
  credits: int
  cote_tj_sur_10: float
  cote_examen_sur_10: float
  appreciation: str


class EtudiantEvaluationsResponse(BaseModel):
  cours: list[CoursEvaluationsBrief] = Field(default_factory=list)
  cours_selectionne_id: int | None = None
  evaluations: list[EvaluationEtudiantItem] = Field(default_factory=list)
  resume: CoursEvaluationsResume | None = None
