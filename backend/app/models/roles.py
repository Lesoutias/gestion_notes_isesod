from sqlalchemy import Column, ForeignKey, String, Table, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

role_permissions = Table(
  "role_permissions",
  Base.metadata,
  Column("role_id", ForeignKey("roles.id"), primary_key=True),
  Column("permission_id", ForeignKey("permissions.id"), primary_key=True),
)


class Role(Base):
  __tablename__ = "roles"

  id: Mapped[int] = mapped_column(primary_key=True)
  nom: Mapped[str] = mapped_column(String(50), unique=True)
  description: Mapped[str | None] = mapped_column(Text, nullable=True)

  users: Mapped[list["User"]] = relationship(back_populates="role")
  permissions: Mapped[list["Permission"]] = relationship(
    secondary=role_permissions,
    back_populates="roles",
  )
