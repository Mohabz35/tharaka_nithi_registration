import nodemailer from "nodemailer";
import { ENV } from "./env.js";

let _transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!_transporter) {
    if (!ENV.smtpUser || !ENV.smtpPass) {
      throw new Error("SMTP credentials not configured. Set SMTP_USER and SMTP_PASS environment variables.");
    }
    _transporter = nodemailer.createTransport({
      host: ENV.smtpHost,
      port: ENV.smtpPort,
      secure: ENV.smtpPort === 465,
      auth: {
        user: ENV.smtpUser,
        pass: ENV.smtpPass,
      },
    });
  }
  return _transporter;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content?: Buffer;
    path?: string;
  }>;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: ENV.smtpFrom,
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments,
    });
    return true;
  } catch (error) {
    console.error("[Email] Failed to send:", error);
    return false;
  }
}

export function buildCertificateEmail(participantName: string): { subject: string; html: string } {
  return {
    subject: `🏆 Your Certificate - Mr & Miss Face of Tharaka-Nithi County 2026`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a0a1a; border: 2px solid #d4af37; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #4a1a2a, #2a0a1a); padding: 32px; text-align: center;">
          <h1 style="color: #d4af37; margin: 0; font-size: 24px;">Mr & Miss Face of Tharaka-Nithi</h1>
          <p style="color: #e5c158; margin: 8px 0 0; font-size: 14px;">County 2026</p>
        </div>
        <div style="padding: 32px; color: #ffffff;">
          <p style="font-size: 16px;">Dear <strong style="color: #d4af37;">${participantName}</strong>,</p>
          <p style="line-height: 1.6;">Congratulations! 🎉 Your registration certificate for the <strong>Mr & Miss Face of Tharaka-Nithi County 2026</strong> competition is attached to this email.</p>
          <p style="line-height: 1.6;">Please download and keep this certificate as proof of your registration. We look forward to seeing you at the event!</p>
          <div style="background: #2a0a1a; border: 1px solid #d4af37; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="color: #d4af37; margin: 0; font-weight: bold;">📅 Event Date: September 12, 2026</p>
            <p style="color: #d4af37; margin: 8px 0 0; font-weight: bold;">📍 Venue: Chuka Grounds</p>
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 24px;">— Royals Icon Events</p>
        </div>
      </div>
    `,
  };
}

export function buildRegistrationEmail(participantName: string): { subject: string; html: string } {
  return {
    subject: `📋 Your Registration Form - Mr & Miss Face of Tharaka-Nithi County 2026`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a0a1a; border: 2px solid #d4af37; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #4a1a2a, #2a0a1a); padding: 32px; text-align: center;">
          <h1 style="color: #d4af37; margin: 0; font-size: 24px;">Mr & Miss Face of Tharaka-Nithi</h1>
          <p style="color: #e5c158; margin: 8px 0 0; font-size: 14px;">County 2026</p>
        </div>
        <div style="padding: 32px; color: #ffffff;">
          <p style="font-size: 16px;">Dear <strong style="color: #d4af37;">${participantName}</strong>,</p>
          <p style="line-height: 1.6;">Thank you for registering for the <strong>Mr & Miss Face of Tharaka-Nithi County 2026</strong> competition!</p>
          <p style="line-height: 1.6;">Your registration form is attached to this email as a PDF. Please keep it for your records.</p>
          <div style="background: #2a0a1a; border: 1px solid #d4af37; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="color: #d4af37; margin: 0; font-weight: bold;">📅 Event Date: September 12, 2026</p>
            <p style="color: #d4af37; margin: 8px 0 0; font-weight: bold;">📍 Venue: Chuka Grounds</p>
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 24px;">— Royals Icon Events</p>
        </div>
      </div>
    `,
  };
}

export function buildRegistrationConfirmationEmail(participantName: string): { subject: string; html: string } {
  return {
    subject: `✅ Registration Received - Mr & Miss Face of Tharaka-Nithi County 2026`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a0a1a; border: 2px solid #d4af37; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #4a1a2a, #2a0a1a); padding: 32px; text-align: center;">
          <h1 style="color: #d4af37; margin: 0; font-size: 24px;">Mr & Miss Face of Tharaka-Nithi</h1>
          <p style="color: #e5c158; margin: 8px 0 0; font-size: 14px;">County 2026</p>
        </div>
        <div style="padding: 32px; color: #ffffff;">
          <p style="font-size: 16px;">Dear <strong style="color: #d4af37;">${participantName}</strong>,</p>
          <p style="line-height: 1.6;">Thank you for registering! We have received your application for the <strong>Mr & Miss Face of Tharaka-Nithi County 2026</strong> competition. Our team will review your details and the documents you submitted.</p>
          <p style="line-height: 1.6;">If you included identity documents, our team will verify them for confirmation. You will hear from us via email or our official WhatsApp channels.</p>
          <div style="background: #2a0a1a; border: 1px solid #d4af37; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="color: #d4af37; margin: 0; font-weight: bold;">📅 Event Date: September 12, 2026</p>
            <p style="color: #d4af37; margin: 8px 0 0; font-weight: bold;">📍 Venue: Chuka Grounds</p>
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 24px;">— Royals Icon Events</p>
        </div>
      </div>
    `,
  };
}

export function buildDocumentConfirmationEmail(
  participantName: string,
  category: string,
  documentUrl: string
): { subject: string; html: string } {
  return {
    subject: `📄 New Registration Document - ${participantName} (${category})`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a0a1a; border: 2px solid #d4af37; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #4a1a2a, #2a0a1a); padding: 32px; text-align: center;">
          <h1 style="color: #d4af37; margin: 0; font-size: 22px;">Document Submission Alert</h1>
        </div>
        <div style="padding: 32px; color: #ffffff;">
          <p style="font-size: 16px;">A new contestant has submitted identity documents for confirmation:</p>
          <ul style="line-height: 1.8;">
            <li><strong style="color: #d4af37;">Name:</strong> ${participantName}</li>
            <li><strong style="color: #d4af37;">Category:</strong> ${category}</li>
            <li><strong style="color: #d4af37;">Document:</strong> <a href="${documentUrl}" style="color: #e5c158;">View uploaded document</a></li>
          </ul>
          <p style="line-height: 1.6;">Please review and confirm the contestant's eligibility.</p>
          <p style="color: #999; font-size: 12px; margin-top: 24px;">— Royals Icon Events</p>
        </div>
      </div>
    `,
  };
}

export function buildPaymentConfirmationEmail(
  customerName: string,
  orderId: number,
  items: Array<{ name: string; quantity: number; price: number }>,
  totalAmount: number,
  amountPaid: number,
  transactionId: string,
  registrationId: string
): { subject: string; html: string } {
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #3a1c28; color: #ffffff;">${item.quantity}x ${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #3a1c28; color: #d4af37; text-align: right;">KES ${(item.price * item.quantity).toLocaleString()}</td>
    </tr>
  `).join('');

  return {
    subject: `✅ Payment Receipt - Order #${orderId} - Mr & Miss Face of Tharaka-Nithi`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a0a1a; border: 2px solid #d4af37; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #4a1a2a, #2a0a1a); padding: 32px; text-align: center;">
          <h1 style="color: #d4af37; margin: 0; font-size: 24px;">Payment Confirmed!</h1>
          <p style="color: #e5c158; margin: 8px 0 0;">Order #${orderId}</p>
        </div>
        <div style="padding: 32px; color: #ffffff;">
          <p style="font-size: 16px;">Dear <strong style="color: #d4af37;">${customerName}</strong>,</p>
          <p style="line-height: 1.6; margin: 16px 0;">Your payment has been received. Here is your receipt:</p>

          <div style="background: #2a0a1a; border: 1px solid #d4af37; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="color: #999; margin: 0; font-size: 12px;">Registration ID</p>
            <p style="color: #d4af37; margin: 4px 0 0; font-size: 18px; font-weight: bold;">${registrationId}</p>
          </div>
          
          <div style="background: #2a0a1a; border: 1px solid #d4af37; border-radius: 8px; overflow: hidden; margin: 24px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #3a1c28;">
                  <th style="padding: 10px; text-align: left; color: #d4af37; font-size: 12px; text-transform: uppercase;">Item</th>
                  <th style="padding: 10px; text-align: right; color: #d4af37; font-size: 12px; text-transform: uppercase;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr style="background: #3a1c28;">
                  <td style="padding: 10px; color: #ffffff; font-weight: bold;">TOTAL</td>
                  <td style="padding: 10px; color: #d4af37; font-weight: bold; text-align: right;">KES ${totalAmount.toLocaleString()}</td>
                </tr>
                <tr style="background: #2a5a2a;">
                  <td style="padding: 10px; color: #ffffff; font-weight: bold;">PAID</td>
                  <td style="padding: 10px; color: #4CAF50; font-weight: bold; text-align: right;">KES ${amountPaid.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div style="background: #2a0a1a; border: 1px solid #4CAF50; border-radius: 8px; padding: 16px; margin: 24px 0; text-align: center;">
            <p style="color: #4CAF50; margin: 0; font-weight: bold; font-size: 16px;">✅ FULLY PAID</p>
            <p style="color: #999; margin: 4px 0 0; font-size: 12px;">Transaction: ${transactionId}</p>
          </div>

          <div style="background: #2a0a1a; border: 1px solid #d4af37; border-radius: 8px; padding: 16px; margin: 24px 0; text-align: center;">
            <p style="color: #d4af37; margin: 0; font-weight: bold;">📅 Event Date: September 12, 2026</p>
            <p style="color: #d4af37; margin: 8px 0 0; font-weight: bold;">📍 Venue: Chuka Grounds</p>
            <p style="color: #999; margin: 8px 0 0; font-size: 12px;">Collect your merchandise at the event</p>
          </div>

          <p style="color: #999; font-size: 12px; margin-top: 24px; text-align: center;">
            — Royals Icon Events<br/>
            Questions? Contact support@royaliconevents.co.ke
          </p>
        </div>
      </div>
    `,
  };
}

export function buildInstallmentReceiptEmail(
  customerName: string,
  orderId: number,
  installmentNumber: number,
  totalInstallments: number,
  amountPaid: number,
  remainingAmount: number,
  installmentsPaid: number,
  nextDueDate: Date,
  registrationId: string
): { subject: string; html: string } {
  const formattedDate = nextDueDate.toLocaleDateString('en-KE', { 
    year: 'numeric', month: 'long', day: 'numeric' 
  });

  return {
    subject: `✅ Installment #${installmentNumber} Paid - Order #${orderId}`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a0a1a; border: 2px solid #d4af37; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #4a1a2a, #2a0a1a); padding: 32px; text-align: center;">
          <h1 style="color: #d4af37; margin: 0; font-size: 24px;">Installment Paid!</h1>
          <p style="color: #e5c158; margin: 8px 0 0;">Order #${orderId}</p>
        </div>
        <div style="padding: 32px; color: #ffffff;">
          <p style="font-size: 16px;">Dear <strong style="color: #d4af37;">${customerName}</strong>,</p>
          <p style="line-height: 1.6; margin: 16px 0;">Your installment payment has been received.</p>

          <div style="background: #2a0a1a; border: 1px solid #d4af37; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="color: #999; margin: 0; font-size: 12px;">Registration ID</p>
            <p style="color: #d4af37; margin: 4px 0 0; font-size: 18px; font-weight: bold;">${registrationId}</p>
          </div>

          <!-- Payment Just Made -->
          <div style="background: #2a0a1a; border: 1px solid #4CAF50; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <p style="color: #4CAF50; margin: 0; font-weight: bold; font-size: 14px;">✅ PAYMENT RECEIVED</p>
            <p style="color: #ffffff; margin: 12px 0 0; font-size: 24px; font-weight: bold;">KES ${amountPaid.toLocaleString()}</p>
            <p style="color: #999; margin: 4px 0 0; font-size: 13px;">Installment #${installmentNumber} of ${totalInstallments}</p>
          </div>

          <!-- Progress -->
          <div style="background: #2a0a1a; border: 1px solid #d4af37; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <p style="color: #d4af37; margin: 0; font-weight: bold;">Payment Progress</p>
            <div style="background: #3a1c28; border-radius: 4px; height: 8px; margin: 12px 0; overflow: hidden;">
              <div style="background: #4CAF50; height: 100%; width: ${(installmentsPaid / totalInstallments * 100).toFixed(0)}%;"></div>
            </div>
            <p style="color: #ffffff; margin: 8px 0 0; font-size: 14px;">${installmentsPaid} of ${totalInstallments} installments paid</p>
            <p style="color: #999; margin: 4px 0 0; font-size: 13px;">Remaining: KES ${remainingAmount.toLocaleString()}</p>
          </div>

          ${remainingAmount > 0 ? `
          <!-- Next Payment -->
          <div style="background: #2a0a1a; border: 1px solid #e5c158; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="color: #e5c158; margin: 0; font-weight: bold;">📅 Next Payment Due</p>
            <p style="color: #ffffff; margin: 8px 0 0;">${formattedDate}</p>
            <p style="color: #999; margin: 4px 0 0; font-size: 12px;">Use your Registration ID (${registrationId}) to track and pay</p>
          </div>
          ` : `
          <div style="background: #2a0a1a; border: 1px solid #4CAF50; border-radius: 8px; padding: 16px; margin: 24px 0; text-align: center;">
            <p style="color: #4CAF50; margin: 0; font-weight: bold; font-size: 16px;">🎉 ALL INSTALLMENTS PAID!</p>
            <p style="color: #999; margin: 4px 0 0; font-size: 12px;">Your order is now fully paid</p>
          </div>
          `}

          <div style="background: #2a0a1a; border: 1px solid #d4af37; border-radius: 8px; padding: 16px; margin: 24px 0; text-align: center;">
            <p style="color: #d4af37; margin: 0; font-weight: bold;">📅 Event Date: September 12, 2026</p>
            <p style="color: #d4af37; margin: 8px 0 0; font-weight: bold;">📍 Venue: Chuka Grounds</p>
          </div>

          <p style="color: #999; font-size: 12px; margin-top: 24px; text-align: center;">
            — Royals Icon Events<br/>
            Questions? Contact support@royaliconevents.co.ke
          </p>
        </div>
      </div>
    `,
  };
}

export function buildOrderReceiptEmail(
  customerName: string,
  orderId: number,
  items: Array<{ name: string; quantity: number; price: number }>,
  totalAmount: number,
  numberOfInstallments: number,
  installmentAmount: number,
  installmentInterval: string,
  paymentLink: string,
  registrationId?: string
): { subject: string; html: string } {
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #3a1c28; color: #ffffff;">${item.quantity}x ${item.name}</td>
      <td style="padding: 12px; border-bottom: 1px solid #3a1c28; color: #999999; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #3a1c28; color: #d4af37; text-align: right;">KES ${(item.price * item.quantity).toLocaleString()}</td>
    </tr>
  `).join('');

  const installmentInfo = numberOfInstallments > 1 
    ? `
      <div style="background: #2a0a1a; border: 1px solid #d4af37; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p style="color: #d4af37; margin: 0; font-weight: bold;">📦 Payment Plan</p>
        <p style="color: #ffffff; margin: 8px 0 0;">${numberOfInstallments} installments of KES ${installmentAmount.toLocaleString()} (${installmentInterval})</p>
        <p style="color: #e5c158; margin: 4px 0 0; font-size: 12px;">⚠ All payments must be completed by 1st September 2026</p>
      </div>
    `
    : '';

  return {
    subject: `🧾 Order #${orderId} Confirmed - Mr & Miss Face of Tharaka-Nithi`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a0a1a; border: 2px solid #d4af37; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #4a1a2a, #2a0a1a); padding: 32px; text-align: center;">
          <h1 style="color: #d4af37; margin: 0; font-size: 24px;">Order Confirmed!</h1>
          <p style="color: #e5c158; margin: 8px 0 0;">Order #${orderId}</p>
          ${registrationId ? `<p style="color: #ffffff; margin: 8px 0 0; font-size: 14px;">Registration ID: <strong style="color: #d4af37;">${registrationId}</strong></p>` : ''}
        </div>
        
        <div style="padding: 32px; color: #ffffff;">
          <p style="font-size: 16px;">Dear <strong style="color: #d4af37;">${customerName}</strong>,</p>
          <p style="line-height: 1.6; margin: 16px 0;">Thank you for your order! Here is your receipt:</p>
          
          <!-- Receipt Table -->
          <div style="background: #2a0a1a; border: 1px solid #d4af37; border-radius: 8px; overflow: hidden; margin: 24px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #3a1c28;">
                  <th style="padding: 12px; text-align: left; color: #d4af37; font-size: 12px; text-transform: uppercase;">Item</th>
                  <th style="padding: 12px; text-align: center; color: #d4af37; font-size: 12px; text-transform: uppercase;">Qty</th>
                  <th style="padding: 12px; text-align: right; color: #d4af37; font-size: 12px; text-transform: uppercase;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr style="background: #3a1c28;">
                  <td colspan="2" style="padding: 12px; color: #ffffff; font-weight: bold;">TOTAL</td>
                  <td style="padding: 12px; color: #d4af37; font-weight: bold; font-size: 18px; text-align: right;">KES ${totalAmount.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          ${installmentInfo}

          <!-- Payment Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${paymentLink}" style="display: inline-block; background: #d4af37; color: #000000; padding: 16px 40px; text-decoration: none; font-weight: bold; border-radius: 4px; text-transform: uppercase; letter-spacing: 1px;">
              Pay Now with M-Pesa / Card
            </a>
          </div>

          ${registrationId ? `
          <div style="background: #2a0a1a; border: 1px solid #e5c158; border-radius: 8px; padding: 16px; margin: 24px 0; text-align: center;">
            <p style="color: #e5c158; margin: 0; font-weight: bold;">📋 Your Registration ID: ${registrationId}</p>
            <p style="color: #999; margin: 8px 0 0; font-size: 12px;">Save this ID to track your orders and payments at faceoftharakanithi.app/payment</p>
          </div>
          ` : ''}

          <!-- Event Info -->
          <div style="background: #2a0a1a; border: 1px solid #d4af37; border-radius: 8px; padding: 16px; margin: 24px 0; text-align: center;">
            <p style="color: #d4af37; margin: 0; font-weight: bold;">📅 Event Date: September 12, 2026</p>
            <p style="color: #d4af37; margin: 8px 0 0; font-weight: bold;">📍 Venue: Chuka Grounds</p>
            <p style="color: #999999; margin: 8px 0 0; font-size: 12px;">Collect your merchandise at the event</p>
          </div>

          <p style="color: #999999; font-size: 12px; margin-top: 24px; text-align: center;">
            — Royals Icon Events<br/>
            Questions? Contact support@royaliconevents.co.ke
          </p>
        </div>
      </div>
    `,
  };
}

export function buildInstallmentReminderEmail(
  installmentNumber: number,
  totalInstallments: number,
  amountDue: number,
  dueDate: Date,
  orderId: number
): { subject: string; html: string } {
  const formattedDate = dueDate.toLocaleDateString('en-KE', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  return {
    subject: `📅 Installment Reminder - Payment #${installmentNumber} of ${totalInstallments}`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a0a1a; border: 2px solid #d4af37; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #4a1a2a, #2a0a1a); padding: 32px; text-align: center;">
          <h1 style="color: #d4af37; margin: 0; font-size: 24px;">Payment Reminder</h1>
        </div>
        <div style="padding: 32px; color: #ffffff;">
          <p style="font-size: 16px;">This is a friendly reminder for your upcoming installment payment.</p>
          <div style="background: #2a0a1a; border: 1px solid #d4af37; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <p style="color: #d4af37; margin: 0; font-weight: bold;">Installment #${installmentNumber} of ${totalInstallments}</p>
            <p style="color: #ffffff; margin: 12px 0 0; font-size: 24px; font-weight: bold;">KES ${amountDue.toLocaleString()}</p>
            <p style="color: #e5c158; margin: 8px 0 0;">Due Date: ${formattedDate}</p>
          </div>
          <p style="line-height: 1.6;">Please ensure your payment is made before the due date to avoid any interruptions to your order.</p>
          <p style="line-height: 1.6;">Order Reference: #${orderId}</p>
          <div style="background: #4a1a2a; border-radius: 8px; padding: 16px; margin: 24px 0; text-align: center;">
            <p style="color: #d4af37; margin: 0; font-weight: bold;">Need help? Contact us</p>
            <p style="color: #999; margin: 8px 0 0;">support@royaliconevents.co.ke</p>
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 24px;">— Royals Icon Events</p>
        </div>
      </div>
    `,
  };
}

export function buildOrderConfirmationEmail(
  participantName: string,
  orderId: number,
  items: Array<{ name: string; quantity: number; price: number }>,
  totalAmount: number,
  numberOfInstallments: number
): { subject: string; html: string } {
  const itemsHtml = items.map(item => 
    `<li style="margin: 8px 0;"><span style="color: #d4af37;">${item.quantity}x ${item.name}</span> - KES ${item.price.toLocaleString()}</li>`
  ).join('');

  const paymentInfo = numberOfInstallments > 1 
    ? `<p style="color: #e5c158; margin: 12px 0 0;">Pay in ${numberOfInstallments} installments of KES ${Math.ceil(totalAmount / numberOfInstallments).toLocaleString()}</p>`
    : `<p style="color: #e5c158; margin: 12px 0 0;">Pay in full: KES ${totalAmount.toLocaleString()}</p>`;

  return {
    subject: `🛒 Order Confirmed - #${orderId} - Mr & Miss Face of Tharaka-Nithi`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a0a1a; border: 2px solid #d4af37; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #4a1a2a, #2a0a1a); padding: 32px; text-align: center;">
          <h1 style="color: #d4af37; margin: 0; font-size: 24px;">Order Confirmed!</h1>
        </div>
        <div style="padding: 32px; color: #ffffff;">
          <p style="font-size: 16px;">Dear <strong style="color: #d4af37;">${participantName}</strong>,</p>
          <p style="line-height: 1.6;">Thank you for your order! Here are your order details:</p>
          <div style="background: #2a0a1a; border: 1px solid #d4af37; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <p style="color: #d4af37; margin: 0; font-weight: bold;">Order #${orderId}</p>
            <ul style="margin: 12px 0; padding-left: 20px; list-style-type: none;">
              ${itemsHtml}
            </ul>
            <p style="color: #ffffff; margin: 12px 0 0; font-size: 18px; font-weight: bold;">Total: KES ${totalAmount.toLocaleString()}</p>
            ${paymentInfo}
          </div>
          <p style="line-height: 1.6;">You will receive payment instructions shortly. Please complete your payment to confirm your order.</p>
          <div style="background: #2a0a1a; border: 1px solid #d4af37; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="color: #d4af37; margin: 0; font-weight: bold;">📅 Event Date: September 12, 2026</p>
            <p style="color: #d4af37; margin: 8px 0 0; font-weight: bold;">📍 Venue: Chuka Grounds</p>
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 24px;">— Royals Icon Events</p>
        </div>
      </div>
    `,
  };
}
