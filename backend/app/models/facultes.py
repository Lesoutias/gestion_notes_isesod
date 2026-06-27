from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Faculte(Base):
  __tablename__ = "facultes"

  id: Mapped[int] = mapped_column(primary_key=True)
  nom: Mapped[str] = mapped_column(String(120), unique=True)
  code: Mapped[str | None] = mapped_column(String(20), unique=True, nullable=True)

  departements: Mapped[list["Departement"]] = relationship(back_populates="faculte")
