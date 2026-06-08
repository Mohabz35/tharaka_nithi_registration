import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { storagePut } from "../storage";

export interface BootcampFormData {
  fullName: string;
  category: string;
  registrationId: string;
  phoneNumber: string;
  email: string;
  countySubLocation: string;
  age: number;
}

export async function generateBootcampForm(data: BootcampFormData): Promise<{ url: string; key: string }> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]);
  const { width, height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const bgColor = rgb(35/255, 8/255, 12/255);
  const gold = rgb(218/255, 165/255, 32/255);
  const white = rgb(1, 1, 1);

  // Background Header
  page.drawRectangle({
    x: 0,
    y: height - 120,
    width,
    height: 120,
    color: bgColor,
  });

  // Title
  page.drawText("BOOTCAMP ADMISSION FORM", {
    x: 50,
    y: height - 60,
    size: 24,
    font: fontBold,
    color: gold,
  });

  page.drawText("Mr & Miss Face of Tharaka-Nithi County 2026", {
    x: 50,
    y: height - 85,
    size: 14,
    font: fontRegular,
    color: white,
  });

  // Body
  let currentY = height - 160;

  const drawField = (label: string, value: string) => {
    page.drawText(label, { x: 50, y: currentY, size: 12, font: fontBold, color: bgColor });
    page.drawText(value, { x: 200, y: currentY, size: 12, font: fontRegular, color: rgb(0, 0, 0) });
    page.drawLine({ start: { x: 200, y: currentY - 5 }, end: { x: 550, y: currentY - 5 }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
    currentY -= 40;
  };

  drawField("Full Name:", data.fullName);
  drawField("Registration ID:", data.registrationId);
  drawField("Category:", data.category);
  drawField("Age:", data.age.toString());
  drawField("Phone Number:", data.phoneNumber);
  drawField("Email:", data.email);
  drawField("Location:", data.countySubLocation);

  currentY -= 20;
  page.drawText("BOOTCAMP REQUIREMENTS", { x: 50, y: currentY, size: 14, font: fontBold, color: bgColor });
  currentY -= 25;

  const requirements = [
    "1. Print and bring this form to the bootcamp venue.",
    "2. Valid National ID (Original and Photocopy).",
    "3. High heels (for ladies) and smart casual wear.",
    "4. Registration fee confirmation (if applicable).",
    "5. Commitment to attend all training sessions."
  ];

  requirements.forEach(req => {
    page.drawText(req, { x: 60, y: currentY, size: 11, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
    currentY -= 20;
  });

  currentY -= 40;
  page.drawText("DECLARATION", { x: 50, y: currentY, size: 14, font: fontBold, color: bgColor });
  currentY -= 25;
  page.drawText("I confirm that the information provided is accurate and I agree to abide by the event rules.", { x: 50, y: currentY, size: 11, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });

  currentY -= 60;
  page.drawLine({ start: { x: 50, y: currentY }, end: { x: 250, y: currentY }, thickness: 1, color: rgb(0, 0, 0) });
  page.drawText("Participant Signature", { x: 50, y: currentY - 15, size: 10, font: fontRegular });

  page.drawLine({ start: { x: 350, y: currentY }, end: { x: 550, y: currentY }, thickness: 1, color: rgb(0, 0, 0) });
  page.drawText("Date", { x: 350, y: currentY - 15, size: 10, font: fontRegular });

  const pdfBytes = await pdfDoc.save();
  const fileName = `bootcamp_form_${data.registrationId}.pdf`;
  const { url, key } = await storagePut(`bootcamp_forms/${fileName}`, Buffer.from(pdfBytes), "application/pdf");

  return { url, key };
}
