from __future__ import annotations

import io
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

def generate_report_pdf(data: dict) -> bytes:
    """
    Generates a PDF report from the evaluation results.
    data: {tender_title, bidders: [{name, evaluations: [{criterion, verdict, reason, page}]}]}
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    story = []

    # Title
    story.append(Paragraph(f"Tender Evaluation Report: {data.get('tender_title')}", styles['Title']))
    story.append(Spacer(1, 12))

    for bidder in data.get('bidders', []):
        story.append(Paragraph(f"Bidder: {bidder['name']}", styles['Heading2']))
        story.append(Spacer(1, 6))

        # Table data
        table_data = [["Criterion", "Verdict", "Page", "Reason"]]
        for ev in bidder.get('evaluations', []):
            table_data.append([
                Paragraph(ev['criterion'], styles['Normal']),
                ev['verdict'],
                str(ev.get('page', '-')),
                Paragraph(ev['reason'], styles['Normal'])
            ])

        t = Table(table_data, colWidths=[150, 60, 40, 200])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        story.append(t)
        story.append(Spacer(1, 24))

    doc.build(story)
    return buffer.getvalue()
