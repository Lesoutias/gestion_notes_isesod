from datetime import date

from sqlalchemy import Date, Index, String, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import StatutAnneeAcademique


class AnneeAcademique(Base):
  __tablename__ = "annees_academiques"
  __table_args__ = (
    Index(
      "uq_annee_academique_active",
      "statut",
      unique=True,
      postgresql_where=text("statut = 'active'"),
    ),
  )

  id: Mapped[int] = mapped_column(primary_key=True)
  libelle: Mapped[str] = mapped_column(String(20), unique=True)
  date_debut: Mapped[date] = mapped_column(Date)
  date_fin: Mapped[date] = mapped_column(Date)
  statut: Mapped[StatutAnneeAcademique] = mapped_column(default=StatutAnneeAcademique.cloturee)

  etudiants: Mapped[list["Etudiant"]] = relationship(back_populates="annee_academique")
  evaluations: Mapped[list["Evaluation"]] = relationship(back_populates="annee_academique")
  cahiers_cotes: Mapped[list["CahierCotes"]] = relationship(back_populates="annee_academique")
  fiches_synthetiques: Mapped[list["FicheSynthetique"]] = relationship(back_populates="annee_academique")
  bulletins: Mapped[list["Bulletin"]] = relationship(back_populates="annee_academique")
  releves_cotes: Mapped[list["ReleveCotes"]] = relationship(back_populates="annee_academique")
