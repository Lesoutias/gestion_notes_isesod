from sqlalchemy import Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Cours(Base):
  __tablename__ = "cours"

  id: Mapped[int] = mapped_column(primary_key=True)
  code: Mapped[str | None] = mapped_column(String(30), unique=True, nullable=True)
  intitule: Mapped[str] = mapped_column(String(150))
  volume_horaire: Mapped[int] = mapped_column(Integer)
  credits: Mapped[int] = mapped_column(Integer, default=0)
  points_max: Mapped[float] = mapped_column(Float, default=20.0)
  promotion_id: Mapped[int] = mapped_column(ForeignKey("promotions.id"))
  enseignant_id: Mapped[int | None] = mapped_column(ForeignKey("enseignants.id"), nullable=True)
  semestre: Mapped[str | None] = mapped_column(String(20), nullable=True)
  type_cours: Mapped[str | None] = mapped_column(String(50), nullable=True)

  promotion: Mapped["Promotion"] = relationship(back_populates="cours")
  enseignant: Mapped["Enseignant | None"] = relationship(back_populates="cours")
  evaluations: Mapped[list["Evaluation"]] = relationship(back_populates="cours")
  cahiers_cotes: Mapped[list["CahierCotes"]] = relationship(back_populates="cours")
  fiche_synthetique_lignes: Mapped[list["FicheSynthetiqueLigne"]] = relationship(back_populates="cours")
  bulletin_lignes: Mapped[list["BulletinLigne"]] = relationship(back_populates="cours")
