from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import StatutFicheSynthetique


class FicheSynthetique(Base):
  __tablename__ = "fiches_synthetiques"
  __table_args__ = (
    UniqueConstraint("promotion_id", "annee_academique_id", name="uq_fiche_promotion_annee"),
  )

  id: Mapped[int] = mapped_column(primary_key=True)
  promotion_id: Mapped[int] = mapped_column(ForeignKey("promotions.id"))
  annee_academique_id: Mapped[int] = mapped_column(ForeignKey("annees_academiques.id"))
  statut: Mapped[StatutFicheSynthetique] = mapped_column(
    default=StatutFicheSynthetique.en_attente
  )
  total_cours_attendus: Mapped[int] = mapped_column(Integer, default=0)
  total_cours_recus: Mapped[int] = mapped_column(Integer, default=0)
  date_creation: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
  date_validation: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

  promotion: Mapped["Promotion"] = relationship(back_populates="fiches_synthetiques")
  annee_academique: Mapped["AnneeAcademique"] = relationship(back_populates="fiches_synthetiques")
  lignes: Mapped[list["FicheSynthetiqueLigne"]] = relationship(
    back_populates="fiche_synthetique",
    cascade="all, delete-orphan",
  )
  bulletins: Mapped[list["Bulletin"]] = relationship(back_populates="fiche_synthetique")
  releves_cotes: Mapped[list["ReleveCotes"]] = relationship(back_populates="fiche")
