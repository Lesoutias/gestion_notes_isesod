from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings

ALGORITHM = "HS256"


def hash_password(password: str) -> str:
  return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
  return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))


def get_access_token_lifetime() -> timedelta:
  return timedelta(days=settings.ACCESS_TOKEN_EXPIRE_DAYS)


def create_access_token(user_id: int, role: str) -> tuple[str, datetime]:
  expire = datetime.now(timezone.utc) + get_access_token_lifetime()
  payload = {
    "sub": str(user_id),
    "role": role,
    "exp": expire,
  }
  token = jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)
  return token, expire


def decode_access_token(token: str) -> dict:
  return jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
