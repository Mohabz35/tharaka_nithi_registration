import { describe, expect, it } from "vitest";
import { PDFDocument, rgb } from "pdf-lib";
import {
  BRAND,
  drawCrown,
  drawFooter,
  drawKeyValueRows,
  drawLetterhead,
  drawPageFrame,
  drawSeal,
  drawSignature,
  drawStamp,
  fitFontSize,
  kesInWords,
  loadFonts,
  numberToWords,
  textWidth,
  wrapText,
} from "./_core/pdfLayout.js";
import { buildCsv, csvEscapeCell } from "../shared/csv.js";

describe("wrapText", () => {
  it("wraps long text at word boundaries", async () => {
    const doc = await PDFDocument.create();
    const fonts = await loadFonts(doc);
    const text =
      "We are pleased to confirm that your entry for the Models Call Out has been received.";
    const lines = wrapText(fonts.regular, text, 11, 200);
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.join(" ")).toBe(text);
    for (const line of lines) {
      expect(textWidth(fonts.regular, line, 11)).toBeLessThanOrEqual(200);
    }
  });

  it("keeps short text on a single line and honours explicit newlines", async () => {
    const doc = await PDFDocument.create();
    const fonts = await loadFonts(doc);
    expect(wrapText(fonts.regular, "Dear Jane,", 11, 400)).toEqual(["Dear Jane,"]);
    expect(wrapText(fonts.regular, "line one\nline two", 11, 400)).toEqual(["line one", "line two"]);
  });
});

describe("fitFontSize", () => {
  it("returns the max size when the text already fits", async () => {
    const doc = await PDFDocument.create();
    const fonts = await loadFonts(doc);
    expect(fitFontSize(fonts.bold, "Short", 400, 24, 8)).toBe(24);
  });

  it("shrinks until the text fits the width", async () => {
    const doc = await PDFDocument.create();
    const fonts = await loadFonts(doc);
    const name = "Miss Face of Tharaka-Nithi County Amina Kilonzo-Mwangi";
    const size = fitFontSize(fonts.bold, name, 210, 26, 8);
    expect(size).toBeLessThan(26);
    expect(textWidth(fonts.bold, name, size)).toBeLessThanOrEqual(210);
  });
});

describe("numberToWords / kesInWords", () => {
  it("converts common amounts", () => {
    expect(numberToWords(0)).toBe("Zero");
    expect(numberToWords(5)).toBe("Five");
    expect(numberToWords(15)).toBe("Fifteen");
    expect(numberToWords(21)).toBe("Twenty-One");
    expect(numberToWords(115)).toBe("One Hundred and Fifteen");
    expect(numberToWords(1000)).toBe("One Thousand");
    expect(numberToWords(2500)).toBe("Two Thousand Five Hundred");
    expect(numberToWords(1234)).toBe("One Thousand Two Hundred and Thirty-Four");
    expect(numberToWords(1_000_000)).toBe("One Million");
  });

  it("appends the shilling wording", () => {
    expect(kesInWords(1000)).toBe("One Thousand Shillings Only");
  });
});

describe("drawing smoke (no storage / network)", () => {
  it("renders a page using every shared ornament without throwing", async () => {
    const doc = await PDFDocument.create();
    const fonts = await loadFonts(doc);
    const page = doc.addPage([595.28, 841.89]);

    drawPageFrame(page);
    const y = drawLetterhead(page, fonts);
    expect(y).toBeLessThan(842);

    drawKeyValueRows(
      page,
      fonts,
      [
        { label: "Participant", value: 'Jane "JJ" Wanjiku, Snr' },
        { label: "Fee", value: "KES 1,000", valueColor: BRAND.gold },
      ],
      { x: 56, y: y - 20, width: 483 }
    );

    drawCrown(page, 300, 500, 70);
    drawSignature(page, fonts, {
      x: 56,
      top: 460,
      lineWidth: 215,
      name: "Royals Icon Events",
      title: "Organising Committee",
    });
    drawSeal(page, fonts, { cx: 120, cy: 320, r: 42 });
    drawStamp(page, fonts, {
      x: 360,
      y: 300,
      main: "PAID",
      sub: "IN FULL",
      color: BRAND.green,
    });
    drawFooter(page, fonts);

    const bytes = await doc.save();
    expect(bytes.byteLength).toBeGreaterThan(1000);
    expect(Buffer.from(bytes).subarray(0, 5).toString()).toBe("%PDF-");
  });
});

describe("csv builder", () => {
  it("escapes quotes, commas and newlines per RFC 4180", () => {
    expect(csvEscapeCell("plain")).toBe("plain");
    expect(csvEscapeCell("has,comma")).toBe('"has,comma"');
    expect(csvEscapeCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvEscapeCell("line\nbreak")).toBe('"line\nbreak"');
    expect(csvEscapeCell(null)).toBe("");
    expect(csvEscapeCell(undefined)).toBe("");
    expect(csvEscapeCell(42)).toBe("42");
  });

  it("builds BOM + CRLF output with a header row", () => {
    const csv = buildCsv(["Name", "Note"], [["Jane", 'A, "quoted" value'], ["John", null]]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("Name,Note\r\n");
    expect(csv).toContain('Jane,"A, ""quoted"" value"');
    expect(csv).toContain("John,\r\n");
    expect(csv.endsWith("\r\n")).toBe(true);
  });
});
