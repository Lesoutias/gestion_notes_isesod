import re
import unicodedata
from io import BytesIO

from fastapi.responses import Response
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, Spacer, Table, TableStyle

INSTITUTION_NAME = (
  "Institut Supérieur d'Etudes Sociales et de l'Organisation du Développement"
)
INSTITUTION_SHORT = "ISESOD"

PAGE_A4 = A4
PAGE_A4_LANDSCAPE = landscape(A4)


def pdf_response(data: bytes, filename: str) -> Response:
  safe_name = sanitize_filename(filename)
  return Response(
    content=data,
    media_type="application/pdf",
    headers={"Content-Disposition": f'attachment; filename="{safe_name}"'},
  )


def sanitize_filename(name: str) -> str:
  normalized = unicodedata.normalize("NFKD", name)
  ascii_name = normalized.encode("ascii", "ignore").decode("ascii")
  cleaned = re.sub(r"[^\w.\-]+", "_", ascii_name)
  return cleaned or "document.pdf"


def format_nom_complet(personne) -> str:
  if not personne:
    return "—"
  parts = [personne.prenom, personne.nom, personne.postnom]
  return " ".join(part for part in parts if part)


def promotion_label(filiere, promotion) -> str:
  if not promotion:
    return "—"
  sigle = getattr(filiere, "sigle", None) if filiere else None
  return f"{sigle} — {promotion.nom}" if sigle else promotion.nom


def build_styles():
  styles = getSampleStyleSheet()
  styles.add(
    ParagraphStyle(
      name="InstitutionTitle",
      parent=styles["Heading1"],
      fontSize=13,
      leading=16,
      alignment=TA_CENTER,
      spaceAfter=4,
    )
  )
  styles.add(
    ParagraphStyle(
      name="DocumentTitle",
      parent=styles["Heading2"],
      fontSize=12,
      leading=14,
      alignment=TA_CENTER,
      spaceAfter=10,
    )
  )
  styles.add(
    ParagraphStyle(
      name="Meta",
      parent=styles["Normal"],
      fontSize=9,
      leading=12,
      spaceAfter=2,
    )
  )
  styles.add(
    ParagraphStyle(
      name="TableHeader",
      parent=styles["Normal"],
      fontSize=8,
      leading=10,
      alignment=TA_CENTER,
    )
  )
  styles.add(
    ParagraphStyle(
      name="TableCell",
      parent=styles["Normal"],
      fontSize=8,
      leading=10,
    )
  )
  return styles


def institution_header(styles, document_title: str) -> list:
  return [
    Paragraph(INSTITUTION_SHORT, styles["InstitutionTitle"]),
    Paragraph(INSTITUTION_NAME, styles["Meta"]),
    Spacer(1, 0.2 * cm),
    Paragraph(document_title, styles["DocumentTitle"]),
    Spacer(1, 0.3 * cm),
  ]


def table_style(header_rows: int = 1) -> TableStyle:
  commands = [
    ("BACKGROUND", (0, 0), (-1, header_rows - 1), colors.HexColor("#1e3a5f")),
    ("TEXTCOLOR", (0, 0), (-1, header_rows - 1), colors.white),
    ("FONTNAME", (0, 0), (-1, header_rows - 1), "Helvetica-Bold"),
    ("FONTNAME", (0, header_rows), (-1, -1), "Helvetica"),
    ("FONTSIZE", (0, 0), (-1, -1), 8),
    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("GRID", (0, 0), (-1, -1), 0.25, colors.grey),
    ("ROWBACKGROUNDS", (0, header_rows), (-1, -1), [colors.white, colors.HexColor("#f5f5f0")]),
    ("LEFTPADDING", (0, 0), (-1, -1), 4),
    ("RIGHTPADDING", (0, 0), (-1, -1), 4),
    ("TOPPADDING", (0, 0), (-1, -1), 4),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
  ]
  return TableStyle(commands)


def build_pdf_document(elements: list, pagesize=PAGE_A4) -> bytes:
  buffer = BytesIO()
  from reportlab.platypus import SimpleDocTemplate

  doc = SimpleDocTemplate(
    buffer,
    pagesize=pagesize,
    leftMargin=1.5 * cm,
    rightMargin=1.5 * cm,
    topMargin=1.5 * cm,
    bottomMargin=1.5 * cm,
  )
  doc.build(elements)
  return buffer.getvalue()
