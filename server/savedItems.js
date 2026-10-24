// A customer's cart and wishlist, kept on their account so they come back on the next
// login (on any device). Stored on the user's own document, with readable item details:
//   users.cart     [{ slug, name, price, qty, addedAt, updatedAt }]   + cartUpdatedAt
//   users.wishlist [{ slug, name, price, addedAt }]                   + wishlistUpdatedAt
// The storefront sends one change at a time (set a quantity, save/unsave an item), so
// two open tabs can't overwrite each other's changes.
import { getDb } from './db.js';
import { HttpError } from './http.js';

const MAX_QTY = 10; // same cap as checkout
const MAX_ITEMS = 50;
const SLUG_RE = /^[a-z0-9-]{1,80}$/;

function readSlug(slug) {
  if (!SLUG_RE.test(String(slug))) throw new HttpError(400, 'Invalid product.');
  return slug;
}

function readQty(value) {
  const qty = Math.round(Number(value));
  if (!Number.isFinite(qty) || qty < 0) throw new HttpError(400, 'Invalid quantity.');
  return Math.min(MAX_QTY, qty);
}

async function productInfo(db, slug) {
  const p = await db.collection('products').findOne({ slug }, { projection: { name: 1, price: 1 } });
  if (!p) throw new HttpError(404, 'Product not found.');
  return { name: p.name, price: p.price ?? null };
}

// field is 'cart' or 'wishlist' on the user document.
async function loadItems(db, field, userId) {
  const doc = await db.collection('users').findOne({ _id: userId }, { projection: { [field]: 1 } });
  return Array.isArray(doc?.[field]) ? doc[field] : [];
}

async function storeItems(db, field, userId, items) {
  await db
    .collection('users')
    .updateOne({ _id: userId }, { $set: { [field]: items.slice(0, MAX_ITEMS), [`${field}UpdatedAt`]: new Date() } });
}

// What the storefront needs: { cart: { slug: qty }, wishlist: [slug] }.
export async function getSaved(env, user) {
  const db = await getDb(env);
  const [cartItems, wishItems] = await Promise.all([loadItems(db, 'cart', user._id), loadItems(db, 'wishlist', user._id)]);
  return {
    cart: Object.fromEntries(cartItems.map((it) => [it.slug, it.qty])),
    wishlist: wishItems.map((it) => it.slug)
  };
}

// Sets one cart line's quantity (0 removes it).
export async function setCartQty(env, user, rawSlug, rawQty) {
  const slug = readSlug(rawSlug);
  const qty = readQty(rawQty);
  const db = await getDb(env);
  const items = await loadItems(db, 'cart', user._id);
  const now = new Date();
  const existing = items.find((it) => it.slug === slug);
  let next;
  if (qty === 0) next = items.filter((it) => it.slug !== slug);
  else if (existing) next = items.map((it) => (it.slug === slug ? { ...it, qty, updatedAt: now } : it));
  else next = [...items, { slug, ...(await productInfo(db, slug)), qty, addedAt: now, updatedAt: now }];
  await storeItems(db, 'cart', user._id, next);
}

// Adds (saved = true) or removes a wishlist item.
export async function setWishlisted(env, user, rawSlug, saved) {
  const slug = readSlug(rawSlug);
  const db = await getDb(env);
  const items = await loadItems(db, 'wishlist', user._id);
  const has = items.some((it) => it.slug === slug);
  if (saved === has) return;
  const next = saved
    ? [...items, { slug, ...(await productInfo(db, slug)), addedAt: new Date() }]
    : items.filter((it) => it.slug !== slug);
  await storeItems(db, 'wishlist', user._id, next);
}

// On login: adds what the shopper picked as a guest (larger quantity wins).
export async function mergeSaved(env, user, body) {
  const cart = body.cart && typeof body.cart === 'object' && !Array.isArray(body.cart) ? body.cart : {};
  const wishlist = Array.isArray(body.wishlist) ? body.wishlist : [];
  const current = await getSaved(env, user);
  for (const [slug, qty] of Object.entries(cart).slice(0, MAX_ITEMS)) {
    const wanted = Math.max(readQty(qty), current.cart[slug] || 0);
    if (SLUG_RE.test(slug) && wanted !== current.cart[slug]) {
      await setCartQty(env, user, slug, wanted).catch(ignoreMissingProduct);
    }
  }
  for (const slug of wishlist.slice(0, MAX_ITEMS)) {
    if (SLUG_RE.test(String(slug)) && !current.wishlist.includes(slug)) {
      await setWishlisted(env, user, slug, true).catch(ignoreMissingProduct);
    }
  }
  return getSaved(env, user);
}

// A guest item whose product was deleted meanwhile is simply dropped.
function ignoreMissingProduct(err) {
  if (!(err instanceof HttpError) || err.status !== 404) throw err;
}

// After a paid order: the purchased products leave the cart.
export async function removePurchased(db, userId, items) {
  const slugs = items.map((it) => it.slug);
  await db.collection('users').updateOne({ _id: userId }, { $pull: { cart: { slug: { $in: slugs } } }, $set: { cartUpdatedAt: new Date() } });
}

// Earlier versions stored these differently; bring everything onto the user document once:
// - separate `carts` / `wishlists` collections (one document per user) are moved in and dropped;
// - a cart saved as { slug: qty } and a wishlist saved as [slug] become item lists.
export async function migrateSavedItems(db) {
  const products = await db.collection('products').find({}, { projection: { slug: 1, name: 1, price: 1 } }).toArray();
  const info = (slug) => {
    const p = products.find((x) => x.slug === slug);
    return { name: p?.name || slug, price: p?.price ?? null };
  };
  const collections = (await db.listCollections({}, { nameOnly: true }).toArray()).map((c) => c.name);
  for (const [name, field] of [['carts', 'cart'], ['wishlists', 'wishlist']]) {
    if (!collections.includes(name)) continue;
    for (const doc of await db.collection(name).find().toArray()) {
      await storeItems(db, field, doc.userId, doc.items || []);
    }
    await db.collection(name).drop();
  }
  const now = new Date();
  const oldCarts = await db.collection('users').find({ cart: { $exists: true, $not: { $type: 'array' } } }).toArray();
  for (const u of oldCarts) {
    const items = Object.entries(u.cart || {}).map(([slug, qty]) => ({ slug, ...info(slug), qty, addedAt: now, updatedAt: now }));
    await storeItems(db, 'cart', u._id, items);
  }
  const oldLists = await db.collection('users').find({ 'wishlist.0': { $type: 'string' } }).toArray();
  for (const u of oldLists) {
    await storeItems(db, 'wishlist', u._id, u.wishlist.map((slug) => ({ slug, ...info(slug), addedAt: now })));
  }
  await db.collection('users').updateMany({ savedItemsAt: { $exists: true } }, { $unset: { savedItemsAt: '' } });
}
