from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import Sexe, StatutEtudiant


class Etudiant(Base):
  __tablename__ = "etudiants"

  id: Mapped[int] = mapped_column(primary_key=True)
  matricule: Mapped[str | None] = mapped_column(String(30), unique=True, nullable=True)
  nom: Mapped[str] = mapped_column(String(80))
  postnom: Mapped[str] = mapped_column(String(80))
  prenom: Mapped[str] = mapped_column(String(80))
  sexe: Mapped[Sexe] = mapped_column()
  email: Mapped[str | None] = mapped_column(String(120), unique=True, nullable=True)
  telephone: Mapped[str | None] = mapped_column(String(30), nullable=True)
  promotion_id: Mapped[int] = mapped_column(ForeignKey("promotions.id"))
  annee_academique_id: Mapped[int] = mapped_column(ForeignKey("annees_academiques.id"))
  user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
  statut: Mapped[StatutEtudiant] = mapped_column(default=StatutEtudiant.actif)

  user: Mapped["User | None"] = relationship(foreign_keys=[user_id])
  promotion: Mapped["Promotion"] = relationship(back_populates="etudiants")
  annee_academique: Mapped["AnneeAcademique"] = relationship(back_populates="etudiants")
  notes: Mapped[list["Note"]] = relationship(back_populates="etudiant")
  cahier_cotes_lignes: Mapped[list["CahierCotesLigne"]] = relationship(back_populates="etudiant")
  fiche_synthetique_lignes: Mapped[list["FicheSynthetiqueLigne"]] = relationship(back_populates="etudiant")
  bulletins: Mapped[list["Bulletin"]] = relationship(back_populates="etudiant")
  releves_cotes: Mapped[list["ReleveCotes"]] = relationship(back_populates="etudiant")
