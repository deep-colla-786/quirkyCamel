import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { EPISODES } from '../../data/episodes';
import { kitSVG } from '../../utils/svgGenerators';

// three.js is large, so the 3D kit lives in its own chunk. Until it is needed a still
// picture of the kit fills the same stage, so the layout doesn't move when it swaps in.
const loadHero3D = () => import('./Hero3D');
// If the chunk can't load (offline, flaky network) keep showing the still picture.
const Hero3D = lazy(() => loadHero3D().catch(() => ({ default: () => <StagePlaceholder /> })));

const STAGE_LABEL =
  '3D Quirky Camel kit box with six fragrance sachets fanned out of it. Drag to turn it, tap a sachet to open that episode.';

const stillArt = () => kitSVG(EPISODES, 'hero-still').replace('<svg class="kitsvg"', '<svg class="kitsvg" width="100%" height="100%"');

function StagePlaceholder({ stageRef, onWake }) {
  return (
    <div className="stage" id="stage" ref={stageRef} aria-label={STAGE_LABEL} onPointerEnter={onWake} onTouchStart={onWake}>
      <div className="hint">
        <i />
        Drag the kit · Tap a sachet
      </div>
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0 }} dangerouslySetInnerHTML={{ __html: stillArt() }} />
    </div>
  );
}

StagePlaceholder.propTypes = {
  stageRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.any })]),
  onWake: PropTypes.func
};

const whenIdle = (fn) => {
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(fn, { timeout: 1500 });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(fn, 200);
  return () => window.clearTimeout(id);
};

// Desktop (mouse) visitors get the 3D kit as soon as the page is idle. On touch devices,
// where three.js is costly, it also waits for the visitor's first scroll/tap/key press so
// it never competes with the first paint.
const FIRST_INPUT = ['scroll', 'pointerdown', 'touchstart', 'keydown', 'wheel'];
const isDesktopPointer = () => Boolean(window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches);

function afterFirstInput(fn) {
  if (isDesktopPointer()) {
    fn();
    return () => {};
  }
  let done = false;
  const go = () => {
    if (done) return;
    done = true;
    FIRST_INPUT.forEach((t) => window.removeEventListener(t, go));
    fn();
  };
  FIRST_INPUT.forEach((t) => window.addEventListener(t, go, { passive: true }));
  return () => {
    done = true;
    FIRST_INPUT.forEach((t) => window.removeEventListener(t, go));
  };
}

// Loads the 3D kit once its stage is near the viewport and the browser is idle
// (or straight away when the visitor points at it).
export default function LazyHero3D({ onSelectEpisode }) {
  const [active, setActive] = useState(false);
  const stageRef = useRef(null);

  useEffect(() => {
    if (active) return undefined;
    const el = stageRef.current;
    let cancelIdle = null;
    let cancelInput = null;
    const start = () => {
      cancelInput = afterFirstInput(() => {
        cancelIdle = whenIdle(() => setActive(true));
      });
    };
    const cancelAll = () => {
      if (cancelInput) cancelInput();
      if (cancelIdle) cancelIdle();
    };
    if (!el || typeof IntersectionObserver === 'undefined') {
      start();
      return cancelAll;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((en) => en.isIntersecting)) {
          io.disconnect();
          start();
        }
      },
      { rootMargin: '200px' }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAll();
    };
  }, [active]);

  if (!active) return <StagePlaceholder stageRef={stageRef} onWake={() => setActive(true)} />;
  return (
    <Suspense fallback={<StagePlaceholder />}>
      <Hero3D onSelectEpisode={onSelectEpisode} />
    </Suspense>
  );
}

LazyHero3D.propTypes = {
  onSelectEpisode: PropTypes.func.isRequired
};
