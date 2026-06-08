import { storagePut } from "../storage";
import type { Registration } from "../../drizzle/schema";

export async function generateRegistrationPDF(registration: Registration): Promise<{ url: string; key: string }> {
  const categoryLabel =
    registration.category === "adults"
      ? "Adults (18-26)"
      : registration.category === "teens"
        ? "Teens (13-17)"
        : "Little Stars (5-12)";

  const pdfContent = `REGISTRATION CONFIRMATION
Mr & Miss Face of Tharaka-Nithi County 2026

========================================

PARTICIPANT DETAILS
Name: ${registration.fullName}
Date of Birth: ${registration.dateOfBirth}
Age: ${registration.age}
Category: ${categoryLabel}
Phone: ${registration.phoneNumber}
Email: ${registration.email}
County Sub-Location: ${registration.countySubLocation}

========================================

REGISTRATION INFORMATION
Registration Date: ${new Date(registration.registrationDate).toLocaleDateString()}
Payment Status: ${registration.paymentStatus}

========================================

CONSENTS & AGREEMENTS
Photo/Video Usage Consent: ${registration.consentPhotoVideo ? "✓ Accepted" : "✗ Not Accepted"}
Data Processing Consent: ${registration.consentDataProcessing ? "✓ Accepted" : "✗ Not Accepted"}
Terms & Conditions: ${registration.consentTerms ? "✓ Accepted" : "✗ Not Accepted"}
${registration.parentalConsentSigned ? `Parental Consent (Minors): ✓ Signed` : ""}

========================================

NEXT STEPS
1. Complete M-PESA payment to confirm your registration
2. Paybill Number: 522522
3. Account Name: ROYALS2026
4. Amount: ${
    registration.category === "adults"
      ? "KSh 1,000"
      : registration.category === "teens"
        ? "KSh 500"
        : "KSh 300"
  }

========================================

EVENT DETAILS
Event: Models Call Out
Date: September 15, 2026
Venue: Chuka Grounds
Organized by: Royals Icon Events

========================================

Thank you for registering! We look forward to seeing you at the event.`;

  // Convert text to buffer
  const pdfBuffer = Buffer.from(pdfContent);

  // Upload to S3
  const fileName = `registration-${registration.id}-${Date.now()}.pdf`;
  const result = await storagePut(fileName, pdfBuffer, "application/pdf");

  return result;
}

export async function generateParentalConsentPDF(registration: Registration): Promise<{ url: string; key: string }> {
  const categoryLabel =
    registration.category === "teens" ? "Teens (13-17)" : "Little Stars (5-12)";

  const pdfContent = `PARENTAL/GUARDIAN CONSENT FORM
Mr & Miss Face of Tharaka-Nithi County 2026

========================================

PARTICIPANT INFORMATION
Name: ${registration.fullName}
Age: ${registration.age}
Category: ${categoryLabel}
Date of Birth: ${registration.dateOfBirth}

========================================

PARENTAL/GUARDIAN DECLARATION

I, the parent/guardian of the above-named participant, hereby confirm that:

1. I have reviewed and understood the terms and conditions of participation in the
   "Mr & Miss Face of Tharaka-Nithi County 2026" event.

2. I consent to my child's participation in this modeling and talent event.

3. I authorize the use of my child's photographs and videos for event documentation,
   social media promotion, and marketing materials.

4. I consent to the processing of my child's personal data in accordance with the
   Data Protection Act 2019.

5. I understand that participation is subject to the eligibility criteria and code of conduct.

6. I accept that providing false information will result in disqualification.

========================================

PARENT/GUARDIAN DETAILS
Participant Name: ${registration.fullName}
Parent/Guardian Name: _________________________
Relationship: _________________________
Contact Number: _________________________
Email: _________________________

========================================

SIGNATURE & DATE
Signature: _________________________
Date: _________________________

========================================

IMPORTANT NOTES
- This form must be signed by the parent/guardian
- A copy of the participant's birth certificate is required
- Please keep a copy for your records

========================================

For inquiries, contact:
Royals Icon Events
Email: contact@royalsiconevents.co.ke
Website: www.royalsiconevents.co.ke`;

  // Convert text to buffer
  const pdfBuffer = Buffer.from(pdfContent);

  // Upload to S3
  const fileName = `parental-consent-${registration.id}-${Date.now()}.pdf`;
  const result = await storagePut(fileName, pdfBuffer, "application/pdf");

  return result;
}
