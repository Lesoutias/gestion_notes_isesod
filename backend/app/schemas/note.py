from pydantic import BaseModel, ConfigDict, Field, computed_field


class NoteEnseignantCreate(BaseModel):
  etudiant_id: int
  cote_obtenue: float = Field(ge=0)


class NoteEnseignantBulkItem(BaseModel):
  etudiant_id: int
  cote_obtenue: float = Field(ge=0)


class NoteEnseignantBulkCreate(BaseModel):
  notes: list[NoteEnseignantBulkItem] = Field(min_length=1)


class NoteCreate(BaseModel):
  evaluation_id: int
  etudiant_id: int
  cote_obtenue: float = Field(ge=0)


class NoteUpdate(BaseModel):
  cote_obtenue: float | None = Field(default=None, ge=0)


class NoteResponse(BaseModel):
  model_config = ConfigDict(from_attributes=True)

  id: int
  evaluation_id: int
  etudiant_id: int
  cote_obtenue: float
  moyenne_obtenue: float

  @computed_field
  @property
  def pourcentage(self) -> float:
    return self.moyenne_obtenue


class NoteBulkItem(BaseModel):
  evaluation_id: int
  etudiant_id: int
  cote_obtenue: float = Field(ge=0)


class NoteBulkCreate(BaseModel):
  notes: list[NoteBulkItem] = Field(min_length=1)


class NoteBulkResponse(BaseModel):
  created: list[NoteResponse]
  errors: list[str] = []
