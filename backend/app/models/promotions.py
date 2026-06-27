from sqlalchemy import ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Promotion(Base):
  __tablename__ = "promotions"
  __table_args__ = (UniqueConstraint("nom", "filiere_id", name="uq_promotion_nom_filiere"),)

  id: Mapped[int] = mapped_column(primary_key=True)
  nom: Mapped[str] = mapped_column(String(10))
  niveau: Mapped[int] = mapped_column(Integer)
  cycle_id: Mapped[int] = mapped_column(ForeignKey("cycles.id"))
  filiere_id: Mapped[int] = mapped_column(ForeignKey("filieres.id"))

  cycle: Mapped["Cycle"] = relationship(back_populates="promotions")
  filiere: Mapped["Filiere"] = relationship(back_populates="promotions")
  etudiants: Mapped[list["Etudiant"]] = relationship(back_populates="promotion")
  cours: Mapped[list["Cours"]] = relationship(back_populates="promotion")
  cahiers_cotes: Mapped[list["CahierCotes"]] = relationship(back_populates="promotion")
  fiches_synthetiques: Mapped[list["FicheSynthetique"]] = relationship(back_populates="promotion")
  bulletins: Mapped[list["Bulletin"]] = relationship(back_populates="promotion")
  releves_cotes: Mapped[list["ReleveCotes"]] = relationship(back_populates="promotion")
