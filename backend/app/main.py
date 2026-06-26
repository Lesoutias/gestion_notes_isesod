from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import Base, SessionLocal, engine
from app.routers.router import api_router
from app.seed import seed_database


@asynccontextmanager
async def lifespan(_: FastAPI):
  Base.metadata.create_all(bind=engine)

  db = SessionLocal()
  try:
    seed_database(db)
  finally:
    db.close()

  yield


app = FastAPI(
  title=settings.APP_NAME,
  version=settings.APP_VERSION,
  description="API de gestion des notes universitaires",
  lifespan=lifespan,
)

app.add_middleware(
  CORSMiddleware,
  allow_origins=settings.cors_origins,
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")


@app.get("/health")
def health_check():
  return {"status": "ok", "app": settings.APP_NAME}
