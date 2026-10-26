import { useEffect, useState } from 'react';
import '../styles/offscreen-pause.css';

// Pauses the CSS and SVG (SMIL) animations inside `ref` while it is scrolled out of view
// or the tab is hidden, and resumes them when it comes back. Returns whether it is in view.
function setSvgPaused(root, paused) {
  root.querySelectorAll('svg').forEach((svg) => {
    if (svg.ownerSVGElement) return; // nested <svg>s share their outer svg's timeline
    if (paused && typeof svg.pauseAnimations === 'function') svg.pauseAnimations();
    if (!paused && typeof svg.unpauseAnimations === 'function') svg.unpauseAnimations();
  });
}

export default function useOffscreenPause(ref, { rootMargin = '100px' } = {}) {
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    let visible = true;
    const apply = () => {
      const paused = !visible || document.hidden;
      el.classList.toggle('is-offscreen', paused);
      setSvgPaused(el, paused);
      setInView(visible);
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        apply();
      },
      { rootMargin }
    );
    io.observe(el);
    document.addEventListener('visibilitychange', apply);
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', apply);
      el.classList.remove('is-offscreen');
      setSvgPaused(el, false);
    };
  }, [ref, rootMargin]);

  return inView;
}
