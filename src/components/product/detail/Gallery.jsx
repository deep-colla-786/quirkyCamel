import React, { useMemo, useRef, useState } from 'react';
import useOffscreenPause from '../../../hooks/useOffscreenPause';
import { ChevronLeft, ChevronRight, Box } from 'lucide-react';
import { EPISODES } from '../../../data/episodes';
import { SCENES, kitSVG, sachetSVG, sachetBackSVG } from '../../../utils/svgGenerators';
import Hero3D from '../../kit3d/LazyHero3D';
import { ProductImage } from '../ProductCard';
import { productShape } from '../../../lib/propShapes';
import { navigate } from '../../../hooks/useRouter';
import { productPath } from '../../../data/products';

// Image carousel. Kit: box + six sachets + live 3D view; fragrance: scene + sachet front/back + kit.
function galleryFor(product) {
  if (product.type === 'product') return [{ id: 'photo', label: product.name, photo: true }];
  // A real photo uploaded in the dashboard comes first; the artwork follows.
  const photo = product.image ? [{ id: 'photo', label: 'Photo', photo: true }] : [];
  if (product.type === 'kit') {
    return [
      ...photo,
      { id: 'kit', label: 'Collector box', html: (ns) => kitSVG(EPISODES, ns) },
      ...EPISODES.map((e) => ({ id: e.id, label: e.name, html: (ns) => sachetSVG(e, {}, ns), bg: e.pal.bg, sachet: true })),
      { id: '3d', label: '3D view' }
    ];
  }
  const e = product.episode;
  return [
    ...photo,
    { id: 'scene', label: 'The world', html: (ns) => SCENES[e.id](ns) },
    { id: 'front', label: 'Sachet front', html: (ns) => sachetSVG(e, {}, ns), bg: e.pal.soft, sachet: true },
    { id: 'back', label: 'Sachet back', html: (ns) => sachetBackSVG(e, ns), bg: e.pal.soft, sachet: true },
    { id: 'kit', label: 'In the kit', html: (ns) => kitSVG(EPISODES, ns) }
  ];
}

// Main stage: the live 3D view, an uploaded photo, or generated SVG artwork.
function renderStage(cur, product) {
  if (cur.id === '3d') return <Hero3D onSelectEpisode={(id) => navigate(productPath(id))} />;
  if (cur.photo) return <ProductImage product={product} className="pd-stage-art pd-photo" />;
  return <div key={cur.id} className="pd-stage-art" dangerouslySetInnerHTML={{ __html: cur.markup }} />;
}

export default function Gallery({ product }) {
  const items = useMemo(() => galleryFor(product).map((it) => ({ ...it, markup: it.html ? it.html(`pdg-${it.id}`) : null, thumb: it.html ? it.html(`pdt-${it.id}`) : null })), [product]);
  const [idx, setIdx] = useState(0);
  const pauseRef = useRef(null);
  useOffscreenPause(pauseRef); // pause the artwork's animations while scrolled away
  const cur = items[idx];
  const go = (d) => setIdx((i) => (i + d + items.length) % items.length);

  return (
    <div className="pd-gallery" ref={pauseRef}>
      {/* The carousel is focusable so the arrow keys can change the image. */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div
        role="region"
        className={`pd-stage ${cur.sachet ? 'is-sachet' : ''}`}
        style={cur.bg ? { background: cur.bg } : undefined}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') go(-1);
          if (e.key === 'ArrowRight') go(1);
        }}
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- focus target for the arrow keys
        tabIndex={0}
        aria-roledescription="carousel"
        aria-label={`${product.name} images, ${idx + 1} of ${items.length}: ${cur.label}`}
      >
        {renderStage(cur, product)}
        {items.length > 1 && (
          <>
            <button className="pd-nav prev" onClick={() => go(-1)} aria-label="Previous image">
              <ChevronLeft size={22} />
            </button>
            <button className="pd-nav next" onClick={() => go(1)} aria-label="Next image">
              <ChevronRight size={22} />
            </button>
            <span className="pd-stage-label">{cur.label}</span>
          </>
        )}
      </div>
      <div className="pd-thumbs" role="group" aria-label="Product images" hidden={items.length < 2}>
        {items.map((it, i) => (
          <button
            key={it.id}
            aria-pressed={i === idx}
            aria-label={it.label}
            className={`pd-thumb ${it.sachet ? 'is-sachet' : ''}`}
            style={it.bg ? { background: it.bg } : undefined}
            onClick={() => setIdx(i)}
            title={it.label}
          >
            {it.id === '3d' ? (
              <span className="pd-thumb-3d">
                <Box size={20} />
                3D
              </span>
            ) : (
              <span dangerouslySetInnerHTML={{ __html: it.thumb }} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

Gallery.propTypes = {
  product: productShape.isRequired
};
