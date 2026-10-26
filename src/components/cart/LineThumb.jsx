import React from 'react';
import { EPISODES } from '../../data/episodes';
import { kitSVG, sachetSVG } from '../../utils/svgGenerators';
import { productShape } from '../../lib/propShapes';

// Kit artwork is generated once and reused.
let kitArtCache = null;
const kitArt = () => (kitArtCache ??= kitSVG(EPISODES, 'cart-kit'));

export default function LineThumb({ product }) {
  if (product.type === 'kit') {
    return <div className="thumb" dangerouslySetInnerHTML={{ __html: kitArt() }} />;
  }
  if (product.episode) {
    return <div className="thumb" style={{ background: product.episode.pal.soft }} dangerouslySetInnerHTML={{ __html: sachetSVG(product.episode, {}, `cart-${product.episode.id}`) }} />;
  }
  return (
    <div className="thumb thumb-img">
      {product.image ? <img src={product.image} alt="" /> : <span className="icon" />}
    </div>
  );
}

LineThumb.propTypes = {
  product: productShape.isRequired
};
