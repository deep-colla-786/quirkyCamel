// Form checks shared by the login modal and checkout.

// Same rule as /^\S+@\S+\.\S+$/ (no whitespace; an '@' after the first character; a '.'
// at least one character after it and before the last character), without regex backtracking.
export const isValidEmail = (value) => {
  if (/\s/.test(value)) return false;
  const at = value.indexOf('@', 1);
  const dot = value.lastIndexOf('.', value.length - 2);
  return at !== -1 && dot >= at + 2;
};
