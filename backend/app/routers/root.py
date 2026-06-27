from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.seed import get_seed_status

router = APIRouter()


@router.get("/")
def root():
  return {"message": "Bienvenue sur l'API Gestion des Notes"}


@router.get("/seed/status")
def seed_status(db: Session = Depends(get_db)):
  return get_seed_status(db)
