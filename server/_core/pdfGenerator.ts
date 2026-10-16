import { PDFDocument, PDFPage, rgb } from "pdf-lib";
import { storagePut } from "../storage.js";
import type { Registration } from "../../drizzle/schema";
import { EVENT_DATE, EVENT_NAME, EVENT_VENUE, ORGANIZER_NAME } from "../../shared/const.js";
import {
  BRAND,
  DocFonts,
  drawFooter,
  drawKeyValueRows,
  drawLetterhead,
  drawParagraph,
  drawPageFrame,
  drawSeal,
  drawSignature,
  fitFontSize,
  formatLongDate,
  loadFonts,
  textWidth,
  wrapText,
} from "./pdfLayout.js";

const MARGIN = 56;
const FOOTER_LIMIT = 100;

function categoryLabel(category: string): string {
  if (category === "adults") return "Adults (18–35)";
  if (category === "teens") return "Teens (13–17)";
  if (category === "little_stars") return "Little Stars (5–12)";
  return category;
}

function drawCenteredText(
  page: PDFPage,
  text: string,
  font: any,
  size: number,
  color: ReturnType<typeof rgb>,
  y: number,
  maxWidth?: number
): void {
  const { width } = page.getSize();
  const fitted = fitFontSize(font, text, maxWidth ?? width - 140, size);
  page.drawText(text, {
    x: (width - textWidth(font, text, fitted)) / 2,
    y,
    size: fitted,
    font,
    color,
  });
}

function a4() {
  return { width: 595.28, height: 841.89 };
}

// ============ Official registration letter ============

export async function generateRegistrationPDF(
  registration: Registration
): Promise<{ url: string; key: string }> {
  const pdfDoc = await PDFDocument.create();
  const fonts = await loadFonts(pdfDoc);
  const { width, height } = a4();

  const regNo = `REG-${String(registration.id).padStart(3, "0")}`;
  const isMinor = registration.category !== "adults";

  let page: PDFPage = pdfDoc.addPage([width, height]);
  drawPageFrame(page);
  let pageNum = 1;
  let y = drawLetterhead(page, fonts) - 6;

  const ensure = (needed: number) => {
    if (y - needed > FOOTER_LIMIT) return;
    drawFooter(page, fonts);
    pageNum += 1;
    page = pdfDoc.addPage([width, height]);
    drawPageFrame(page);
    // Slim continuation header
    drawCenteredText(
      page,
      `${ORGANIZER_NAME} — ${EVENT_NAME}`,
      fonts.regular,
      9.5,
      BRAND.burgundy,
      790
    );
    const pageLabel = `Page ${pageNum}`;
    page.drawText(pageLabel, {
      x: width - MARGIN - textWidth(fonts.sans, pageLabel, 8),
      y: 774,
      size: 8,
      font: fonts.sans,
      color: BRAND.grey,
    });
    page.drawLine({
      start: { x: MARGIN, y: 786 },
      end: { x: width - MARGIN, y: 786 },
      thickness: 0.8,
      color: BRAND.gold,
    });
    y = 760;
  };

  const para = (
    text: string,
    opts: { font?: any; size?: number; color?: any; lineHeight?: number; after?: number } = {}
  ) => {
    const font = opts.font ?? fonts.regular;
    const size = opts.size ?? 11;
    const color = opts.color ?? BRAND.ink;
    const lineHeight = opts.lineHeight ?? size * 1.35;
    const after = opts.after ?? 4;
    const lines = wrapText(font, text, size, width - MARGIN * 2);
    ensure(lines.length * lineHeight + after);
    y = drawParagraph(page, text, {
      font,
      size,
      color,
      x: MARGIN,
      y,
      maxWidth: width - MARGIN * 2,
      lineHeight,
    });
    y -= after;
  };

  // ---------- Date & reference ----------
  ensure(20);
  const dateText = `Date: ${formatLongDate(new Date())}`;
  const refText = `Our Ref: ${regNo}`;
  page.drawText(dateText, { x: MARGIN, y, size: 10.5, font: fonts.regular, color: BRAND.grey });
  page.drawText(refText, {
    x: width - MARGIN - textWidth(fonts.regular, refText, 10.5),
    y,
    size: 10.5,
    font: fonts.regular,
    color: BRAND.grey,
  });
  y -= 30;

  // ---------- Addressee ----------
  para(registration.fullName, { font: fonts.bold, size: 14, after: 2 });
  para(`Contestant — ${categoryLabel(registration.category)}`, {
    size: 10.5,
    color: BRAND.grey,
    after: 1,
  });
  para(registration.countySubLocation, { size: 10.5, color: BRAND.grey, after: 14 });

  // ---------- Subject ----------
  const subject = `RE: OFFICIAL REGISTRATION CONFIRMATION — ${EVENT_NAME}`;
  const subjectLines = wrapText(fonts.bold, subject, 12, width - MARGIN * 2);
  ensure(subjectLines.length * 17 + 14);
  for (const s of subjectLines) {
    page.drawText(s, { x: MARGIN, y, size: 12, font: fonts.bold, color: BRAND.burgundy });
    y -= 16;
  }
  page.drawLine({
    start: { x: MARGIN, y: y + 8 },
    end: { x: width - MARGIN, y: y + 8 },
    thickness: 0.8,
    color: BRAND.gold,
  });
  y -= 14;

  // ---------- Salutation & body ----------
  para(`Dear ${registration.fullName},`, { after: 6 });
  para(
    "We are pleased to confirm that your entry for the Models Call Out has been received and duly " +
      "registered in the official contestant register. This letter serves as your official proof of " +
      "registration — please keep it safe and quote your registration number in all correspondence " +
      "with the organising committee.",
    { size: 11.5, lineHeight: 15.5, after: 12 }
  );

  // ---------- Details table ----------
  const statusText = registration.paymentStatus === "completed" ? "PAID IN FULL" : "FREE — NO FEE PAYABLE";
  const statusColor = registration.paymentStatus === "completed" ? BRAND.green : BRAND.burgundy;
  ensure(7 * 20 + 10);
  y = drawKeyValueRows(
    page,
    fonts,
    [
      { label: "Registration No.", value: regNo, valueColor: BRAND.goldDark },
      { label: "Category", value: categoryLabel(registration.category) },
      { label: "Phone", value: registration.phoneNumber },
      { label: "Email", value: registration.email },
      { label: "Location", value: registration.countySubLocation },
      { label: "Registered On", value: formatLongDate(registration.registrationDate) },
      { label: "Payment Status", value: statusText, valueColor: statusColor },
    ],
    { x: MARGIN, y, width: width - MARGIN * 2 }
  );
  y -= 18;

  // ---------- Event details ----------
  para(`Event Date: ${EVENT_DATE}    ·    Venue: ${EVENT_VENUE}`, {
    font: fonts.bold,
    size: 11.5,
    color: BRAND.burgundy,
    after: 12,
  });

  // ---------- Important notes ----------
  para("Important:", { font: fonts.bold, size: 11, color: BRAND.burgundy, after: 3 });
  para("1.  Registration is completely free of charge — no payment is required to take part.", {
    size: 10.5,
    after: 2,
  });
  para("2.  Retain this letter as proof of registration; it will be requested at audition check-in.", {
    size: 10.5,
    after: 2,
  });
  para("3.  You will be contacted regarding audition dates and venues via the phone number above.", {
    size: 10.5,
    after: 16,
  });

  // ---------- Closing & authorised signature ----------
  para("Yours faithfully,", { size: 11.5, after: 52 });
  ensure(74);
  y = drawSignature(page, fonts, {
    x: MARGIN + 8,
    top: y + 48,
    lineWidth: 215,
    name: ORGANIZER_NAME,
    title: `Organising Committee — ${EVENT_NAME}`,
  });
  y -= 12;

  // ---------- Participant declaration box ----------
  const sigCols = isMinor ? 2 : 1;
  const boxH = 46 + (sigCols === 2 ? 58 : 50);
  ensure(boxH + 20);
  const boxY = y - boxH + 8;
  page.drawRectangle({
    x: MARGIN - 8,
    y: boxY,
    width: width - (MARGIN - 8) * 2,
    height: boxH,
    color: BRAND.burgundyTint,
    borderColor: BRAND.gold,
    borderWidth: 0.8,
  });
  let by = boxY + boxH - 20;
  page.drawText("PARTICIPANT DECLARATION", {
    x: MARGIN,
    y: by,
    size: 10,
    font: fonts.bold,
    color: BRAND.burgundy,
  });
  by -= 14;
  const declLines = wrapText(
    fonts.regular,
    "I confirm that the information provided above is true and accurate, and I accept the terms and " +
      "conditions of the event as published by the organising committee.",
    9.5,
    width - MARGIN * 2 - 16
  );
  for (const dl of declLines) {
    page.drawText(dl, { x: MARGIN, y: by, size: 9.5, font: fonts.regular, color: BRAND.ink });
    by -= 12;
  }
  by -= 4;

  const colGap = sigCols === 2 ? 30 : 0;
  const colW = (width - MARGIN * 2 - colGap) / sigCols;
  const drawSigCol = (x: number, label: string) => {
    const lineY = by + 2;
    page.drawLine({
      start: { x, y: lineY },
      end: { x: x + colW - 10, y: lineY },
      thickness: 0.8,
      color: BRAND.ink,
    });
    page.drawText(`${label} Signature`, {
      x,
      y: lineY - 11,
      size: 8,
      font: fonts.sans,
      color: BRAND.grey,
    });
    const dateX = x + colW * 0.5;
    page.drawLine({
      start: { x: dateX, y: lineY - 28 },
      end: { x: x + colW - 10, y: lineY - 28 },
      thickness: 0.8,
      color: BRAND.ink,
    });
    page.drawText("Date", {
      x: dateX,
      y: lineY - 39,
      size: 8,
      font: fonts.sans,
      color: BRAND.grey,
    });
  };
  drawSigCol(MARGIN, "Participant");
  if (sigCols === 2) drawSigCol(MARGIN + colW + colGap, "Parent / Guardian");
  y = boxY - 16;

  drawFooter(page, fonts);

  const pdfBytes = await pdfDoc.save();
  const fileName = `registration-${registration.id}-${Date.now()}.pdf`;
  return await storagePut(fileName, Buffer.from(pdfBytes), "application/pdf");
}

// ============ Parental / guardian consent ============

export async function generateParentalConsentPDF(
  registration: Registration
): Promise<{ url: string; key: string }> {
  const pdfDoc = await PDFDocument.create();
  const fonts = await loadFonts(pdfDoc);
  const { width, height } = a4();
  const page = pdfDoc.addPage([width, height]);
  drawPageFrame(page);
  let y = drawLetterhead(page, fonts) - 10;

  const regNo = `REG-${String(registration.id).padStart(3, "0")}`;

  drawCenteredText(page, "PARENTAL / GUARDIAN CONSENT FORM", fonts.bold, 18, BRAND.burgundy, y);
  y -= 16;
  page.drawLine({
    start: { x: width / 2 - 140, y: y + 6 },
    end: { x: width / 2 + 140, y: y + 6 },
    thickness: 1,
    color: BRAND.gold,
  });
  y -= 26;

  const dateText = `Date: ${formatLongDate(new Date())}`;
  const refText = `Ref: ${regNo}`;
  page.drawText(dateText, { x: MARGIN, y, size: 10.5, font: fonts.regular, color: BRAND.grey });
  page.drawText(refText, {
    x: width - MARGIN - textWidth(fonts.regular, refText, 10.5),
    y,
    size: 10.5,
    font: fonts.regular,
    color: BRAND.grey,
  });
  y -= 32;

  y = drawKeyValueRows(
    page,
    fonts,
    [
      { label: "Contestant", value: registration.fullName },
      { label: "Category", value: categoryLabel(registration.category) },
      { label: "Registration No.", value: regNo },
      { label: "Event", value: EVENT_NAME },
      { label: "Event Date & Venue", value: `${EVENT_DATE} — ${EVENT_VENUE}` },
    ],
    { x: MARGIN, y, width: width - MARGIN * 2 }
  );
  y -= 26;

  const consent =
    `I, the parent or legal guardian of ${registration.fullName}, hereby grant permission for the ` +
    `minor named above to participate in the Models Call Out and all related activities of ${EVENT_NAME}. ` +
    "I confirm that I have read and accept the terms and conditions published by the organising " +
    "committee, and I understand that this consent covers participation, photography and the use " +
    "of event images as described in the event's data-processing notice.";
  for (const cl of wrapText(fonts.regular, consent, 11, width - MARGIN * 2)) {
    page.drawText(cl, { x: MARGIN, y, size: 11, font: fonts.regular, color: BRAND.ink });
    y -= 15.5;
  }
  y -= 34;

  const colW = (width - MARGIN * 2 - 40) / 2;
  const columns = [
    { x: MARGIN, label: "Parent / Guardian" },
    { x: MARGIN + colW + 40, label: "Witness (optional)" },
  ];
  for (const col of columns) {
    page.drawLine({
      start: { x: col.x, y },
      end: { x: col.x + colW, y },
      thickness: 0.9,
      color: BRAND.ink,
    });
    page.drawText(col.label, { x: col.x, y: y - 13, size: 9, font: fonts.sans, color: BRAND.grey });
    const dateX = col.x + colW * 0.62;
    page.drawLine({
      start: { x: dateX, y: y - 36 },
      end: { x: col.x + colW, y: y - 36 },
      thickness: 0.9,
      color: BRAND.ink,
    });
    page.drawText("Date", { x: dateX, y: y - 49, size: 9, font: fonts.sans, color: BRAND.grey });
  }
  y -= 74;

  const note =
    "This consent form must be presented together with the participant's registration letter at check-in.";
  let ny = y;
  for (const nl of wrapText(fonts.italic, note, 10, width - MARGIN * 2 - 140)) {
    page.drawText(nl, { x: MARGIN, y: ny, size: 10, font: fonts.italic, color: BRAND.grey });
    ny -= 13;
  }
  drawSeal(page, fonts, { cx: width - MARGIN - 46, cy: y - 12, r: 42 });

  drawFooter(page, fonts);

  const pdfBytes = await pdfDoc.save();
  const fileName = `consent-${registration.id}-${Date.now()}.pdf`;
  const { url, key } = await storagePut(
    `consent/${fileName}`,
    Buffer.from(pdfBytes),
    "application/pdf"
  );
  return { url, key };
}
