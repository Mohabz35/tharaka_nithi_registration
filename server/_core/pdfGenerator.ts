import { storagePut } from "../storage.js";
import type { Registration } from "../../drizzle/schema";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export async function generateRegistrationPDF(registration: Registration): Promise<{ url: string; key: string }> {
  const categoryLabel =
    registration.category === "adults"
      ? "Adults (18-26)"
      : registration.category === "teens"
        ? "Teens (13-17)"
        : "Little Stars (5-12)";

  // Create a new PDFDocument
  const pdfDoc = await PDFDocument.create();
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  const fontSize = 12;
  const margin = 50;

  let cursorY = height - margin;

  // Colors
  const burgundy = rgb(0.29, 0.1, 0.16);
  const gold = rgb(0.83, 0.68, 0.22);
  const black = rgb(0, 0, 0);

  // Borders
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
    borderColor: burgundy,
    borderWidth: 2,
  });

  const drawText = (text: string, font = timesRomanFont, size = fontSize, offset = 20, color = black) => {
    page.drawText(text, {
      x: margin,
      y: cursorY,
      size,
      font,
      color,
    });
    cursorY -= offset;
  };

  // Header
  drawText("REGISTRATION CONFIRMATION", timesBoldFont, 22, 30, gold);
  drawText("Mr & Miss Face of Tharaka-Nithi County 2026", timesBoldFont, 16, 40, burgundy);

  // Participant Details
  drawText("PARTICIPANT DETAILS", timesBoldFont, 14, 25, burgundy);
  drawText(`Name: ${registration.fullName}`);
  drawText(`Date of Birth: ${registration.dateOfBirth}`);
  drawText(`Age: ${registration.age}`);
  drawText(`Category: ${categoryLabel}`);
  drawText(`Phone: ${registration.phoneNumber}`);
  drawText(`Email: ${registration.email}`);
  drawText(`County Sub-Location: ${registration.countySubLocation}`);
  
  cursorY -= 15;

  // Registration Info
  drawText("REGISTRATION INFORMATION", timesBoldFont, 14, 25, burgundy);
  drawText(`Registration Date: ${new Date(registration.registrationDate).toLocaleDateString()}`);
  drawText(`Payment Status: FREE`);
  
  cursorY -= 15;

  // Next steps
  drawText("IMPORTANT INFORMATION", timesBoldFont, 14, 25, burgundy);
  drawText("1. Registration is completely FREE of charge.", timesBoldFont, 12, 20, black);
  drawText("2. Keep this document safe as proof of your registration.", timesRomanFont, 12, 20, black);
  drawText("3. You will be contacted regarding audition dates and venues.", timesRomanFont, 12, 20, black);

  cursorY -= 20;
  
  // Physical Signature Section
  drawText("OFFICIAL DECLARATION & SIGNATURE", timesBoldFont, 14, 25, burgundy);
  drawText("I confirm that the information provided above is true and accurate. I agree to");
  drawText("the terms and conditions of Mr & Miss Face of Tharaka-Nithi County 2026.");
  
  cursorY -= 30;
  drawText("Signature: ___________________________        Date: ____________________");
  
  if (registration.category !== "adults") {
    cursorY -= 30;
    drawText("Parent/Guardian Signature: __________________   Date: ____________________");
  }

  // Serialize the PDFDocument to bytes (a Uint8Array)
  const pdfBytes = await pdfDoc.save();

  // Convert Uint8Array to Buffer
  const pdfBuffer = Buffer.from(pdfBytes);

  // Upload to S3
  const fileName = `registration-${registration.id}-${Date.now()}.pdf`;
  const result = await storagePut(fileName, pdfBuffer, "application/pdf");

  return result;
}

export async function generateParentalConsentPDF(registration: Registration): Promise<{ url: string; key: string }> {
  // We can just reuse the main PDF since it has the parent signature block now.
  // Returning dummy or generating a specific one.
  const pdfDoc = await PDFDocument.create();
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  
  page.drawText("PARENTAL CONSENT FORM", { x: 50, y: height - 50, size: 18, font: timesBoldFont });
  page.drawText(`Participant Name: ${registration.fullName}`, { x: 50, y: height - 80, size: 12, font: timesRomanFont });
  page.drawText("I hereby grant permission for the above minor to participate.", { x: 50, y: height - 110, size: 12, font: timesRomanFont });
  
  page.drawText("Parent/Guardian Signature: ___________________________ Date: _____________", { x: 50, y: height - 160, size: 12, font: timesRomanFont });
  
  const pdfBytes = await pdfDoc.save();
  const fileName = `consent-${registration.id}-${Date.now()}.pdf`;
  const result = await storagePut(fileName, Buffer.from(pdfBytes), "application/pdf");
  return result;
}
