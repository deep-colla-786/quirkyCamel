import React from 'react';
import PropTypes from 'prop-types';
import { ChevronRight, Check } from 'lucide-react';
import { EPISODES } from '../../../data/episodes';

// Bodies of the product-page tabs.
export function InsideList({ items }) {
  return (
    <ul className="pd-inside">
      {items.map(([t, d]) => (
        <li key={t}>
          <Check size={18} />
          <span><b>{t}</b>{d}</span>
        </li>
      ))}
    </ul>
  );
}

InsideList.propTypes = { items: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string)).isRequired };

export function SpecsTable({ specs }) {
  return (
    <table className="pd-specs">
      <tbody>
        {specs.map((s) => (
          <tr key={s.label}>
            <th>{s.label}</th>
            <td>{s.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

SpecsTable.propTypes = {
  specs: PropTypes.arrayOf(PropTypes.shape({ label: PropTypes.string, value: PropTypes.string })).isRequired
};

export const FragranceList = () => (
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
);
