import { PDFDocument, PDFPage, rgb, degrees } from "pdf-lib";
import { storagePut } from "../storage.js";
import { EVENT_DATE, EVENT_NAME, EVENT_VENUE, ORGANIZER_NAME } from "../../shared/const.js";
import {
  BRAND,
  drawCrown,
  drawSeal,
  drawSignature,
  fitFontSize,
  formatLongDate,
  loadFonts,
  textWidth,
} from "./pdfLayout.js";

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

// Dark-canvas palette for certificates
const bg = rgb(35 / 255, 8 / 255, 12 / 255);
const gold = BRAND.gold;
const goldBright = BRAND.goldBright;
const goldDark = BRAND.goldDark;
const white = rgb(1, 1, 1);
const silver = rgb(240 / 255, 240 / 255, 245 / 255);

interface CertificateFonts {
  regular: any;
  bold: any;
  italic: any;
  sans: any;
  sansBold: any;
}

function drawCertificateFrame(page: PDFPage): void {
  const { width, height } = page.getSize();
  page.drawRectangle({ x: 0, y: 0, width, height, color: bg });

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

  // Corner diamonds
  const diamond = (x: number, y: number) => {
    page.drawRectangle({
      x,
      y,
      width: 15,
      height: 15,
      color: silver,
      borderColor: goldBright,
      borderWidth: 1,
      rotate: degrees(45),
    });
  };
  diamond(40, height - 40);
  diamond(width - 40, height - 40);
  diamond(40, 40);
  diamond(width - 40, 40);
}

function centeredFactory(page: PDFPage, fonts: CertificateFonts) {
  const { width } = page.getSize();
  let y = 0;
  const draw = (
    text: string,
    font: any,
    size: number,
    color: ReturnType<typeof rgb>,
    spaceAfter: number,
    maxWidth = width - 120
  ) => {
    const fitted = fitFontSize(font, text, maxWidth, size);
    page.drawText(text, {
      x: (width - textWidth(font, text, fitted)) / 2,
      y,
      size: fitted,
      font,
      color,
    });
    y -= spaceAfter;
  };
  const setY = (value: number) => {
    y = value;
  };
  const getY = () => y;
  void fonts;
  return { draw, setY, getY };
}

// ============ Registration certificate ============

export async function generateCertificate(
  data: CertificateData
): Promise<{ url: string; key: string }> {
  const pdfDoc = await PDFDocument.create();
  const fonts = await loadFonts(pdfDoc);
  const page = pdfDoc.addPage([595, 842]); // A4 Portrait
  const { width, height } = page.getSize();

  drawCertificateFrame(page);

  const c = centeredFactory(page, fonts);
  c.setY(height - 120);

  // Crown ornament
  drawCrown(page, width / 2, c.getY() - 10, 70, gold);
  c.setY(c.getY() - 66);

  c.draw("Certificate of Registration", fonts.bold, 28, goldBright, 36);
  c.draw("Mr & Miss", fonts.bold, 18, gold, 20);
  c.draw("FACE OF THARAKA-NITHI COUNTY", fonts.bold, 24, gold, 26, width - 160);
  c.draw("2026", fonts.bold, 24, gold, 38);

  // Divider
  page.drawLine({
    start: { x: width / 2 - 100, y: c.getY() + 22 },
    end: { x: width / 2 + 100, y: c.getY() + 22 },
    thickness: 2,
    color: gold,
  });
  page.drawLine({
    start: { x: width / 2 - 75, y: c.getY() + 17 },
    end: { x: width / 2 + 75, y: c.getY() + 17 },
    thickness: 1,
    color: goldDark,
  });

  c.draw("This is to certify that", fonts.regular, 16, goldBright, 32);

  // Participant name (fitted so long names never overflow the frame)
  c.draw(data.participantName, fonts.bold, 26, white, 10, width - 180);
  page.drawLine({
    start: { x: width / 2 - 120, y: c.getY() - 2 },
    end: { x: width / 2 + 120, y: c.getY() - 2 },
    thickness: 2,
    color: gold,
  });
  c.setY(c.getY() - 38);

  c.draw(
    "has successfully registered for the Models Call Out event",
    fonts.regular,
    14,
    goldBright,
    26
  );
  c.draw(`Category: ${getCategoryLabel(data.category)}`, fonts.bold, 15, gold, 18);
  c.draw(`Registration ID: ${data.registrationId}`, fonts.bold, 15, gold, 34);

  page.drawLine({
    start: { x: width / 2 - 60, y: c.getY() + 16 },
    end: { x: width / 2 + 60, y: c.getY() + 16 },
    thickness: 1,
    color: gold,
  });

  // Event details columns
  const colY = c.getY() - 14;
  const leftCenter = width * 0.35;
  const rightCenter = width * 0.65;
  const dateVal = data.eventDate || EVENT_DATE;
  const venueVal = data.venue || EVENT_VENUE;

  const centeredValue = (cx: number, label: string, value: string) => {
    page.drawText(label, {
      x: cx - textWidth(fonts.regular, label, 12) / 2,
      y: colY,
      size: 12,
      font: fonts.regular,
      color: goldBright,
    });
    const size = fitFontSize(fonts.bold, value, width * 0.28, 14, 9);
    page.drawText(value, {
      x: cx - textWidth(fonts.bold, value, size) / 2,
      y: colY - 20,
      size,
      font: fonts.bold,
      color: white,
    });
  };
  centeredValue(leftCenter, "Event Date:", dateVal);
  centeredValue(rightCenter, "Venue:", venueVal);
  c.setY(colY - 70);

  // Authorised signature (dark background → light ink)
  drawSignature(page, fonts, {
    x: width / 2 - 110,
    top: c.getY(),
    lineWidth: 220,
    name: ORGANIZER_NAME,
    title: `Authorised for ${EVENT_NAME}`,
    ink: goldBright,
    ruleColor: gold,
    nameColor: goldBright,
    titleColor: silver,
  });
  c.setY(c.getY() - 78);

  // Seal
  drawSeal(page, fonts, {
    cx: width / 2,
    cy: c.getY() - 20,
    r: 42,
    orgLine: "ROYALS ICON",
    textColor: gold,
  });
  c.setY(c.getY() - 78);

  const issueDate = formatLongDate(data.registrationDate || new Date());
  c.draw(`Date Issued: ${issueDate}`, fonts.regular, 12, goldBright, 24);

  // Bottom banner
  c.draw("Fashion | Talent | Celebration", fonts.italic, 14, goldBright, 18);
  c.draw(`Organized by ${ORGANIZER_NAME}`, fonts.regular, 10, gold, 0);

  const pdfBytes = await pdfDoc.save();
  const fileName = `certificate_${data.registrationId}_${Date.now()}.pdf`;
  const { url, key } = await storagePut(`certificates/${fileName}`, Buffer.from(pdfBytes), "application/pdf");
  return { url, key };
}

// ============ Achievement / participation certificates ============

export interface AchievementCertificateData {
  recipientName: string;
  award: string;
  kind: "winner" | "participation";
  categoryLabel?: string;
  eventDate?: string;
  venue?: string;
  issuedAt?: Date;
  fileNameId: string;
}

export async function generateAchievementCertificate(
  data: AchievementCertificateData
): Promise<{ url: string; key: string }> {
  const pdfDoc = await PDFDocument.create();
  const fonts = await loadFonts(pdfDoc);
  const page = pdfDoc.addPage([595, 842]); // A4 Portrait
  const { width, height } = page.getSize();

  drawCertificateFrame(page);

  const c = centeredFactory(page, fonts);
  c.setY(height - 120);

  drawCrown(page, width / 2, c.getY() - 10, 70, gold);
  c.setY(c.getY() - 66);

  c.draw(
    data.kind === "winner" ? "Certificate of Achievement" : "Certificate of Participation",
    fonts.bold,
    28,
    goldBright,
    36
  );
  c.draw("Mr & Miss", fonts.bold, 18, gold, 20);
  c.draw("FACE OF THARAKA-NITHI COUNTY", fonts.bold, 24, gold, 26, width - 160);
  c.draw("2026", fonts.bold, 24, gold, 38);

  page.drawLine({
    start: { x: width / 2 - 100, y: c.getY() + 22 },
    end: { x: width / 2 + 100, y: c.getY() + 22 },
    thickness: 2,
    color: gold,
  });

  c.draw("This is proudly presented to", fonts.regular, 16, goldBright, 32);
  c.draw(data.recipientName, fonts.bold, 26, white, 10, width - 180);
  page.drawLine({
    start: { x: width / 2 - 120, y: c.getY() - 2 },
    end: { x: width / 2 + 120, y: c.getY() - 2 },
    thickness: 2,
    color: gold,
  });
  c.setY(c.getY() - 38);

  c.draw(data.award, fonts.bold, 20, goldBright, 22, width - 170);
  if (data.categoryLabel) {
    c.draw(`Category: ${data.categoryLabel}`, fonts.regular, 14, gold, 16);
  }
  c.draw(
    data.kind === "winner"
      ? "in recognition of outstanding achievement at the Models Call Out event"
      : "for valuable participation in the Models Call Out event",
    fonts.italic,
    14,
    goldBright,
    34,
    width - 170
  );

  page.drawLine({
    start: { x: width / 2 - 60, y: c.getY() + 16 },
    end: { x: width / 2 + 60, y: c.getY() + 16 },
    thickness: 1,
    color: gold,
  });

  // Event details columns
  const colY = c.getY() - 14;
  const leftCenter = width * 0.35;
  const rightCenter = width * 0.65;
  const dateVal = data.eventDate || EVENT_DATE;
  const venueVal = data.venue || EVENT_VENUE;
  const centeredValue = (cx: number, label: string, value: string) => {
    page.drawText(label, {
      x: cx - textWidth(fonts.regular, label, 12) / 2,
      y: colY,
      size: 12,
      font: fonts.regular,
      color: goldBright,
    });
    const size = fitFontSize(fonts.bold, value, width * 0.28, 14, 9);
    page.drawText(value, {
      x: cx - textWidth(fonts.bold, value, size) / 2,
      y: colY - 20,
      size,
      font: fonts.bold,
      color: white,
    });
  };
  centeredValue(leftCenter, "Event Date:", dateVal);
  centeredValue(rightCenter, "Venue:", venueVal);
  c.setY(colY - 70);

  drawSignature(page, fonts, {
    x: width / 2 - 110,
    top: c.getY(),
    lineWidth: 220,
    name: ORGANIZER_NAME,
    title: `Authorised for ${EVENT_NAME}`,
    ink: goldBright,
    ruleColor: gold,
    nameColor: goldBright,
    titleColor: silver,
  });
  c.setY(c.getY() - 78);

  drawSeal(page, fonts, {
    cx: width / 2,
    cy: c.getY() - 20,
    r: 42,
    orgLine: "ROYALS ICON",
    textColor: gold,
  });
  c.setY(c.getY() - 78);

  const issueDate = formatLongDate(data.issuedAt || new Date());
  c.draw(`Date Issued: ${issueDate}`, fonts.regular, 12, goldBright, 24);

  c.draw("Fashion | Talent | Celebration", fonts.italic, 14, goldBright, 18);
  c.draw(`Organized by ${ORGANIZER_NAME}`, fonts.regular, 10, gold, 0);

  const pdfBytes = await pdfDoc.save();
  const fileName = `achievement_${data.fileNameId}_${Date.now()}.pdf`;
  const { url, key } = await storagePut(
    `certificates/${fileName}`,
    Buffer.from(pdfBytes),
    "application/pdf"
  );
  return { url, key };
}
