// Checks the SMTP settings in .env and sends a test email.
// Usage: npm run mail:test            (sends to ADMIN_EMAIL)
//        npm run mail:test -- you@example.com
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = { ...process.env };
const envFile = path.join(root, '.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([\w.]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}

const { mailStatus, sendTestEmail } = await import('../server/mailer.js');
const to = process.argv[2] || env.ADMIN_EMAIL;
const status = mailStatus(env);

if (!status.configured) {
  console.log('✗ Email is not set up. Fill in SMTP_HOST, SMTP_USER and SMTP_PASS in .env (see the comments there).');
  process.exit(1);
}
console.log(`Sending a test email via ${status.host} from ${status.from} to ${to} …`);
try {
  const r = await sendTestEmail(env, to);
  console.log(`✓ Sent (message id ${r.messageId}). Check the inbox and the spam folder of ${to}.`);
  process.exit(0);
} catch (err) {
  console.log('✗ ' + err.message);
  process.exit(1);
}
