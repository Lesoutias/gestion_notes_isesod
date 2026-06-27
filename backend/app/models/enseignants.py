from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import Sexe, StatutEnseignant


class Enseignant(Base):
  __tablename__ = "enseignants"

  id: Mapped[int] = mapped_column(primary_key=True)
  matricule: Mapped[str | None] = mapped_column(String(30), unique=True, nullable=True)
  nom: Mapped[str] = mapped_column(String(80))
  postnom: Mapped[str] = mapped_column(String(80))
  prenom: Mapped[str] = mapped_column(String(80))
  sexe: Mapped[Sexe] = mapped_column()
  email: Mapped[str | None] = mapped_column(String(120), unique=True, nullable=True)
  telephone: Mapped[str | None] = mapped_column(String(30), nullable=True)
  user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
  statut: Mapped[StatutEnseignant] = mapped_column(default=StatutEnseignant.actif)

  user: Mapped["User | None"] = relationship(foreign_keys=[user_id])
  cours: Mapped[list["Cours"]] = relationship(back_populates="enseignant")
  evaluations: Mapped[list["Evaluation"]] = relationship(back_populates="enseignant")
