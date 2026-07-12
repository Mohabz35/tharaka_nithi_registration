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
