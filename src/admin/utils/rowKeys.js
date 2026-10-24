// Editable list rows get a client-only `_key` so React can track them while they're
// edited; it's removed again before saving.
let lastKey = 0;
export const withKey = (row) => ({ ...row, _key: ++lastKey });
export const withoutKey = ({ _key, ...row }) => row;
