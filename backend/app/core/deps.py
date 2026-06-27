from typing import Callable

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models import Role, RoleNom, StatutUser, User

bearer_scheme = HTTPBearer(auto_error=True)


def _user_query(db: Session):
  return (
    db.query(User)
    .options(
      joinedload(User.role).joinedload(Role.permissions),
      joinedload(User.etudiant),
      joinedload(User.enseignant),
    )
  )


def get_current_user(
  credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
  db: Session = Depends(get_db),
) -> User:
  credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Identifiants invalides ou token expiré",
    headers={"WWW-Authenticate": "Bearer"},
  )

  try:
    payload = decode_access_token(credentials.credentials)
    user_id = payload.get("sub")
    if user_id is None:
      raise credentials_exception
  except JWTError:
    raise credentials_exception from None

  user = _user_query(db).filter(User.id == int(user_id)).first()
  if user is None:
    raise credentials_exception

  if user.statut != StatutUser.actif:
    raise HTTPException(
      status_code=status.HTTP_403_FORBIDDEN,
      detail="Compte inactif",
    )

  return user


def require_roles(*roles: RoleNom) -> Callable:
  allowed = {role.value for role in roles}

  def checker(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role.nom not in allowed:
      raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Accès refusé pour ce rôle",
      )
    return current_user

  return checker


require_admin = require_roles(RoleNom.admin)
require_enseignant = require_roles(RoleNom.enseignant)
require_etudiant = require_roles(RoleNom.etudiant)
