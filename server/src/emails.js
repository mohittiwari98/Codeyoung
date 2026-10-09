import nodemailer from 'nodemailer';
import { fmt } from './tz.js';

export function buildEmails({ booking: b, mentor: m }) {
  const link = b.meetingLink;
  return [
    {
      to: b.parentEmail,
      subject: `Your Codeyoung trial class: ${fmt(b.startMs, b.parentTz)}`,
      text: `Hi ${b.parentName},\n\nYour trial class for ${b.childName} (age ${b.childAge}) with ${m.name} is confirmed.\nWhen: ${fmt(b.startMs, b.parentTz)} (your local time)\nJoin: ${link}\n`,
    },
    {
      to: m.email,
      subject: `New trial class: ${fmt(b.startMs, m.tz)}`,
      text: `Hi ${m.name},\n\nYou have a trial class with ${b.parentName} for ${b.childName} (age ${b.childAge}).\nWhen: ${fmt(b.startMs, m.tz)} (your local time)\nParent's local time: ${fmt(b.startMs, b.parentTz)}\nJoin: ${link}\n`,
    },
  ];
}

let transport;
async function getTransport() {
  if (transport) return transport;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (SMTP_HOST) {
    transport = nodemailer.createTransport({ host: SMTP_HOST, port: Number(SMTP_PORT) || 587, auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined });
  } else {
    try {
      const a = await nodemailer.createTestAccount();
      transport = nodemailer.createTransport({ host: a.smtp.host, port: a.smtp.port, secure: a.smtp.secure, auth: { user: a.user, pass: a.pass } });
    } catch { transport = nodemailer.createTransport({ jsonTransport: true }); }
  }
  return transport;
}

export async function send(mail) {
  try {
    const info = await (await getTransport()).sendMail({ from: process.env.MAIL_FROM || process.env.SMTP_USER || 'Codeyoung <no-reply@codeyoung.example>', ...mail });
    console.log(`Email to ${mail.to}:`, nodemailer.getTestMessageUrl(info) || info.message || 'sent');
    return true;
  } catch (e) {
    console.error(`Email to ${mail.to} failed:`, e.message);
    return false;
  }
}
