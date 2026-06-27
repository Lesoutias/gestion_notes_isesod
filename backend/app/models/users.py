from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import StatutUser


class User(Base):
  __tablename__ = "users"

  id: Mapped[int] = mapped_column(primary_key=True)
  login: Mapped[str] = mapped_column(String(50), unique=True)
  email: Mapped[str | None] = mapped_column(String(120), unique=True, nullable=True)
  mot_de_passe_hash: Mapped[str] = mapped_column(String(255))
  role_id: Mapped[int] = mapped_column(ForeignKey("roles.id"))
  statut: Mapped[StatutUser] = mapped_column(default=StatutUser.actif)
  etudiant_id: Mapped[int | None] = mapped_column(ForeignKey("etudiants.id"), nullable=True)
  enseignant_id: Mapped[int | None] = mapped_column(ForeignKey("enseignants.id"), nullable=True)
  created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

  role: Mapped["Role"] = relationship(back_populates="users")
  etudiant: Mapped["Etudiant | None"] = relationship(
    foreign_keys=[etudiant_id],
  )
  enseignant: Mapped["Enseignant | None"] = relationship(
    foreign_keys=[enseignant_id],
  )
