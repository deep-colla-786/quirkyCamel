// Rules for new passwords (sign-up, reset). Returns an error message, or '' if acceptable.
const MIN = 8;
const MAX = 200;

// The most common leaked passwords that are 8+ characters long.
const COMMON = new Set([
  '12345678', '123456789', '1234567890', 'password', 'password1', 'password123', 'qwertyuiop', 'qwerty123',
  'iloveyou', 'sunshine', 'princess', 'football', 'baseball', 'welcome1', 'welcome123', 'abcd1234',
  'admin123', 'letmein1', 'trustno1', '11111111', '00000000', '88888888', '87654321', 'asdfghjkl',
  'zaq12wsx', '1q2w3e4r', '1qaz2wsx', 'passw0rd', 'changeme', 'change-me-please', 'india123', 'qwerty12'
]);

export function passwordProblem(password, { email = '', name = '' } = {}) {
  const pw = String(password || '');
  if (pw.length < MIN) return `Password must be at least ${MIN} characters.`;
  if (pw.length > MAX) return 'Password is too long.';
  const lower = pw.toLowerCase();
  if (COMMON.has(lower)) return 'That password is too common. Please choose another.';
  if (new Set(lower).size <= 2) return 'Please use a less repetitive password.';
  if (/^\d+$/.test(pw)) return 'Please don’t use only numbers. Add some letters.';
  const local = String(email).toLowerCase().split('@')[0];
  if (local.length >= 4 && lower.includes(local)) return 'Your password shouldn’t contain your email address.';
  const first = String(name).toLowerCase().split(/\s+/)[0];
  if (first.length >= 4 && lower === first) return 'Your password shouldn’t be your name.';
  return '';
}
