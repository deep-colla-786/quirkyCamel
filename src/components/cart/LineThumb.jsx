import React from 'react';
import { EPISODES } from '../../data/episodes';
import { kitSVG } from '../../utils/svgGenerators';

// Kit artwork is generated once and reused.
let kitArtCache = null;
const kitArt = () => (kitArtCache ??= kitSVG(EPISODES));

export default function LineThumb({ product }) {
  if (product.type === 'kit') {
    return <div className="thumb" dangerouslySetInnerHTML={{ __html: kitArt() }} />;
  }
  return (
    <div className="thumb thumb-img">
      {product.image ? <img src={product.image} alt="" /> : <span className="icon" />}
    </div>
  );
}
