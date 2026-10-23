// Product catalog API. The storefront reads the active products; admins create,
// edit and hide them. Built-in products (the kit and six fragrances) can be edited
// but not deleted, because their artwork and story pages live in the frontend code.
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDb } from './db.js';
import { HttpError } from './http.js';

export const UPLOAD_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'uploads');

const clip = (v, n) => String(v ?? '').trim().slice(0, n);
// Removes leading and trailing dashes (a loop instead of a backtracking regex).
function trimDashes(s) {
  let start = 0;
  let end = s.length;
  while (start < end && s[start] === '-') start++;
  while (end > start && s[end - 1] === '-') end--;
  return s.slice(start, end);
}

const slugify = (s) =>
  trimDashes(
    String(s)
      .toLowerCase()
      .normalize('NFKD')
      .replaceAll(/[^a-z0-9]+/g, '-')
  ).slice(0, 60);

export const isBuyable = (p) => p && p.active && (p.type === 'kit' || p.type === 'product') && p.price > 0;

const toPublic = (p) => ({
  slug: p.slug,
  name: p.name,
  type: p.type,
  tagline: p.tagline || '',
  description: p.description || '',
  price: p.price,
  mrp: p.mrp || null,
  stock: p.stock ?? null,
  active: !!p.active,
  image: p.image || null,
  builtIn: !!p.builtIn
});

export async function listPublicProducts(env) {
  const db = await getDb(env);
  const docs = await db.collection('products').find({ active: true }).sort({ sort: 1, createdAt: 1 }).toArray();
  return { products: docs.map(toPublic) };
}

export async function listAllProducts(env) {
  const db = await getDb(env);
  const docs = await db.collection('products').find({}).sort({ sort: 1, createdAt: 1 }).toArray();
  const sold = await db
    .collection('orders')
    .aggregate([
      { $match: { status: 'paid' } },
      { $unwind: '$items' },
      { $group: { _id: '$items.slug', units: { $sum: '$items.qty' }, revenue: { $sum: { $multiply: ['$items.price', '$items.qty'] } } } }
    ])
    .toArray();
  const bySlug = Object.fromEntries(sold.map((s) => [s._id, s]));
  return {
    products: docs.map((p) => ({ ...toPublic(p), unitsSold: bySlug[p.slug]?.units || 0, revenue: bySlug[p.slug]?.revenue || 0 }))
  };
}

const isBlank = (v) => v === null || v === '';
const UPLOAD_URL_RE = /^\/uploads\/[a-f0-9]{24}\.(?:png|jpe?g|webp)$/;

// Each validator turns one submitted field into its stored value, or throws a 400.
function readName(value) {
  const name = clip(value, 80);
  if (name.length < 2) throw new HttpError(400, 'Product name is required.');
  return name;
}

function readPrice(value) {
  const price = Math.round(Number(value));
  if (!Number.isFinite(price) || price < 1 || price > 1e6) throw new HttpError(400, 'Price must be between ₹1 and ₹10,00,000.');
  return price;
}

function readMrp(value, price) {
  if (isBlank(value)) return null;
  const mrp = Math.round(Number(value));
  if (!Number.isFinite(mrp) || mrp < price) throw new HttpError(400, 'MRP must be empty or at least the selling price.');
  return mrp;
}

function readStock(value) {
  if (isBlank(value)) return null;
  const stock = Math.round(Number(value));
  if (!Number.isFinite(stock) || stock < 0) throw new HttpError(400, 'Stock must be 0 or more (leave empty for unlimited).');
  return stock;
}

function readImage(value) {
  const image = value ? clip(value, 300) : null;
  if (image && !UPLOAD_URL_RE.test(image)) throw new HttpError(400, 'Invalid image.');
  return image;
}

// Validates the submitted fields; only fields present in `body` are returned.
// Fragrance prices are never edited (they're sold inside the kit).
function readFields(body, existing) {
  const out = {};
  const has = (key) => body[key] !== undefined;
  const priced = (existing?.type || body.type || 'product') !== 'fragrance';
  if (has('name')) out.name = readName(body.name);
  if (has('tagline')) out.tagline = clip(body.tagline, 160);
  if (has('description')) out.description = clip(body.description, 3000);
  if (priced && has('price')) out.price = readPrice(body.price);
  if (priced && has('mrp')) out.mrp = readMrp(body.mrp, out.price ?? existing?.price);
  if (has('stock')) out.stock = readStock(body.stock);
  if (has('active')) out.active = !!body.active;
  if (has('image')) out.image = readImage(body.image);
  return out;
}

// The first free slug among base, base-2, base-3, …
async function uniqueSlug(db, base) {
  let slug = base;
  let n = 2;
  while (await db.collection('products').findOne({ slug }, { projection: { _id: 1 } })) {
    slug = `${base}-${n}`;
    n++;
  }
  return slug;
}

export async function createProduct(env, body) {
  const fields = readFields({ ...body, type: 'product' });
  if (!fields.name) throw new HttpError(400, 'Product name is required.');
  if (!fields.price) throw new HttpError(400, 'Price is required.');
  const db = await getDb(env);
  const base = slugify(body.slug || fields.name) || 'product';
  const slug = await uniqueSlug(db, base);
  const now = new Date();
  const doc = {
    slug,
    type: 'product',
    tagline: '',
    description: '',
    mrp: null,
    stock: null,
    image: null,
    active: true,
    ...fields,
    builtIn: false,
    sort: 100,
    createdAt: now,
    updatedAt: now
  };
  await db.collection('products').insertOne(doc);
  return { product: toPublic(doc) };
}

export async function updateProduct(env, slug, body) {
  const db = await getDb(env);
  const existing = await db.collection('products').findOne({ slug });
  if (!existing) throw new HttpError(404, 'Product not found.');
  const fields = readFields(body, existing);
  const updated = await db
    .collection('products')
    .findOneAndUpdate({ slug }, { $set: { ...fields, updatedAt: new Date() } }, { returnDocument: 'after' });
  return { product: toPublic(updated) };
}

export async function deleteProduct(env, slug) {
  const db = await getDb(env);
  const existing = await db.collection('products').findOne({ slug });
  if (!existing) throw new HttpError(404, 'Product not found.');
  if (existing.builtIn) throw new HttpError(400, 'Built-in products can’t be deleted. Hide them instead.');
  await db.collection('products').deleteOne({ slug });
  return { ok: true };
}

// Image upload as a base64 data URL inside JSON. The file type is checked from its
// magic bytes (not the name), and files get a random name.
const SIGNATURES = [
  ['png', (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47],
  ['jpg', (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff],
  ['webp', (b) => b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP']
];
export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

export async function uploadImage(body) {
  const m = /^data:image\/[a-z+]+;base64,([A-Za-z0-9+/=]+)$/.exec(String(body.dataUrl || ''));
  if (!m) throw new HttpError(400, 'Upload a PNG, JPG or WebP image.');
  const buf = Buffer.from(m[1], 'base64');
  if (buf.length > MAX_UPLOAD_BYTES) throw new HttpError(413, 'Images must be 2 MB or smaller.');
  const kind = SIGNATURES.find(([, test]) => buf.length > 12 && test(buf));
  if (!kind) throw new HttpError(400, 'Upload a PNG, JPG or WebP image.');
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${crypto.randomBytes(12).toString('hex')}.${kind[0]}`;
  await fs.writeFile(path.join(UPLOAD_DIR, name), buf);
  return { url: `/uploads/${name}` };
}

// Serve uploaded images: GET /uploads/<random>.<ext>
const MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp' };
export async function serveUpload(req, res) {
  const m = /^\/uploads\/([a-f0-9]{24})\.(png|jpe?g|webp)$/.exec((req.url || '').split('?')[0]);
  if (!m) return false;
  try {
    const data = await fs.readFile(path.join(UPLOAD_DIR, `${m[1]}.${m[2]}`));
    res.setHeader('Content-Type', MIME[m[2]]);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.end(data);
  } catch {
    res.statusCode = 404;
    res.end('Not found');
  }
  return true;
}
