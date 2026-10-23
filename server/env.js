// Minimal .env loader (no extra dependency). Real environment variables always win.
import fs from 'node:fs';
import path from 'node:path';

const KEY_RE = /^[\w.]+$/;

function unquote(value) {
  const first = value.at(0);
  const quoted = value.length >= 2 && (first === '"' || first === "'") && value.at(-1) === first;
  return quoted ? value.slice(1, -1) : value;
}

// Parses KEY=value lines; blank lines, comments and malformed lines are skipped.
export function parseEnv(text) {
  const out = {};
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    const eq = line.indexOf('=');
    if (!line || line.startsWith('#') || eq < 1) continue;
    const key = line.slice(0, eq).trim();
    if (KEY_RE.test(key)) out[key] = unquote(line.slice(eq + 1).trim());
  }
  return out;
}

// Returns process.env merged over the values in <root>/.env.
export function loadEnv(root) {
  const file = path.join(root, '.env');
  const fromFile = fs.existsSync(file) ? parseEnv(fs.readFileSync(file, 'utf8')) : {};
  return { ...fromFile, ...process.env };
}
