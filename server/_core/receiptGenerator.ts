import { PDFDocument, PDFPage, rgb } from "pdf-lib";
import { storagePut } from "../storage.js";
import { EVENT_DATE, EVENT_NAME, EVENT_VENUE, ORGANIZER_NAME, SUPPORT_EMAIL } from "../../shared/const.js";
import {
  BRAND,
  drawFooter,
  drawKeyValueRows,
  drawPageFrame,
  drawSeal,
  drawSignature,
  drawStamp,
  fitFontSize,
  formatLongDate,
  kesInWords,
  loadFonts,
  textWidth,
  wrapText,
} from "./pdfLayout.js";

export interface RegistrationReceiptData {
  registrationId: string;
  fullName: string;
  registrationDate: Date;
  feeKes: number; // 0 when no fee is configured
  paymentStatus: "pending" | "completed";
}

const MARGIN = 64;

export async function generateRegistrationReceiptPDF(
  data: RegistrationReceiptData
): Promise<{ url: string; key: string }> {
  const pdfDoc = await PDFDocument.create();
  const fonts = await loadFonts(pdfDoc);

  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();
  drawPageFrame(page, { inset: 30 });

  const recNo = `REC-${data.registrationId.replace(/^REG-/, "")}`;
  const paid = data.paymentStatus === "completed";
  const hasFee = data.feeKes > 0;

  // ---------- Letterhead ----------
  let y = height - 150;
  drawCentered(page, ORGANIZER_NAME, fonts.bold, 20, BRAND.burgundy, y, width - 120);
  y -= 22;
  drawCentered(page, EVENT_NAME, fonts.regular, 12.5, BRAND.ink, y, width - 120);
  y -= 16;
  drawCentered(page, SUPPORT_EMAIL, fonts.sans, 8.5, BRAND.grey, y, width - 120);
  y -= 18;

  // Classic double rule under letterhead
  page.drawLine({
    start: { x: MARGIN - 10, y: y + 8 },
    end: { x: width - MARGIN + 10, y: y + 8 },
    thickness: 2.2,
    color: BRAND.gold,
  });
  page.drawLine({
    start: { x: MARGIN - 10, y: y + 3 },
    end: { x: width - MARGIN + 10, y: y + 3 },
    thickness: 0.7,
    color: BRAND.burgundy,
  });
  y -= 30;

  // ---------- Title ----------
  drawCentered(page, "OFFICIAL RECEIPT", fonts.bold, 24, BRAND.burgundy, y, width - 120);
  y -= 16;
  drawCentered(
    page,
    "REGISTRATION FEE — MODELS CALL OUT",
    fonts.sansBold,
    9.5,
    BRAND.goldDark,
    y,
    width - 120
  );
  y -= 30;

  // ---------- Meta row ----------
  const metaLeft = `Receipt No: ${recNo}`;
  const metaRight = `Date of Issue: ${formatLongDate(new Date())}`;
  page.drawText(metaLeft, {
    x: MARGIN,
    y,
    size: 10.5,
    font: fonts.bold,
    color: BRAND.ink,
  });
  page.drawText(metaRight, {
    x: width - MARGIN - textWidth(fonts.regular, metaRight, 10.5),
    y,
    size: 10.5,
    font: fonts.regular,
    color: BRAND.grey,
  });
  y -= 24;
  page.drawLine({
    start: { x: MARGIN, y: y + 10 },
    end: { x: width - MARGIN, y: y + 10 },
    thickness: 0.6,
    color: BRAND.lightLine,
  });
  y -= 16;

  // ---------- Payer details ----------
  y = drawKeyValueRows(
    page,
    fonts,
    [
      { label: "Received From", value: data.fullName },
      { label: "Registration No.", value: data.registrationId, valueColor: BRAND.goldDark },
      {
        label: "Date of Registration",
        value: formatLongDate(data.registrationDate),
      },
    ],
    { x: MARGIN, y, width: width - MARGIN * 2 }
  );
  y -= 26;

  // ---------- Amount table ----------
  const tableX = MARGIN;
  const tableW = width - MARGIN * 2;
  const descW = tableW * 0.62;
  const amtW = tableW - descW;

  // Header row
  page.drawText("DESCRIPTION", {
    x: tableX,
    y,
    size: 9,
    font: fonts.sansBold,
    color: BRAND.grey,
  });
  const amtHeader = "AMOUNT (KES)";
  page.drawText(amtHeader, {
    x: tableX + tableW - textWidth(fonts.sansBold, amtHeader, 9),
    y,
    size: 9,
    font: fonts.sansBold,
    color: BRAND.grey,
  });
  y -= 8;
  page.drawLine({
    start: { x: tableX, y },
    end: { x: tableX + tableW, y },
    thickness: 1.2,
    color: BRAND.burgundy,
  });
  y -= 20;

  // Line item
  const itemText = `Registration Fee — ${EVENT_NAME}`;
  const itemLines = wrapText(fonts.regular, itemText, 11, descW - 10);
  let iy = y;
  for (const il of itemLines) {
    page.drawText(il, { x: tableX, y: iy, size: 11, font: fonts.regular, color: BRAND.ink });
    iy -= 14;
  }
  const amountText = hasFee ? data.feeKes.toLocaleString("en-GB") : "0";
  const amountSize = fitFontSize(fonts.bold, amountText, amtW - 10, 13, 9);
  page.drawText(amountText, {
    x: tableX + tableW - textWidth(fonts.bold, amountText, amountSize),
    y,
    size: amountSize,
    font: fonts.bold,
    color: BRAND.ink,
  });
  y = Math.min(iy, y) - 12;

  page.drawLine({
    start: { x: tableX, y },
    end: { x: tableX + tableW, y },
    thickness: 0.6,
    color: BRAND.lightLine,
  });
  y -= 22;

  // Total row
  page.drawText("TOTAL", {
    x: tableX,
    y,
    size: 13,
    font: fonts.bold,
    color: BRAND.burgundy,
  });
  const totalText = `KES ${data.feeKes.toLocaleString("en-GB")}`;
  const totalSize = fitFontSize(fonts.bold, totalText, amtW + descW * 0.4, 16, 10);
  page.drawText(totalText, {
    x: tableX + tableW - textWidth(fonts.bold, totalText, totalSize),
    y,
    size: totalSize,
    font: fonts.bold,
    color: BRAND.burgundy,
  });
  y -= 10;
  page.drawLine({
    start: { x: tableX, y },
    end: { x: tableX + tableW, y },
    thickness: 2,
    color: BRAND.gold,
  });
  y -= 20;

  // Amount in words
  if (hasFee) {
    const words = `Amount in words: ${kesInWords(data.feeKes)}`;
    for (const wl of wrapText(fonts.italic, words, 10.5, tableW)) {
      page.drawText(wl, { x: tableX, y, size: 10.5, font: fonts.italic, color: BRAND.grey });
      y -= 13;
    }
    y -= 8;
  }

  // ---------- Status stamp ----------
  const stampColor = paid ? BRAND.green : hasFee ? BRAND.orange : BRAND.goldDark;
  const stampMain = paid ? "PAID" : hasFee ? "PAYMENT DUE" : "REGISTERED";
  const stampSub = paid ? "IN FULL" : hasFee ? `DUE: KES ${data.feeKes.toLocaleString("en-GB")}` : "NO FEE";
  drawStamp(page, fonts, {
    x: width - MARGIN - 150,
    y: y - 66,
    main: stampMain,
    sub: stampSub,
    color: stampColor,
    width: 150,
    height: 62,
  });

  // ---------- Notes ----------
  let noteY = y;
  const notes = paid
    ? "Thank you. This receipt confirms that the registration fee has been received in full. " +
        "Please keep it for your records and present it at check-in if requested."
    : hasFee
      ? "Please settle the registration fee at the registration desk or via the payment link sent " +
          `to you. Quote receipt number ${recNo} when paying.`
      : "No registration fee is currently configured. This receipt confirms your registration for " +
          "the event.";
  for (const nl of wrapText(fonts.regular, notes, 10.5, tableW - 170)) {
    page.drawText(nl, { x: tableX, y: noteY, size: 10.5, font: fonts.regular, color: BRAND.ink });
    noteY -= 14;
  }

  // ---------- Received-by signature + seal ----------
  const sigWidth = 215;
  const sigX = width - MARGIN - sigWidth;
  let sigTop = y - 30;
  drawSignature(page, fonts, {
    x: sigX,
    top: sigTop,
    lineWidth: sigWidth,
    name: ORGANIZER_NAME,
    title: "Authorised Signatory",
  });
  drawSeal(page, fonts, { cx: MARGIN + 44, cy: sigTop - 54, r: 40 });

  drawFooter(page, fonts, 64);

  const pdfBytes = await pdfDoc.save();
  const fileName = `receipt_${data.registrationId}_${Date.now()}.pdf`;
  const { url, key } = await storagePut(`receipts/${fileName}`, Buffer.from(pdfBytes), "application/pdf");
  return { url, key };
}

function drawCentered(
  page: PDFPage,
  text: string,
  font: any,
  size: number,
  color: ReturnType<typeof rgb>,
  y: number,
  maxWidth: number
): void {
  const { width } = page.getSize();
  const fitted = fitFontSize(font, text, maxWidth, size);
  page.drawText(text, {
    x: (width - textWidth(font, text, fitted)) / 2,
    y,
    size: fitted,
    font,
    color,
  });
}
