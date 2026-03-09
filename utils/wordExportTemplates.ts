import { Document, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType } from 'docx';
import { Client, BusinessSettings } from '../types';

/**
 * CUSTOMIZABLE WORD TEMPLATE
 * Edit this file to change the layout, fonts, and styles of the exported Word documents.
 */

export const generateStandardWordTemplate = (docData: any, type: 'invoice' | 'estimate', client: Client | undefined, business: BusinessSettings) => {
  const docTitle = docData.title || (type === 'invoice' ? 'Invoice' : 'Estimate');
  const docNumber = docData.invoiceNumber || docData.estimateNumber;
  const brandColor = business.brandColor.replace('#', '');

  return new Document({
    sections: [{
      properties: {},
      children: [
        // Header: Business Name
        new Paragraph({
          children: [
            new TextRun({
              text: business.name.toUpperCase(),
              bold: true,
              size: 32,
            }),
          ],
          alignment: AlignmentType.LEFT,
        }),
        // Business Address
        new Paragraph({
          children: [
            new TextRun({
              text: business.address,
              size: 20,
            }),
          ],
          spacing: { after: 400 },
        }),
        // Document Title (Invoice/Estimate)
        new Paragraph({
          children: [
            new TextRun({
              text: docTitle.toUpperCase(),
              bold: true,
              size: 48,
              color: brandColor,
            }),
          ],
          alignment: AlignmentType.RIGHT,
          spacing: { before: -1000 },
        }),
        // Document Number
        new Paragraph({
          children: [
            new TextRun({
              text: `#${docNumber}`,
              bold: true,
              size: 24,
            }),
          ],
          alignment: AlignmentType.RIGHT,
        }),
        // Date
        new Paragraph({
          children: [
            new TextRun({
              text: `Date: ${new Date(docData.date).toLocaleDateString()}`,
              size: 20,
            }),
          ],
          alignment: AlignmentType.RIGHT,
          spacing: { after: 800 },
        }),
        
        // Billing Info
        new Paragraph({
          children: [
            new TextRun({
              text: "BILL TO:",
              bold: true,
              size: 18,
              color: "888888",
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: client?.name || "Unknown Client",
              bold: true,
              size: 24,
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: client?.address || "",
              size: 20,
            }),
          ],
          spacing: { after: 800 },
        }),

        // Items Table
        new Table({
          width: {
            size: 100,
            type: WidthType.PERCENTAGE,
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "DESCRIPTION", bold: true, size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "QTY", bold: true, size: 18 })], alignment: AlignmentType.CENTER })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "RATE", bold: true, size: 18 })], alignment: AlignmentType.RIGHT })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "TOTAL", bold: true, size: 18 })], alignment: AlignmentType.RIGHT })] }),
              ],
            }),
            ...docData.items.map((item: any) => new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.description, size: 20 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.quantity.toString(), size: 20 })], alignment: AlignmentType.CENTER })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.rate.toLocaleString('en-US', { style: 'currency', currency: business.currency }), size: 20 })], alignment: AlignmentType.RIGHT })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: (item.quantity * item.rate).toLocaleString('en-US', { style: 'currency', currency: business.currency }), bold: true, size: 20 })], alignment: AlignmentType.RIGHT })] }),
              ],
            })),
          ],
        }),

        // Totals
        new Paragraph({
          children: [
            new TextRun({
              text: `TOTAL: ${docData.total.toLocaleString('en-US', { style: 'currency', currency: business.currency })}`,
              bold: true,
              size: 32,
              color: brandColor,
            }),
          ],
          alignment: AlignmentType.RIGHT,
          spacing: { before: 800, after: 800 },
        }),

        // Notes
        new Paragraph({
          children: [
            new TextRun({
              text: "NOTES:",
              bold: true,
              size: 18,
              color: "888888",
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: docData.notes || "Thank you for your business!",
              size: 20,
            }),
          ],
        }),
      ],
    }],
  });
};
