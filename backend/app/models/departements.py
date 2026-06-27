from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Departement(Base):
  __tablename__ = "departements"
  __table_args__ = (UniqueConstraint("nom", "faculte_id", name="uq_departement_nom_faculte"),)

  id: Mapped[int] = mapped_column(primary_key=True)
  nom: Mapped[str] = mapped_column(String(120))
  code: Mapped[str | None] = mapped_column(String(20), unique=True, nullable=True)
  faculte_id: Mapped[int] = mapped_column(ForeignKey("facultes.id"))

  faculte: Mapped["Faculte"] = relationship(back_populates="departements")
  filieres: Mapped[list["Filiere"]] = relationship(back_populates="departement")
