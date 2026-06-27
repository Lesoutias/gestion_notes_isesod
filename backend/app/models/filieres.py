from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Filiere(Base):
  __tablename__ = "filieres"

  id: Mapped[int] = mapped_column(primary_key=True)
  nom: Mapped[str] = mapped_column(String(120))
  sigle: Mapped[str] = mapped_column(String(10), unique=True)
  cycle_id: Mapped[int] = mapped_column(ForeignKey("cycles.id"))
  departement_id: Mapped[int] = mapped_column(ForeignKey("departements.id"))
  description: Mapped[str | None] = mapped_column(Text, nullable=True)

  cycle: Mapped["Cycle"] = relationship(back_populates="filieres")
  departement: Mapped["Departement"] = relationship(back_populates="filieres")
  promotions: Mapped[list["Promotion"]] = relationship(back_populates="filiere")
