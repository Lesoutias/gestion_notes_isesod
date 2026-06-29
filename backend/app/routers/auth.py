from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.security import create_access_token, get_access_token_lifetime, hash_password, verify_password
from app.models import Enseignant, Etudiant, Role, RoleNom, StatutUser, User
from app.schemas.academic import EnseignantResponse, EtudiantResponse
from app.schemas.user import (
  AuthUserResponse,
  EnseignantRegisterRequest,
  EtudiantRegisterRequest,
  LoginRequest,
  LoginResponse,
  MatriculeVerifyRequest,
  MatriculeVerifyResponse,
  MeResponse,
  RoleResponse,
)
from app.services.matricule import (
  etudiant_has_account,
  enseignant_has_account,
  find_enseignant_by_matricule,
  find_etudiant_by_matricule,
  get_enseignant_login,
  matricule_to_login,
  normalize_matricule,
)

router = APIRouter(prefix="/auth", tags=["Authentification"])


def _user_with_relations(db: Session, user_id: int) -> User | None:
  return (
    db.query(User)
    .options(
      joinedload(User.role).joinedload(Role.permissions),
      joinedload(User.etudiant),
      joinedload(User.enseignant),
    )
    .filter(User.id == user_id)
    .first()
  )


def _find_user_by_identifiant(db: Session, identifiant: str) -> User | None:
  user = db.query(User).filter(User.login == identifiant).first()
  if user:
    return _user_with_relations(db, user.id)

  user = db.query(User).filter(User.email == identifiant).first()
  if user:
    return _user_with_relations(db, user.id)

  etudiant = find_etudiant_by_matricule(db, identifiant)
  if etudiant and etudiant.user_id:
    return _user_with_relations(db, etudiant.user_id)

  enseignant = find_enseignant_by_matricule(db, identifiant)
  if enseignant and enseignant.user_id:
    return _user_with_relations(db, enseignant.user_id)

  return None


def _build_auth_user(user: User) -> AuthUserResponse:
  permissions = [p.code for p in user.role.permissions] if user.role else []
  return AuthUserResponse(
    id=user.id,
    login=user.login,
    email=user.email,
    statut=user.statut,
    role_id=user.role_id,
    etudiant_id=user.etudiant_id,
    enseignant_id=user.enseignant_id,
    created_at=user.created_at,
    role=RoleResponse.model_validate(user.role) if user.role else None,
    permissions=permissions,
  )


def _build_login_response(user: User) -> LoginResponse:
  access_token, expires_at = create_access_token(user.id, user.role.nom)
  return LoginResponse(
    access_token=access_token,
    token_type="bearer",
    expires_in=int(get_access_token_lifetime().total_seconds()),
    expires_at=expires_at,
    user=_build_auth_user(user),
    role=RoleResponse.model_validate(user.role),
    etudiant=EtudiantResponse.model_validate(user.etudiant) if user.etudiant else None,
    enseignant=EnseignantResponse.model_validate(user.enseignant) if user.enseignant else None,
    permissions=[p.code for p in user.role.permissions],
  )


def _get_role(db: Session, role_nom: RoleNom) -> Role:
  role = db.query(Role).filter(Role.nom == role_nom.value).first()
  if not role:
    raise HTTPException(
      status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
      detail=f"Rôle {role_nom.value} introuvable",
    )
  return role


def _ensure_login_available(db: Session, login: str) -> None:
  if db.query(User).filter(User.login == login).first():
    raise HTTPException(
      status_code=status.HTTP_409_CONFLICT,
      detail="Ce login est déjà utilisé",
    )


def _ensure_email_available(db: Session, email: str | None) -> None:
  if email and db.query(User).filter(User.email == email).first():
    raise HTTPException(
      status_code=status.HTTP_409_CONFLICT,
      detail="Cet email est déjà utilisé",
    )


def _resolve_account_credentials(payload, matricule: str) -> tuple[str, str]:
  login = payload.login or matricule_to_login(matricule)
  email = payload.email or f"{login}@isesod.local"
  return login, email


@router.post("/verify-matricule-etudiant", response_model=MatriculeVerifyResponse)
def verify_matricule_etudiant(
  payload: MatriculeVerifyRequest,
  db: Session = Depends(get_db),
):
  """
  Vérifie qu'un matricule existe en base et qu'aucun compte n'y est encore lié.
  À appeler avant l'inscription dans l'application mobile/web.
  """
  etudiant = find_etudiant_by_matricule(db, payload.matricule)
  if not etudiant:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail="Matricule introuvable. Vérifiez le numéro fourni par l'administration.",
    )

  if etudiant_has_account(db, etudiant):
    raise HTTPException(
      status_code=status.HTTP_409_CONFLICT,
      detail="Un compte existe déjà pour ce matricule",
    )

  return MatriculeVerifyResponse(
    matricule=etudiant.matricule or normalize_matricule(payload.matricule),
    nom=etudiant.nom,
    prenom=etudiant.prenom,
    eligible=True,
  )


@router.post("/verify-matricule-enseignant", response_model=MatriculeVerifyResponse)
def verify_matricule_enseignant(
  payload: MatriculeVerifyRequest,
  db: Session = Depends(get_db),
):
  enseignant = find_enseignant_by_matricule(db, payload.matricule)
  if not enseignant:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail="Matricule introuvable. Vérifiez le numéro fourni par l'administration.",
    )

  if enseignant_has_account(db, enseignant):
    login = get_enseignant_login(db, enseignant)
    detail = "Un compte existe déjà pour ce matricule."
    if login:
      detail += f" Connectez-vous avec l'identifiant « {login} » ou votre matricule."
    raise HTTPException(
      status_code=status.HTTP_409_CONFLICT,
      detail=detail,
    )

  return MatriculeVerifyResponse(
    matricule=enseignant.matricule or normalize_matricule(payload.matricule),
    nom=enseignant.nom,
    prenom=enseignant.prenom,
    eligible=True,
  )


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
  user = _find_user_by_identifiant(db, payload.identifiant)
  if not user or not verify_password(payload.mot_de_passe, user.mot_de_passe_hash):
    raise HTTPException(
      status_code=status.HTTP_401_UNAUTHORIZED,
      detail="Identifiant ou mot de passe incorrect",
      headers={"WWW-Authenticate": "Bearer"},
    )

  if user.statut != StatutUser.actif:
    raise HTTPException(
      status_code=status.HTTP_403_FORBIDDEN,
      detail="Compte inactif",
    )

  return _build_login_response(user)


def _build_me_response(user: User) -> MeResponse:
  return MeResponse(
    user=_build_auth_user(user),
    role=RoleResponse.model_validate(user.role),
    etudiant=EtudiantResponse.model_validate(user.etudiant) if user.etudiant else None,
    enseignant=EnseignantResponse.model_validate(user.enseignant) if user.enseignant else None,
    permissions=[p.code for p in user.role.permissions],
  )


@router.get("/me", response_model=MeResponse)
def me(current_user: User = Depends(get_current_user)):
  return _build_me_response(current_user)


@router.post(
  "/register-etudiant",
  response_model=LoginResponse,
  status_code=status.HTTP_201_CREATED,
)
def register_etudiant(
  payload: EtudiantRegisterRequest,
  db: Session = Depends(get_db),
):
  etudiant = find_etudiant_by_matricule(db, payload.matricule)
  if not etudiant:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail="Matricule introuvable. L'étudiant doit d'abord être enregistré par l'administration.",
    )

  if etudiant_has_account(db, etudiant):
    raise HTTPException(
      status_code=status.HTTP_409_CONFLICT,
      detail="Un compte existe déjà pour ce matricule",
    )

  login, email = _resolve_account_credentials(payload, etudiant.matricule or payload.matricule)
  _ensure_login_available(db, login)
  _ensure_email_available(db, email)

  role = _get_role(db, RoleNom.etudiant)
  user = User(
    login=login,
    email=email,
    mot_de_passe_hash=hash_password(payload.mot_de_passe),
    role_id=role.id,
    statut=StatutUser.actif,
    etudiant_id=etudiant.id,
  )
  db.add(user)
  db.flush()

  etudiant.user_id = user.id
  db.commit()

  user = _user_with_relations(db, user.id)
  return _build_login_response(user)


@router.post(
  "/register-enseignant",
  response_model=LoginResponse,
  status_code=status.HTTP_201_CREATED,
)
def register_enseignant(
  payload: EnseignantRegisterRequest,
  db: Session = Depends(get_db),
):
  enseignant = find_enseignant_by_matricule(db, payload.matricule)
  if not enseignant:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail="Matricule introuvable. L'enseignant doit d'abord être enregistré par l'administration.",
    )

  if enseignant_has_account(db, enseignant):
    raise HTTPException(
      status_code=status.HTTP_409_CONFLICT,
      detail="Un compte existe déjà pour ce matricule",
    )

  login, email = _resolve_account_credentials(
    payload, enseignant.matricule or payload.matricule
  )
  _ensure_login_available(db, login)
  _ensure_email_available(db, email)

  role = _get_role(db, RoleNom.enseignant)
  user = User(
    login=login,
    email=email,
    mot_de_passe_hash=hash_password(payload.mot_de_passe),
    role_id=role.id,
    statut=StatutUser.actif,
    enseignant_id=enseignant.id,
  )
  db.add(user)
  db.flush()

  enseignant.user_id = user.id
  db.commit()

  user = _user_with_relations(db, user.id)
  return _build_login_response(user)
