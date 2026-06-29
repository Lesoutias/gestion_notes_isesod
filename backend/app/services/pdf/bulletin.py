from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, Spacer, Table

from app.models import Bulletin
from app.services.pdf.common import (
  build_pdf_document,
  build_styles,
  format_nom_complet,
  institution_header,
  promotion_label,
  table_style,
)


def generer_bulletin_pdf(
  bulletin: Bulletin,
  *,
  filiere,
  promotion,
  annee_academique,
) -> bytes:
  styles = build_styles()
  elements = institution_header(styles, "BULLETIN DE NOTES")

  etudiant = bulletin.etudiant
  promo = promotion_label(filiere, promotion)
  annee = annee_academique.libelle if annee_academique else "—"

  meta_lines = [
    f"<b>Etudiant :</b> {format_nom_complet(etudiant)}",
    f"<b>Matricule :</b> {etudiant.matricule or '—'}",
    f"<b>Promotion :</b> {promo}",
    f"<b>Annee academique :</b> {annee}",
    (
      f"<b>Moyenne generale :</b> {bulletin.moyenne_generale}"
      f" &nbsp;&nbsp; <b>Credits :</b> {bulletin.total_credits}"
    ),
    f"<b>Total pondere :</b> {bulletin.total_points_ponderes}",
  ]
  for line in meta_lines:
    elements.append(Paragraph(line, styles["Meta"]))

  elements.append(Spacer(1, 0.4 * cm))

  table_data = [["Cours", "Moyenne /20", "Credits", "Points ponderes"]]
  lignes = sorted(bulletin.lignes, key=lambda ligne: ligne.intitule)
  for ligne in lignes:
    table_data.append(
      [
        ligne.intitule,
        str(ligne.moyenne_finale),
        str(ligne.credits),
        str(ligne.points_ponderes),
      ]
    )

  col_widths = [8 * cm, 2.5 * cm, 2 * cm, 3 * cm]
  table = Table(table_data, colWidths=col_widths, repeatRows=1)
  table.setStyle(table_style())
  elements.append(table)

  elements.append(Spacer(1, 0.6 * cm))
  elements.append(
    Paragraph(
      "Bulletin officiel genere par le systeme de gestion des notes ISESOD.",
      styles["Meta"],
    )
  )

  return build_pdf_document(elements)
