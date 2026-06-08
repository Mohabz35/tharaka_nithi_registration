import { PDFDocument, PDFPage, rgb, degrees } from "pdf-lib";
import { storagePut } from "../storage";

export interface CertificateData {
  participantName: string;
  category: "adults" | "teens" | "little_stars";
  registrationId: string;
  registrationDate: Date;
  eventDate: string;
  venue: string;
}

const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    adults: "Adults (18–26)",
    teens: "Teens (13–17)",
    little_stars: "Little Stars (5–12)",
  };
  return labels[category] || category;
};

export async function generateCertificate(data: CertificateData): Promise<{ url: string; key: string }> {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([842, 595]); // A4 landscape in points

  const { width, height } = page.getSize();

  // Draw burgundy border
  page.drawRectangle({
    x: 20,
    y: 20,
    width: width - 40,
    height: height - 40,
    borderColor: rgb(0.8, 0.68, 0.22), // Gold color
    borderWidth: 3,
  });

  // Draw inner decorative border
  page.drawRectangle({
    x: 35,
    y: 35,
    width: width - 70,
    height: height - 70,
    borderColor: rgb(0.8, 0.68, 0.22),
    borderWidth: 1,
  });

  // Title
  page.drawText("Certificate of Registration", {
    x: width / 2 - 120,
    y: height - 80,
    size: 32,
    color: rgb(0.29, 0.1, 0.16), // Burgundy
    font: await pdfDoc.embedFont("Helvetica-Bold"),
  });

  // Subtitle
  page.drawText("Mr & Miss Face of Tharaka-Nithi County 2026", {
    x: width / 2 - 140,
    y: height - 120,
    size: 14,
    color: rgb(0.29, 0.1, 0.16),
    font: await pdfDoc.embedFont("Helvetica"),
  });

  // Decorative line
  page.drawLine({
    start: { x: 100, y: height - 140 },
    end: { x: width - 100, y: height - 140 },
    thickness: 2,
    color: rgb(0.8, 0.68, 0.22),
  });

  // "This is to certify that" text
  page.drawText("This is to certify that", {
    x: width / 2 - 50,
    y: height - 200,
    size: 12,
    color: rgb(0.29, 0.1, 0.16),
    font: await pdfDoc.embedFont("Helvetica"),
  });

  // Participant name (larger, bold)
  page.drawText(data.participantName, {
    x: width / 2 - 120,
    y: height - 250,
    size: 24,
    color: rgb(0.8, 0.68, 0.22),
    font: await pdfDoc.embedFont("Helvetica-Bold"),
  });

  // Underline for name
  page.drawLine({
    start: { x: 100, y: height - 260 },
    end: { x: width - 100, y: height - 260 },
    thickness: 1,
    color: rgb(0.8, 0.68, 0.22),
  });

  // Registration details
  page.drawText("has successfully registered for the Models Call Out event", {
    x: width / 2 - 140,
    y: height - 300,
    size: 12,
    color: rgb(0.29, 0.1, 0.16),
    font: await pdfDoc.embedFont("Helvetica"),
  });

  // Event details box
  const detailsY = height - 380;
  page.drawRectangle({
    x: 100,
    y: detailsY - 80,
    width: width - 200,
    height: 80,
    borderColor: rgb(0.8, 0.68, 0.22),
    borderWidth: 1,
    color: rgb(0.29, 0.1, 0.16),
    opacity: 0.05,
  });

  // Details text
  const detailsX = 120;
  page.drawText(`Category: ${getCategoryLabel(data.category)}`, {
    x: detailsX,
    y: detailsY - 20,
    size: 11,
    color: rgb(0.29, 0.1, 0.16),
    font: await pdfDoc.embedFont("Helvetica"),
  });

  page.drawText(`Registration ID: ${data.registrationId}`, {
    x: detailsX,
    y: detailsY - 40,
    size: 11,
    color: rgb(0.29, 0.1, 0.16),
    font: await pdfDoc.embedFont("Helvetica"),
  });

  page.drawText(`Event Date: ${data.eventDate} | Venue: ${data.venue}`, {
    x: detailsX,
    y: detailsY - 60,
    size: 11,
    color: rgb(0.29, 0.1, 0.16),
    font: await pdfDoc.embedFont("Helvetica"),
  });

  // Signature and stamp area
  const signatureY = 100;
  page.drawText("Authorized by:", {
    x: 100,
    y: signatureY + 40,
    size: 10,
    color: rgb(0.29, 0.1, 0.16),
    font: await pdfDoc.embedFont("Helvetica"),
  });

  page.drawText("Royals Icon Events", {
    x: 100,
    y: signatureY + 20,
    size: 11,
    color: rgb(0.8, 0.68, 0.22),
    font: await pdfDoc.embedFont("Helvetica-Bold"),
  });

  // Stamp placeholder
  page.drawText("[Official Stamp]", {
    x: width - 200,
    y: signatureY + 30,
    size: 10,
    color: rgb(0.8, 0.68, 0.22),
    font: await pdfDoc.embedFont("Helvetica-Oblique"),
  });

  // Date issued
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  page.drawText(`Date Issued: ${dateStr}`, {
    x: width / 2 - 60,
    y: 30,
    size: 9,
    color: rgb(0.29, 0.1, 0.16),
    font: await pdfDoc.embedFont("Helvetica"),
  });

  // Save PDF to bytes
  const pdfBytes = await pdfDoc.save();

  // Upload to S3
  const fileName = `certificate_${data.registrationId}_${Date.now()}.pdf`;
  const { url, key } = await storagePut(
    `certificates/${fileName}`,
    Buffer.from(pdfBytes),
    "application/pdf"
  );

  return { url, key };
}
