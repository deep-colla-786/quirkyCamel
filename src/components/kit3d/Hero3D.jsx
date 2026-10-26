import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import * as THREE from 'three';
import { hasWebGL, createRenderer, createPainter, buildKitScene, disposeKitScene, stepKitScene } from './kitScene';

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';
// With reduced motion the scene renders still frames; it only animates for this long
// after the visitor drags or hovers, so the hover lift and drag easing can settle.
const INTERACTION_MS = 1200;

// Drag-to-turn, hover-to-lift and tap-a-sachet handling on the canvas.
function attachPointer(el, s, st, { onTooltip, onSelect, onActivity }) {
  const ray = new THREE.Raycaster();
  const ptr = new THREE.Vector2();
  let lastX = 0;
  let movedDist = 0;

  const pickCard = (clientX, clientY) => {
    const rect = el.getBoundingClientRect();
    ptr.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    ray.setFromCamera(ptr, s.camera);
    const hits = ray.intersectObjects(s.cards, true);
    return hits.length > 0 ? hits[0].object.userData.card : null;
  };

  const onPointerDown = (ev) => {
    st.dragging = true;
    lastX = ev.clientX;
    movedDist = 0;
    el.setPointerCapture(ev.pointerId);
    onActivity();
  };

  const onPointerMove = (ev) => {
    const rect = el.getBoundingClientRect();
    st.mx = (ev.clientX - rect.left) / rect.width - 0.5;
    st.my = (ev.clientY - rect.top) / rect.height - 0.5;

    if (st.dragging) {
      const d = ev.clientX - lastX;
      lastX = ev.clientX;
      movedDist += Math.abs(d);
      st.targetRotY = Math.max(-1.3, Math.min(1.3, st.targetRotY + d * 0.008));
    }

    const h = st.dragging && movedDist > 6 ? null : pickCard(ev.clientX, ev.clientY);
    if (h !== st.hoveredCard) {
      st.hoveredCard = h;
      el.style.cursor = h ? 'pointer' : 'grab';
    }

    onTooltip(h ? { name: h.userData.e.name, headline: h.userData.e.headline, x: ev.clientX - rect.left, y: ev.clientY - rect.top } : null);
    onActivity();
  };

  const onPointerUp = (ev) => {
    st.dragging = false;
    if (movedDist <= 6) {
      const h = pickCard(ev.clientX, ev.clientY);
      if (h) onSelect(h.userData.e.id);
    }
    onActivity();
  };

  const onPointerLeave = () => {
    st.hoveredCard = null;
    st.mx = 0;
    st.my = 0;
    onTooltip(null);
    el.style.cursor = 'grab';
    onActivity();
  };

  el.addEventListener('pointerdown', onPointerDown);
  el.addEventListener('pointermove', onPointerMove);
  el.addEventListener('pointerup', onPointerUp);
  el.addEventListener('pointerleave', onPointerLeave);
  return () => {
    el.removeEventListener('pointerdown', onPointerDown);
    el.removeEventListener('pointermove', onPointerMove);
    el.removeEventListener('pointerup', onPointerUp);
    el.removeEventListener('pointerleave', onPointerLeave);
  };
}

// Render loop that only runs while the stage is on screen and the tab is visible.
// With reduced motion it draws still frames, animating briefly after interaction only.
function createLoop(renderer, s, st) {
  let rafId = 0;
  let visible = true;
  let activeUntil = 0;
  let elapsed = 0;
  let last = performance.now();

  const canDraw = () => visible && !document.hidden;
  const shouldContinue = () => canDraw() && (!st.reduced || performance.now() < activeUntil);

  const frame = (now) => {
    rafId = 0;
    const dt = Math.min(Math.max(now - last, 0) / 1000, 0.1);
    last = now;
    if (!st.reduced) elapsed += dt;
    stepKitScene(s, st, st.reduced ? 0 : elapsed);
    renderer.render(s.scene, s.camera);
    if (shouldContinue()) rafId = requestAnimationFrame(frame);
  };

  // Schedules a frame (which keeps looping when motion is allowed) if the stage can be drawn.
  const kick = () => {
    if (rafId || !canDraw()) return;
    last = performance.now();
    rafId = requestAnimationFrame(frame);
  };

  return {
    kick,
    setVisible(v) {
      visible = v;
      kick();
    },
    activity() {
      activeUntil = performance.now() + INTERACTION_MS;
      kick();
    },
    stop() {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
    }
  };
}

export default function Hero3D({ onSelectEpisode }) {
  const containerRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const [webglSupported, setWebglSupported] = useState(true);
  // Keep the latest callback in a ref so the WebGL scene isn't rebuilt on every parent render.
  const onSelectRef = useRef(onSelectEpisode);
  useEffect(() => {
    onSelectRef.current = onSelectEpisode;
  }, [onSelectEpisode]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (!hasWebGL()) {
      setWebglSupported(false);
      return;
    }

    const renderer = createRenderer();
    container.appendChild(renderer.domElement);

    const painter = createPainter();
    const s = buildKitScene(painter);
    s.camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    s.camera.position.set(0, 1.2, 10);
    s.lookTarget = new THREE.Vector3(0, 0.6, 0);

    const motionQuery = window.matchMedia ? window.matchMedia(REDUCED_MOTION) : null;
    const st = {
      rotY: -0.25,
      targetRotY: -0.25,
      dragging: false,
      mx: 0,
      my: 0,
      hoveredCard: null,
      reduced: Boolean(motionQuery && motionQuery.matches)
    };

    const loop = createLoop(renderer, s, st);

    let disposed = false;
    painter.loadArtwork(() => disposed, loop.kick);

    const detachPointer = attachPointer(renderer.domElement, s, st, {
      onTooltip: setTooltip,
      onSelect: (id) => onSelectRef.current && onSelectRef.current(id),
      onActivity: loop.activity
    });

    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      s.camera.aspect = w / h;
      s.camera.position.z = w / h < 1.05 ? 13 : 10;
      s.camera.updateProjectionMatrix();
      loop.kick();
    };
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(container);
    onResize();

    // Pause while scrolled away or while the tab is hidden.
    const io =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver(([entry]) => loop.setVisible(entry.isIntersecting));
    if (io) io.observe(container);
    const onVisibility = () => loop.kick();
    document.addEventListener('visibilitychange', onVisibility);

    const onMotionChange = (ev) => {
      st.reduced = ev.matches;
      loop.kick();
    };
    if (motionQuery) motionQuery.addEventListener('change', onMotionChange);

    loop.kick();

    return () => {
      disposed = true;
      loop.stop();
      resizeObserver.disconnect();
      if (io) io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      if (motionQuery) motionQuery.removeEventListener('change', onMotionChange);
      detachPointer();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      disposeKitScene(s.scene, renderer);
    };
  }, []);

  return (
    <div
      className="stage"
      id="stage"
      ref={containerRef}
      aria-label="3D Quirky Camel kit box with six fragrance sachets fanned out of it. Drag to turn it, tap a sachet to open that episode."
    >
      <div className="hint">
        <i />
        Drag the kit · Tap a sachet
      </div>

      {tooltip && (
        <div
          className="tip"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            opacity: 1
          }}
        >
          {tooltip.name}
          <small>{tooltip.headline}</small>
        </div>
      )}

      {!webglSupported && (
        <div className="fallback">
          <div>
            <span className="icon" style={{ height: '90px', color: 'var(--lime)' }} />
            <p className="mix" style={{ fontSize: '22px' }}>
              The 3D kit needs WebGL. All six episodes are shown below!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

Hero3D.propTypes = {
  onSelectEpisode: PropTypes.func.isRequired
};
