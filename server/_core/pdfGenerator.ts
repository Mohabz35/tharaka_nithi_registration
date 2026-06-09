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

  const drawText = (text: string, font = timesRomanFont, size = fontSize, offset = 20) => {
    page.drawText(text, {
      x: margin,
      y: cursorY,
      size,
      font,
      color: rgb(0, 0, 0),
    });
    cursorY -= offset;
  };

  // Header
  drawText("REGISTRATION CONFIRMATION", timesBoldFont, 18, 30);
  drawText("Mr & Miss Face of Tharaka-Nithi County 2026", timesRomanFont, 14, 30);
  
  drawText("========================================", timesRomanFont, 12, 20);

  // Participant Details
  drawText("PARTICIPANT DETAILS", timesBoldFont, 14, 20);
  drawText(`Name: ${registration.fullName}`);
  drawText(`Date of Birth: ${registration.dateOfBirth}`);
  drawText(`Age: ${registration.age}`);
  drawText(`Category: ${categoryLabel}`);
  drawText(`Phone: ${registration.phoneNumber}`);
  drawText(`Email: ${registration.email}`);
  drawText(`County Sub-Location: ${registration.countySubLocation}`);
  
  cursorY -= 10;
  drawText("========================================", timesRomanFont, 12, 20);

  // Registration Info
  drawText("REGISTRATION INFORMATION", timesBoldFont, 14, 20);
  drawText(`Registration Date: ${new Date(registration.registrationDate).toLocaleDateString()}`);
  drawText(`Payment Status: ${registration.paymentStatus}`);
  
  cursorY -= 10;
  drawText("========================================", timesRomanFont, 12, 20);

  // Next steps
  drawText("NEXT STEPS", timesBoldFont, 14, 20);
  drawText("1. Complete M-PESA payment to confirm your registration");
  drawText("2. Paybill Number: 522522");
  drawText("3. Account Name: ROYALS2026");
  drawText(`4. Amount: ${
    registration.category === "adults"
      ? "KSh 1,000"
      : registration.category === "teens"
        ? "KSh 500"
        : "KSh 300"
  }`);

  cursorY -= 10;
  drawText("========================================", timesRomanFont, 12, 20);
  
  // Physical Signature Section
  drawText("OFFICIAL DECLARATION & SIGNATURE", timesBoldFont, 14, 25);
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
