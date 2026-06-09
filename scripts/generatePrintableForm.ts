import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "fs";
import path from "path";

async function generateForm() {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  let y = 800;
  page.drawText("Printable Registration Form - Bootcamp", { x: 50, y, size: 20, font: boldFont });
  y -= 40;
  
  const fields = ["Full Name:", "Age:", "Date of Birth:", "Phone Number:", "Email Address:", "County Sub-Location:"];
  for (const field of fields) {
    page.drawText(field, { x: 50, y, size: 12, font });
    page.drawLine({ start: { x: 200, y }, end: { x: 500, y }, thickness: 1, color: rgb(0,0,0) });
    y -= 30;
  }
  
  const pdfBytes = await pdfDoc.save();
  const outDir = path.join(process.cwd(), "client/public");
  if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
  }
  fs.writeFileSync(path.join(outDir, "printable_form.pdf"), pdfBytes);
}

generateForm().catch(console.error);
