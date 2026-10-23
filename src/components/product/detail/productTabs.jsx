import React from 'react';
import { ChevronRight, Check } from 'lucide-react';
import { EPISODES } from '../../../data/episodes';
import HowToUse from './HowToUse';
import ShippingReturns from './ShippingReturns';

// Information tabs for a product page: different sets for extras, the kit and each fragrance.
export function buildTabs(product) {
  const isKit = product.type === 'kit';
  const isExtra = product.type === 'product';
  const ep = product.episode;
  if (isExtra) {
    return [
      { id: 'overview', label: 'Overview', body: <p className="pd-lede">{product.description || product.tagline}</p> },
      { id: 'shipping', label: 'Shipping & returns', body: <ShippingReturns /> }
    ];
  }
  if (isKit) {
    return [
      { id: 'overview', label: 'Overview', body: <p className="pd-lede">{product.description}</p> },
      {
        id: 'inside',
        label: 'What’s inside',
        body: (
          <ul className="pd-inside">
            {product.inside.map(([t, d]) => (
              <li key={t}>
                <Check size={18} />
                <span><b>{t}</b>{d}</span>
              </li>
            ))}
          </ul>
        )
      },
      {
        id: 'fragrances',
        label: 'The six fragrances',
        body: (
          <div className="pd-frag-list">
            {EPISODES.map((e) => (
              <a key={e.id} href={`#product/${e.id}`} className="pd-frag-row">
                <span className="pd-frag-sw" style={{ background: e.pal.bg }}>0{e.n}</span>
                <span>
                  <b>{e.name}</b>
                  <small>{e.scent}</small>
                </span>
                <ChevronRight size={18} />
              </a>
            ))}
          </div>
        )
      },
      { id: 'use', label: 'How to use', body: <HowToUse /> },
      {
        id: 'specs',
        label: 'Specifications',
        body: (
          <table className="pd-specs">
            <tbody>
              {product.specs.map((s) => (
                <tr key={s.label}>
                  <th>{s.label}</th>
                  <td>{s.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      },
      { id: 'shipping', label: 'Shipping & returns', body: <ShippingReturns /> }
    ];
  }
  return [
    {
      id: 'overview',
      label: 'The episode',
      body: (
        <div className="pd-episode">
          <p className="pd-world">{ep.world}</p>
          <p>{ep.body}</p>
          <p><b>The scene:</b> {ep.look}</p>
          <a className="pd-story-link" href={`#${ep.id}`}>Read the full episode story →</a>
        </div>
      )
    },
    {
      id: 'scent',
      label: 'Scent profile',
      body: (
        <div className="pd-scent">
          <p>{ep.scent}</p>
          <div className="pd-chips">
            {ep.scentTags.map((t) => <span key={t}>{t}</span>)}
          </div>
          {ep.pending && (
            <p className="pd-note">Exact notes will be confirmed from the final fragrance formulation.</p>
          )}
          {ep.note && <p className="pd-note">{ep.note}</p>}
        </div>
      )
    },
    { id: 'use', label: 'How to use', body: <HowToUse /> },
    { id: 'shipping', label: 'Shipping & returns', body: <ShippingReturns /> }
  ];
}
