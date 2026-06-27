from fastapi import APIRouter

from app.routers.admin import (
  annees_academiques,
  cours,
  cycles,
  enseignants,
  etudiants,
  fiches,
  filieres,
  promotions,
  releves_cotes,
)

router = APIRouter(prefix="/admin")
router.include_router(cycles.router)
router.include_router(filieres.router)
router.include_router(promotions.router)
router.include_router(annees_academiques.router)
router.include_router(etudiants.router)
router.include_router(enseignants.router)
router.include_router(cours.router)
router.include_router(fiches.router)
router.include_router(releves_cotes.router)
