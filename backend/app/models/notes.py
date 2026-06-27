from sqlalchemy import Float, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Note(Base):
  __tablename__ = "notes"
  __table_args__ = (
    UniqueConstraint("evaluation_id", "etudiant_id", name="uq_note_evaluation_etudiant"),
  )

  id: Mapped[int] = mapped_column(primary_key=True)
  evaluation_id: Mapped[int] = mapped_column(ForeignKey("evaluations.id"))
  etudiant_id: Mapped[int] = mapped_column(ForeignKey("etudiants.id"))
  cote_obtenue: Mapped[float] = mapped_column(Float)
  moyenne_obtenue: Mapped[float] = mapped_column(Float, default=0.0)

  evaluation: Mapped["Evaluation"] = relationship(back_populates="notes")
  etudiant: Mapped["Etudiant"] = relationship(back_populates="notes")
