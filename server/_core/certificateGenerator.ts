import { PDFDocument, PDFPage, rgb, degrees, StandardFonts } from "pdf-lib";
import { storagePut } from "../storage.js";

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
    adults: "Adults (18–35)",
    teens: "Teens (13–17)",
    little_stars: "Little Stars (5–12)",
  };
  return labels[category] || category;
};

// Colors
const bgColor = rgb(35/255, 8/255, 12/255); // Deep burgundy
const gold = rgb(218/255, 165/255, 32/255);
const goldBright = rgb(255/255, 223/255, 128/255);
const goldDark = rgb(139/255, 101/255, 20/255);
const whiteColor = rgb(1, 1, 1);
const silver = rgb(240/255, 240/255, 245/255);

export async function generateCertificate(data: CertificateData): Promise<{ url: string; key: string }> {
  // Create a new PDF document (A4 Portrait instead of Landscape to match 1600x2200 ratio)
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 Portrait

  const { width, height } = page.getSize();

  // Background
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: bgColor,
  });

  // Fonts
  const fontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

  // Border frame
  const border = 20;
  page.drawRectangle({
    x: border,
    y: border,
    width: width - border * 2,
    height: height - border * 2,
    borderColor: gold,
    borderWidth: 3,
  });
  page.drawRectangle({
    x: border + 6,
    y: border + 6,
    width: width - (border + 6) * 2,
    height: height - (border + 6) * 2,
    borderColor: goldDark,
    borderWidth: 2,
  });
  page.drawRectangle({
    x: border + 10,
    y: border + 10,
    width: width - (border + 10) * 2,
    height: height - (border + 10) * 2,
    borderColor: gold,
    borderWidth: 1,
  });

  // Diamond drawing helper
  const drawDiamond = (x: number, y: number, size: number) => {
    // In pdf-lib, polygons aren't directly supported by a single simple function without paths
    // But we can draw a rotated square
    page.drawRectangle({
      x,
      y,
      width: size,
      height: size,
      color: silver,
      borderColor: goldBright,
      borderWidth: 1,
      rotate: degrees(45)
    });
  };

  // Corner diamonds
  drawDiamond(40, height - 40, 15);
  drawDiamond(width - 40, height - 40, 15);
  drawDiamond(40, 40, 15);
  drawDiamond(width - 40, 40, 15);

  // Layout text
  let y = height - 150;

  const drawCenteredText = (text: string, font: any, size: number, color: any, spaceAfter: number) => {
    const textWidth = font.widthOfTextAtSize(text, size);
    page.drawText(text, {
      x: (width - textWidth) / 2,
      y,
      size,
      font,
      color,
    });
    y -= spaceAfter;
  };

  // Crown placeholder
  drawCenteredText("* * *", fontBold, 24, gold, 50);

  drawCenteredText("Certificate of Registration", fontBold, 28, goldBright, 40);
  drawCenteredText("Mr & Miss", fontBold, 18, gold, 20);
  drawCenteredText("FACE OF THARAKA-NITHI COUNTY", fontBold, 24, gold, 30);
  drawCenteredText("2026", fontBold, 24, gold, 40);

  // Decorative line
  page.drawLine({
    start: { x: width / 2 - 100, y: y + 20 },
    end: { x: width / 2 + 100, y: y + 20 },
    thickness: 2,
    color: gold,
  });
  page.drawLine({
    start: { x: width / 2 - 75, y: y + 16 },
    end: { x: width / 2 + 75, y: y + 16 },
    thickness: 1,
    color: goldDark,
  });

  y -= 20;

  drawCenteredText("This is to certify that", fontRegular, 16, goldBright, 30);

  // Participant Name
  drawCenteredText(data.participantName, fontBold, 26, whiteColor, 10);
  page.drawLine({
    start: { x: width / 2 - 120, y: y - 5 },
    end: { x: width / 2 + 120, y: y - 5 },
    thickness: 2,
    color: gold,
  });
  y -= 40;

  drawCenteredText("has successfully registered for the Models Call Out event", fontRegular, 14, goldBright, 30);
  drawCenteredText(`Category: ${getCategoryLabel(data.category)}`, fontBold, 16, gold, 20);
  drawCenteredText(`Registration ID: ${data.registrationId}`, fontBold, 16, gold, 40);

  // Divider
  page.drawLine({
    start: { x: width / 2 - 60, y: y + 20 },
    end: { x: width / 2 + 60, y: y + 20 },
    thickness: 1,
    color: gold,
  });
  y -= 20;

  // Two Column Layout
  const leftCenter = width * 0.35;
  const rightCenter = width * 0.65;
  const colY = y;

  const dateLabel = "Event Date:";
  const dateVal = data.eventDate || "September 12, 2026";
  const venueLabel = "Venue:";
  const venueVal = data.venue || "Chuka Grounds";

  page.drawText(dateLabel, { x: leftCenter - fontRegular.widthOfTextAtSize(dateLabel, 12)/2, y: colY, size: 12, font: fontRegular, color: goldBright });
  page.drawText(dateVal, { x: leftCenter - fontBold.widthOfTextAtSize(dateVal, 14)/2, y: colY - 20, size: 14, font: fontBold, color: whiteColor });

  page.drawText(venueLabel, { x: rightCenter - fontRegular.widthOfTextAtSize(venueLabel, 12)/2, y: colY, size: 12, font: fontRegular, color: goldBright });
  page.drawText(venueVal, { x: rightCenter - fontBold.widthOfTextAtSize(venueVal, 14)/2, y: colY - 20, size: 14, font: fontBold, color: whiteColor });

  y -= 80;

  // Authorized by
  drawCenteredText("Authorized by:", fontRegular, 12, goldBright, 20);
  drawCenteredText("Royals Icon Events", fontItalic, 20, gold, 30);

  // Date Issued
  const issueDate = data.registrationDate ? new Date(data.registrationDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : new Date().toLocaleDateString();
  drawCenteredText(`Date Issued: ${issueDate}`, fontRegular, 12, goldBright, 40);

  // Official Seal
  const sealY = y - 40;
  const sealR = 40;
  page.drawCircle({ x: width/2, y: sealY, size: sealR, borderColor: gold, borderWidth: 2 });
  page.drawCircle({ x: width/2, y: sealY, size: sealR - 6, borderColor: goldDark, borderWidth: 1 });
  
  const sealText = "OFFICIAL SEAL";
  page.drawText(sealText, { x: width/2 - fontBold.widthOfTextAtSize(sealText, 10)/2, y: sealY, size: 10, font: fontBold, color: gold });

  // Bottom section
  y = 80;
  drawCenteredText("Fashion | Talent | Celebration", fontItalic, 14, goldBright, 20);
  drawCenteredText("Organized by Royals Icon Events", fontRegular, 10, gold, 0);

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
