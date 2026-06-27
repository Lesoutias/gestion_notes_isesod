from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import StatutUser
from app.schemas.academic import EnseignantCreate, EnseignantResponse, EtudiantCreate, EtudiantResponse
from app.schemas.common import InstitutionalEmail


# --- Permission ---

class PermissionCreate(BaseModel):
  code: str = Field(max_length=80)
  libelle: str = Field(max_length=150)
  module: str = Field(max_length=50)
  description: str | None = None


class PermissionUpdate(BaseModel):
  code: str | None = Field(default=None, max_length=80)
  libelle: str | None = Field(default=None, max_length=150)
  module: str | None = Field(default=None, max_length=50)
  description: str | None = None


class PermissionResponse(BaseModel):
  model_config = ConfigDict(from_attributes=True)

  id: int
  code: str
  libelle: str
  module: str
  description: str | None


# --- Role ---

class RoleCreate(BaseModel):
  nom: str = Field(max_length=50)
  description: str | None = None


class RoleUpdate(BaseModel):
  nom: str | None = Field(default=None, max_length=50)
  description: str | None = None


class RolePermissionAssign(BaseModel):
  permission_ids: list[int] = Field(min_length=1)


class RoleResponse(BaseModel):
  model_config = ConfigDict(from_attributes=True)

  id: int
  nom: str
  description: str | None
  permissions: list[PermissionResponse] = []


# --- User ---

class UserCreate(BaseModel):
  login: str = Field(max_length=50)
  email: InstitutionalEmail | None = None
  mot_de_passe: str = Field(min_length=8)
  role_id: int
  etudiant_id: int | None = None
  enseignant_id: int | None = None
  statut: StatutUser = StatutUser.actif


class UserUpdate(BaseModel):
  login: str | None = Field(default=None, max_length=50)
  email: InstitutionalEmail | None = None
  mot_de_passe: str | None = Field(default=None, min_length=8)
  role_id: int | None = None
  etudiant_id: int | None = None
  enseignant_id: int | None = None
  statut: StatutUser | None = None


class UserResponse(BaseModel):
  model_config = ConfigDict(from_attributes=True)

  id: int
  login: str
  email: str | None
  role_id: int
  statut: StatutUser
  etudiant_id: int | None
  enseignant_id: int | None
  created_at: datetime
  role: RoleResponse | None = None


class EtudiantAccountCreate(EtudiantCreate):
  mot_de_passe: str = Field(min_length=8)


class EnseignantAccountCreate(EnseignantCreate):
  mot_de_passe: str = Field(min_length=8)


# --- Auth ---

class LoginRequest(BaseModel):
  identifiant: str
  mot_de_passe: str


class MatriculeVerifyRequest(BaseModel):
  matricule: str = Field(max_length=30)


class MatriculeVerifyResponse(BaseModel):
  matricule: str
  nom: str
  prenom: str
  eligible: bool = True


class EtudiantRegisterRequest(BaseModel):
  matricule: str = Field(max_length=30)
  login: str = Field(max_length=50)
  email: InstitutionalEmail
  mot_de_passe: str = Field(min_length=8)


class EnseignantRegisterRequest(BaseModel):
  matricule: str = Field(max_length=30)
  login: str = Field(max_length=50)
  email: InstitutionalEmail
  mot_de_passe: str = Field(min_length=8)


class AuthUserResponse(BaseModel):
  model_config = ConfigDict(from_attributes=True)

  id: int
  login: str
  email: str | None
  statut: StatutUser
  role_id: int
  etudiant_id: int | None
  enseignant_id: int | None
  created_at: datetime
  role: RoleResponse | None = None
  permissions: list[str] = []


class LoginResponse(BaseModel):
  access_token: str
  token_type: str = "bearer"
  user: AuthUserResponse
  role: RoleResponse
  etudiant: EtudiantResponse | None = None
  enseignant: EnseignantResponse | None = None
  permissions: list[str] = []


class MeResponse(BaseModel):
  user: AuthUserResponse
  role: RoleResponse
  etudiant: EtudiantResponse | None = None
  enseignant: EnseignantResponse | None = None
  permissions: list[str] = []


class TokenResponse(BaseModel):
  access_token: str
  token_type: str = "bearer"
  permissions: list[str] = []
