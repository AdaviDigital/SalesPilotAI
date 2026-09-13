import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../config/logger';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASSWORD) return null;
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT ?? 587,
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
  });
  return transporter;
}

/**
 * Falls back to logging when SMTP isn't configured, mirroring the AI/storage
 * demo-mode pattern — auth and notifications must keep working in
 * development or a fresh deployment with no mail provider set up yet.
 */
export async function sendEmail(params: SendEmailParams) {
  const t = getTransporter();
  if (!t) {
    logger.info({ to: params.to, subject: params.subject }, '[demo mode] Email not sent — SMTP not configured. Would have sent:');
    return { sent: false, mode: 'demo' as const };
  }
  await t.sendMail({ from: env.SMTP_USER, to: params.to, subject: params.subject, html: params.html });
  return { sent: true, mode: 'smtp' as const };
}

export function verificationEmailHtml(firstName: string, verifyUrl: string) {
  return `<p>Hi ${firstName},</p><p>Welcome to SalesPilot AI. Verify your email to activate your account:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`;
}

export function passwordResetEmailHtml(firstName: string, resetUrl: string) {
  return `<p>Hi ${firstName},</p><p>Reset your SalesPilot AI password using the link below. This link expires in 1 hour.</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you didn't request this, you can ignore this email.</p>`;
}

export function newUserInviteEmailHtml(organizationName: string, role: string, acceptUrl: string) {
  return `<p>You've been invited to join <strong>${organizationName}</strong> on SalesPilot AI as a ${role.replace('_', ' ').toLowerCase()}.</p><p>Accept the invitation and set up your account:</p><p><a href="${acceptUrl}">${acceptUrl}</a></p><p>This link expires in 7 days.</p>`;
}

export function existingUserInviteEmailHtml(firstName: string, organizationName: string, role: string) {
  return `<p>Hi ${firstName},</p><p>You've been added to <strong>${organizationName}</strong> on SalesPilot AI as a ${role.replace('_', ' ').toLowerCase()}. You can switch to this organization the next time you sign in.</p>`;
}
