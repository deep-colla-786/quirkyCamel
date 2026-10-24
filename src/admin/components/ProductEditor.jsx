import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { X, ImagePlus, Trash2 } from 'lucide-react';
import { adminApi } from '../../lib/api';
import { formatINR } from '../../data/episodes';
import { productShape } from '../utils/shapes';
import { initialForm, validate, toFields, discountFrom, priceFromDiscount, isPositive } from '../utils/productForm';
import RowsEditor from './RowsEditor';

const MAX_BYTES = 2 * 1024 * 1024;
const IMAGE_TYPE_RE = /^image\/(?:png|jpe?g|webp)$/;

const INSIDE_COLUMNS = [
  { key: 'title', label: 'Item', placeholder: 'e.g. Snap pouch', maxLength: 80 },
  { key: 'detail', label: 'Detail', placeholder: 'One line about it', width: '2fr', maxLength: 200 }
];
const SPEC_COLUMNS = [
  { key: 'label', label: 'Label', placeholder: 'e.g. Longevity', maxLength: 60 },
  { key: 'value', label: 'Value', placeholder: 'e.g. 8–12 hours', width: '2fr', maxLength: 200 }
];
const PACK_COLUMNS = [
  { key: 'qty', label: 'Kits', type: 'number', width: '70px' },
  { key: 'label', label: 'Label', placeholder: 'e.g. 2 Kits', maxLength: 40 },
  { key: 'note', label: 'Note', placeholder: 'e.g. One to gift', maxLength: 60 }
];

function imageButtonLabel(uploading, hasImage) {
  if (uploading) return 'Uploading…';
  return hasImage ? 'Replace image' : 'Upload image';
}

function saveButtonLabel(busy, isNew) {
  if (busy) return 'Saving…';
  return isNew ? 'Add product' : 'Save changes';
}

// MRP, selling price and discount %. Editing the discount sets the price from the MRP;
// editing the price or MRP recalculates the discount.
function PricingFields({ form, setForm, optional }) {
  const setPrice = (price) => setForm((s) => ({ ...s, price, discount: discountFrom(price, s.mrp) }));
  const setMrp = (mrp) => setForm((s) => ({ ...s, mrp, discount: discountFrom(s.price, mrp) }));
  const setDiscount = (discount) =>
    setForm((s) => ({ ...s, discount, price: priceFromDiscount(s.mrp, discount) ?? s.price }));
  const price = Number(form.price);
  const mrp = Number(form.mrp);

  return (
    <fieldset className="ad-rows">
      <legend>Pricing</legend>
      {optional && (
        <small className="ad-rows-hint">
          Leave the selling price empty to sell this fragrance only inside the Complete Kit. With a price, customers can
          also buy the single sachet.
        </small>
      )}
      <div className="ad-form-row ad-form-row-3">
        <label>
          MRP (₹) <small>optional</small>
          <input type="number" min="1" inputMode="numeric" value={form.mrp} onChange={(e) => setMrp(e.target.value)} />
        </label>
        <label>
          Discount (%)
          <input
            type="number"
            min="0"
            max="99"
            inputMode="numeric"
            value={form.discount}
            onChange={(e) => setDiscount(e.target.value)}
            disabled={!isPositive(mrp)}
            title={isPositive(mrp) ? '' : 'Set an MRP first'}
          />
        </label>
        <label>
          Selling price (₹)
          <input
            type="number"
            min="1"
            inputMode="numeric"
            value={form.price}
            onChange={(e) => setPrice(e.target.value)}
            required={!optional}
            placeholder={optional ? 'Only in the kit' : ''}
          />
        </label>
      </div>
      {price > 0 && (
        <p className="ad-price-preview">
          Customers see <b>{formatINR(price)}</b>
          {mrp > price && (
            <>
              {' '}
              <s>{formatINR(mrp)}</s> <span className="ad-badge ok">Save {form.discount}%</span>
            </>
          )}
        </p>
      )}
    </fieldset>
  );
}

PricingFields.propTypes = {
  form: PropTypes.shape({ price: PropTypes.string, mrp: PropTypes.string, discount: PropTypes.string }).isRequired,
  setForm: PropTypes.func.isRequired,
  optional: PropTypes.bool
};

function ImageField({ image, uploading, onPick, onRemove }) {
  return (
    <div className="ad-image-field">
      <span>Product image</span>
      <div className="ad-image-row">
        <div className="ad-image-preview">{image ? <img src={image} alt="" /> : <span className="icon" />}</div>
        <div className="ad-image-actions">
          <label className="btn ghost-dark ad-btn-sm">
            <ImagePlus size={16} /> {imageButtonLabel(uploading, Boolean(image))}
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={onPick} hidden disabled={uploading} />
          </label>
          {image && (
            <button type="button" className="ad-link" onClick={onRemove}>
              Remove image
            </button>
          )}
          <small>PNG, JPG or WebP, up to 2 MB. A square image works best.</small>
        </div>
      </div>
    </div>
  );
}

ImageField.propTypes = {
  image: PropTypes.string,
  uploading: PropTypes.bool.isRequired,
  onPick: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired
};

function DeleteControl({ busy, onDelete }) {
  const [confirming, setConfirming] = useState(false);
  if (!confirming) {
    return (
      <button type="button" className="ad-link danger" onClick={() => setConfirming(true)}>
        <Trash2 size={15} /> Delete
      </button>
    );
  }
  return (
    <span className="ad-confirm">
      Delete permanently?
      <button type="button" className="ad-link danger" onClick={onDelete} disabled={busy}>
        Yes, delete
      </button>
      <button type="button" className="ad-link" onClick={() => setConfirming(false)}>
        Cancel
      </button>
    </span>
  );
}

DeleteControl.propTypes = { busy: PropTypes.bool.isRequired, onDelete: PropTypes.func.isRequired };

function builtInNote(isFragrance) {
  return isFragrance
    ? 'Built-in fragrance: its artwork and episode story come from the site code. Everything below is shown on its product page and shop card.'
    : 'Built-in product: its artwork comes from the site code. Everything below (prices, discount, stock and all the text) is set here.';
}

// Create (product = null) or edit a product. Every customer-facing detail is editable.
export default function ProductEditor({ product, onClose, onSaved }) {
  const isNew = !product;
  const type = product?.type || 'product';
  const isFragrance = type === 'fragrance';
  const [form, setForm] = useState(() => initialForm(product));
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const setRows = (k) => (rows) => setForm((s) => ({ ...s, [k]: rows }));

  const pickImage = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!IMAGE_TYPE_RE.test(file.type)) return setError('Choose a PNG, JPG or WebP image.');
    if (file.size > MAX_BYTES) return setError('Images must be 2 MB or smaller.');
    const reader = new FileReader();
    reader.onload = async () => {
      setUploading(true);
      setError('');
      const res = await adminApi.upload(reader.result);
      setUploading(false);
      if (res.ok) setForm((s) => ({ ...s, image: res.data.url }));
      else setError(res.data.error || 'Upload failed.');
    };
    reader.readAsDataURL(file);
  };

  const save = async (e) => {
    e.preventDefault();
    const problem = validate(form, { priceRequired: !isFragrance });
    setError(problem);
    if (problem) return;
    const fields = toFields(form, product);
    setBusy(true);
    const res = isNew ? await adminApi.createProduct(fields) : await adminApi.updateProduct(product.slug, fields);
    setBusy(false);
    if (!res.ok) return setError(res.data.error || 'Could not save.');
    onSaved(res.data.product, isNew ? 'created' : 'updated');
  };

  const remove = async () => {
    setBusy(true);
    const res = await adminApi.deleteProduct(product.slug);
    setBusy(false);
    if (!res.ok) return setError(res.data.error || 'Could not delete.');
    onSaved(product, 'deleted');
  };

  return (
    <div className="ad-modal-scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="ad-modal ad-editor-modal" onSubmit={save} noValidate aria-labelledby="pe-title">
        <header>
          <h2 id="pe-title">{isNew ? 'Add a product' : `Edit ${product.name}`}</h2>
          <button type="button" className="ad-icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>

        <div className="ad-form">
          {product?.builtIn && <p className="ad-note">{builtInNote(isFragrance)}</p>}

          <label>
            Name
            <input value={form.name} onChange={set('name')} maxLength={80} required />
          </label>
          <label>
            Small heading <small>shown above the name on the product page</small>
            <input value={form.eyebrow} onChange={set('eyebrow')} maxLength={80} placeholder="e.g. All six episodes · One box" />
          </label>
          <label>
            Short tagline
            <input value={form.tagline} onChange={set('tagline')} maxLength={160} placeholder="One line shown on the product card" />
          </label>
          <label>
            Description
            <textarea value={form.description} onChange={set('description')} maxLength={3000} rows={4} />
          </label>

          <PricingFields form={form} setForm={setForm} optional={isFragrance} />

          <label>
            Stock <small>leave empty for unlimited · customers see it on the product page</small>
            <input type="number" min="0" inputMode="numeric" value={form.stock} onChange={set('stock')} placeholder="Unlimited" />
          </label>

          {!product?.builtIn && (
            <ImageField
              image={form.image}
              uploading={uploading}
              onPick={pickImage}
              onRemove={() => setForm((s) => ({ ...s, image: null }))}
            />
          )}

          {isFragrance && (
            <>
              <label>
                Scent profile
                <textarea value={form.scent} onChange={set('scent')} maxLength={400} rows={2} />
              </label>
              <label>
                Scent notes <small>comma separated</small>
                <input value={form.scentTags} onChange={set('scentTags')} placeholder="Watery, Fresh, Mineral" />
              </label>
            </>
          )}

          {!isFragrance && (
            <RowsEditor
              legend="What’s inside"
              hint="Shown as a tab on the product page. Leave empty to hide it."
              columns={INSIDE_COLUMNS}
              rows={form.inside}
              onChange={setRows('inside')}
              addLabel="Add an item"
            />
          )}
          <RowsEditor
            legend="Specifications"
            hint="Shown as a table on the product page. Leave empty to hide it."
            columns={SPEC_COLUMNS}
            rows={form.specs}
            onChange={setRows('specs')}
            addLabel="Add a specification"
          />
          {type === 'kit' && (
            <RowsEditor
              legend="Pack options"
              hint="The quantity choices on the kit page; each is priced at the selling price × kits."
              columns={PACK_COLUMNS}
              rows={form.packs}
              onChange={setRows('packs')}
              addLabel="Add a pack option"
              max={6}
            />
          )}

          <label className="ad-check">
            <input type="checkbox" checked={form.active} onChange={set('active')} />
            Visible in the shop
          </label>

          {error && (
            <p className="ad-error" role="alert">
              {error}
            </p>
          )}
        </div>

        <footer>
          {!isNew && !product.builtIn && <DeleteControl busy={busy} onDelete={remove} />}
          <span className="ad-spacer" />
          <button type="button" className="btn ghost-dark ad-btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn blue ad-btn-sm" disabled={busy || uploading}>
            {saveButtonLabel(busy, isNew)}
          </button>
        </footer>
      </form>
    </div>
  );
}

ProductEditor.propTypes = {
  product: productShape,
  onClose: PropTypes.func.isRequired,
  onSaved: PropTypes.func.isRequired
};
