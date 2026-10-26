// Scene-building helpers for the 3D kit (Hero3D). Each builder adds its objects to the
// given parent and returns the handles the animation loop needs.
import * as THREE from 'three';
import { EPISODES } from '../../data/episodes';
import { CAMEL_ICON_PNG, LOGO_PNG } from '../../utils/svgGenerators';

// Box dimensions and card size
const BW = 2.7, BH = 2.5, BD = 1.0;
const CW = 1.0, CH = 1.5;

// Resolves with the loaded image, or null if it fails to load.
const loadImg = (src) =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });

// Adds a rounded rectangle to the current path (plain rectangle on canvases without roundRect).
function roundedRect(ctx, x, y, w, h, r) {
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
  else ctx.rect(x, y, w, h);
}

export function hasWebGL() {
  try {
    const testCanvas = document.createElement('canvas');
    return Boolean(testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl'));
  } catch {
    return false;
  }
}

export function createRenderer() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  if (THREE.SRGBColorSpace) {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
  }
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  return renderer;
}

export function addLights(scene) {
  // Three r155+ dropped legacy lighting: intensities are physical, so scale by PI
  // (and use the old linear falloff) to match the original r128 look.
  const PI = Math.PI;
  scene.add(new THREE.HemisphereLight(0xe6eeff, 0x14295e, 0.95 * PI));
  const key = new THREE.DirectionalLight(0xffffff, 1.15 * PI);
  key.position.set(3, 6, 6);
  scene.add(key);

  const rim = new THREE.PointLight(0xc4e539, 1.4 * PI, 20, 1);
  rim.position.set(-4, 3, -2);
  scene.add(rim);

  const warm = new THREE.PointLight(0xff9100, 0.8 * PI, 16, 1);
  warm.position.set(4, -1, 4);
  scene.add(warm);
}

// Canvas-texture painter. Camel artwork loads asynchronously, so each canvas texture is
// painted once straight away and again once the images (and webfonts) are ready.
export function createPainter() {
  const imgs = { icon: null, logo: null };
  const repaints = [];

  const makeTex = (canvas) => {
    const t = new THREE.CanvasTexture(canvas);
    if (THREE.SRGBColorSpace) {
      t.colorSpace = THREE.SRGBColorSpace;
    }
    t.anisotropy = 4;
    return t;
  };

  const paintTex = (W, H, draw) => {
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const x = c.getContext('2d');
    const tex = makeTex(c);
    const run = () => {
      x.clearRect(0, 0, W, H);
      x.save();
      draw(x, W, H);
      x.restore();
      tex.needsUpdate = true;
    };
    run();
    repaints.push(run);
    return tex;
  };

  // Recolour a black-on-transparent image (camel icon / logo) to a flat colour.
  const tint = (img, color) => {
    const c = document.createElement('canvas');
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const x = c.getContext('2d');
    x.drawImage(img, 0, 0);
    x.globalCompositeOperation = 'source-in';
    x.fillStyle = color;
    x.fillRect(0, 0, c.width, c.height);
    return c;
  };

  // Loads the artwork and repaints every texture; calls onDone afterwards unless cancelled.
  const loadArtwork = (isCancelled, onDone) =>
    Promise.all([loadImg(CAMEL_ICON_PNG), loadImg(LOGO_PNG), document.fonts ? document.fonts.ready : null]).then(
      ([icon, logo]) => {
        if (isCancelled()) return;
        imgs.icon = icon;
        imgs.logo = logo;
        repaints.forEach((run) => run());
        onDone();
      }
    );

  return { imgs, paintTex, tint, loadArtwork };
}

function paintBoxFront(painter) {
  const { imgs, tint } = painter;
  return painter.paintTex(512, 474, (x, W, H) => {
    x.fillStyle = '#2259B2';
    x.fillRect(0, 0, W, H);

    // Lime accents
    x.fillStyle = '#C4E539';
    x.globalAlpha = 0.9;
    x.beginPath();
    x.moveTo(W, 0);
    x.bezierCurveTo(W - 60, 40, W - 30, 90, W - 90, 120);
    x.bezierCurveTo(W - 40, 140, W, 120, W, 170);
    x.fill();

    x.beginPath();
    x.moveTo(0, H);
    x.bezierCurveTo(40, H - 60, 10, H - 110, 70, H - 130);
    x.bezierCurveTo(30, H - 150, 0, H - 120, 0, H - 170);
    x.fill();
    x.globalAlpha = 1;

    // Logo (camel + wordmark), falling back to text until the image loads
    x.fillStyle = '#C4E539';
    x.textAlign = 'center';
    if (imgs.logo) {
      const lw = 380, lh = (lw * imgs.logo.naturalHeight) / imgs.logo.naturalWidth;
      x.drawImage(tint(imgs.logo, '#C4E539'), (W - lw) / 2, 110, lw, lh);
    } else {
      x.font = '700 36px "Bagel Fat One", sans-serif';
      x.fillText('QUIRKY CAMEL', W / 2, 170);
    }

    x.font = '700 24px Lexend, sans-serif';
    x.fillText('THE COMPLETE KIT', W / 2, 260);

    x.font = '600 18px Lexend, sans-serif';
    x.fillText('ATTAR SACHETS · SIX EPISODES', W / 2, 296);

    // Pill
    x.beginPath();
    roundedRect(x, W / 2 - 130, 330, 260, 44, 22);
    x.fill();

    x.fillStyle = '#14295e';
    x.font = '700 15px Lexend, sans-serif';
    x.fillText('COLLECT. SNAP. WEAR.', W / 2, 358);
  });
}

function paintBoxSide(painter) {
  const { imgs, tint } = painter;
  return painter.paintTex(200, 474, (sx) => {
    sx.fillStyle = '#1f50a3';
    sx.fillRect(0, 0, 200, 474);
    sx.translate(100, 237);
    sx.rotate(-Math.PI / 2);
    if (imgs.icon) {
      sx.drawImage(tint(imgs.icon, '#C4E539'), -90, -60, 180, 140);
    } else {
      sx.fillStyle = '#C4E539';
      sx.font = '700 24px "Bagel Fat One", sans-serif';
      sx.textAlign = 'center';
      sx.fillText('QUIRKY CAMEL', 0, 8);
    }
  });
}

// The collector box, its open lid and the dark slot the sachets sit in.
export function buildBox(root, painter) {
  const sideTex = paintBoxSide(painter);
  const sideM = new THREE.MeshStandardMaterial({ map: sideTex, roughness: 0.55 });
  const plainM = new THREE.MeshStandardMaterial({ color: 0x1c4b9c, roughness: 0.6 });
  const frontM = new THREE.MeshStandardMaterial({ map: paintBoxFront(painter), roughness: 0.5 });
  const box = new THREE.Mesh(new THREE.BoxGeometry(BW, BH, BD), [sideM, sideM, plainM, plainM, frontM, plainM]);
  box.position.y = -0.55;
  root.add(box);

  // Lid behind
  const lidM = new THREE.MeshStandardMaterial({ color: 0x2259b2, roughness: 0.55 });
  const lid = new THREE.Mesh(new THREE.BoxGeometry(BW + 0.08, 0.2, BD + 0.08), lidM);
  lid.position.set(0, -0.45 + BH / 2 + 0.95, -0.95);
  lid.rotation.x = -1.25;
  root.add(lid);

  // Dark interior slot
  const inner = new THREE.Mesh(new THREE.PlaneGeometry(BW - 0.1, BD - 0.1), new THREE.MeshBasicMaterial({ color: 0x0e2554 }));
  inner.rotation.x = -Math.PI / 2;
  inner.position.set(0, -0.55 + BH / 2 + 0.002, 0);
  root.add(inner);
}

function paintCardFront(painter, e) {
  const { imgs, tint } = painter;
  return painter.paintTex(400, 600, (x, W, H) => {
    const p = e.pal;

    x.fillStyle = p.bg;
    x.fillRect(0, 0, W, H);

    const hg = x.createLinearGradient(0, 0, 0, H * 0.5);
    hg.addColorStop(0, 'rgba(255,255,255,.22)');
    hg.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = hg;
    x.fillRect(0, 0, W, H);

    x.fillStyle = 'rgba(0,0,0,.16)';
    x.fillRect(0, 0, W, 60);
    x.fillRect(0, 540, W, 60);

    // Tear notch
    x.fillStyle = p.deep;
    x.beginPath();
    x.moveTo(0, 66);
    x.lineTo(18, 76);
    x.lineTo(0, 86);
    x.fill();

    // Perforation line
    x.setLineDash([8, 6]);
    x.strokeStyle = p.ink;
    x.globalAlpha = 0.55;
    x.lineWidth = 2.5;
    x.beginPath();
    x.moveTo(20, 90);
    x.lineTo(W - 20, 90);
    x.stroke();
    x.setLineDash([]);
    x.globalAlpha = 1;

    // Soft center frame
    x.fillStyle = p.soft;
    x.beginPath();
    roundedRect(x, 36, 116, W - 72, 246, 24);
    x.fill();

    // Accent sun
    x.fillStyle = p.accent;
    x.globalAlpha = 0.45;
    x.beginPath();
    x.arc(W - 110, 180, 46, 0, Math.PI * 2);
    x.fill();
    x.globalAlpha = 1;

    // The episode's camel; lime camels read better in the episode's deep colour
    if (imgs.icon) {
      const iw = 220, ih = (iw * imgs.icon.naturalHeight) / imgs.icon.naturalWidth;
      const col = e.camel === '#C4E539' ? p.deep : e.camel;
      x.drawImage(tint(imgs.icon, col), (W - iw) / 2, 250 - ih / 2 + 14, iw, ih);
    }

    // Labels
    x.fillStyle = p.ink;
    x.textAlign = 'center';
    x.font = '700 17px Lexend, sans-serif';
    x.globalAlpha = 0.9;
    x.fillText('EPISODE 0' + e.n + ' · ATTAR SACHET', W / 2, 396);
    x.globalAlpha = 1;

    x.fillStyle = p.title;
    x.font = '400 38px "Bagel Fat One", sans-serif';
    const ls = e.lines;
    const y0 = ls.length > 1 ? 444 : 466;
    for (let i = 0; i < ls.length; i++) x.fillText(ls[i], W / 2, y0 + i * 44);

    x.fillStyle = p.ink;
    x.font = '700 14px Lexend, sans-serif';
    x.globalAlpha = 0.8;
    x.fillText('QUIRKY CAMEL', W / 2, 526);
    x.globalAlpha = 1;
  });
}

function paintCardBack(painter) {
  const { imgs, tint } = painter;
  return painter.paintTex(200, 300, (bx) => {
    bx.fillStyle = '#2259B2';
    bx.fillRect(0, 0, 200, 300);
    bx.fillStyle = 'rgba(0,0,0,.18)';
    bx.fillRect(0, 0, 200, 30);
    bx.fillRect(0, 270, 200, 30);
    if (imgs.icon) bx.drawImage(tint(imgs.icon, '#C4E539'), 45, 95, 110, 86);
    bx.fillStyle = '#C4E539';
    bx.textAlign = 'center';
    bx.font = '700 11px Lexend, sans-serif';
    bx.fillText('ATTAR SACHET', 100, 210);
  });
}

// Zig-zag sealed sachet outline shared by every card.
function cardGeometries() {
  const shape = new THREE.Shape();
  const w = CW / 2, h = CH / 2, n = 20, t = 0.028;
  shape.moveTo(-w, -h);
  for (let i = 1; i <= n; i++) shape.lineTo(-w + (CW * i) / n, -h + (i % 2 ? t : 0));
  shape.lineTo(w, h);
  for (let i = 1; i <= n; i++) shape.lineTo(w - (CW * i) / n, h - (i % 2 ? t : 0));
  shape.lineTo(-w, -h);

  const slab = new THREE.ExtrudeGeometry(shape, { depth: 0.024, bevelEnabled: false });
  slab.translate(0, 0, -0.012);

  const plane = new THREE.ShapeGeometry(shape);
  const pa = plane.attributes.position, uv = plane.attributes.uv;
  for (let i = 0; i < pa.count; i++) {
    uv.setXY(i, (pa.getX(i) + CW / 2) / CW, (pa.getY(i) + CH / 2) / CH);
  }
  uv.needsUpdate = true;
  return { slab, plane };
}

// The six sachets fanned out of the box. Returns the card groups (raycast targets).
export function buildCards(root, painter) {
  const { slab, plane } = cardGeometries();
  const backT = paintCardBack(painter);
  const pivotY = -0.55 + BH / 2 - 0.25;

  return EPISODES.map((e, i) => {
    const g = new THREE.Group();
    const innerGroup = new THREE.Group();
    g.add(innerGroup);

    const edge = new THREE.Mesh(slab, new THREE.MeshStandardMaterial({ color: new THREE.Color(e.pal.deep), roughness: 0.5 }));
    const f = new THREE.Mesh(plane, new THREE.MeshStandardMaterial({ map: paintCardFront(painter, e), roughness: 0.35, metalness: 0.08 }));
    f.position.z = 0.0125;
    const bMesh = new THREE.Mesh(plane, new THREE.MeshStandardMaterial({ map: backT, roughness: 0.4 }));
    bMesh.position.z = -0.0125;
    bMesh.rotation.y = Math.PI;

    innerGroup.add(edge, f, bMesh);

    const th = (-1 + (2 * i) / 5) * 0.78;
    g.position.set(0, pivotY, -0.08 + i * 0.012);
    g.rotation.z = -th;
    innerGroup.position.y = 1.15;

    g.userData = { e, th, lift: 0, phase: i * 1.1 };
    g.traverse((o) => (o.userData.card = g));
    root.add(g);
    return g;
  });
}

function makeFlower(pc, cc, count) {
  const g = new THREE.Group();
  const pm = new THREE.MeshStandardMaterial({ color: pc, roughness: 0.35 });
  const cm = new THREE.MeshStandardMaterial({ color: cc, roughness: 0.3 });
  for (let i = 0; i < count; i++) {
    const petal = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), pm);
    petal.scale.set(1, 0.42, 1.7);
    const a = (i / count) * Math.PI * 2;
    petal.position.set(Math.cos(a) * 0.34, 0, Math.sin(a) * 0.34);
    petal.rotation.y = -a + Math.PI / 2;
    g.add(petal);
  }
  const center = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), cm);
  center.scale.y = 0.8;
  center.position.y = 0.06;
  g.add(center);
  return g;
}

// Two floating 3D flowers.
export function buildFlowers(scene) {
  const fl1 = makeFlower(0xff4fa0, 0xff9100, 7);
  fl1.position.set(-3.3, 2.4, -1);
  fl1.rotation.x = 1.1;
  scene.add(fl1);

  const fl2 = makeFlower(0xff9100, 0x2259b2, 9);
  fl2.position.set(3.4, -1.6, 0.8);
  fl2.rotation.x = 1.2;
  fl2.scale.setScalar(0.8);
  scene.add(fl2);
  return [fl1, fl2];
}

export function buildSparkles(scene) {
  const N = 60;
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    // eslint-disable-next-line sonarjs/pseudo-random -- cosmetic only, not security-sensitive
    pos[i * 3] = (Math.random() - 0.5) * 13;
    // eslint-disable-next-line sonarjs/pseudo-random -- cosmetic only, not security-sensitive
    pos[i * 3 + 1] = (Math.random() - 0.5) * 8 + 0.5;
    // eslint-disable-next-line sonarjs/pseudo-random -- cosmetic only, not security-sensitive
    pos[i * 3 + 2] = (Math.random() - 0.5) * 6 - 1.5;
  }
  const spG = new THREE.BufferGeometry();
  spG.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dc = document.createElement('canvas');
  dc.width = dc.height = 32;
  const dx = dc.getContext('2d');
  dx.fillStyle = '#ffffff';
  dx.beginPath();
  dx.moveTo(16, 0);
  dx.quadraticCurveTo(17, 15, 32, 16);
  dx.quadraticCurveTo(17, 17, 16, 32);
  dx.quadraticCurveTo(15, 17, 0, 16);
  dx.quadraticCurveTo(15, 15, 16, 0);
  dx.fill();
  const sparks = new THREE.Points(
    spG,
    new THREE.PointsMaterial({ size: 0.16, map: new THREE.CanvasTexture(dc), transparent: true, depthWrite: false, opacity: 0.8 })
  );
  scene.add(sparks);
  return sparks;
}

export function buildShadow(scene) {
  const sc = document.createElement('canvas');
  sc.width = sc.height = 128;
  const shadowCtx = sc.getContext('2d');
  const rg = shadowCtx.createRadialGradient(64, 64, 4, 64, 64, 64);
  rg.addColorStop(0, 'rgba(5,15,45,.55)');
  rg.addColorStop(1, 'rgba(5,15,45,0)');
  shadowCtx.fillStyle = rg;
  shadowCtx.fillRect(0, 0, 128, 128);
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(5, 2.4),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -1.82;
  scene.add(shadow);
}

// Builds the whole scene graph. Returns the pieces the animation loop moves.
export function buildKitScene(painter) {
  const scene = new THREE.Scene();
  addLights(scene);
  const root = new THREE.Group();
  scene.add(root);
  buildBox(root, painter);
  const cards = buildCards(root, painter);
  const [fl1, fl2] = buildFlowers(scene);
  const sparks = buildSparkles(scene);
  buildShadow(scene);
  return { scene, root, cards, fl1, fl2, sparks };
}

// Frees every geometry, material and texture in the scene, then the renderer and its GL context.
export function disposeKitScene(scene, renderer) {
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();
  scene.traverse((o) => {
    if (o.geometry) geometries.add(o.geometry);
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    mats.forEach((m) => {
      if (!m) return;
      materials.add(m);
      Object.values(m).forEach((v) => {
        if (v && v.isTexture) textures.add(v);
      });
    });
  });
  textures.forEach((t) => t.dispose());
  materials.forEach((m) => m.dispose());
  geometries.forEach((g) => g.dispose());
  scene.clear();
  renderer.renderLists.dispose();
  renderer.dispose();
  renderer.forceContextLoss();
}

// One animation step. `t` is the scene time in seconds (frozen at 0 for reduced motion).
export function stepKitScene(s, st, t) {
  if (!st.dragging && !st.reduced) {
    st.targetRotY += (Math.sin(t * 0.35) * 0.45 - 0.15 - st.targetRotY) * 0.01;
  }
  st.rotY += (st.targetRotY - st.rotY) * 0.08;
  s.root.rotation.y = st.rotY;
  s.root.position.y = Math.sin(t * 1.1) * 0.05;

  s.cards.forEach((c) => {
    const u = c.userData;
    const want = c === st.hoveredCard ? 1 : 0;
    u.lift += (want - u.lift) * 0.15;
    const innerNode = c.children[0];
    innerNode.position.y = 1.15 + u.lift * 0.55 + Math.sin(t * 1.4 + u.phase) * 0.04;
    innerNode.position.z = u.lift * 0.35;
    innerNode.rotation.x = -u.lift * 0.12;
    innerNode.scale.setScalar(1 + u.lift * 0.08);
  });

  if (!st.reduced) {
    s.fl1.rotation.z += 0.004;
    s.fl2.rotation.z -= 0.005;
  }
  s.fl1.position.y = 2.4 + Math.sin(t * 0.9) * 0.15;
  s.fl2.position.y = -1.6 + Math.cos(t * 0.8) * 0.15;
  s.sparks.rotation.y = t * 0.02;

  s.camera.position.x += (st.mx * 1.2 - s.camera.position.x) * 0.05;
  s.camera.position.y += (1.2 - st.my * 0.8 - s.camera.position.y) * 0.05;
  s.camera.lookAt(s.lookTarget);
}
