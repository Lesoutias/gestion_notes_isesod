from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import StatutReleveCotes


class ReleveCotes(Base):
  __tablename__ = "releves_cotes"
  __table_args__ = (
    UniqueConstraint("etudiant_id", "fiche_id", name="uq_releve_etudiant_fiche"),
  )

  id: Mapped[int] = mapped_column(primary_key=True)
  etudiant_id: Mapped[int] = mapped_column(ForeignKey("etudiants.id"))
  promotion_id: Mapped[int] = mapped_column(ForeignKey("promotions.id"))
  annee_academique_id: Mapped[int] = mapped_column(ForeignKey("annees_academiques.id"))
  fiche_id: Mapped[int] = mapped_column(ForeignKey("fiches_synthetiques.id"))
  total_points_obtenus: Mapped[float] = mapped_column(Float, default=0.0)
  total_points_max: Mapped[float] = mapped_column(Float, default=0.0)
  total_credits: Mapped[int] = mapped_column(Integer, default=0)
  pourcentage: Mapped[float] = mapped_column(Float, default=0.0)
  mention: Mapped[str] = mapped_column(String(30))
  decision: Mapped[str] = mapped_column(String(20))
  rang: Mapped[int] = mapped_column(Integer)
  statut: Mapped[StatutReleveCotes] = mapped_column(default=StatutReleveCotes.genere)
  date_generation: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

  etudiant: Mapped["Etudiant"] = relationship(back_populates="releves_cotes")
  promotion: Mapped["Promotion"] = relationship(back_populates="releves_cotes")
  annee_academique: Mapped["AnneeAcademique"] = relationship(back_populates="releves_cotes")
  fiche: Mapped["FicheSynthetique"] = relationship(back_populates="releves_cotes")
  lignes: Mapped[list["ReleveCotesLigne"]] = relationship(
    back_populates="releve",
    cascade="all, delete-orphan",
  )
