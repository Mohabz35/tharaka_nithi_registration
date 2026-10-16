import { PDFDocument, PDFPage, PDFFont, rgb, degrees, StandardFonts } from "pdf-lib";
import {
  EVENT_DATE,
  EVENT_NAME,
  EVENT_VENUE,
  ORGANIZER_NAME,
  SOCIAL_HANDLE,
  SUPPORT_EMAIL,
} from "../../shared/const.js";

// ============ Brand palette ============
export const BRAND = {
  burgundy: rgb(0.29, 0.1, 0.16),
  burgundyDeep: rgb(0.16, 0.05, 0.09),
  burgundyTint: rgb(0.98, 0.96, 0.96),
  gold: rgb(0.83, 0.68, 0.22),
  goldBright: rgb(1, 0.87, 0.5),
  goldDark: rgb(0.55, 0.4, 0.08),
  ink: rgb(0.12, 0.1, 0.1),
  grey: rgb(0.42, 0.42, 0.42),
  lightLine: rgb(0.82, 0.82, 0.82),
  white: rgb(1, 1, 1),
  green: rgb(0.1, 0.5, 0.25),
  orange: rgb(0.78, 0.42, 0.08),
  signatureInk: rgb(0.1, 0.14, 0.35),
} as const;

export const A4 = { width: 595.28, height: 841.89 } as const;

export interface DocFonts {
  regular: PDFFont;
  bold: PDFFont;
  italic: PDFFont;
  boldItalic: PDFFont;
  sans: PDFFont;
  sansBold: PDFFont;
}

export async function loadFonts(pdfDoc: PDFDocument): Promise<DocFonts> {
  const [regular, bold, italic, boldItalic, sans, sansBold] = await Promise.all([
    pdfDoc.embedFont(StandardFonts.TimesRoman),
    pdfDoc.embedFont(StandardFonts.TimesRomanBold),
    pdfDoc.embedFont(StandardFonts.TimesRomanItalic),
    pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic),
    pdfDoc.embedFont(StandardFonts.Helvetica),
    pdfDoc.embedFont(StandardFonts.HelveticaBold),
  ]);
  return { regular, bold, italic, boldItalic, sans, sansBold };
}

// ============ Text metrics / layout primitives ============

export function textWidth(font: PDFFont, text: string, size: number): number {
  try {
    return font.widthOfTextAtSize(text, size);
  } catch {
    // WinAnsi fonts throw on unsupported glyphs — approximate so layout never crashes
    return text.length * size * 0.5;
  }
}

export function fitFontSize(
  font: PDFFont,
  text: string,
  maxWidth: number,
  maxSize: number,
  minSize = 6
): number {
  let size = maxSize;
  while (size > minSize && textWidth(font, text, size) > maxWidth) {
    size -= 0.5;
  }
  return size;
}

export function wrapText(font: PDFFont, text: string, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const para of String(text).split("\n")) {
    const words = para.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push("");
      continue;
    }
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (line && textWidth(font, candidate, size) > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

export function centerTextX(font: PDFFont, text: string, size: number, pageWidth: number): number {
  return (pageWidth - textWidth(font, text, size)) / 2;
}

export function drawCentered(
  page: PDFPage,
  text: string,
  font: PDFFont,
  size: number,
  color: ReturnType<typeof rgb>,
  y: number
): number {
  const { width } = page.getSize();
  const fitted = fitFontSize(font, text, width - 100, size);
  page.drawText(text, {
    x: centerTextX(font, text, fitted, width),
    y,
    size: fitted,
    font,
    color,
  });
  return textWidth(font, text, fitted);
}

export interface ParagraphOptions {
  font: PDFFont;
  size: number;
  color: ReturnType<typeof rgb>;
  x: number;
  y: number;
  maxWidth: number;
  lineHeight?: number;
}

/** Draws a wrapped paragraph; returns the y of the next free line (below the last). */
export function drawParagraph(page: PDFPage, text: string, opts: ParagraphOptions): number {
  const lineHeight = opts.lineHeight ?? opts.size * 1.35;
  const lines = wrapText(opts.font, text, opts.size, opts.maxWidth);
  let y = opts.y;
  for (const line of lines) {
    page.drawText(line, { x: opts.x, y, size: opts.size, font: opts.font, color: opts.color });
    y -= lineHeight;
  }
  return y;
}

/** Right-aligned value rows with hairline separators. Returns the next free y. */
export function drawKeyValueRows(
  page: PDFPage,
  fonts: DocFonts,
  rows: Array<{ label: string; value: string; valueColor?: ReturnType<typeof rgb> }>,
  opts: { x: number; y: number; width: number; rowHeight?: number }
): number {
  const rowHeight = opts.rowHeight ?? 18;
  let y = opts.y;
  for (const row of rows) {
    page.drawText(row.label, {
      x: opts.x,
      y,
      size: 10.5,
      font: fonts.regular,
      color: BRAND.grey,
    });
    const valueSize = fitFontSize(fonts.bold, row.value, opts.width * 0.6, 11.5, 8);
    const vw = textWidth(fonts.bold, row.value, valueSize);
    page.drawText(row.value, {
      x: opts.x + opts.width - vw,
      y,
      size: valueSize,
      font: fonts.bold,
      color: row.valueColor ?? BRAND.ink,
    });
    y -= rowHeight;
    page.drawLine({
      start: { x: opts.x, y: y + rowHeight - 6 },
      end: { x: opts.x + opts.width, y: y + rowHeight - 6 },
      thickness: 0.5,
      color: BRAND.lightLine,
    });
  }
  return y;
}

// ============ Page furniture ============

export function drawPageFrame(
  page: PDFPage,
  opts: { inset?: number; color?: ReturnType<typeof rgb>; thickness?: number } = {}
) {
  const { width, height } = page.getSize();
  const inset = opts.inset ?? 28;
  const color = opts.color ?? BRAND.burgundy;
  page.drawRectangle({
    x: inset,
    y: inset,
    width: width - inset * 2,
    height: height - inset * 2,
    borderColor: color,
    borderWidth: opts.thickness ?? 1,
  });
  page.drawRectangle({
    x: inset + 5,
    y: inset + 5,
    width: width - (inset + 5) * 2,
    height: height - (inset + 5) * 2,
    borderColor: BRAND.gold,
    borderWidth: 0.6,
  });
}

/** Burgundy letterhead band used on light documents. Returns the first free y below it. */
export function drawLetterhead(page: PDFPage, fonts: DocFonts, contactLine?: string): number {
  const { width, height } = page.getSize();
  const bandH = 100;
  page.drawRectangle({ x: 0, y: height - bandH, width, height: bandH, color: BRAND.burgundy });
  page.drawRectangle({ x: 0, y: height - bandH, width, height: 3.5, color: BRAND.gold });

  drawCentered(page, ORGANIZER_NAME, fonts.bold, 17, BRAND.gold, height - 40);
  drawCentered(page, EVENT_NAME, fonts.regular, 12, BRAND.white, height - 62);
  drawCentered(
    page,
    contactLine ?? `@${SOCIAL_HANDLE}   ·   ${SUPPORT_EMAIL}`,
    fonts.sans,
    8.5,
    BRAND.goldBright,
    height - 82
  );
  return height - bandH - 22;
}

export function drawFooter(page: PDFPage, fonts: DocFonts, y = 70): void {
  const { width } = page.getSize();
  const margin = 56;
  page.drawLine({
    start: { x: margin, y: y + 16 },
    end: { x: width - margin, y: y + 16 },
    thickness: 0.8,
    color: BRAND.gold,
  });
  drawCentered(page, `${EVENT_DATE}  ·  ${EVENT_VENUE}  ·  ${SUPPORT_EMAIL}`, fonts.sans, 8, BRAND.grey, y);
}

/** Slim header for continuation pages of multi-page letters. */
export function drawContinuationHeader(page: PDFPage, fonts: DocFonts, pageNum: number): number {
  const { width } = page.getSize();
  const margin = 56;
  drawCentered(page, `${ORGANIZER_NAME} — ${EVENT_NAME}`, fonts.regular, 9.5, BRAND.burgundy, 790);
  page.drawText(`Page ${pageNum}`, {
    x: width - margin - textWidth(fonts.sans, `Page ${pageNum}`, 8),
    y: 774,
    size: 8,
    font: fonts.sans,
    color: BRAND.grey,
  });
  page.drawLine({
    start: { x: margin, y: 786 },
    end: { x: width - margin, y: 786 },
    thickness: 0.8,
    color: BRAND.gold,
  });
  return 760;
}

// ============ Ornament: crown, star, seal ============

const CROWN_PATH = "M 0 38 L 3 2 L 20 22 L 32 0 L 44 22 L 61 2 L 64 38 Z M -2 38 L 66 38 L 66 46 L -2 46 Z";

/** Draws a small crown centred at cx with its base at bottomY. */
export function drawCrown(
  page: PDFPage,
  cx: number,
  bottomY: number,
  width: number,
  fill: ReturnType<typeof rgb> = BRAND.gold
): void {
  const scale = width / 64;
  page.drawSvgPath(CROWN_PATH, {
    x: cx - width / 2,
    y: bottomY + 46 * scale,
    scale,
    color: fill,
    borderColor: BRAND.goldBright,
    borderWidth: 0.6,
  });
}

function starPath(cx: number, cy: number, outer: number, inner: number, points = 5): string {
  let d = "";
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / points;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    d += `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)} `;
  }
  return `${d}Z`;
}

export function drawSeal(
  page: PDFPage,
  fonts: DocFonts,
  opts: {
    cx: number;
    cy: number;
    r?: number;
    orgLine?: string;
    textColor?: ReturnType<typeof rgb>;
  }
): void {
  const r = opts.r ?? 44;
  const { cx, cy } = opts;
  const textColor = opts.textColor ?? BRAND.goldDark;
  page.drawCircle({ x: cx, y: cy, size: r, borderColor: BRAND.gold, borderWidth: 2.2 });
  page.drawCircle({ x: cx, y: cy, size: r - 5, borderColor: BRAND.goldDark, borderWidth: 0.9 });

  // Star at the top of the seal (SVG y-down: above centre means smaller y in svg space)
  const starR = r * 0.22;
  page.drawSvgPath(starPath(0, 0, starR, starR * 0.45), {
    x: cx,
    y: cy + r * 0.42 + starR,
    scale: 1,
    color: BRAND.gold,
    borderColor: BRAND.goldDark,
    borderWidth: 0.4,
  });

  const orgLine = opts.orgLine ?? ORGANIZER_NAME.toUpperCase();
  drawCentered(page, orgLine, fonts.sansBold, r > 40 ? 6.2 : 5.4, textColor, cy + r * 0.16);
  page.drawLine({
    start: { x: cx - r * 0.55, y: cy + r * 0.06 },
    end: { x: cx + r * 0.55, y: cy + r * 0.06 },
    thickness: 0.5,
    color: textColor,
  });
  drawCentered(page, "OFFICIAL SEAL", fonts.sansBold, r > 40 ? 8 : 6.8, textColor, cy - r * 0.22);
}

// ============ Signature block ============

/** Handwritten-style signature flourish, authored in a 150 × 48 SVG box (y-down). */
export const SIGNATURE_PATH =
  "M 2 38 C 12 8 22 42 36 28 C 44 20 48 38 60 32 C 70 27 72 10 86 20 C 94 26 96 38 110 34 C 122 30 126 12 148 24 M 14 42 C 44 48 96 46 142 36";

/**
 * Draws a signature flourish above a ruled line, with the signatory's printed
 * name and title underneath. Returns the next free y below the block.
 */
export function drawSignature(
  page: PDFPage,
  fonts: DocFonts,
  opts: {
    x: number;
    top: number;
    lineWidth?: number;
    name: string;
    title?: string;
    ink?: ReturnType<typeof rgb>;
    ruleColor?: ReturnType<typeof rgb>;
    nameColor?: ReturnType<typeof rgb>;
    titleColor?: ReturnType<typeof rgb>;
    align?: "left" | "center";
  }
): number {
  const lineWidth = opts.lineWidth ?? 200;
  const ink = opts.ink ?? BRAND.signatureInk;
  const boxW = 150;
  const boxH = 48;
  const scale = (lineWidth * 0.62) / boxW;
  const sigX = opts.align === "center" ? opts.x + (lineWidth - boxW * scale) / 2 : opts.x + 6;

  page.drawSvgPath(SIGNATURE_PATH, {
    x: sigX,
    y: opts.top,
    scale,
    borderColor: ink,
    borderWidth: 1.5,
  });

  const baselineY = opts.top - boxH * scale - 6;
  page.drawLine({
    start: { x: opts.x, y: baselineY },
    end: { x: opts.x + lineWidth, y: baselineY },
    thickness: 0.9,
    color: opts.ruleColor ?? BRAND.ink,
  });

  const centre = opts.x + lineWidth / 2;
  const nameSize = fitFontSize(fonts.bold, opts.name, lineWidth, 11.5, 8);
  page.drawText(opts.name, {
    x: centre - textWidth(fonts.bold, opts.name, nameSize) / 2,
    y: baselineY - 14,
    size: nameSize,
    font: fonts.bold,
    color: opts.nameColor ?? BRAND.ink,
  });
  if (opts.title) {
    const titleSize = fitFontSize(fonts.sans, opts.title, lineWidth, 8.5, 6.5);
    page.drawText(opts.title, {
      x: centre - textWidth(fonts.sans, opts.title, titleSize) / 2,
      y: baselineY - 26,
      size: titleSize,
      font: fonts.sans,
      color: opts.titleColor ?? BRAND.grey,
    });
  }
  return baselineY - 34;
}

// ============ Status stamp (receipts) ============

export function drawStamp(
  page: PDFPage,
  fonts: DocFonts,
  opts: {
    x: number;
    y: number;
    main: string;
    sub?: string;
    color: ReturnType<typeof rgb>;
    width?: number;
    height?: number;
  }
): void {
  const w = opts.width ?? 130;
  const h = opts.height ?? 58;
  const angle = degrees(-12);
  page.drawRectangle({
    x: opts.x,
    y: opts.y,
    width: w,
    height: h,
    borderColor: opts.color,
    borderWidth: 2.4,
    rotate: angle,
    opacity: 0.85,
  });
  page.drawRectangle({
    x: opts.x + 5,
    y: opts.y + 5,
    width: w - 10,
    height: h - 10,
    borderColor: opts.color,
    borderWidth: 0.8,
    rotate: angle,
    opacity: 0.85,
  });
  const mainSize = fitFontSize(fonts.sansBold, opts.main, w - 22, 24, 12);
  page.drawText(opts.main, {
    x: opts.x + (w - textWidth(fonts.sansBold, opts.main, mainSize)) / 2,
    y: opts.y + h - mainSize - 10,
    size: mainSize,
    font: fonts.sansBold,
    color: opts.color,
    rotate: angle,
    opacity: 0.9,
  });
  if (opts.sub) {
    const subSize = fitFontSize(fonts.sans, opts.sub, w - 20, 9, 6.5);
    page.drawText(opts.sub, {
      x: opts.x + (w - textWidth(fonts.sans, opts.sub, subSize)) / 2,
      y: opts.y + 12,
      size: subSize,
      font: fonts.sans,
      color: opts.color,
      rotate: angle,
      opacity: 0.9,
    });
  }
}

// ============ Amount in words ============

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen",
  "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function under100(n: number): string {
  if (n < 20) return ONES[n];
  const t = TENS[Math.floor(n / 10)];
  const o = ONES[n % 10];
  return o ? `${t}-${o}` : t;
}

function under1000(n: number): string {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  const parts: string[] = [];
  if (h) parts.push(`${ONES[h]} Hundred`);
  if (rest) parts.push(h ? `and ${under100(rest)}` : under100(rest));
  return parts.join(" ");
}

/** Integer amount in words, e.g. 1500 -> "One Thousand Five Hundred". */
export function numberToWords(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "";
  n = Math.floor(n);
  if (n === 0) return "Zero";
  const parts: string[] = [];
  const millions = Math.floor(n / 1_000_000);
  n %= 1_000_000;
  const thousands = Math.floor(n / 1000);
  n %= 1000;
  if (millions) parts.push(`${under1000(millions)} Million`);
  if (thousands) parts.push(`${under1000(thousands)} Thousand`);
  if (n) parts.push(under1000(n));
  return parts.join(" ");
}

export function kesInWords(amount: number): string {
  return `${numberToWords(amount)} Shillings Only`;
}

// ============ Misc helpers ============

export function formatLongDate(date: Date | string | number): string {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatShortDate(date: Date | string | number): string {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
