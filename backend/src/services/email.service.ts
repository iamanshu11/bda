import nodemailer, { type Transporter } from 'nodemailer';
import { env, isDev } from '@/config/env';
import { logger } from '@/logger';

/**
 * Thin wrapper around Nodemailer.
 * In development, if SMTP creds are absent, emails are logged instead of sent
 * so signup/login flows can be tested without a mail server.
 */
class EmailService {
  private transporter: Transporter | null = null;

  private getTransporter(): Transporter | null {
    if (this.transporter) return this.transporter;
    if (!env.SMTP_USER || !env.SMTP_PASS) return null;

    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    });
    return this.transporter;
  }

  async send(to: string, subject: string, html: string): Promise<void> {
    const transporter = this.getTransporter();
    const from = `"${env.MAIL_FROM_NAME}" <${env.MAIL_FROM_ADDRESS}>`;

    if (!transporter) {
      if (isDev) {
        logger.warn(`[email:dev] SMTP not configured. Would send to ${to} — "${subject}"`);
        return;
      }
      throw new Error('Email transport not configured');
    }

    await transporter.sendMail({ from, to, subject, html });
    logger.info(`Email sent to ${to} — "${subject}"`);
  }
}

export const emailService = new EmailService();
