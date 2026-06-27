from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import StatutReleveCotes


class ReleveCotesLigneResponse(BaseModel):
  model_config = ConfigDict(from_attributes=True)

  id: int
  releve_id: int
  cours_id: int
  intitule_cours: str
  credits: int
  cote_sur_20: float
  points_ponderes: float
  points_max_ponderes: float
  appreciation: str | None = None


class ReleveCotesResponse(BaseModel):
  model_config = ConfigDict(from_attributes=True)

  id: int
  etudiant_id: int
  promotion_id: int
  annee_academique_id: int
  fiche_id: int
  total_points_obtenus: float
  total_points_max: float
  total_credits: int
  pourcentage: float
  mention: str
  decision: str
  rang: int
  statut: StatutReleveCotes
  date_generation: datetime


class ReleveCotesDetailResponse(ReleveCotesResponse):
  lignes: list[ReleveCotesLigneResponse] = Field(default_factory=list)


class ReleveCotesGenerateResponse(BaseModel):
  fiche_id: int
  total_generes: int
  releves: list[ReleveCotesDetailResponse]
