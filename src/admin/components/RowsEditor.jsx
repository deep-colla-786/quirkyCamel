import React from 'react';
import PropTypes from 'prop-types';
import { Plus, Trash2 } from 'lucide-react';
import { withKey } from '../utils/rowKeys';

// Editable list of rows (e.g. specifications: label + value). Each column is an input.
export default function RowsEditor({ legend, hint, columns, rows, onChange, addLabel, max = 20 }) {
  const update = (i, key, value) => onChange(rows.map((r, j) => (j === i ? { ...r, [key]: value } : r)));
  const remove = (i) => onChange(rows.filter((_, j) => j !== i));
  const add = () => onChange([...rows, withKey(Object.fromEntries(columns.map((c) => [c.key, ''])))]);

  return (
    <fieldset className="ad-rows">
      <legend>{legend}</legend>
      {hint && <small className="ad-rows-hint">{hint}</small>}
      {rows.map((row, i) => (
        <div className="ad-row" key={row._key} style={{ gridTemplateColumns: `${columns.map((c) => c.width || '1fr').join(' ')} auto` }}>
          {columns.map((c) => (
            <input
              key={c.key}
              type={c.type || 'text'}
              min={c.type === 'number' ? 1 : undefined}
              inputMode={c.type === 'number' ? 'numeric' : undefined}
              value={row[c.key] ?? ''}
              onChange={(e) => update(i, c.key, e.target.value)}
              placeholder={c.placeholder}
              aria-label={`${c.label} ${i + 1}`}
              maxLength={c.maxLength}
            />
          ))}
          <button type="button" className="ad-icon-btn" onClick={() => remove(i)} aria-label={`Remove row ${i + 1}`}>
            <Trash2 size={15} />
          </button>
        </div>
      ))}
      {rows.length < max && (
        <button type="button" className="ad-link" onClick={add}>
          <Plus size={14} /> {addLabel}
        </button>
      )}
    </fieldset>
  );
}

RowsEditor.propTypes = {
  legend: PropTypes.string.isRequired,
  hint: PropTypes.string,
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      placeholder: PropTypes.string,
      type: PropTypes.string,
      width: PropTypes.string,
      maxLength: PropTypes.number
    })
  ).isRequired,
  rows: PropTypes.arrayOf(PropTypes.object).isRequired,
  onChange: PropTypes.func.isRequired,
  addLabel: PropTypes.string.isRequired,
  max: PropTypes.number
};
