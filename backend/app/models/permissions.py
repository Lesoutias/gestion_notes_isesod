from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Permission(Base):
  __tablename__ = "permissions"

  id: Mapped[int] = mapped_column(primary_key=True)
  code: Mapped[str] = mapped_column(String(80), unique=True)
  libelle: Mapped[str] = mapped_column(String(150))
  module: Mapped[str] = mapped_column(String(50))
  description: Mapped[str | None] = mapped_column(Text, nullable=True)

  roles: Mapped[list["Role"]] = relationship(
    secondary="role_permissions",
    back_populates="permissions",
  )
