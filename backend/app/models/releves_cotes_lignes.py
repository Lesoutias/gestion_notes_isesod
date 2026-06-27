from sqlalchemy import Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ReleveCotesLigne(Base):
  __tablename__ = "releves_cotes_lignes"

  id: Mapped[int] = mapped_column(primary_key=True)
  releve_id: Mapped[int] = mapped_column(ForeignKey("releves_cotes.id"))
  cours_id: Mapped[int] = mapped_column(ForeignKey("cours.id"))
  intitule_cours: Mapped[str] = mapped_column(String(150))
  credits: Mapped[int] = mapped_column(Integer)
  cote_sur_20: Mapped[float] = mapped_column(Float)
  points_ponderes: Mapped[float] = mapped_column(Float)
  points_max_ponderes: Mapped[float] = mapped_column(Float)
  appreciation: Mapped[str | None] = mapped_column(String(30), nullable=True)

  releve: Mapped["ReleveCotes"] = relationship(back_populates="lignes")
  cours: Mapped["Cours"] = relationship()
