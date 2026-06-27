from sqlalchemy import Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class BulletinLigne(Base):
  __tablename__ = "bulletins_lignes"
  __table_args__ = (
    UniqueConstraint("bulletin_id", "cours_id", name="uq_bulletin_ligne_cours"),
  )

  id: Mapped[int] = mapped_column(primary_key=True)
  bulletin_id: Mapped[int] = mapped_column(ForeignKey("bulletins.id"))
  cours_id: Mapped[int] = mapped_column(ForeignKey("cours.id"))
  intitule: Mapped[str] = mapped_column(String(150))
  moyenne_finale: Mapped[float] = mapped_column(Float)
  credits: Mapped[int] = mapped_column(Integer)
  points_ponderes: Mapped[float] = mapped_column(Float)

  bulletin: Mapped["Bulletin"] = relationship(back_populates="lignes")
  cours: Mapped["Cours"] = relationship(back_populates="bulletin_lignes")
