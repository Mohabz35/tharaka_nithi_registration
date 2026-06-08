import { PDFDocument, rgb, degrees, StandardFonts } from "pdf-lib";

export interface CertificateData {
  participantName: string;
  category: string;
  registrationId: string;
  eventDate: string;
  venue: string;
  partners?: string[];
  dateIssued?: string;
}

export async function generateEnhancedCertificate(
  data: CertificateData
): Promise<Buffer> {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();

  // Certificate dimensions: 1600x2200 pixels roughly converts to 600x825 points (72 DPI)
  // Standard Letter is 612x792. Let's use a custom size similar to the Python design.
  const page = pdfDoc.addPage([600, 825]);
  const { width, height } = page.getSize();

  // Colors matching the poster exactly
  const bgColor = rgb(35/255, 8/255, 12/255);      // Deep burgundy/maroon
  const gold = rgb(218/255, 165/255, 32/255);       // Rich gold (#DAA520)
  const goldBright = rgb(255/255, 223/255, 128/255);  // Highlight gold
  const goldDark = rgb(139/255, 101/255, 20/255);  // Dark gold
  const white = rgb(1, 1, 1);

  // Background
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: bgColor,
  });

  // Silk texture simulation (lines)
  for (let y = 0; y < height; y += 4) {
    page.drawLine({
      start: { x: 0, y },
      end: { x: width, y },
      thickness: 1,
      color: white,
      opacity: 0.03,
    });
  }

  // Border frame
  const border = 15;
  page.drawRectangle({
    x: border,
    y: border,
    width: width - border * 2,
    height: height - border * 2,
    borderColor: gold,
    borderWidth: 2,
  });

  page.drawRectangle({
    x: border + 5,
    y: border + 5,
    width: width - (border + 5) * 2,
    height: height - (border + 5) * 2,
    borderColor: goldDark,
    borderWidth: 1,
  });

  // Embed fonts
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Helper for centered text
  const drawCentered = (text: string, y: number, font: any, size: number, color: any) => {
    const textWidth = font.widthOfTextAtSize(text, size);
    page.drawText(text, {
      x: (width - textWidth) / 2,
      y: height - y,
      size,
      font,
      color,
    });
    return y + size;
  };

  // Content Layout
  let currentY = 150;

  // Title
  currentY = drawCentered("Certificate of Registration", currentY, fontBold, 28, goldBright) + 20;

  currentY = drawCentered("Mr & Miss", currentY, fontBold, 18, gold) + 5;
  currentY = drawCentered("FACE OF", currentY, fontBold, 32, gold) + 5;
  currentY = drawCentered("THARAKA-NITHI COUNTY", currentY, fontBold, 32, gold) + 5;
  currentY = drawCentered("2026", currentY, fontBold, 32, gold) + 40;

  // Divider line
  page.drawLine({
    start: { x: width / 2 - 100, y: height - currentY },
    end: { x: width / 2 + 100, y: height - currentY },
    thickness: 2,
    color: gold,
  });
  currentY += 30;

  currentY = drawCentered("This is to certify that", currentY, fontRegular, 14, goldBright) + 40;

  // Participant Name
  const name = data.participantName.toUpperCase();
  currentY = drawCentered(name, currentY, fontBold, 24, white) + 15;

  // Name underline
  page.drawLine({
    start: { x: width / 2 - 150, y: height - currentY },
    end: { x: width / 2 + 150, y: height - currentY },
    thickness: 1,
    color: gold,
  });
  currentY += 40;

  currentY = drawCentered("has successfully registered for the Models Call Out event", currentY, fontRegular, 12, goldBright) + 30;
  currentY = drawCentered(`Category: ${data.category}`, currentY, fontBold, 16, gold) + 10;
  currentY = drawCentered(`Registration ID: ${data.registrationId}`, currentY, fontBold, 16, gold) + 40;

  // Two column layout for Date and Venue
  const colY = currentY;
  const leftX = width * 0.3;
  const rightX = width * 0.7;

  // Date
  const dateLabel = "Event Date:";
  page.drawText(dateLabel, { x: leftX - fontRegular.widthOfTextAtSize(dateLabel, 10) / 2, y: height - colY, size: 10, font: fontRegular, color: goldBright });
  page.drawText(data.eventDate, { x: leftX - fontBold.widthOfTextAtSize(data.eventDate, 14) / 2, y: height - (colY + 20), size: 14, font: fontBold, color: white });

  // Venue
  const venueLabel = "Venue:";
  page.drawText(venueLabel, { x: rightX - fontRegular.widthOfTextAtSize(venueLabel, 10) / 2, y: height - colY, size: 10, font: fontRegular, color: goldBright });
  page.drawText(data.venue, { x: rightX - fontBold.widthOfTextAtSize(data.venue, 14) / 2, y: height - (colY + 20), size: 14, font: fontBold, color: white });

  currentY += 80;

  // Authorized by
  currentY = drawCentered("Authorized by:", currentY, fontRegular, 10, goldBright) + 10;
  currentY = drawCentered("Royals Icon Events", currentY, fontItalic, 14, gold) + 40;

  // Partners section
  if (data.partners && data.partners.length > 0) {
    currentY = drawCentered("Our Partners", currentY, fontBold, 12, goldBright) + 15;
    const partnersText = data.partners.join("  |  ");
    currentY = drawCentered(partnersText, currentY, fontRegular, 10, white) + 30;
  }

  // Date issued
  const dateIssued = data.dateIssued || new Date().toLocaleDateString("en-US", { month: 'long', day: 'numeric', year: 'numeric' });
  drawCentered(`Date Issued: ${dateIssued}`, currentY, fontRegular, 10, goldBright);

  // Seal Simulation
  const sealR = 40;
  const sealX = width / 2;
  const sealY = currentY + 70;
  page.drawCircle({
    x: sealX,
    y: height - sealY,
    size: sealR,
    borderColor: gold,
    borderWidth: 2,
  });
  const sealText = "OFFICIAL SEAL";
  const sealTextSize = 6;
  page.drawText(sealText, {
    x: sealX - fontBold.widthOfTextAtSize(sealText, sealTextSize) / 2,
    y: height - sealY + 20,
    size: sealTextSize,
    font: fontBold,
    color: gold,
  });

  // Footer
  drawCentered("Fashion  |  Talent  |  Celebration", height - 60, fontItalic, 12, goldBright);
  drawCentered("Organized by Royals Icon Events", height - 40, fontRegular, 10, gold);

  // Save PDF to bytes
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes) as any;
}
