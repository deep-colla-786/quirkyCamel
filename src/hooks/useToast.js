import { useState, useCallback, useRef, useEffect } from 'react';

const TOAST_MS = 2800;

// A single toast message that clears itself after a few seconds.
export default function useToast() {
  const [toastMessage, setToastMessage] = useState('');
  const timer = useRef(null);

  const showToast = useCallback((msg) => {
    clearTimeout(timer.current);
    setToastMessage(msg);
    timer.current = setTimeout(() => setToastMessage(''), TOAST_MS);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  return { toastMessage, showToast };
}
