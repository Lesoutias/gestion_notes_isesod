from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Cycle(Base):
  __tablename__ = "cycles"

  id: Mapped[int] = mapped_column(primary_key=True)
  nom: Mapped[str] = mapped_column(String(50), unique=True)
  duree_annees: Mapped[int] = mapped_column(Integer)

  filieres: Mapped[list["Filiere"]] = relationship(back_populates="cycle")
  promotions: Mapped[list["Promotion"]] = relationship(back_populates="cycle")
