// MongoDB connection (one shared client per process), indexes and first-run seeding.
//
// Collections:
//   users    { email, name, phone, role: 'customer'|'admin', passwordHash, address,
//              createdAt, updatedAt, lastLoginAt }
//   sessions { tokenHash, userId, createdAt, expiresAt }       (TTL index removes expired)
//   logins   { userId, email, type: 'signup'|'login'|'failed'|'logout', ip, userAgent, at }
//   products { slug, name, type: 'kit'|'fragrance'|'product', tagline, description, price,
//              mrp, stock (null = unlimited), active, image, builtIn, createdAt, updatedAt }
//   orders   { userId, items[{slug,name,price,qty}], amount (paise), currency, status, mode,
//              razorpayOrderId, razorpayPaymentId, customer, emails, createdAt, paidAt }
import { MongoClient } from 'mongodb';
import { KIT, FRAGRANCES } from '../src/data/products.js';
import { hashPassword, verifyPassword } from './passwords.js';

let dbPromise;

export function getDb(env) {
  if (!dbPromise) {
    const uri = env.MONGODB_URI || 'mongodb://127.0.0.1:27017/quirkycamel';
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
    dbPromise = client
      .connect()
      .then(async () => {
        const db = client.db(); // database name comes from the URI path
        await Promise.all([
          db.collection('users').createIndex({ email: 1 }, { unique: true }),
          db.collection('sessions').createIndex({ tokenHash: 1 }, { unique: true }),
          db.collection('sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
          db.collection('logins').createIndex({ at: -1 }),
          db.collection('logins').createIndex({ userId: 1, at: -1 }),
          db.collection('products').createIndex({ slug: 1 }, { unique: true }),
          db.collection('orders').createIndex({ userId: 1, createdAt: -1 }),
          db.collection('orders').createIndex({ createdAt: -1 }),
          db.collection('orders').createIndex({ razorpayOrderId: 1 }, { unique: true, sparse: true })
        ]);
        await seedProducts(db);
        await ensureAdmin(db, env);
        return db;
      })
      .catch((err) => {
        dbPromise = null; // retry on the next request
        throw err;
      });
  }
  return dbPromise;
}

// Insert the built-in catalog (kit + six fragrances) the first time; never overwrite
// later edits made from the admin panel.
async function seedProducts(db) {
  const now = new Date();
  const builtIns = [KIT, ...FRAGRANCES].map((p, i) => ({
    slug: p.slug,
    name: p.name,
    type: p.type,
    tagline: p.tagline,
    description: p.description,
    price: p.type === 'kit' ? KIT.price : null,
    mrp: p.type === 'kit' ? KIT.mrp : null,
    stock: null,
    active: true,
    image: null,
    builtIn: true,
    sort: i,
    createdAt: now,
    updatedAt: now
  }));
  await db.collection('products').bulkWrite(
    builtIns.map((doc) => ({ updateOne: { filter: { slug: doc.slug }, update: { $setOnInsert: doc }, upsert: true } }))
  );
}

// The admin account comes from ADMIN_EMAIL / ADMIN_PASSWORD in .env. It is created if
// missing, and its password is re-synced whenever the .env value changes.
async function ensureAdmin(db, env) {
  const email = String(env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = String(env.ADMIN_PASSWORD || '');
  if (!email || !password) return;
  const users = db.collection('users');
  const existing = await users.findOne({ email });
  const now = new Date();
  if (!existing) {
    await users.insertOne({
      name: env.ADMIN_NAME || 'Store Admin',
      email,
      phone: '',
      role: 'admin',
      passwordHash: await hashPassword(password),
      address: null,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: null
    });
    return;
  }
  const update = { role: 'admin' };
  if (!(await verifyPassword(password, existing.passwordHash))) {
    update.passwordHash = await hashPassword(password);
    update.updatedAt = now;
  }
  await users.updateOne({ _id: existing._id }, { $set: update });
}
