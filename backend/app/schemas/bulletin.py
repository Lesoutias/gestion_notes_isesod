from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import StatutDocument


class BulletinCreate(BaseModel):
  etudiant_id: int
  annee_academique_id: int
  promotion_id: int
  fiche_synthetique_id: int
  moyenne_generale: float = 0.0
  total_credits: int = 0
  total_points_ponderes: float = 0.0
  statut: StatutDocument = StatutDocument.brouillon


class BulletinUpdate(BaseModel):
  moyenne_generale: float | None = None
  total_credits: int | None = None
  total_points_ponderes: float | None = None
  statut: StatutDocument | None = None


class BulletinResponse(BaseModel):
  model_config = ConfigDict(from_attributes=True)

  id: int
  etudiant_id: int
  annee_academique_id: int
  promotion_id: int
  fiche_synthetique_id: int
  moyenne_generale: float
  total_credits: int
  total_points_ponderes: float
  statut: StatutDocument
  date_generation: datetime
  rang: int | None = None


class BulletinLigneCreate(BaseModel):
  bulletin_id: int
  cours_id: int
  intitule: str = Field(max_length=150)
  moyenne_finale: float
  credits: int = Field(ge=0)
  points_ponderes: float


class BulletinLigneUpdate(BaseModel):
  intitule: str | None = Field(default=None, max_length=150)
  moyenne_finale: float | None = None
  credits: int | None = Field(default=None, ge=0)
  points_ponderes: float | None = None


class BulletinLigneResponse(BaseModel):
  model_config = ConfigDict(from_attributes=True)

  id: int
  bulletin_id: int
  cours_id: int
  intitule: str
  moyenne_finale: float
  credits: int
  points_ponderes: float


class BulletinGenerate(BaseModel):
  etudiant_id: int
  annee_academique_id: int
  fiche_synthetique_id: int


class BulletinGenerateResponse(BaseModel):
  model_config = ConfigDict(from_attributes=True)

  id: int
  etudiant_id: int
  annee_academique_id: int
  promotion_id: int
  fiche_synthetique_id: int
  moyenne_generale: float
  total_credits: int
  total_points_ponderes: float
  statut: StatutDocument
  date_generation: datetime
  rang: int | None = None
  lignes: list[BulletinLigneResponse] = []
