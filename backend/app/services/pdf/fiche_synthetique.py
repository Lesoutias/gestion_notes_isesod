from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, Spacer, Table

from app.models import FicheSynthetique
from app.services.pdf.common import (
  PAGE_A4_LANDSCAPE,
  build_pdf_document,
  build_styles,
  format_nom_complet,
  institution_header,
  promotion_label,
  table_style,
)


def _build_matrix(fiche: FicheSynthetique):
  etudiants_map: dict[int, object] = {}
  cours_map: dict[int, object] = {}
  cells: dict[tuple[int, int], object] = {}

  for ligne in fiche.lignes:
    if ligne.etudiant:
      etudiants_map[ligne.etudiant_id] = ligne.etudiant
    if ligne.cours:
      cours_map[ligne.cours_id] = ligne.cours
    cells[(ligne.cours_id, ligne.etudiant_id)] = ligne

  etudiants = sorted(
    etudiants_map.values(),
    key=lambda etu: format_nom_complet(etu),
  )
  cours = sorted(cours_map.values(), key=lambda c: c.intitule)
  return etudiants, cours, cells


def generer_fiche_synthetique_pdf(
  fiche: FicheSynthetique,
  *,
  filiere,
  promotion,
  annee_academique,
) -> bytes:
  styles = build_styles()
  elements = institution_header(styles, "FICHE SYNTHETIQUE")

  promo = promotion_label(filiere, promotion)
  annee = annee_academique.libelle if annee_academique else "—"
  elements.append(Paragraph(f"<b>Promotion :</b> {promo}", styles["Meta"]))
  elements.append(Paragraph(f"<b>Annee academique :</b> {annee}", styles["Meta"]))
  statut = fiche.statut.value if hasattr(fiche.statut, "value") else fiche.statut
  elements.append(Paragraph(f"<b>Statut :</b> {statut}", styles["Meta"]))
  elements.append(
    Paragraph(
      f"<b>Cours recus :</b> {fiche.total_cours_recus} / {fiche.total_cours_attendus}",
      styles["Meta"],
    )
  )
  elements.append(Spacer(1, 0.3 * cm))

  etudiants, cours, cells = _build_matrix(fiche)
  if not etudiants or not cours:
    elements.append(Paragraph("Aucune donnee disponible.", styles["Meta"]))
    return build_pdf_document(elements, pagesize=PAGE_A4_LANDSCAPE)

  header = ["Cours"] + [format_nom_complet(etu) for etu in etudiants]
  table_data = [header]
  for cours_item in cours:
    row = [cours_item.intitule]
    for etu in etudiants:
      ligne = cells.get((cours_item.id, etu.id))
      row.append(str(ligne.points_ponderes) if ligne else "—")
    table_data.append(row)

  total_row = ["Total pts pond."]
  for etu in etudiants:
    total = sum(
      (cells.get((c.id, etu.id)).points_ponderes or 0)
      for c in cours
      if cells.get((c.id, etu.id))
    )
    total_row.append(str(round(total, 2)))
  table_data.append(total_row)

  usable_width = PAGE_A4_LANDSCAPE[0] - 3 * cm
  first_col = min(5.5 * cm, usable_width * 0.25)
  remaining = max(usable_width - first_col, 1)
  other_cols = len(header) - 1
  other_width = remaining / other_cols if other_cols else remaining
  col_widths = [first_col] + [other_width] * other_cols

  table = Table(table_data, colWidths=col_widths, repeatRows=1)
  table.setStyle(table_style())
  elements.append(table)

  return build_pdf_document(elements, pagesize=PAGE_A4_LANDSCAPE)
