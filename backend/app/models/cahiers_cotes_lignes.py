from sqlalchemy import Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class CahierCotesLigne(Base):
  __tablename__ = "cahiers_cotes_lignes"
  __table_args__ = (
    UniqueConstraint("cahier_cotes_id", "etudiant_id", name="uq_cahier_ligne_etudiant"),
  )

  id: Mapped[int] = mapped_column(primary_key=True)
  cahier_cotes_id: Mapped[int] = mapped_column(ForeignKey("cahiers_cotes.id"))
  etudiant_id: Mapped[int] = mapped_column(ForeignKey("etudiants.id"))
  moyenne_tj: Mapped[float] = mapped_column(Float, default=0.0)
  moyenne_examen: Mapped[float] = mapped_column(Float, default=0.0)
  cote_tj_sur_10: Mapped[float] = mapped_column(Float, default=0.0)
  cote_examen_sur_10: Mapped[float] = mapped_column(Float, default=0.0)
  cote_finale_sur_20: Mapped[float] = mapped_column(Float, default=0.0)
  moyenne_finale: Mapped[float | None] = mapped_column(Float, nullable=True)
  credits: Mapped[int] = mapped_column(Integer, default=0)
  points_ponderes: Mapped[float] = mapped_column(Float, default=0.0)
  points_max_ponderes: Mapped[float] = mapped_column(Float, default=0.0)
  appreciation: Mapped[str | None] = mapped_column(String(30), nullable=True)

  cahier_cotes: Mapped["CahierCotes"] = relationship(back_populates="lignes")
  etudiant: Mapped["Etudiant"] = relationship(back_populates="cahier_cotes_lignes")
