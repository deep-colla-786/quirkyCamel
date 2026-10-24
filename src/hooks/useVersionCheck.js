import { useEffect, useState } from 'react';
import { api } from '../lib/api';

const CHECK_EVERY_MS = 2 * 60 * 1000;

// True once the site has been updated since this page was opened (the server's version
// changed), so the page can offer a refresh instead of running outdated code.
export default function useVersionCheck() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    let first = null;
    const check = async () => {
      const res = await api('/version');
      if (!res.ok || !res.data.version) return;
      if (first === null) first = res.data.version;
      else if (res.data.version !== first) setUpdateAvailable(true);
    };
    const onVisible = () => document.visibilityState === 'visible' && check();
    check();
    const timer = setInterval(check, CHECK_EVERY_MS);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return updateAvailable;
}
