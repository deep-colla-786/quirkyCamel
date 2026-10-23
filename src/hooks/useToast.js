import { useState } from 'react';

// A single toast message that clears itself after a few seconds.
export default function useToast() {
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 2800);
  };

  return { toastMessage, showToast };
}
