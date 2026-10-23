// Camel artwork. The SVG <mask> needs the white silhouette (masks read luminance);
// CSS masks and the 3D canvas tint use the black icon (they read alpha).
import camelMaskUrl from '../assets/camel-mask.png';
import camelIconUrl from '../assets/camel-icon.png';
import camelMascotUrl from '../assets/camel-mascot.webp';
import logoUrl from '../assets/qc-logo.png';

export const CAMEL_MASK_PNG = camelMaskUrl;
export const CAMEL_ICON_PNG = camelIconUrl;
export const CAMEL_MASCOT_WEBP = camelMascotUrl;
export const LOGO_PNG = logoUrl;

let uidN = 0;

export function camel(x, y, w, color, extra = '', flip = false) {
  const u = 'm' + (++uidN);
  const s = w / 366;
  const tf = flip
    ? `translate(${x + w} ${y}) scale(${-s} ${s})`
    : `translate(${x} ${y}) scale(${s})`;
  return `<g transform="${tf}"><mask id="${u}" maskUnits="userSpaceOnUse" x="0" y="0" width="366" height="286"><image href="${CAMEL_MASK_PNG}" width="366" height="286"/></mask><rect width="366" height="286" fill="${color}" mask="url(#${u})"/>${extra}</g>`;
}

const L = (d, c) => `<g class="pl" data-d="${d}">${c}</g>`;
const anim = (attr, vals, dur, extra = '') =>
  `<animate attributeName="${attr}" values="${vals}" dur="${dur}s" repeatCount="indefinite" ${extra}/>`;
const animT = (type, vals, dur, extra = '') =>
  `<animateTransform attributeName="transform" type="${type}" values="${vals}" dur="${dur}s" repeatCount="indefinite" ${extra}/>`;

export function wrapSVG(content, label) {
  return `<svg viewBox="0 0 480 360" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${label}">${content}</svg>`;
}

export const SCENES = {
  'trouble-in-oasis'() {
    const u = 'o' + (++uidN);
    const ripples = L(26, `<g opacity=".45" stroke="#fff" stroke-width="2" fill="none"><path d="M20 130 q20 -8 40 0 t40 0">${animT('translate', '0 0;0 -6;0 0', 3)}</path><path d="M300 150 q20 -8 40 0 t40 0">${animT('translate', '0 0;0 -6;0 0', 3.6)}</path></g>`);
    return wrapSVG(
      `<defs><linearGradient id="${u}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe3a3"/><stop offset="1" stop-color="#ffb35a"/></linearGradient>
   <radialGradient id="${u}w" cx=".5" cy=".4" r=".7"><stop offset="0" stop-color="#7cf0f2"/><stop offset="1" stop-color="#1590a8"/></radialGradient>
   <clipPath id="${u}c"><ellipse cx="270" cy="292" rx="130" ry="34"/></clipPath></defs>
   <rect width="480" height="360" fill="url(#${u}s)"/>
   ${L(4, `<circle cx="380" cy="78" r="44" fill="#fff4c9"/><circle cx="380" cy="78" r="64" fill="#fff4c9" opacity=".35">${anim('r', '60;70;60', 4)}</circle>`)}
   ${L(8, `<path d="M0 210 Q90 160 190 200 T380 190 T480 200 V360 H0z" fill="#f2a24b"/>`)}
   ${L(14, `<path d="M-10 250 Q120 205 240 248 T490 240 V360 H-10z" fill="#e0812a"/>`)}
   ${L(18, `<ellipse cx="270" cy="292" rx="130" ry="34" fill="url(#${u}w)"/>
     <g clip-path="url(#${u}c)" opacity=".35">${camel(140, 292, 124, '#173f86', '', false).replace('<g transform="translate(140 292) scale', '<g transform="translate(140 392) scale').replace(/scale\(([\d.]+)\)/, (m, s) => `scale(${s} -${s})`)}</g>
     <path d="M180 290 h50 M250 300 h70 M300 284 h40" stroke="#e8ffff" stroke-width="3" stroke-linecap="round" opacity=".8">${anim('opacity', '.2;.9;.2', 3)}</path>
     <g transform="translate(395 300)"><path d="M0 0 C-4-40 2-80 8-110" stroke="#7a4a1c" stroke-width="9" fill="none" stroke-linecap="round"/>
       <g fill="#7fbf2a">${animT('rotate', '-3 8 -110;3 8 -110;-3 8 -110', 5)}<path d="M8-110 q-40-10-62 18 q32-14 62-18z"/><path d="M8-110 q40-14 62 14 q-30-12-62-14z"/><path d="M8-110 q-20-34 4-56 q-6 30-4 56z"/><path d="M8-110 q30-26 54-14 q-30 0-54 14z"/></g></g>
     ${camel(140, 198, 124, '#2259B2')}
     <g transform="translate(150 166)"><rect x="-4" y="-26" width="40" height="30" rx="12" fill="#fff"/><path d="M8 4 l-6 10 12-10z" fill="#fff"/><text x="16" y="-4" text-anchor="middle" font-family="Bagel Fat One, sans-serif" font-size="20" fill="#e0812a">!?</text>${animT('translate', '150 166;150 160;150 166', 1.6, 'additive="replace"')}</g>`)}
   ${ripples}`,
      'A blue camel finds a hidden pool of water among orange desert dunes'
    );
  },
  'camel-after-dark'() {
    const u = 'd' + (++uidN);
    let stars = '';
    for (let i = 0; i < 26; i++) {
      const x = (i * 73) % 480,
        y = (i * 37) % 170,
        r = (i % 3) + 1;
      const dim = .2 + (i % 4) * .2;
      const twinkle = `${dim};1;${dim}`;
      stars += `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff">${anim('opacity', twinkle, 2 + (i % 5) * .6)}</circle>`;
    }
    let wins = '';
    for (let i = 0; i < 34; i++) {
      const x = 10 + (i * 29) % 460,
        y = 212 + (i * 17) % 70;
      wins += `<rect x="${x}" y="${y}" width="7" height="9" fill="${i % 3 ? '#ffc23d' : '#C4E539'}" opacity=".85"/>`;
    }
    let conf = '';
    for (let i = 0; i < 20; i++) {
      conf += `<g><animateTransform attributeName="transform" type="translate" values="0 -220;0 200" dur="${5 + (i % 4)}s" begin="-${i * .4}s" repeatCount="indefinite"/><rect x="${(i * 53) % 470}" y="${(i * 29) % 200}" width="6" height="10" rx="2" fill="${['#C4E539', '#ff5fa8', '#FF9100', '#7cf0f2'][i % 4]}" transform="rotate(${i * 31} ${(i * 53) % 470} ${(i * 29) % 200})"/></g>`;
    }
    return wrapSVG(
      `<defs><linearGradient id="${u}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b0f38"/><stop offset=".7" stop-color="#2d1777"/><stop offset="1" stop-color="#5a1aa8"/></linearGradient>
   <linearGradient id="${u}b" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#b44bff" stop-opacity=".7"/><stop offset="1" stop-color="#b44bff" stop-opacity="0"/></linearGradient></defs>
   <rect width="480" height="360" fill="url(#${u}s)"/>
   ${L(3, stars + `<path d="M410 40 a26 26 0 1 0 18 44 a20 20 0 1 1 -18 -44z" fill="#fff6d0"/>`)}
   ${L(6, `<g opacity=".8"><path d="M120 360 L60 0 L110 0z" fill="url(#${u}b)">${animT('rotate', '-8 120 360;10 120 360;-8 120 360', 6)}</path><path d="M360 360 L380 0 L430 0z" fill="url(#${u}b)">${animT('rotate', '8 360 360;-12 360 360;8 360 360', 7)}</path></g>`)}
   ${L(10, `<path d="M0 360 V230 h40 v-40 h30 v60 h30 v-80 h40 v90 h26 v-50 h40 v30 h36 v-70 h44 v80 h30 v-46 h40 v60 h34 v-30 h90 v126z" fill="#080a26"/><rect y="300" width="480" height="60" fill="#080a26"/>` + wins)}
   ${L(16, `<g transform="translate(240 40)"><line x1="0" y1="-40" x2="0" y2="0" stroke="#999" stroke-width="2"/><circle r="22" fill="#c9cde0"/><g stroke="#8a90b0" stroke-width="1.2" fill="none"><circle r="22"/><ellipse rx="22" ry="8"/><ellipse rx="22" ry="16"/><ellipse rx="8" ry="22"/><ellipse rx="16" ry="22"/></g><circle cx="-8" cy="-8" r="5" fill="#fff" opacity=".9">${anim('opacity', '.2;1;.2', 1.2)}</circle>${animT('rotate', '0;360', 8, 'additive="sum"')}</g>`)}
   ${L(22, camel(150, 170, 170, '#C4E539',
        `<rect x="10" y="22" width="68" height="20" rx="8" fill="#14142a"/><rect x="18" y="26" width="22" height="12" rx="5" fill="#7616C1"/><rect x="48" y="26" width="22" height="12" rx="5" fill="#7616C1"/><path d="M78 30 l20 -6" stroke="#14142a" stroke-width="6"/>
       <path d="M80 100 l-22 -14 v28z M80 100 l22 -14 v28z" fill="#ff5fa8"/><circle cx="80" cy="100" r="7" fill="#ff5fa8"/>
       <path d="M60 4 l20 -70 l22 66z" fill="#FF9100"/><circle cx="80" cy="-68" r="9" fill="#fff"/>`) + `<ellipse cx="236" cy="306" rx="90" ry="10" fill="#000" opacity=".35"/>`)}
   ${L(30, conf)}`,
      'A lime camel in sunglasses, a bow tie and a party hat under a disco ball on a purple city night'
    );
  },
  'madam-camel'() {
    const u = 's' + (++uidN);
    let tiles = '';
    for (let x = 0; x < 480; x += 40) tiles += `<line x1="${x}" y1="0" x2="${x}" y2="360" stroke="#fff" stroke-width="2" opacity=".7"/>`;
    for (let y = 0; y < 360; y += 40) tiles += `<line x1="0" y1="${y}" x2="480" y2="${y}" stroke="#fff" stroke-width="2" opacity=".7"/>`;
    let bub = '';
    for (let i = 0; i < 14; i++) {
      const x = 30 + (i * 61) % 440,
        r = 6 + (i % 4) * 6;
      bub += `<g><circle cx="${x}" cy="380" r="${r}" fill="#fff" fill-opacity=".25" stroke="#fff" stroke-width="2"/><circle cx="${x - r / 3}" cy="${380 - r / 3}" r="${r / 4}" fill="#fff"/><animateTransform attributeName="transform" type="translate" values="0 0;${i % 2 ? 12 : -12} -420" dur="${6 + (i % 5)}s" begin="-${i * .7}s" repeatCount="indefinite"/></g>`;
    }
    let drops = '';
    for (let i = 0; i < 9; i++) {
      const fadeBegin = `begin="-${i * .13}s"`;
      drops += `<path d="M${74 + i * 9} 70 q-3 6 0 9 q3 -3 0 -9z" fill="#5fc8ff"><animateTransform attributeName="transform" type="translate" values="0 0;${i * 4 - 14} 90" dur="1.1s" begin="-${i * .13}s" repeatCount="indefinite"/>${anim('opacity', '1;0', 1.1, fadeBegin)}</path>`;
    }
    return wrapSVG(
      `<defs><linearGradient id="${u}s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c8ecff"/><stop offset="1" stop-color="#8fd3ff"/></linearGradient></defs>
   <rect width="480" height="360" fill="url(#${u}s)"/>${tiles}
   ${L(4, `<rect x="0" y="290" width="480" height="70" fill="#C4E539"/><path d="M0 290 h480" stroke="#9fbd1f" stroke-width="4"/>`)}
   ${L(8, `<g><path d="M30 0 v40 q0 14 14 14 h40" stroke="#c0c6d4" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M70 50 h40 l8 18 h-56z" fill="#e3e8f1"/>${drops}</g>`)}
   ${L(12, `<g fill="#fff" opacity=".7"><path d="M330 120 q-20 -30 0 -60 q20 -30 0 -60" stroke="#fff" stroke-width="10" fill="none" stroke-linecap="round" opacity=".5">${animT('translate', '0 0;6 -10;0 0', 4)}</path><path d="M390 150 q-20 -30 0 -60" stroke="#fff" stroke-width="10" fill="none" stroke-linecap="round" opacity=".45">${animT('translate', '0 0;-6 -12;0 0', 5)}</path></g>`)}
   ${L(18, camel(140, 140, 180, '#7616C1',
        `<ellipse cx="64" cy="-4" rx="54" ry="24" fill="#ff5fa8"/><path d="M14 2 q48 18 100 -6" stroke="#ff9cc9" stroke-width="8" fill="none"/><ellipse cx="66" cy="-30" rx="28" ry="20" fill="#ff5fa8"/><path d="M44 -34 q22 10 44 0" stroke="#ff9cc9" stroke-width="6" fill="none"/>
       <circle cx="40" cy="50" r="5" fill="#fff"/><path d="M150 40 l10 -24 l10 24 l-10 24z M300 60 l8 -18 l8 18 l-8 18z" fill="#fff"/>`) + `<ellipse cx="236" cy="294" rx="100" ry="10" fill="#14295e" opacity=".18"/>`)}
   ${L(26, bub)}`,
      'A purple camel wrapped in a pink towel turban in a bright, bubbly bathroom'
    );
  },
  'mirage'() {
    const u = 'r' + (++uidN);
    const sunHat = `<ellipse cx="60" cy="6" rx="62" ry="14" fill="#fff6e0"/><path d="M28 4 q32 -46 66 0z" fill="#fff6e0"/><path d="M28 2 q34 8 66 0" stroke="#ff4f6d" stroke-width="7" fill="none"/>`;
    const bubbles = [[40, 180, 14], [440, 200, 10], [110, 320, 9], [420, 300, 16]]
      .map(([x, y, r], i) => {
        const bob = `${y};${y - 16};${y}`;
        return `<circle cx="${x}" cy="${y}" r="${r}">${anim('cy', bob, 3 + i)}</circle>`;
      })
      .join('');
    const bubbleLayer = L(28, `<g fill="#fff" fill-opacity=".25" stroke="#fff" stroke-width="2">${bubbles}</g>`);
    return wrapSVG(
      `<defs><linearGradient id="${u}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff8fa3"/><stop offset=".55" stop-color="#ffc3a0"/><stop offset="1" stop-color="#ffe2b5"/></linearGradient>
   <linearGradient id="${u}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7cf3e3"/><stop offset="1" stop-color="#1fb3c7"/></linearGradient>
   <filter id="${u}f" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.012 0.06" numOctaves="1" seed="3"><animate attributeName="baseFrequency" values="0.012 0.06;0.014 0.08;0.012 0.06" dur="6s" repeatCount="indefinite"/></feTurbulence><feDisplacementMap in="SourceGraphic" scale="9"/></filter></defs>
   <rect width="480" height="360" fill="url(#${u}s)"/>
   ${L(4, `<circle cx="240" cy="150" r="70" fill="#fff1c9" opacity=".8"/><circle cx="240" cy="150" r="96" fill="#fff1c9" opacity=".25"/>`)}
   ${L(8, `<g filter="url(#${u}f)"><rect y="196" width="480" height="164" fill="url(#${u}w)"/>
     <g opacity=".9"><path d="M360 196 q30 -26 70 0z" fill="#3fae5a"/><path d="M394 196 q2 -40 -6 -62" stroke="#7a4a1c" stroke-width="5" fill="none"/><path d="M388 134 q-24 -4 -34 12 q18 -8 34 -12z M388 134 q24 -8 36 8 q-18 -6 -36 -8z M388 134 q-4 -22 10 -30 q-6 16 -10 30z" fill="#3fae5a"/></g>
     <g opacity=".35" transform="translate(0 392) scale(1 -1)"><path d="M360 196 q30 -26 70 0z" fill="#3fae5a"/><path d="M394 196 q2 -40 -6 -62" stroke="#7a4a1c" stroke-width="5" fill="none"/></g>
     <path d="M30 230 h60 M140 250 h90 M300 236 h70 M60 290 h120 M260 310 h140" stroke="#e9fffb" stroke-width="3" stroke-linecap="round" opacity=".8"/></g>`)}
   ${L(14, `<g>${animT('translate', '0 0;0 -10;0 0', 4)}<g transform="translate(60 70) rotate(-18)"><path d="M0 0 a60 60 0 0 0 120 0z" fill="#2fb34a"/><path d="M8 0 a52 52 0 0 0 104 0z" fill="#fff6e0"/><path d="M14 0 a46 46 0 0 0 92 0z" fill="#ff4f6d"/><g fill="#2a1420"><ellipse cx="40" cy="14" rx="3" ry="5"/><ellipse cx="60" cy="24" rx="3" ry="5"/><ellipse cx="80" cy="14" rx="3" ry="5"/></g></g></g>
     <g>${animT('translate', '0 0;0 8;0 0', 5)}<g transform="translate(400 60)"><circle r="34" fill="#FF9100"/><circle r="28" fill="#ffd27a"/><g stroke="#FF9100" stroke-width="3">${[0, 45, 90, 135].map(a => `<line x1="0" y1="-28" x2="0" y2="28" transform="rotate(${a})"/>`).join('')}</g><circle r="4" fill="#fff"/></g></g>
     <g>${animT('translate', '0 0;0 -8;0 0', 3.5)}<g transform="translate(150 22)"><path d="M0 30 q-10 -24 6 -30 M0 30 q16 -26 30 -20" stroke="#3fae5a" stroke-width="3" fill="none"/><circle cx="-4" cy="34" r="10" fill="#e8174a"/><circle cx="20" cy="36" r="10" fill="#e8174a"/></g></g>`)}
   ${L(20, `<g>${anim('opacity', '1;.55;1', 3.2)}${camel(150, 176, 170, '#2259B2', sunHat)}</g>
     <ellipse cx="236" cy="312" rx="96" ry="12" fill="#1fb3c7" opacity=".6"/>`)}
   ${bubbleLayer}`,
      'A shimmering blue camel in a sun hat stands in a tropical sea under floating giant fruit'
    );
  },
  'fruitto-del-deserto'() {
    const u = 'f' + (++uidN);
    const date = (x, y, r, rot) =>
      `<g transform="translate(${x} ${y}) rotate(${rot})"><ellipse rx="${r * 1.5}" ry="${r}" fill="#5a2210"/><ellipse rx="${r * 1.5}" ry="${r}" fill="none" stroke="#3a1408" stroke-width="2"/><path d="M${-r} ${-r * .3} q${r} ${-r * .4} ${r * 2} 0" stroke="#8a3d1c" stroke-width="${r * .25}" fill="none" stroke-linecap="round"/><ellipse cx="${-r * .5}" cy="${-r * .4}" rx="${r * .4}" ry="${r * .18}" fill="#c06a3c" opacity=".8"/></g>`;
    const figSeeds = () =>
      Array.from({ length: 10 }, (_, i) => `<circle cx="${Math.cos(i) * 10}" cy="${16 + Math.sin(i * 1.7) * 9}" r="1.6"/>`).join('');
    const fig = (x, y, s, cut) => {
      const flesh = cut
        ? '<ellipse cx="0" cy="16" rx="26" ry="22" fill="#ff8aa0"/><ellipse cx="0" cy="16" rx="18" ry="15" fill="#d9415e"/><g fill="#fff3c4">' + figSeeds() + '</g>'
        : '<ellipse cx="-12" cy="0" rx="6" ry="14" fill="#a24a82" opacity=".7"/>';
      return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 -40 q-6 6 -6 14 q-30 10 -30 40 a36 36 0 0 0 72 0 q0 -30 -30 -40 q0 -8 -6 -14z" fill="#7a2c5c"/>${flesh}<path d="M0 -40 q4 -10 12 -12" stroke="#3fae5a" stroke-width="4" fill="none" stroke-linecap="round"/></g>`;
    };
    const crumbs = [[260, 330], [280, 340], [110, 340], [440, 250]]
      .map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="9" ry="5" transform="rotate(${i * 40} ${x} ${y})"/>`)
      .join('');
    const foreground = L(30, `${fig(330, 300, 1.1, true)}<g>${animT('rotate', '-6 150 300;6 150 300;-6 150 300', 3)}${date(150, 320, 18, 4)}</g><g fill="#e8d2a6">${crumbs}</g>`);
    return wrapSVG(
      `<defs><linearGradient id="${u}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9d4d"/><stop offset="1" stop-color="#ffcf7a"/></linearGradient></defs>
   <rect width="480" height="360" fill="url(#${u}s)"/>
   ${L(4, `<circle cx="110" cy="120" r="80" fill="#ffe08a" opacity=".9"/>`)}
   ${L(8, `<path d="M0 220 Q120 170 250 214 T480 200 V360 H0z" fill="#d9692e"/>`)}
   ${L(12, `<path d="M-10 262 Q140 226 260 260 T490 250 V360 H-10z" fill="#b4461f"/>`)}
   ${L(16, `${fig(400, 150, 1.6, false)}${date(70, 300, 22, -14)}${date(410, 310, 26, 10)}`)}
   ${L(22, camel(150, 150, 170, '#C4E539', `<g transform="translate(-6 40) rotate(20)">${date(0, 0, 14, 0)}</g><path d="M-30 30 l-14 -4 M-30 42 l-16 4 M-26 54 l-12 10" stroke="#fff3e6" stroke-width="5" stroke-linecap="round">${anim('opacity', '0;1;0', 1.4)}</path>`) + `<ellipse cx="236" cy="286" rx="96" ry="10" fill="#5a2210" opacity=".25"/>`)}
   ${foreground}`,
      'A lime camel snacking on a giant date among oversized dates and figs in a warm desert'
    );
  },
  'oud-but-different'() {
    const u = 'w' + (++uidN);
    let petals = '';
    for (let i = 0; i < 14; i++) {
      const x = (i * 67) % 470;
      petals += `<path d="M0 0 q10 -14 20 0 q-10 14 -20 0z" fill="${i % 2 ? '#ff5d7d' : '#e0315a'}" transform="translate(${x} -20)"><animateTransform attributeName="transform" type="translate" values="${x} -20;${x + (i % 2 ? 40 : -40)} 380" dur="${7 + (i % 5)}s" begin="-${i * .8}s" repeatCount="indefinite"/></path>`;
    }
    const rings = (cx, cy, n, c) =>
      Array.from({ length: n }, (_, i) => `<ellipse cx="${cx}" cy="${cy}" rx="${12 + i * 14}" ry="${8 + i * 10}" fill="none" stroke="${c}" stroke-width="3" opacity="${.9 - i * .1}"/>`).join('');
    const rose = (x, y, s) =>
      `<g transform="translate(${x} ${y}) scale(${s})"><circle r="30" fill="#c21d45"/><path d="M-22 -6 a22 22 0 0 1 40 -8 a16 16 0 0 0 -28 10 a10 10 0 0 1 18 4 a6 6 0 0 0 -10 0" fill="none" stroke="#ff8aa3" stroke-width="5" stroke-linecap="round"/><path d="M-30 6 q-30 6 -36 30 q26 -2 36 -30z M26 14 q34 0 40 24 q-28 2 -40 -24z" fill="#3c7a3a"/></g>`;
    return wrapSVG(
      `<defs><radialGradient id="${u}s" cx=".5" cy=".55" r=".75"><stop offset="0" stop-color="#5a2a18"/><stop offset="1" stop-color="#1a0b06"/></radialGradient></defs>
   <rect width="480" height="360" fill="url(#${u}s)"/>
   ${L(4, `<g opacity=".55">${rings(90, 90, 6, '#7a4529')}${rings(420, 280, 5, '#7a4529')}</g>`)}
   ${L(9, `<path d="M0 300 l60 -60 l50 40 l40 -80 l60 70 l30 -30 l50 50 l60 -70 l70 60 l60 -40 V360 H0z" fill="#3b1e12"/><g stroke="#6b3b22" stroke-width="2" fill="none" opacity=".8"><path d="M60 250 q20 30 0 70 M150 230 q-14 40 6 90 M330 260 q16 30 -4 70"/></g>`)}
   ${L(14, `<g transform="translate(380 70) rotate(18)"><path d="M0 0 l60 10 l-10 50 l-60 -6z" fill="#6b3b22"/><path d="M6 8 q24 20 46 6 M2 24 q24 18 48 10 M0 40 q20 12 46 10" stroke="#3a1d10" stroke-width="2" fill="none"/>${animT('rotate', '18;10;18', 6, 'additive="sum"')}</g>
     <g transform="translate(40 150) rotate(-22)"><path d="M0 0 l50 -6 l12 40 l-56 10z" fill="#7a4529"/><path d="M8 6 q18 14 44 0 M6 22 q20 10 48 -2" stroke="#3a1d10" stroke-width="2" fill="none"/></g>`)}
   ${L(20, camel(150, 150, 170, '#FF9100', `${rose(104, -4, .75)}`) + `<ellipse cx="236" cy="286" rx="96" ry="10" fill="#000" opacity=".4"/>`)}
   ${L(28, rose(60, 320, 1) + rose(430, 330, .8) + petals)}`,
      'An orange camel with a rose behind its ear stands among dark oud wood and falling rose petals'
    );
  }
};

export function sachetSVG(e, o = {}) {
  const u = 'q' + (++uidN),
    p = e.pal;
  const pos = o.w ? `x="${o.x || 0}" y="${o.y || 0}" width="${o.w}" height="${o.w * 1.5}"` : '';
  let zt = 'M0 30 L0 5',
    zb = 'M0 270 L200 270 L200 295';
  for (let i = 0; i <= 25; i++) zt += ` L${i * 8} ${i % 2 ? 0 : 5}`;
  zt += ' L200 30 Z';
  for (let i = 25; i >= 0; i--) zb += ` L${i * 8} ${i % 2 ? 300 : 295}`;
  zb += ' Z';
  let ridge = '';
  for (let x = 4; x < 200; x += 6) ridge += `M${x} 3V29M${x} 272V297`;
  const sc = SCENES[e.id]().replace('<svg ', `<svg x="18" y="58" width="164" height="123" `);
  const ln = e.lines,
    ys = ln.length > 1 ? [214, 236] : [226];
  const txt = ln
    .map(
      (l, i) =>
        `<text x="100" y="${ys[i]}" text-anchor="middle" font-family="Bagel Fat One, Arial Rounded MT Bold, sans-serif" font-size="20" fill="${p.title}" ${
          l.length > 9 ? 'textLength="166" lengthAdjust="spacingAndGlyphs"' : ''
        }>${l}</text>`
    )
    .join('');
  return `<svg class="sachet" ${pos} viewBox="0 0 200 300" overflow="visible" role="img" aria-label="${e.name} attar sachet">
   <defs><clipPath id="${u}c"><rect x="18" y="58" width="164" height="123" rx="12"/></clipPath><linearGradient id="${u}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".4" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
   <g class="body">
     <rect x="0" y="44" width="200" height="228" fill="${p.bg}"/><rect x="0" y="44" width="200" height="228" fill="url(#${u}g)"/>
     <path d="${zb}" fill="${p.bg}"/><path d="${zb}" fill="#000" opacity=".16"/><path d="${ridge}" stroke="#fff" stroke-opacity=".2" stroke-width="1.4"/>
     <line x1="10" y1="45" x2="190" y2="45" stroke="${p.ink}" stroke-opacity=".55" stroke-width="1.4" stroke-dasharray="4 3"/>
     <g clip-path="url(#${u}c)"><rect x="18" y="58" width="164" height="123" fill="${p.soft}"/>${sc}</g>
     <rect x="18" y="58" width="164" height="123" rx="12" fill="none" stroke="${p.soft}" stroke-width="3"/>
     <text x="100" y="196" text-anchor="middle" font-family="Lexend, sans-serif" font-weight="700" font-size="8.5" letter-spacing="2.4" fill="${p.ink}" opacity=".9">EPISODE 0${e.n} · ATTAR SACHET</text>
     ${txt}
     <text x="100" y="260" text-anchor="middle" font-family="Lexend, sans-serif" font-weight="700" font-size="7.5" letter-spacing="2.2" fill="${p.ink}" opacity=".8">QUIRKY CAMEL</text>
   </g>
   <g class="strip">
     <path d="${zt}" fill="${p.bg}"/><path d="${zt}" fill="#000" opacity=".16"/><rect x="0" y="29" width="200" height="16" fill="${p.bg}"/>
     <path d="M0 33 L9 38 L0 43 Z" fill="${p.deep}"/>
     <text x="190" y="40.5" text-anchor="end" font-family="Lexend, sans-serif" font-weight="700" font-size="6.5" letter-spacing="1.6" fill="${p.ink}" opacity=".75">TEAR HERE</text>
   </g></svg>`;
}

export function sachetBackSVG(e) {
  const p = e.pal;
  let zt = 'M0 30 L0 5',
    zb = 'M0 270 L200 270 L200 295';
  for (let i = 0; i <= 25; i++) zt += ` L${i * 8} ${i % 2 ? 0 : 5}`;
  zt += ' L200 30 Z';
  for (let i = 25; i >= 0; i--) zb += ` L${i * 8} ${i % 2 ? 300 : 295}`;
  zb += ' Z';
  const row = (y, n, t) =>
    `<circle cx="34" cy="${y}" r="11" fill="${p.btnBg}"/><text x="34" y="${y + 4}" text-anchor="middle" font-family="Bagel Fat One, sans-serif" font-size="12" fill="${p.btnInk}">${n}</text><text x="52" y="${y + 4}" font-family="Lexend, sans-serif" font-weight="600" font-size="10" fill="${p.ink}">${t}</text>`;
  return `<svg viewBox="0 0 200 300" overflow="visible" role="img" aria-label="Back of the ${e.name} sachet">
   <rect x="0" y="29" width="200" height="243" fill="${p.bg}"/><path d="${zt}" fill="${p.bg}"/><path d="${zt}" fill="#000" opacity=".16"/><path d="${zb}" fill="${p.bg}"/><path d="${zb}" fill="#000" opacity=".16"/>
   ${camel(62, 50, 76, p.title)}
   <text x="100" y="134" text-anchor="middle" font-family="Lexend, sans-serif" font-weight="700" font-size="8.5" letter-spacing="2.4" fill="${p.ink}">HOW TO WEAR</text>
   ${row(158, 1, 'Tear at the notch')}${row(186, 2, 'Swipe on wrists and neck')}${row(214, 3, 'Smell different. Everywhere.')}
   <text x="100" y="252" text-anchor="middle" font-family="Gluten, cursive" font-weight="700" font-size="11" fill="${p.ink}">Part of the complete kit</text>
  </svg>`;
}

export function kitSVG(episodes = []) {
  const list = episodes.length === 6 ? episodes : [
    { id: 'trouble-in-oasis', n: 1, name: 'Trouble in Oasis', lines: ['TROUBLE IN', 'OASIS'], pal: { bg: '#e8892c', title: '#ffffff', ink: '#fff8ec', deep: '#6b3608', soft: '#ffe9c7' } },
    { id: 'camel-after-dark', n: 2, name: 'Camel After Dark', lines: ['CAMEL', 'AFTER DARK'], pal: { bg: '#141a4d', title: '#C4E539', ink: '#f1ecff', deep: '#2b0f5c', soft: '#e7dcff' } },
    { id: 'madam-camel', n: 3, name: 'Madam Camel', lines: ['MADAM', 'CAMEL'], pal: { bg: '#9edcff', title: '#7616C1', ink: '#14295e', deep: '#14295e', soft: '#eaf8ff' } },
    { id: 'mirage', n: 4, name: 'Mirage', lines: ['MIRAGE'], pal: { bg: '#ff7f8e', title: '#ffffff', ink: '#ffffff', deep: '#7a1d33', soft: '#ffe4e4' } },
    { id: 'fruitto-del-deserto', n: 5, name: 'Fruitto Del Deserto', lines: ['FRUITTO DEL', 'DESERTO'], pal: { bg: '#b4461f', title: '#ffc23d', ink: '#fff3e6', deep: '#5a2210', soft: '#ffe6cc' } },
    { id: 'oud-but-different', n: 6, name: 'Oud But Different', lines: ['OUD BUT', 'DIFFERENT'], pal: { bg: '#2a140d', title: '#ff5d7d', ink: '#ffeee6', deep: '#4a1322', soft: '#ffe1e6' } }
  ];
  const fan = list.map((e, i) => {
    const x = 70 + i * 42,
      r = -12 + i * 4.8;
    return `<g transform="rotate(${r} ${x + 35} 200)">${sachetSVG(e, { x, y: 84, w: 70 })}</g>`;
  }).join('');
  return `<svg class="kitsvg" viewBox="0 0 600 450" role="img" aria-label="The complete kit: a collector box holding sachets of all six fragrances, a snap pouch with a carabiner and a drawstring bag">
   <rect width="600" height="450" fill="#2259B2"/>
   <path d="M600 0 C540 40 580 90 500 110 C560 130 600 100 600 170Z" fill="#C4E539" opacity=".9"/>
   <path d="M0 450 C40 390 0 340 70 320 C20 300 0 330 0 270Z" fill="#C4E539" opacity=".9"/>
   <ellipse cx="300" cy="418" rx="280" ry="22" fill="#0e2554" opacity=".35"/>
   <rect x="58" y="176" width="284" height="50" rx="4" fill="#0e2554"/>
   ${fan}
   <rect x="46" y="214" width="308" height="190" rx="8" fill="#2a5fd0"/><rect x="46" y="214" width="308" height="10" rx="4" fill="#3a70e0"/>
   ${camel(140, 246, 120, '#C4E539')}
   <text x="200" y="378" text-anchor="middle" font-family="Lexend, sans-serif" font-weight="700" font-size="14" letter-spacing="3.5" fill="#C4E539">THE COMPLETE KIT</text>
   <text x="200" y="395" text-anchor="middle" font-family="Lexend, sans-serif" font-weight="600" font-size="9.5" letter-spacing="2.5" fill="#dbe6fb">SIX EPISODES. ONE BOX.</text>
   <g transform="translate(386 70)">
     <ellipse cx="-6" cy="34" rx="15" ry="30" fill="none" stroke="#b6d43a" stroke-width="6" transform="rotate(-20 -6 34)"/>
     <rect x="0" y="20" width="184" height="138" rx="18" fill="#1f4fae"/>
     <path d="M0 40 Q0 20 18 20 H166 Q184 20 184 40 V78 Q184 92 168 92 H110 Q96 92 92 104 Q88 92 74 92 H16 Q0 92 0 78Z" fill="#2a5fd0"/>
     <path d="M10 34 H174 M10 84 H70 M114 84 H174" stroke="#C4E539" stroke-width="2" stroke-dasharray="6 4" fill="none"/>
     <circle cx="92" cy="96" r="9" fill="#C4E539"/>${camel(52, 112, 80, '#C4E539')}
   </g>
   <g transform="translate(404 266)">
     <path d="M20 40 Q10 140 40 152 H130 Q160 140 150 40 Q120 30 85 32 Q50 30 20 40Z" fill="#2a5fd0"/>
     <path d="M20 40 Q85 58 150 40" stroke="#173f86" stroke-width="5" fill="none"/>
     <path d="M85 44 q-30 -36 -54 -26 M85 44 q30 -40 52 -22" stroke="#C4E539" stroke-width="4" fill="none" stroke-linecap="round"/>
     <circle cx="30" cy="18" r="6" fill="#C4E539"/><circle cx="138" cy="22" r="6" fill="#C4E539"/>
     ${camel(50, 78, 72, '#C4E539')}
   </g>
   <g transform="rotate(-24 360 330)">${sachetSVG(list[0], { x: 322, y: 280, w: 56 })}</g>
  </svg>`;
}
