from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import StatutDocument


class Bulletin(Base):
  __tablename__ = "bulletins"
  __table_args__ = (
    UniqueConstraint("etudiant_id", "annee_academique_id", name="uq_bulletin_etudiant_annee"),
  )

  id: Mapped[int] = mapped_column(primary_key=True)
  etudiant_id: Mapped[int] = mapped_column(ForeignKey("etudiants.id"))
  annee_academique_id: Mapped[int] = mapped_column(ForeignKey("annees_academiques.id"))
  promotion_id: Mapped[int] = mapped_column(ForeignKey("promotions.id"))
  fiche_synthetique_id: Mapped[int] = mapped_column(ForeignKey("fiches_synthetiques.id"))
  moyenne_generale: Mapped[float] = mapped_column(Float, default=0.0)
  total_credits: Mapped[int] = mapped_column(Integer, default=0)
  total_points_ponderes: Mapped[float] = mapped_column(Float, default=0.0)
  statut: Mapped[StatutDocument] = mapped_column(default=StatutDocument.brouillon)
  date_generation: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

  etudiant: Mapped["Etudiant"] = relationship(back_populates="bulletins")
  annee_academique: Mapped["AnneeAcademique"] = relationship(back_populates="bulletins")
  promotion: Mapped["Promotion"] = relationship(back_populates="bulletins")
  fiche_synthetique: Mapped["FicheSynthetique"] = relationship(back_populates="bulletins")
  lignes: Mapped[list["BulletinLigne"]] = relationship(back_populates="bulletin")
