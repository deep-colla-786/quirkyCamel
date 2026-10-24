// Live updates for open store pages (Server-Sent Events). Events carry no data, only
// "something changed": pages then re-fetch what they need through the normal API.
//   catalog  products, prices, stock or visibility changed       -> every open page
//   saved    a user's cart or wishlist changed                     -> that user's other pages
//   shipment a delivery update for one of the user's orders           -> that user's pages
// Connections live in memory, so with several server processes each one only reaches
// its own clients (use a shared pub/sub such as Redis to fan out across processes).
const HEARTBEAT_MS = 25_000;
const clients = new Set(); // { res, userId, clientId }

function send(client, event) {
  client.res.write(`event: ${event}\ndata: {}\n\n`);
}

// GET /api/events?client=<id> — keeps the response open and streams events.
export function openStream(req, res, { userId, clientId }) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-store',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  res.write('retry: 3000\n\n');
  const client = { res, userId: userId ? String(userId) : null, clientId };
  clients.add(client);
  const heartbeat = setInterval(() => res.write(': keep-alive\n\n'), HEARTBEAT_MS);
  req.on('close', () => {
    clearInterval(heartbeat);
    clients.delete(client);
  });
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
