from datetime import date

from sqlalchemy import Date, Float, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import StatutEvaluation, TypeEvaluation


class Evaluation(Base):
  """TJ = 50 % du cours, EXAMEN = 50 % du cours. Cotation sur 20 points."""
  __tablename__ = "evaluations"
  __table_args__ = (
    UniqueConstraint(
      "cours_id",
      "annee_academique_id",
      "type_evaluation",
      name="uq_evaluation_cours_annee_type",
    ),
  )

  id: Mapped[int] = mapped_column(primary_key=True)
  libelle: Mapped[str] = mapped_column(String(150))
  type_evaluation: Mapped[TypeEvaluation] = mapped_column()
  cote_maximale: Mapped[float] = mapped_column(Float, default=20.0)
  date_evaluation: Mapped[date] = mapped_column(Date)
  cours_id: Mapped[int] = mapped_column(ForeignKey("cours.id"))
  enseignant_id: Mapped[int] = mapped_column(ForeignKey("enseignants.id"))
  annee_academique_id: Mapped[int] = mapped_column(ForeignKey("annees_academiques.id"))
  statut: Mapped[StatutEvaluation] = mapped_column(default=StatutEvaluation.brouillon)

  cours: Mapped["Cours"] = relationship(back_populates="evaluations")
  enseignant: Mapped["Enseignant"] = relationship(back_populates="evaluations")
  annee_academique: Mapped["AnneeAcademique"] = relationship(back_populates="evaluations")
  notes: Mapped[list["Note"]] = relationship(back_populates="evaluation")
