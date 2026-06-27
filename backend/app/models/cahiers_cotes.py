from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import StatutDocument


class CahierCotes(Base):
  __tablename__ = "cahiers_cotes"
  __table_args__ = (
    UniqueConstraint("cours_id", "annee_academique_id", name="uq_cahier_cours_annee"),
  )

  id: Mapped[int] = mapped_column(primary_key=True)
  cours_id: Mapped[int] = mapped_column(ForeignKey("cours.id"))
  enseignant_id: Mapped[int] = mapped_column(ForeignKey("enseignants.id"))
  annee_academique_id: Mapped[int] = mapped_column(ForeignKey("annees_academiques.id"))
  promotion_id: Mapped[int] = mapped_column(ForeignKey("promotions.id"))
  statut: Mapped[StatutDocument] = mapped_column(default=StatutDocument.brouillon)
  date_generation: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
  date_validation: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

  cours: Mapped["Cours"] = relationship(back_populates="cahiers_cotes")
  enseignant: Mapped["Enseignant"] = relationship()
  annee_academique: Mapped["AnneeAcademique"] = relationship(back_populates="cahiers_cotes")
  promotion: Mapped["Promotion"] = relationship(back_populates="cahiers_cotes")
  lignes: Mapped[list["CahierCotesLigne"]] = relationship(
    back_populates="cahier_cotes",
    cascade="all, delete-orphan",
  )
