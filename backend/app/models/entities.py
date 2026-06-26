from sqlalchemy import Float, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Faculte(Base):
  __tablename__ = "facultes"

  id: Mapped[int] = mapped_column(primary_key=True)
  nom: Mapped[str] = mapped_column(String(120), unique=True)
  code: Mapped[str | None] = mapped_column(String(20), unique=True, nullable=True)

  departements: Mapped[list["Departement"]] = relationship(back_populates="faculte")


class Departement(Base):
  __tablename__ = "departements"

  id: Mapped[int] = mapped_column(primary_key=True)
  nom: Mapped[str] = mapped_column(String(120))
  code: Mapped[str | None] = mapped_column(String(20), unique=True, nullable=True)
  faculte_id: Mapped[int] = mapped_column(ForeignKey("facultes.id"))

  faculte: Mapped["Faculte"] = relationship(back_populates="departements")
  etudiants: Mapped[list["Etudiant"]] = relationship(back_populates="departement")
  cours: Mapped[list["Cours"]] = relationship(back_populates="departement")


class Etudiant(Base):
  __tablename__ = "etudiants"

  id: Mapped[int] = mapped_column(primary_key=True)
  matricule: Mapped[str | None] = mapped_column(String(30), unique=True, nullable=True)
  nom: Mapped[str] = mapped_column(String(80))
  prenom: Mapped[str] = mapped_column(String(80))
  email: Mapped[str] = mapped_column(String(120), unique=True)
  departement_id: Mapped[int] = mapped_column(ForeignKey("departements.id"))

  departement: Mapped["Departement"] = relationship(back_populates="etudiants")
  notes: Mapped[list["Note"]] = relationship(back_populates="etudiant")


class Cours(Base):
  __tablename__ = "cours"

  id: Mapped[int] = mapped_column(primary_key=True)
  code: Mapped[str | None] = mapped_column(String(20), unique=True, nullable=True)
  intitule: Mapped[str] = mapped_column(String(150))
  credits: Mapped[int] = mapped_column(default=3)
  departement_id: Mapped[int] = mapped_column(ForeignKey("departements.id"))

  departement: Mapped["Departement"] = relationship(back_populates="cours")
  notes: Mapped[list["Note"]] = relationship(back_populates="cours")


class Note(Base):
  __tablename__ = "notes"
  __table_args__ = (UniqueConstraint("etudiant_id", "cours_id", name="uq_note_etudiant_cours"),)

  id: Mapped[int] = mapped_column(primary_key=True)
  valeur: Mapped[float] = mapped_column(Float)
  session: Mapped[str] = mapped_column(String(20), default="Session 1")
  etudiant_id: Mapped[int] = mapped_column(ForeignKey("etudiants.id"))
  cours_id: Mapped[int] = mapped_column(ForeignKey("cours.id"))

  etudiant: Mapped["Etudiant"] = relationship(back_populates="notes")
  cours: Mapped["Cours"] = relationship(back_populates="notes")
