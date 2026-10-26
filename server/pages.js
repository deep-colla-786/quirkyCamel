// Server-side page rendering for search engines and share previews: every store page is
// the same app shell (dist/index.html) with its own <title>, description, Open Graph /
// Twitter tags, canonical link, Product structured data and the right status code (404
// for unknown addresses). Also serves robots.txt and sitemap.xml.
import fs from 'node:fs';
import path from 'node:path';
import { getDb } from './db.js';
import { isHttps } from './http.js';
import { matchPath, paths, INFO_PAGES } from '../src/lib/routes.js';
import { pageMeta } from '../src/lib/pageMeta.js';
import { EPISODES, EPISODES_BY_ID } from '../src/data/episodes.js';
import { listPublicProducts } from './products.js';

const SHARE_IMAGE = '/og-image.jpg';
// JSON inside a <script> tag must not contain '<' (it could close the tag), so it's written as the JSON escape for '<'.
const LT_ESCAPE = String.fromCharCode(92) + 'u003c';
const PRIVATE_PATHS = ['/admin', '/api/', '/account', '/track/', '/reset/'];

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Absolute base URL for links in tags and the sitemap (PUBLIC_URL when set).
export function baseUrl(env, req) {
  let base = String(env.PUBLIC_URL || '');
  if (!base) base = `${isHttps(req) ? 'https' : 'http'}://${req.headers.host || 'localhost'}`;
  while (base.endsWith('/')) base = base.slice(0, -1);
  return base;
}

const templates = new Map(); // file -> { mtime, html }
function template(file) {
  const { mtimeMs } = fs.statSync(file);
  const cached = templates.get(file);
  if (cached?.mtime === mtimeMs) return cached.html;
  const html = fs.readFileSync(file, 'utf8');
  templates.set(file, { mtime: mtimeMs, html });
  return html;
}

async function findProduct(env, slug) {
  const db = await getDb(env);
  return db.collection('products').findOne({ slug, active: true });
}

// schema.org Product data, so search results can show price and stock.
function productJsonLd(product, url, image) {
  const inStock = product.stock === null || product.stock === undefined || product.stock > 0;
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || product.tagline || '',
    image,
    sku: product.slug,
    brand: { '@type': 'Brand', name: 'Quirky Camel' }
  };
  if (product.price > 0) {
    data.offers = {
      '@type': 'Offer',
      url,
      priceCurrency: 'INR',
      price: product.price,
      availability: `https://schema.org/${inStock ? 'InStock' : 'OutOfStock'}`
    };
  }
  // Escape "<" so the JSON can't close the <script> tag.
  return JSON.stringify(data).replaceAll('<', LT_ESCAPE);
}

function headTags({ title, description, noindex, url, image, jsonLd, catalogJson }) {
  const tags = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<meta name="robots" content="${noindex ? 'noindex' : 'index, follow'}" />`,
    `<link rel="canonical" href="${esc(url)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="Quirky Camel" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:image" content="${esc(image)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    `<meta name="twitter:image" content="${esc(image)}" />`
  ];
  if (jsonLd) tags.push(`<script type="application/ld+json">${jsonLd}</script>`);
  // Current prices and stock for the first render (data only, not executed).
  if (catalogJson) tags.push(`<script type="application/json" id="qc-catalog">${catalogJson}</script>`);
  return tags.join('\n    ');
}

// { status, html } for any non-file address.
export async function renderPage(env, dist, urlPath, req) {
  if (urlPath === '/admin' || urlPath.startsWith('/admin/')) {
    return { status: 200, html: template(path.join(dist, 'admin', 'index.html')) };
  }
  const base = baseUrl(env, req);
  const match = matchPath(urlPath);
  let product = null;
  if (match.view === 'product') product = await findProduct(env, match.slug).catch(() => null);
  const notFound = match.view === 'notfound' || (match.view === 'product' && !product);
  const meta = pageMeta({ view: notFound ? 'notfound' : match.view, product, episode: EPISODES_BY_ID[match.episodeId], page: match.page });
  const url = `${base}${urlPath === '/' ? '/' : urlPath}`;
  const image = product?.image ? `${base}${product.image}` : `${base}${SHARE_IMAGE}`;
  const jsonLd = product && !notFound ? productJsonLd(product, url, image) : null;
  const catalog = await listPublicProducts(env).catch(() => null);
  const catalogJson = catalog ? JSON.stringify(catalog.products).replaceAll('<', LT_ESCAPE) : null;
  const html = template(path.join(dist, 'index.html'))
    .replace(/<title>[^<]*<\/title>/, '')
    .replace(/<meta name="description"[^>]*>/, '')
    .replace('</head>', `    ${headTags({ ...meta, url, image, jsonLd, catalogJson })}\n  </head>`);
  return { status: notFound ? 404 : 200, html };
}

export function robotsTxt(env, req) {
  return [
    'User-agent: *',
    ...PRIVATE_PATHS.map((p) => `Disallow: ${p}`),
    '',
    `Sitemap: ${baseUrl(env, req)}/sitemap.xml`,
    ''
  ].join('\n');
}

export async function sitemapXml(env, req) {
  const base = baseUrl(env, req);
  const db = await getDb(env);
  const products = await db.collection('products').find({ active: true }, { projection: { slug: 1, updatedAt: 1 } }).toArray();
  const entries = [
    [paths.home, null],
    [paths.shop, null],
    ...products.map((p) => [paths.product(p.slug), p.updatedAt]),
    ...EPISODES.map((e) => [paths.episode(e.id), null]),
    ...INFO_PAGES.map((id) => [paths[id], null])
  ];
  const urls = entries.map(([loc, updated]) => {
    const lastmod = updated ? `<lastmod>${new Date(updated).toISOString().slice(0, 10)}</lastmod>` : '';
    return `  <url><loc>${esc(base + loc)}</loc>${lastmod}</url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}
