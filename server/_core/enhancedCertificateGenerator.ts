import { PDFDocument, PDFPage, rgb, degrees } from "pdf-lib";

export interface CertificateData {
  participantName: string;
  category: string;
  registrationId: string;
  eventDate: string;
  venue: string;
  partners?: string[];
}

export async function generateEnhancedCertificate(
  data: CertificateData
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // Standard letter size
  const { width, height } = page.getSize();

  // Burgundy and gold theme colors
  const burgundy = rgb(0.29, 0.1, 0.16); // #4a1a2a
  const gold = rgb(0.83, 0.68, 0.22); // #d4af37
  const darkBurgundy = rgb(0.16, 0.04, 0.1); // #2a0a1a
  const white = rgb(1, 1, 1);

  // Background gradient effect with rectangles
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: darkBurgundy,
  });

  // Gold border
  page.drawRectangle({
    x: 20,
    y: 20,
    width: width - 40,
    height: height - 40,
    borderColor: gold,
    borderWidth: 3,
  });

  // Inner burgundy border
  page.drawRectangle({
    x: 30,
    y: 30,
    width: width - 60,
    height: height - 60,
    borderColor: gold,
    borderWidth: 1,
  });

  // Embed fonts first
  const helveticaBold = await pdfDoc.embedFont("Helvetica-Bold");
  const helvetica = await pdfDoc.embedFont("Helvetica");
  const helveticaOblique = await pdfDoc.embedFont("Helvetica-Oblique");

  // Title
  page.drawText("CERTIFICATE OF REGISTRATION", {
    x: 50,
    y: height - 100,
    size: 28,
    color: gold,
    font: helveticaBold,
  });

  // Subtitle
  page.drawText("Mr & Miss Face of Tharaka-Nithi County 2026", {
    x: 50,
    y: height - 140,
    size: 16,
    color: white,
    font: helvetica,
  });

  // Decorative line
  page.drawLine({
    start: { x: 50, y: height - 160 },
    end: { x: width - 50, y: height - 160 },
    color: gold,
    thickness: 2,
  });

  // Certificate body text
  page.drawText("This is to certify that", {
    x: 50,
    y: height - 220,
    size: 12,
    color: white,
    font: helvetica,
  });

  // Participant name (large and prominent)
  page.drawText(data.participantName.toUpperCase(), {
    x: 50,
    y: height - 270,
    size: 24,
    color: gold,
    font: helveticaBold,
  });

  // Category and registration details
  page.drawText(`Category: ${data.category}`, {
    x: 50,
    y: height - 310,
    size: 12,
    color: white,
    font: helvetica,
  });

  page.drawText(`Registration ID: ${data.registrationId}`, {
    x: 50,
    y: height - 335,
    size: 12,
    color: white,
    font: helvetica,
  });

  // Event details
  page.drawText(
    `has successfully registered for the Models Call Out event on ${data.eventDate} at ${data.venue}.`,
    {
      x: 50,
      y: height - 380,
      size: 12,
      color: white,
      font: helvetica,
      maxWidth: width - 100,
    }
  );

  // Eligibility criteria
  page.drawText("Eligibility Criteria:", {
    x: 50,
    y: height - 430,
    size: 11,
    color: gold,
    font: helveticaBold,
  });

  const criteria = [
    "✓ No height restrictions",
    "✓ Tattoos and scars do not disqualify applicants",
    "✓ Registration is FREE",
    "✓ Portfolio submission encouraged",
  ];

  let criteriaY = height - 455;
  criteria.forEach((criterion) => {
    page.drawText(criterion, {
      x: 70,
      y: criteriaY,
      size: 10,
      color: white,
      font: helvetica,
    });
    criteriaY -= 20;
  });

  // Partners section
  if (data.partners && data.partners.length > 0) {
    page.drawText("Event Partners:", {
      x: 50,
      y: criteriaY - 20,
      size: 11,
      color: gold,
      font: helveticaBold,
    });

    let partnerY = criteriaY - 45;
    data.partners.forEach((partner) => {
      page.drawText(`• ${partner}`, {
        x: 70,
        y: partnerY,
        size: 9,
        color: white,
        font: helvetica,
      });
      partnerY -= 15;
    });
  }

  // Footer with date
  page.drawText(`Issued: ${new Date().toLocaleDateString()}`, {
    x: 50,
    y: 60,
    size: 10,
    color: gold,
    font: helveticaOblique,
  });

  page.drawText("Organized by Royals Icon Events", {
    x: width - 250,
    y: 60,
    size: 10,
    color: gold,
    font: helveticaOblique,
  });

  // Save and return PDF
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes) as any;
}
