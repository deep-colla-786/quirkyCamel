// Order emails: an HTML invoice to the customer and a "new order" alert to the admin.
//
// Sent over SMTP when SMTP_HOST/SMTP_USER/SMTP_PASS are set in .env (for Gmail, use port 587
// and an App Password: https://myaccount.google.com/apppasswords). Until then each email is
// written to outbox/ as an .html file so you can open it and see exactly what would go out.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import nodemailer from 'nodemailer';
import { ObjectId } from 'mongodb';
import { getDb } from './db.js';
import { HttpError } from './http.js';

const OUTBOX = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'outbox');

function smtpSettings(env) {
  const host = String(env.SMTP_HOST || '').trim();
  const user = String(env.SMTP_USER || '').trim();
  // Google shows App Passwords as "abcd efgh ijkl mnop"; the spaces aren't part of it.
  const pass = String(env.SMTP_PASS || '').replace(/\s+/g, '');
  const port = Number(env.SMTP_PORT || 587);
  return { host, user, pass, port, configured: !!(host && user && pass) };
}

// Whether real email is set up, for the admin panel.
export function mailStatus(env) {
  const { host, user, configured } = smtpSettings(env);
  return { configured, host: configured ? host : null, from: configured ? env.MAIL_FROM || user : null };
}

let transport;
let transportKey = '';
function getTransport(env) {
  const cfg = smtpSettings(env);
  if (!cfg.configured) return null;
  const key = [cfg.host, cfg.port, cfg.user, cfg.pass].join('|');
  if (!transport || key !== transportKey) {
    transport = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.port === 465,
      requireTLS: cfg.port !== 465, // 587: upgrade to TLS before logging in, never send in plain text
      auth: { user: cfg.user, pass: cfg.pass }
    });
    transportKey = key;
  }
  return transport;
}

// Turn SMTP errors into something actionable.
export function explainMailError(err) {
  const msg = String(err?.response || err?.message || err);
  if (err?.code === 'EAUTH' || /535|534|Invalid login|Username and Password not accepted|Application-specific password/i.test(msg)) {
    return 'The email server rejected the login. For Gmail, SMTP_USER must be the full Gmail address and SMTP_PASS a 16-character App Password (not your normal password). 2-Step Verification must be on to create one.';
  }
  if (/CERT|SELF_SIGNED|UNABLE_TO_VERIFY/i.test(`${err?.code} ${msg}`)) {
    return 'The secure connection to the email server was intercepted (often antivirus email scanning, e.g. AVG/Avast Mail Shield, on port 465). Use SMTP_PORT=587, or turn off email scanning in the antivirus.';
  }
  if (/ETIMEDOUT|ECONNREFUSED|ESOCKET|ECONNECTION|ENOTFOUND|EDNS/i.test(`${err?.code} ${msg}`)) {
    return `Couldn't connect to ${err?.host || 'the email server'}. Check SMTP_HOST and SMTP_PORT (Gmail: smtp.gmail.com, 587), and that your network allows outgoing email.`;
  }
  return msg.slice(0, 300);
}

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const inr = (paise) => '₹' + (paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

export const invoiceNumber = (order) => {
  const d = new Date(order.paidAt || order.createdAt);
  const ymd = d.toISOString().slice(0, 10).replace(/-/g, '');
  return `QC-${ymd}-${String(order._id).slice(-6).toUpperCase()}`;
};

function itemsTable(order) {
  const rows = order.items
    .map(
      (it) => `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #eceef2">${esc(it.name)}</td>
        <td style="padding:10px 0;border-bottom:1px solid #eceef2;text-align:center">${it.qty}</td>
        <td style="padding:10px 0;border-bottom:1px solid #eceef2;text-align:right">${inr(it.price * 100)}</td>
        <td style="padding:10px 0;border-bottom:1px solid #eceef2;text-align:right">${inr(it.price * it.qty * 100)}</td>
      </tr>`
    )
    .join('');
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:14px">
    <thead><tr style="color:#5b5f6b;font-size:12px;text-transform:uppercase;letter-spacing:.06em">
      <th align="left" style="padding-bottom:8px">Item</th><th style="padding-bottom:8px">Qty</th>
      <th align="right" style="padding-bottom:8px">Price</th><th align="right" style="padding-bottom:8px">Amount</th>
    </tr></thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr><td colspan="3" style="padding:12px 0 4px;text-align:right;color:#5b5f6b">Shipping</td><td style="padding:12px 0 4px;text-align:right">Free</td></tr>
      <tr><td colspan="3" style="padding:4px 0;text-align:right;font-weight:700">Total paid</td><td style="padding:4px 0;text-align:right;font-weight:700;font-size:16px">${inr(order.amount)}</td></tr>
    </tfoot>
  </table>`;
}

function shell(title, inner) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(title)}</title></head>
  <body style="margin:0;background:#f6f6f2;font-family:Segoe UI,Helvetica,Arial,sans-serif;color:#212121">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:24px 12px">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden">
      <tr><td style="background:#2259B2;padding:22px 28px;color:#C4E539;font-size:22px;font-weight:800;letter-spacing:.04em">QUIRKY CAMEL</td></tr>
      <tr><td style="padding:26px 28px">${inner}</td></tr>
      <tr><td style="background:#14295e;color:#c4d3f3;padding:16px 28px;font-size:12px">Smell different. Everywhere. · Quirky Camel</td></tr>
    </table>
  </td></tr></table></body></html>`;
}

function customerInvoice(order) {
  const c = order.customer;
  const num = invoiceNumber(order);
  const date = new Date(order.paidAt || order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const demo = order.mode === 'demo'
    ? `<p style="background:#fff6e5;color:#6b4300;border-radius:10px;padding:10px 12px;font-size:13px">Demo order: placed while the store's Razorpay keys are placeholders, so no payment was taken.</p>`
    : '';
  const html = shell(`Invoice ${num}`, `
    <h1 style="margin:0 0 6px;font-size:22px">Thanks for your order, ${esc(c.name.split(' ')[0])}!</h1>
    <p style="margin:0 0 18px;color:#5b5f6b">Your camels are getting ready to travel. Here's your invoice.</p>
    ${demo}
    <table role="presentation" width="100%" style="font-size:13px;margin-bottom:18px"><tr>
      <td valign="top"><b>Invoice</b><br>${num}<br>${date}${order.razorpayPaymentId ? `<br>Payment ID: ${esc(order.razorpayPaymentId)}` : ''}</td>
      <td valign="top" align="right"><b>Ship to</b><br>${esc(c.name)}<br>${esc(c.addr)}<br>${esc(c.city)} ${esc(c.pin)}<br>${esc(c.phone)}</td>
    </tr></table>
    ${itemsTable(order)}
    ${c.gift ? `<p style="margin:18px 0 0;font-size:13px"><b>Gift note:</b> “${esc(c.gift)}”</p>` : ''}
    <p style="margin:22px 0 0;font-size:12px;color:#5b5f6b">Prices are inclusive of all taxes. Keep this email for your records.</p>`);
  return {
    subject: `Your Quirky Camel invoice ${num}`,
    html,
    text: `Thanks for your order! Invoice ${num}, total ${inr(order.amount)}. Shipping to ${c.name}, ${c.addr}, ${c.city} ${c.pin}.`
  };
}

function adminAlert(order, user) {
  const c = order.customer;
  const num = invoiceNumber(order);
  const html = shell(`New order ${num}`, `
    <h1 style="margin:0 0 6px;font-size:20px">New order: ${inr(order.amount)}${order.mode === 'demo' ? ' (demo)' : ''}</h1>
    <p style="margin:0 0 18px;color:#5b5f6b">${num} · ${esc(user?.email || c.email)}</p>
    ${itemsTable(order)}
    <p style="margin:18px 0 0;font-size:14px"><b>Ship to:</b> ${esc(c.name)}, ${esc(c.addr)}, ${esc(c.city)} ${esc(c.pin)} · ${esc(c.phone)}</p>
    ${c.gift ? `<p style="font-size:14px"><b>Gift note:</b> “${esc(c.gift)}”</p>` : ''}
    <p style="font-size:13px;color:#5b5f6b">Razorpay order: ${esc(order.razorpayOrderId || '—')} · Payment: ${esc(order.razorpayPaymentId || '—')}</p>`);
  return { subject: `New order ${num} · ${inr(order.amount)}`, html, text: `New order ${num} for ${inr(order.amount)} from ${c.name}.` };
}

async function deliver(env, to, msg) {
  const t = getTransport(env);
  if (t) {
    const from = env.MAIL_FROM || `Quirky Camel <${smtpSettings(env).user}>`;
    const info = await t.sendMail({ from, to, subject: msg.subject, html: msg.html, text: msg.text });
    return { status: 'sent', to, messageId: info.messageId, at: new Date() };
  }
  await fs.mkdir(OUTBOX, { recursive: true });
  const file = `${new Date().toISOString().replace(/[:.]/g, '-')}_${to.replace(/[^a-z0-9@.]/gi, '_')}.html`;
  await fs.writeFile(path.join(OUTBOX, file), msg.html);
  return { status: 'outbox', to, file: `outbox/${file}`, at: new Date() };
}

// Fire-and-forget after an order is paid; records the result on the order.
export async function sendOrderEmails(env, order, user) {
  const db = await getDb(env);
  const result = {};
  const jobs = [
    ['customer', order.customer.email || user?.email, customerInvoice(order)],
    ['admin', env.ADMIN_EMAIL, adminAlert(order, user)]
  ];
  for (const [key, to, msg] of jobs) {
    if (!to) continue;
    try {
      result[key] = await deliver(env, to, msg);
    } catch (err) {
      const error = explainMailError(err);
      console.error(`[mail] ${key} email to ${to} failed:`, error);
      result[key] = { status: 'failed', to, error, at: new Date() };
    }
  }
  await db.collection('orders').updateOne({ _id: order._id }, { $set: { emails: result, invoiceNumber: invoiceNumber(order) } });
  return result;
}

// Re-send both emails for an existing order (admin "Resend" button).
export async function resendOrderEmails(env, orderId) {
  if (!ObjectId.isValid(orderId)) throw new HttpError(404, 'Order not found.');
  const db = await getDb(env);
  const order = await db.collection('orders').findOne({ _id: new ObjectId(orderId) });
  if (!order || order.status !== 'paid') throw new HttpError(404, 'Order not found.');
  if (!order.items) {
    // Orders placed before multi-product checkout stored only a kit quantity.
    const qty = order.quantity || 1;
    order.items = [{ slug: 'the-complete-kit', name: 'The Complete Kit', price: order.amount / 100 / qty, qty }];
  }
  const user = await db.collection('users').findOne({ _id: order.userId }, { projection: { email: 1 } });
  return sendOrderEmails(env, order, user);
}

// Sends a simple test message; throws with an explained error on failure.
export async function sendTestEmail(env, to) {
  const t = getTransport(env);
  if (!t) throw new HttpError(400, 'Email isn’t set up yet: fill in SMTP_HOST, SMTP_USER and SMTP_PASS in .env, then restart the server.');
  try {
    await t.verify();
    const info = await t.sendMail({
      from: env.MAIL_FROM || `Quirky Camel <${smtpSettings(env).user}>`,
      to,
      subject: 'Quirky Camel test email',
      text: 'Email is working. Order invoices and admin alerts will be delivered.',
      html: shell('Test email', '<h1 style="margin:0 0 8px;font-size:20px">Email is working ✓</h1><p style="margin:0;color:#5b5f6b">Order invoices and admin alerts will be delivered from this address.</p>')
    });
    return { to, messageId: info.messageId };
  } catch (err) {
    throw new HttpError(502, explainMailError(err));
  }
}
