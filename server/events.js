// Live updates for open store pages (Server-Sent Events). Events carry no data, only
// "something changed": pages then re-fetch what they need through the normal API.
//   catalog  products, prices, stock or visibility changed       -> every open page
//   saved    a user's cart or wishlist changed                     -> that user's other pages
//   shipment a delivery update for one of the user's orders           -> that user's pages
// Connections live in memory, so with several server processes each one only reaches
// its own clients (use a shared pub/sub such as Redis to fan out across processes).
const HEARTBEAT_MS = 25_000;
const clients = new Set(); // { res, userId, clientId, ip }
// Open connections cost memory, and the stream needs no login, so they're capped.
const MAX_PER_IP = 5;
const MAX_TOTAL = 2000;
const perIp = new Map(); // ip -> open connections

function send(client, event) {
  client.res.write(`event: ${event}\ndata: {}\n\n`);
}

// GET /api/events?client=<id> — keeps the response open and streams events. Returns
// false (and opens nothing) when the per-IP or total connection limit is reached.
export function openStream(req, res, { userId, clientId, ip }) {
  if (clients.size >= MAX_TOTAL || (perIp.get(ip) || 0) >= MAX_PER_IP) return false;
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-store',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  res.write('retry: 3000\n\n');
  const client = { res, userId: userId ? String(userId) : null, clientId: String(clientId).slice(0, 64), ip };
  clients.add(client);
  perIp.set(ip, (perIp.get(ip) || 0) + 1);
  const heartbeat = setInterval(() => res.write(': keep-alive\n\n'), HEARTBEAT_MS);
  req.on('close', () => {
    clearInterval(heartbeat);
    clients.delete(client);
    const left = (perIp.get(ip) || 1) - 1;
    if (left > 0) perIp.set(ip, left);
    else perIp.delete(ip);
  });
  return true;
}

export function catalogChanged() {
  for (const client of clients) send(client, 'catalog');
}

// Tells the user's other open pages to reload their cart + wishlist. The page that made
// the change (originClientId) already has it.
export function savedItemsChanged(userId, originClientId) {
  for (const client of clients) {
    if (client.userId === String(userId) && client.clientId !== originClientId) send(client, 'saved');
  }
}

// A delivery update for one of this user's orders: their open pages reload its tracking.
export function shipmentChanged(userId) {
  for (const client of clients) {
    if (client.userId === String(userId)) send(client, 'shipment');
  }
}
