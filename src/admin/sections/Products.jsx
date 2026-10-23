import React from 'react';
import { Plus, Pencil } from 'lucide-react';
import { formatINR } from '../../data/episodes';

export default function Products({ products, onEdit, onAdd, onToggle }) {
  if (!products) return <p className="ad-muted">Loading…</p>;
  return (
    <section className="ad-card">
      <header className="ad-card-head">
        <div>
          <h2>Products</h2>
          <p>
            {products.length} products · {products.filter((p) => p.active).length} visible in the shop
          </p>
        </div>
        <button className="btn blue ad-btn-sm" onClick={onAdd}>
          <Plus size={16} /> Add product
        </button>
      </header>
      <div className="ad-table-wrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Type</th>
              <th className="num">Price</th>
              <th className="num">Stock</th>
              <th className="num">Sold</th>
              <th className="num">Revenue</th>
              <th>Visible</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.slug} className={p.active ? '' : 'is-off'}>
                <td>
                  <div className="ad-prod">
                    <span className="ad-thumb">{p.image ? <img src={p.image} alt="" /> : <span className="icon" />}</span>
                    <span>
                      <a href={`/#product/${p.slug}`} target="_blank" rel="noreferrer">
                        <b>{p.name}</b>
                      </a>
                      <small>{p.tagline}</small>
                    </span>
                  </div>
                </td>
                <td>
                  <span className="ad-badge muted">{p.type === 'product' ? 'Extra' : p.type === 'kit' ? 'Kit' : 'Fragrance'}</span>
                </td>
                <td className="num">
                  {p.price ? formatINR(p.price) : <small>In kit</small>}
                  {p.mrp > p.price && <small className="strike">{formatINR(p.mrp)}</small>}
                </td>
                <td className="num">
                  {p.stock === null ? '∞' : p.stock === 0 ? <span className="ad-badge bad">0</span> : p.stock}
                </td>
                <td className="num">{p.unitsSold}</td>
                <td className="num">{p.revenue ? formatINR(p.revenue) : '—'}</td>
                <td>
                  <label className="ad-switch" title={p.active ? 'Hide from shop' : 'Show in shop'}>
                    <input type="checkbox" checked={p.active} onChange={() => onToggle(p)} />
                    <span aria-hidden="true" />
                    <span className="sr">{p.active ? 'Visible' : 'Hidden'}</span>
                  </label>
                </td>
                <td>
                  <button className="ad-icon-btn" onClick={() => onEdit(p)} aria-label={`Edit ${p.name}`}>
                    <Pencil size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
