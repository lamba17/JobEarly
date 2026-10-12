// Gmail SMTP sender shared by the welcome email and the payment emails.
import nodemailer from 'nodemailer';
import { LOGO_PNG_BASE64 } from './logo.js';
export function mailerConfigured() {
    return !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}
/** Sends a branded email (logo attached inline). Throws if SMTP fails; returns false if not configured. */
export async function sendBrandedMail(to, email) {
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;
    if (!user || !pass) {
        console.warn('Email skipped: GMAIL_USER / GMAIL_APP_PASSWORD not configured');
        return false;
    }
    const transport = nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });
    await transport.sendMail({
        from: `"JobEarly" <${user}>`,
        to,
        subject: email.subject,
        text: email.text,
        html: email.html,
        attachments: [{
                filename: 'jobearly-logo.png',
                content: Buffer.from(LOGO_PNG_BASE64, 'base64'),
                contentType: 'image/png',
                cid: 'jobearly-logo',
            }],
    });
    return true;
}
