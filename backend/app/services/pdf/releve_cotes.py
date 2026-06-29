from reportlab.lib.units import cm
from reportlab.platypus import PageBreak, Paragraph, Spacer, Table

from app.models import ReleveCotes
from app.services.pdf.common import (
  build_pdf_document,
  build_styles,
  format_nom_complet,
  institution_header,
  promotion_label,
  table_style,
)


def build_releve_cotes_elements(
  releve: ReleveCotes,
  *,
  filiere,
  promotion,
  annee_academique,
  styles=None,
) -> list:
  styles = styles or build_styles()
  elements = institution_header(styles, "RELEVE DE COTES")

  etudiant = releve.etudiant
  promo = promotion_label(filiere, promotion)
  annee = annee_academique.libelle if annee_academique else "—"

  meta_lines = [
    f"<b>Etudiant :</b> {format_nom_complet(etudiant)}",
    f"<b>Matricule :</b> {etudiant.matricule or '—'}",
    f"<b>Promotion :</b> {promo}",
    f"<b>Annee academique :</b> {annee}",
    f"<b>Rang :</b> {releve.rang} &nbsp;&nbsp; <b>Mention :</b> {releve.mention}",
    f"<b>Decision :</b> {releve.decision} &nbsp;&nbsp; <b>Pourcentage :</b> {releve.pourcentage} %",
    (
      f"<b>Points obtenus :</b> {releve.total_points_obtenus} / {releve.total_points_max}"
      f" &nbsp;&nbsp; <b>Credits :</b> {releve.total_credits}"
    ),
  ]
  for line in meta_lines:
    elements.append(Paragraph(line, styles["Meta"]))

  elements.append(Spacer(1, 0.4 * cm))

  table_data = [
    ["Cours", "Credits", "Cote /20", "Pts ponderes", "Appreciation"],
  ]
  lignes = sorted(releve.lignes, key=lambda ligne: ligne.intitule_cours)
  for ligne in lignes:
    table_data.append(
      [
        ligne.intitule_cours,
        str(ligne.credits),
        str(ligne.cote_sur_20),
        str(ligne.points_ponderes),
        ligne.appreciation or "—",
      ]
    )

  col_widths = [7.5 * cm, 1.5 * cm, 2 * cm, 2.5 * cm, 3 * cm]
  table = Table(table_data, colWidths=col_widths, repeatRows=1)
  table.setStyle(table_style())
  elements.append(table)

  elements.append(Spacer(1, 0.6 * cm))
  elements.append(
    Paragraph(
      "Document officiel genere par le systeme de gestion des notes ISESOD.",
      styles["Meta"],
    )
  )

  return elements


def generer_releve_cotes_pdf(
  releve: ReleveCotes,
  *,
  filiere,
  promotion,
  annee_academique,
) -> bytes:
  elements = build_releve_cotes_elements(
    releve,
    filiere=filiere,
    promotion=promotion,
    annee_academique=annee_academique,
  )
  return build_pdf_document(elements)


def generer_tous_releves_cotes_pdf(
  releves: list[ReleveCotes],
  *,
  filiere,
  promotion,
  annee_academique,
) -> bytes:
  styles = build_styles()
  elements: list = []
  for index, releve in enumerate(releves):
    if index > 0:
      elements.append(PageBreak())
    elements.extend(
      build_releve_cotes_elements(
        releve,
        filiere=filiere,
        promotion=promotion,
        annee_academique=annee_academique,
        styles=styles,
      )
    )
  return build_pdf_document(elements)
