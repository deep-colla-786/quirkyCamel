import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Box } from 'lucide-react';
import { EPISODES } from '../../../data/episodes';
import { SCENES, kitSVG, sachetSVG, sachetBackSVG } from '../../../utils/svgGenerators';
import Hero3D from '../../kit3d/Hero3D';
import { ProductImage } from '../ProductCard';
import { productShape } from '../../../lib/propShapes';

// Image carousel. Kit: box + six sachets + live 3D view; fragrance: scene + sachet front/back + kit.
function galleryFor(product) {
  if (product.type === 'product') return [{ id: 'photo', label: product.name, photo: true }];
  if (product.type === 'kit') {
    return [
      { id: 'kit', label: 'Collector box', html: () => kitSVG(EPISODES) },
      ...EPISODES.map((e) => ({ id: e.id, label: e.name, html: () => sachetSVG(e), bg: e.pal.bg, sachet: true })),
      { id: '3d', label: '3D view' }
    ];
  }
  const e = product.episode;
  return [
    { id: 'scene', label: 'The world', html: () => SCENES[e.id]() },
    { id: 'front', label: 'Sachet front', html: () => sachetSVG(e), bg: e.pal.soft, sachet: true },
    { id: 'back', label: 'Sachet back', html: () => sachetBackSVG(e), bg: e.pal.soft, sachet: true },
    { id: 'kit', label: 'In the kit', html: () => kitSVG(EPISODES) }
  ];
}

// Main stage: the live 3D view, an uploaded photo, or generated SVG artwork.
function renderStage(cur, product) {
  if (cur.id === '3d') return <Hero3D onSelectEpisode={(id) => (window.location.hash = `#product/${id}`)} />;
  if (cur.photo) return <ProductImage product={product} className="pd-stage-art pd-photo" />;
  return <div key={cur.id} className="pd-stage-art" dangerouslySetInnerHTML={{ __html: cur.markup }} />;
}

export default function Gallery({ product }) {
  const items = useMemo(() => galleryFor(product).map((it) => ({ ...it, markup: it.html ? it.html() : null })), [product]);
  const [idx, setIdx] = useState(0);
  const cur = items[idx];
  const go = (d) => setIdx((i) => (i + d + items.length) % items.length);

  return (
    <div className="pd-gallery">
      <div
        className={`pd-stage ${cur.sachet ? 'is-sachet' : ''}`}
        style={cur.bg ? { background: cur.bg } : undefined}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') go(-1);
          if (e.key === 'ArrowRight') go(1);
        }}
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
      <div className="pd-thumbs" role="tablist" aria-label="Product images" hidden={items.length < 2}>
        {items.map((it, i) => (
          <button
            key={it.id}
            role="tab"
            aria-selected={i === idx}
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
              <span dangerouslySetInnerHTML={{ __html: it.markup }} />
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
