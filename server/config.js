// Settings checked once at startup. The server refuses to start with settings that
// would leave the store open (a guessable admin password, an unprotected webhook).
import { passwordProblem } from './passwordPolicy.js';

export const MIN_ADMIN_PASSWORD = 12;
export const MIN_WEBHOOK_TOKEN = 32;
const EXAMPLE_VALUES = new Set(['change-me-please', 'a-strong-password', 'your-api-user-password', 'any-long-random-string']);

export function configProblems(env) {
  const problems = [];
  const adminEmail = String(env.ADMIN_EMAIL || '').trim();
  const adminPassword = String(env.ADMIN_PASSWORD || '');
  if (!adminEmail) problems.push('ADMIN_EMAIL is empty.');
  if (adminPassword.length < MIN_ADMIN_PASSWORD) {
    problems.push(`ADMIN_PASSWORD must be at least ${MIN_ADMIN_PASSWORD} characters.`);
  } else if (EXAMPLE_VALUES.has(adminPassword.toLowerCase())) {
    problems.push('ADMIN_PASSWORD is still the example value from .env.example.');
  } else {
    const weak = passwordProblem(adminPassword, { email: adminEmail });
    if (weak) problems.push(`ADMIN_PASSWORD: ${weak}`);
  }
  const shiprocketLive = Boolean(String(env.SHIPROCKET_EMAIL || '').trim() && env.SHIPROCKET_PASSWORD);
  const token = String(env.SHIPROCKET_WEBHOOK_TOKEN || '');
  if (shiprocketLive && (token.length < MIN_WEBHOOK_TOKEN || EXAMPLE_VALUES.has(token))) {
    problems.push(
      `SHIPROCKET_WEBHOOK_TOKEN must be a random string of at least ${MIN_WEBHOOK_TOKEN} characters when Shiprocket is connected ` +
        `(generate one with: node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))").`
    );
  }
  return problems;
}

export function assertSafeConfig(env) {
  const problems = configProblems(env);
  if (problems.length) {
    throw new Error(`Refusing to start until .env is fixed:\n  - ${problems.join('\n  - ')}`);
  }
}
