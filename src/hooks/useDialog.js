import { useEffect, useRef } from 'react';

// Keyboard behaviour shared by every pop-up (drawers, modals):
// - focus moves into the dialog when it opens,
// - Tab / Shift+Tab cycle through the dialog's controls only,
// - Escape closes it (only the top-most dialog when they are stacked),
// - focus returns to whatever opened it when it closes.
// Returns a ref for the dialog element. `options.initialFocus` is an optional ref to the
// element that should receive focus first (otherwise the first focusable control).

const FOCUSABLE = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

const isVisible = (el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';

export const focusableIn = (node) => (node ? [...node.querySelectorAll(FOCUSABLE)].filter(isVisible) : []);

// Open dialogs, top-most last.
const stack = [];

function trapTab(e, node) {
  const items = focusableIn(node);
  if (items.length === 0) {
    e.preventDefault();
    node.focus();
    return;
  }
  const first = items[0];
  const last = items[items.length - 1];
  const active = document.activeElement;
  const outside = !node.contains(active);
  if (e.shiftKey && (active === first || active === node || outside)) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && (active === last || outside)) {
    e.preventDefault();
    first.focus();
  }
}

export default function useDialog(open, onClose, { initialFocus } = {}) {
  const ref = useRef(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);
  const initialFocusRef = useRef(initialFocus);
  initialFocusRef.current = initialFocus;

  useEffect(() => {
    if (!open) return undefined;
    const token = {};
    stack.push(token);
    const opener = document.activeElement;
    const node = ref.current;

    if (node && !node.contains(document.activeElement)) {
      const target = initialFocusRef.current?.current || focusableIn(node)[0] || node;
      if (target === node && !node.hasAttribute('tabindex')) node.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }

    const onKey = (e) => {
      if (stack[stack.length - 1] !== token || !ref.current) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        if (onCloseRef.current) onCloseRef.current();
      } else if (e.key === 'Tab') {
        trapTab(e, ref.current);
      }
    };
    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('keydown', onKey);
      const i = stack.indexOf(token);
      if (i !== -1) stack.splice(i, 1);
      // Return focus to the opener if it is still on the page and focus was inside (or lost).
      const active = document.activeElement;
      const focusLost = !active || active === document.body || (node && node.contains(active)) || !document.contains(active);
      if (focusLost && opener && typeof opener.focus === 'function' && document.contains(opener)) {
        opener.focus({ preventScroll: true });
      }
    };
  }, [open]);

  return ref;
}
