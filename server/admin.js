// Read-only data for the admin dashboard. Every route using these is behind requireAdmin.
import { getDb } from './db.js';
import { invoiceNumber } from './mailer.js';
import { listActiveSessions } from './sessions.js';

const DAY = 864e5;
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export async function stats(env) {
  const db = await getDb(env);
  const now = new Date();
  const since30 = new Date(startOfDay(now).getTime() - 29 * DAY);
  const since7 = new Date(now.getTime() - 7 * DAY);

  const [users, newUsers7d, products, activeProducts, logins7d, paid, daily, top] = await Promise.all([
    db.collection('users').countDocuments({ role: { $ne: 'admin' } }),
    db.collection('users').countDocuments({ role: { $ne: 'admin' }, createdAt: { $gte: since7 } }),
    db.collection('products').countDocuments(),
    db.collection('products').countDocuments({ active: true }),
    db.collection('logins').countDocuments({ type: { $in: ['login', 'signup'] }, at: { $gte: since7 } }),
    db
      .collection('orders')
      .aggregate([
        { $match: { status: 'paid' } },
        {
          $group: {
            _id: null,
            orders: { $sum: 1 },
            revenue: { $sum: '$amount' },
            liveRevenue: { $sum: { $cond: [{ $eq: ['$mode', 'razorpay'] }, '$amount', 0] } },
            units: { $sum: { $sum: '$items.qty' } }
          }
        }
      ])
      .toArray(),
    db
      .collection('orders')
      .aggregate([
        { $match: { status: 'paid', createdAt: { $gte: since30 } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Kolkata' } },
            orders: { $sum: 1 },
            revenue: { $sum: '$amount' }
          }
        }
      ])
      .toArray(),
    db
      .collection('orders')
      .aggregate([
        { $match: { status: 'paid' } },
        { $unwind: '$items' },
        { $group: { _id: '$items.slug', name: { $last: '$items.name' }, units: { $sum: '$items.qty' } } },
        { $sort: { units: -1 } },
        { $limit: 5 }
      ])
      .toArray()
  ]);

  // Fill every one of the last 30 days, including days with no orders.
  const byDay = Object.fromEntries(daily.map((d) => [d._id, d]));
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * DAY);
    const key = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // YYYY-MM-DD
    days.push({ date: key, orders: byDay[key]?.orders || 0, revenue: (byDay[key]?.revenue || 0) / 100 });
  }

  const p = paid[0] || { orders: 0, revenue: 0, liveRevenue: 0, units: 0 };
  return {
    users,
    newUsers7d,
    products,
    activeProducts,
    logins7d,
    orders: p.orders,
    revenue: p.revenue / 100,
    liveRevenue: p.liveRevenue / 100,
    unitsSold: p.units,
    days,
    topProducts: top.map((t) => ({ slug: t._id, name: t.name, units: t.units }))
  };
}

export async function listUsers(env, q = '') {
  const db = await getDb(env);
  const match = q
    ? { $or: [{ email: { $regex: escapeRe(q), $options: 'i' } }, { name: { $regex: escapeRe(q), $options: 'i' } }] }
    : {};
  const users = await db
    .collection('users')
    .aggregate([
      { $match: match },
      { $sort: { createdAt: -1 } },
      { $limit: 500 },
      {
        $lookup: {
          from: 'orders',
          let: { uid: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$userId', '$$uid'] }, status: 'paid' } },
            { $group: { _id: null, count: { $sum: 1 }, spent: { $sum: '$amount' } } }
          ],
          as: 'stats'
        }
      },
      { $project: { passwordHash: 0 } }
    ])
    .toArray();
  return {
    users: users.map((u) => ({
      id: String(u._id),
      name: u.name,
      email: u.email,
      phone: u.phone || '',
      role: u.role || 'customer',
      city: u.address?.city || '',
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt || null,
      orders: u.stats[0]?.count || 0,
      spent: (u.stats[0]?.spent || 0) / 100,
      cart: (Array.isArray(u.cart) ? u.cart : []).map((it) => ({ name: it.name, qty: it.qty })),
      wishlist: (Array.isArray(u.wishlist) ? u.wishlist : []).map((it) => it.name)
    }))
  };
}

export async function listLogins(env, limit = 200) {
  const db = await getDb(env);
  const rows = await db.collection('logins').find({}).sort({ at: -1 }).limit(Math.min(500, limit)).toArray();
  return {
    logins: rows.map((r) => ({
      id: String(r._id),
      email: r.email,
      type: r.type,
      scope: r.scope || 'store',
      ip: r.ip,
      device: summarizeAgent(r.userAgent),
      at: r.at
    }))
  };
}

export async function listOrders(env) {
  const db = await getDb(env);
  const rows = await db
    .collection('orders')
    .aggregate([
      { $match: { status: { $ne: 'created' } } },
      { $sort: { createdAt: -1 } },
      { $limit: 500 },
      { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user', pipeline: [{ $project: { email: 1, name: 1 } }] } }
    ])
    .toArray();
  return {
    orders: rows.map((o) => ({
      id: String(o._id),
      invoice: o.status === 'paid' ? invoiceNumber(o) : null,
      account: o.user[0]?.email || '(deleted user)',
      customer: o.customer,
      items: o.items || [{ name: 'The Complete Kit', qty: o.quantity || 1, price: o.amount / 100 / (o.quantity || 1) }],
      amount: o.amount / 100,
      status: o.status,
      mode: o.mode,
      razorpayOrderId: o.razorpayOrderId || null,
      paymentId: o.razorpayPaymentId || null,
      emails: o.emails || null,
      delivery: o.delivery || null,
      createdAt: o.createdAt
    }))
  };
}

const escapeRe = (s) => String(s).slice(0, 80).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// First match wins, so more specific agents come first (Edge also says "Chrome").
const BROWSERS = [
  [/Edg\//, 'Edge'],
  [/Chrome\//, 'Chrome'],
  [/Firefox\//, 'Firefox'],
  [/Safari\//, 'Safari'],
  [/curl/i, 'curl']
];
const SYSTEMS = [
  [/Windows/, 'Windows'],
  [/Android/, 'Android'],
  [/iPhone|iPad/, 'iOS'],
  [/Mac OS/, 'macOS'],
  [/Linux/, 'Linux']
];
const firstMatch = (list, ua, fallback) => list.find(([re]) => re.test(ua))?.[1] ?? fallback;

function summarizeAgent(ua = '') {
  const browser = firstMatch(BROWSERS, ua, 'Other');
  const os = firstMatch(SYSTEMS, ua, '');
  return os ? `${browser} · ${os}` : browser;
}

// Active store + admin sessions for the Sessions tab.
export async function listSessions(env, currentSessionId) {
  const sessions = await listActiveSessions(env, currentSessionId);
  return { sessions: sessions.map(({ userAgent, ...s }) => ({ ...s, device: summarizeAgent(userAgent) })) };
}
