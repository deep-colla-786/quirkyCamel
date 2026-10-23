import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { X, ImagePlus, Trash2 } from 'lucide-react';
import { adminApi } from '../../lib/api';
import { productShape } from '../utils/shapes';

const MAX_BYTES = 2 * 1024 * 1024;
// False for '', 0, negative numbers and anything that isn't a number.
const isPositive = (v) => Number(v) > 0;

function imageButtonLabel(uploading, hasImage) {
  if (uploading) return 'Uploading…';
  return hasImage ? 'Replace image' : 'Upload image';
}

function saveButtonLabel(busy, isNew) {
  if (busy) return 'Saving…';
  return isNew ? 'Add product' : 'Save changes';
}

// Create (product = null) or edit a product.
export default function ProductEditor({ product, onClose, onSaved }) {
  const isNew = !product;
  const isFragrance = product?.type === 'fragrance';
  const [f, setF] = useState(() => ({
    name: product?.name || '',
    tagline: product?.tagline || '',
    description: product?.description || '',
    price: product?.price ?? '',
    mrp: product?.mrp ?? '',
    stock: product?.stock ?? '',
    active: product ? product.active : true,
    image: product?.image || null
  }));
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const pickImage = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) return setError('Choose a PNG, JPG or WebP image.');
    if (file.size > MAX_BYTES) return setError('Images must be 2 MB or smaller.');
    const reader = new FileReader();
    reader.onload = async () => {
      setUploading(true);
      setError('');
      const res = await adminApi.upload(reader.result);
      setUploading(false);
      if (res.ok) setF((s) => ({ ...s, image: res.data.url }));
      else setError(res.data.error || 'Upload failed.');
    };
    reader.readAsDataURL(file);
  };

  const save = async (e) => {
    e.preventDefault();
    setError('');
    if (f.name.trim().length < 2) return setError('Enter a product name.');
    if (!isFragrance && !isPositive(f.price)) return setError('Enter a selling price.');
    const fields = {
      name: f.name,
      tagline: f.tagline,
      description: f.description,
      stock: f.stock === '' ? null : Number(f.stock),
      active: f.active
    };
    if (!isFragrance) {
      fields.price = Number(f.price);
      fields.mrp = f.mrp === '' ? null : Number(f.mrp);
    }
    if (!product?.builtIn) fields.image = f.image;
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
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="ad-modal-scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="ad-modal" onSubmit={save} noValidate aria-labelledby="pe-title">
        <header>
          <h2 id="pe-title">{isNew ? 'Add a product' : `Edit ${product.name}`}</h2>
          <button type="button" className="ad-icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>

        <div className="ad-form">
          {product?.builtIn && (
            <p className="ad-note">
              Built-in product: its artwork and story page come from the site code. You can change the text,
              {isFragrance ? '' : ' price,'} stock and visibility here.
            </p>
          )}

          <label>
            Name
            <input value={f.name} onChange={set('name')} maxLength={80} required />
          </label>
          <label>
            Short tagline
            <input value={f.tagline} onChange={set('tagline')} maxLength={160} placeholder="One line shown on the product card" />
          </label>
          <label>
            Description
            <textarea value={f.description} onChange={set('description')} maxLength={3000} rows={4} />
          </label>

          {isFragrance ? (
            <p className="ad-note">Fragrances are sold only inside the Complete Kit, so they have no price of their own.</p>
          ) : (
            <div className="ad-form-row">
              <label>
                Selling price (₹)
                <input type="number" min="1" inputMode="numeric" value={f.price} onChange={set('price')} required />
              </label>
              <label>
                MRP (₹) <small>optional</small>
                <input type="number" min="1" inputMode="numeric" value={f.mrp} onChange={set('mrp')} />
              </label>
            </div>
          )}

          <label>
            Stock <small>leave empty for unlimited</small>
            <input type="number" min="0" inputMode="numeric" value={f.stock} onChange={set('stock')} placeholder="Unlimited" />
          </label>

          {!product?.builtIn && (
            <div className="ad-image-field">
              <span>Product image</span>
              <div className="ad-image-row">
                <div className="ad-image-preview">{f.image ? <img src={f.image} alt="" /> : <span className="icon" />}</div>
                <div className="ad-image-actions">
                  <label className="btn ghost-dark ad-btn-sm">
                    <ImagePlus size={16} /> {imageButtonLabel(uploading, Boolean(f.image))}
                    <input type="file" accept="image/png,image/jpeg,image/webp" onChange={pickImage} hidden disabled={uploading} />
                  </label>
                  {f.image && (
                    <button type="button" className="ad-link" onClick={() => setF((s) => ({ ...s, image: null }))}>
                      Remove image
                    </button>
                  )}
                  <small>PNG, JPG or WebP, up to 2 MB. A square image works best.</small>
                </div>
              </div>
            </div>
          )}

          <label className="ad-check">
            <input type="checkbox" checked={f.active} onChange={set('active')} />
            Visible in the shop
          </label>

          {error && (
            <p className="ad-error" role="alert">
              {error}
            </p>
          )}
        </div>

        <footer>
          {!isNew && !product.builtIn && (
            confirmDelete ? (
              <span className="ad-confirm">
                Delete permanently?
                <button type="button" className="ad-link danger" onClick={remove} disabled={busy}>
                  Yes, delete
                </button>
                <button type="button" className="ad-link" onClick={() => setConfirmDelete(false)}>
                  Cancel
                </button>
              </span>
            ) : (
              <button type="button" className="ad-link danger" onClick={() => setConfirmDelete(true)}>
                <Trash2 size={15} /> Delete
              </button>
            )
          )}
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
