from datetime import date

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import StatutEvaluation, TypeEvaluation


class EvaluationEnseignantCreate(BaseModel):
  libelle: str = Field(max_length=150)
  type_evaluation: TypeEvaluation
  cote_maximale: float = Field(default=20.0, gt=0)
  date_evaluation: date
  cours_id: int


class EvaluationEnseignantUpdate(BaseModel):
  libelle: str | None = Field(default=None, max_length=150)
  type_evaluation: TypeEvaluation | None = None
  cote_maximale: float | None = Field(default=None, gt=0)
  date_evaluation: date | None = None


class EvaluationCreate(BaseModel):
  libelle: str = Field(max_length=150)
  type_evaluation: TypeEvaluation
  cote_maximale: float = 20.0
  date_evaluation: date
  cours_id: int
  enseignant_id: int
  annee_academique_id: int
  statut: StatutEvaluation = StatutEvaluation.brouillon


class EvaluationUpdate(BaseModel):
  libelle: str | None = Field(default=None, max_length=150)
  type_evaluation: TypeEvaluation | None = None
  cote_maximale: float | None = None
  date_evaluation: date | None = None
  cours_id: int | None = None
  enseignant_id: int | None = None
  annee_academique_id: int | None = None
  statut: StatutEvaluation | None = None


class EvaluationResponse(BaseModel):
  model_config = ConfigDict(from_attributes=True)

  id: int
  libelle: str
  type_evaluation: TypeEvaluation
  cote_maximale: float
  date_evaluation: date
  cours_id: int
  enseignant_id: int
  annee_academique_id: int
  statut: StatutEvaluation
