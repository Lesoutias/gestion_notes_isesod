from sqlalchemy import Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class FicheSynthetiqueLigne(Base):
  __tablename__ = "fiches_synthetiques_lignes"
  __table_args__ = (
    UniqueConstraint(
      "fiche_synthetique_id",
      "etudiant_id",
      "cours_id",
      name="uq_fiche_ligne_etudiant_cours",
    ),
  )

  id: Mapped[int] = mapped_column(primary_key=True)
  fiche_synthetique_id: Mapped[int] = mapped_column(ForeignKey("fiches_synthetiques.id"))
  etudiant_id: Mapped[int] = mapped_column(ForeignKey("etudiants.id"))
  cours_id: Mapped[int] = mapped_column(ForeignKey("cours.id"))
  enseignant_id: Mapped[int] = mapped_column(ForeignKey("enseignants.id"))
  credits: Mapped[int] = mapped_column(Integer)
  cote_finale_sur_20: Mapped[float] = mapped_column(Float)
  moyenne_finale: Mapped[float] = mapped_column(Float)
  points_ponderes: Mapped[float] = mapped_column(Float)
  points_max_ponderes: Mapped[float] = mapped_column(Float)
  appreciation: Mapped[str | None] = mapped_column(String(30), nullable=True)

  fiche_synthetique: Mapped["FicheSynthetique"] = relationship(back_populates="lignes")
  etudiant: Mapped["Etudiant"] = relationship(back_populates="fiche_synthetique_lignes")
  cours: Mapped["Cours"] = relationship(back_populates="fiche_synthetique_lignes")
  enseignant: Mapped["Enseignant"] = relationship()
