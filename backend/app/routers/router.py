from fastapi import APIRouter

from app.routers import auth, enseignant_space, enseignants, etudiant_space, etudiants, root
from app.routers.admin import router as admin_router

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(etudiants.router)
api_router.include_router(enseignants.router)
api_router.include_router(enseignant_space.router)
api_router.include_router(etudiant_space.router)
api_router.include_router(admin_router)
api_router.include_router(root.router)