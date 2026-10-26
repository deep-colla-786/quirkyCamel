# Quirky Camel

An online store for **Quirky Camel**, a range of attar (perfume oil) sachets: six fragrances, each with its own "episode" and camel character, sold together in **The Complete Kit**, plus extra products added from the dashboard.

The project has two parts that run from one Node server:

- **The store** (`/`): a React single-page site with a 3D product hero, shop, product pages, cart, login, checkout with Razorpay, and order tracking.
- **The admin panel** (`/admin`): a separate dashboard for orders, deliveries, customers, login activity, sessions and products.

Data lives in **MongoDB**. Payments go through **Razorpay**, emails through **SMTP** (Gmail), and deliveries through **Shiprocket**. Each of the three has a built-in demo mode, so the whole site works end to end before any of them is set up.

---

## Contents

1. [Features](#features)
2. [Tech stack](#tech-stack)
3. [Requirements](#requirements)
4. [Getting started](#getting-started)
5. [Configuration (`.env`)](#configuration-env)
6. [Scripts](#scripts)
7. [Using the site](#using-the-site)
8. [Going live: Razorpay, email and Shiprocket](#going-live-razorpay-email-and-shiprocket)
9. [Running in production](#running-in-production)
10. [How it works](#how-it-works)
11. [Data (MongoDB collections)](#data-mongodb-collections)
12. [API](#api)
13. [Project structure](#project-structure)
14. [Code quality](#code-quality)
15. [Troubleshooting](#troubleshooting)

---

## Features

### For shoppers

- **Home page:** interactive 3D kit (three.js), the six fragrance episodes, a "spin a situation" game, a comparison section, the kit buy box, the brand story and an FAQ.
- **Shop and product pages:**
  - filters and saved items (wishlist);
  - every product page has an image gallery, a price with any discount, a **live stock level**, tabs (overview, what's inside, specifications, how to use, shipping), related products and recently viewed;
  - fragrance pages also show the scent profile.
- **Accounts:** sign up, log in, **reset a forgotten password** by email, and **delete the account** from the account page. Passwords must be at least 8 characters and not a common or easily guessed one.
- **Guest checkout:** shoppers can pay without an account. They get a private tracking link (in the confirmation and the invoice email) and can create an account afterwards to keep the order in their history.
- **Cart and wishlist saved to the account:** they follow the shopper across devices, come back after logging out and in again, and stay in sync across open tabs.
- **Checkout:** delivery address (with state), a review step, then payment with Razorpay (UPI, cards, net banking, wallets), with a demo checkout until real keys are added.
- **After payment:**
  - an order confirmation;
  - an emailed HTML invoice;
  - a **tracking page** with the arrival date, where the parcel is now, six progress steps, the route through each courier hub and the full scan history.
- **Delivery check:** on product pages, a PIN code check shows the expected delivery time (live from Shiprocket when it is set up).
- **Policy pages:** shipping, returns & refunds, privacy, terms and contact, linked from the footer and checkout.
- **Live updates:** price, stock and visibility changes from the dashboard, and delivery updates, appear on open pages without refreshing. If the site itself is updated, open pages offer a **Refresh** button.
- **Search engines and sharing:** every page has its own address, title, description and share preview; product pages include product data for Google; `robots.txt` and `sitemap.xml` are generated; unknown addresses return a real 404 page.

### For the admin (`/admin`)

- **Overview:** revenue, orders, customers, products and logins, with a 30-day revenue chart.
- **Orders:**
  - every order with its customer, items, amount and payment;
  - **View invoice** (exactly as emailed), delivery status, email delivery status and **Resend emails**;
  - CSV export.
- **Deliveries:**
  - every shipment with its courier, AWB (tracking number), status, latest scan and arrival date;
  - filters, and a detailed tracking view;
  - refresh, or book again if a booking failed.
- **Users:** customers with their phone, city, orders, total spent, **current cart and wishlist**, and a CSV export.
- **Login activity:** sign-ups, logins, failed attempts and logouts, in the store and the admin panel.
- **Sessions:** everyone signed in right now; end one session or all of a user's sessions.
- **Products:** add, edit, hide or delete. Every customer-facing detail is editable:
  - name, small heading, tagline and description;
  - MRP, discount % and selling price;
  - stock and image;
  - "what's inside", specifications and the kit's pack options;
  - each fragrance's scent profile and notes.

---

## Tech stack

| Part | Technology |
| --- | --- |
| Store and admin UI | React 19, Vite 8, three.js, lucide-react icons, PropTypes |
| Server | Node.js (no framework): one API module mounted in Vite during development and in a small HTTP server in production |
| Database | MongoDB (official `mongodb` driver) |
| Payments | Razorpay Standard Checkout (order created and signature verified on the server) |
| Email | nodemailer over SMTP (Gmail App Password) |
| Delivery | Shiprocket API and tracking webhook |
| Live updates | Server-Sent Events |
| Code quality | ESLint with SonarJS, React, React Hooks and jsx-a11y (accessibility) rules; `node:test` tests |

---

## Requirements

- **Node.js 20.19+ or 22.12+** (Vite 8 needs one of these). Check with `node -v`.
- **MongoDB 6 or newer**, running locally (default `mongodb://127.0.0.1:27017`) or a MongoDB Atlas connection string.
- **Git**, to clone the project.
- Optional, for going live: a Razorpay account, a Gmail account with 2-Step Verification, and a Shiprocket account.

---

## Getting started

These steps run the full site on your computer with demo payments, emails saved to files, and a demo courier.

**1. Get the code**

```bash
git clone https://github.com/deep-colla-786/quirkyCamel.git
cd quirkyCamel
```

**2. Install the packages**

```bash
npm install
```

**3. Start MongoDB**

- **Windows:** MongoDB is usually installed as a service that starts by itself. Check with `Get-Service MongoDB` in PowerShell, and start it with `Start-Service MongoDB` if needed.
- **macOS (Homebrew):** `brew services start mongodb-community`
- **Linux:** `sudo systemctl start mongod`
- Or set `MONGODB_URI` to a MongoDB Atlas connection string in the next step.

**4. Create your `.env` file**

```bash
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env
```

Open `.env` and at least set your own admin login:

```ini
ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD=<at least 12 characters of your own>
```

The server refuses to start while the admin password is a placeholder, shorter than 12 characters or a common password, and prints what to fix. Everything else can stay as it is for now. See [Configuration](#configuration-env) for every setting.

**5. Start the site**

```bash
npm run dev
```

- Store: http://localhost:5173
- Admin panel: http://localhost:5173/admin (log in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`)

On the first start the server creates the database indexes, adds the kit and the six fragrances to the `products` collection, and creates the admin account.

**6. Try a full order**

Create an account in the store, add the kit to the cart, fill in the delivery address and pay with the demo checkout. You'll get:
- an order confirmation with a **Track your order** link;
- an invoice saved in `outbox/`;
- a shipment that the demo courier moves forward every 2 minutes;
- the order and its shipment in the admin panel.

---

## Configuration (`.env`)

`.env` holds all settings and secrets. It is git-ignored and must never be committed; `.env.example` is the template. Restart the server after changing it.

> Values containing `$`, `#` or spaces should be wrapped in single quotes, e.g. `SHIPROCKET_PASSWORD='p@ss$word#1'`.

### Core

| Variable | Default / example | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/quirkycamel` | MongoDB connection string. The database name is the path. |
| `ADMIN_EMAIL` | `admin@example.com` | Admin login. The account is created on start, and its password is updated if you change it here (stored hashed). New-order alerts are sent here. |
| `ADMIN_PASSWORD` | `change-me-please` | Admin password: at least 12 characters, not a common password. The server won't start with the placeholder. Changing it ends existing admin sessions. |
| `ADMIN_NAME` | `Store Admin` | Name shown for the admin account. |
| `PUBLIC_URL` | empty | The store's public address, e.g. `https://quirkycamel.in`. Used for links in emails (password reset, guest tracking), canonical links, share previews and the sitemap. **Required in production.** |
| `TRUST_PROXY` | `0` | Number of reverse proxies in front of the server (e.g. `1` behind Nginx or a hosting load balancer). With `0`, `X-Forwarded-For` is ignored, so visitors can't fake their IP to get round login limits. |
| `PORT` | `3000` | Port for the production server (`npm start`). |
| `NODE_ENV` | — | Set to `production` when serving over HTTPS. Login cookies are always `Secure` except on `localhost` and local-network addresses. |

### Payments (Razorpay)

| Variable | Purpose |
| --- | --- |
| `RAZORPAY_KEY_ID` | Razorpay key id (`rzp_test_…` for testing, `rzp_live_…` in production). |
| `RAZORPAY_KEY_SECRET` | Razorpay key secret. |

While these are the placeholder values from `.env.example`, checkout uses a **demo payment window**: no money moves, and the order is saved with `mode: "demo"`.

### Email (SMTP)

| Variable | Example | Purpose |
| --- | --- | --- |
| `SMTP_HOST` | `smtp.gmail.com` | SMTP server. |
| `SMTP_PORT` | `587` | Use 587 (STARTTLS). Antivirus email scanning, e.g. AVG Mail Shield, can break port 465. |
| `SMTP_USER` | `store@gmail.com` | Mailbox that sends the invoices. |
| `SMTP_PASS` | 16-character App Password | **Not** your normal Gmail password (see [Going live](#going-live-razorpay-email-and-shiprocket)). |
| `MAIL_FROM` | `Quirky Camel <store@gmail.com>` | Sender name and address. |

While `SMTP_USER` / `SMTP_PASS` are empty, every email is saved as an `.html` file in `outbox/`.

### Delivery (Shiprocket)

| Variable | Default | Purpose |
| --- | --- | --- |
| `SHIPROCKET_EMAIL` | empty | Email of your Shiprocket **API user**. Empty means the demo courier is used. |
| `SHIPROCKET_PASSWORD` | — | Password of that API user (single-quote it). |
| `SHIPROCKET_PICKUP_LOCATION` | `Primary` | Name of your pickup address in Shiprocket (Settings → Pickup Addresses). |
| `SHIPROCKET_PICKUP_CITY` / `SHIPROCKET_PICKUP_STATE` | `Mumbai` / `Maharashtra` | Where parcels start, used for the route shown before the first scan and by the demo courier. |
| `SHIPROCKET_PICKUP_PIN` | empty | PIN code of the pickup address. With it (and Shiprocket set up), the product-page PIN check shows live courier delivery times; without it, typical times are shown. |
| `SHIPROCKET_WEBHOOK_TOKEN` | empty | At least 32 random characters (generate with `node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"`). Paste the same value into Shiprocket's webhook settings as the security token. The webhook stays off without it, and the server won't start in live Shiprocket mode with a short one. |
| `SHIPROCKET_BOX_LENGTH_CM` / `_BREADTH_CM` / `_HEIGHT_CM` | `22` / `16` / `8` | Parcel size sent to Shiprocket. |
| `SHIPROCKET_WEIGHT_PER_ITEM_KG` | `0.3` | Weight per item; a parcel is at least 0.5 kg. |
| `SHIPROCKET_DEMO_STEP_MINUTES` | `2` | Demo courier only: minutes between simulated tracking updates. |

---

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server with hot reload. Store at http://localhost:5173, admin at `/admin`, API at `/api`. Add `-- --host` to open it from other devices on your network. |
| `npm run build` | Builds the store and the admin panel into `dist/`. |
| `npm start` | Production server: serves `dist/` and the API on `PORT` (default 3000). Run `npm run build` first. |
| `npm run preview` | Serves the built `dist/` with the API through Vite (a quick check of a build). |
| `npm run mail:test` | Checks the SMTP settings and sends a test email to `ADMIN_EMAIL`. Add an address to send elsewhere: `npm run mail:test -- you@example.com`. |
| `npm run lint` | ESLint with the SonarJS rules (the open-source rule set behind SonarQube's JavaScript analysis), React, React Hooks and jsx-a11y accessibility rules; should report 0 problems. |
| `npm test` | Unit tests, plus API tests against a throwaway database (`quirkycamel_apitest`, dropped afterwards; skipped if MongoDB isn't running). |

---

## Using the site

### Store pages

| Address | Page |
| --- | --- |
| `/` | Home (sections such as `/#kit` and `/#faq` scroll to that part) |
| `/shop`, `/shop/saved` | Shop, saved items |
| `/product/<slug>` | Product page, e.g. `/product/the-complete-kit`, `/product/madam-camel` |
| `/episodes/<episode-id>` | Episode story, e.g. `/episodes/trouble-in-oasis` |
| `/account` | Account: profile, orders, delivery status, log out (or log out everywhere), delete account |
| `/track/<order-id>` | Delivery tracking for one order. Guests use the link with `?t=<token>` from their confirmation or email. |
| `/reset/<token>` | Choose a new password (from the reset email; the link works once, for 1 hour) |
| `/shipping`, `/refunds`, `/privacy`, `/terms`, `/contact` | Policy and contact pages |

Old `/#product/…`-style links still work: they are redirected to the new addresses.

### Admin panel

Open `/admin` and log in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`. Only admin accounts can sign in there. The admin session is separate from any store login in the same browser, and it ends after 30 minutes without activity.

### Demo modes

| Service | Demo behaviour | How to switch it off |
| --- | --- | --- |
| Razorpay | Demo payment window, no charge; orders saved with `mode: "demo"` | Set real `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` |
| Email | Emails saved to `outbox/` as HTML files | Set `SMTP_USER` / `SMTP_PASS` |
| Shiprocket | Demo courier "Delhivery Surface (demo)" with AWB `DEMO…`, moving one step every `SHIPROCKET_DEMO_STEP_MINUTES` | Set `SHIPROCKET_EMAIL` + `SHIPROCKET_PASSWORD` |

The admin panel shows which mode each service is in (Orders → email bar, Deliveries → delivery bar).

---

## Going live: Razorpay, email and Shiprocket

### Razorpay

1. In the Razorpay Dashboard, go to **Account & Settings → API Keys** and generate keys (test mode first).
2. Put them in `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`, then restart.
3. Checkout now opens Razorpay. Prices are always calculated on the server, and every payment's signature is verified before an order is marked paid.

### Email (Gmail)

1. Turn on **2-Step Verification** for the Gmail account that will send the emails.
2. Create an **App Password** at https://myaccount.google.com/apppasswords.
3. Set `SMTP_USER` to that Gmail address, `SMTP_PASS` to the 16-character App Password (spaces are fine), and `MAIL_FROM` to the sender name and address.
4. Restart, then run `npm run mail:test`.

After each paid order the customer gets an HTML invoice and `ADMIN_EMAIL` gets a new-order alert. The result is stored on the order, and the admin can resend both from Orders.

### Shiprocket

1. In Shiprocket, go to **Settings → API → Add New API User**. Use a different email from your main Shiprocket login, and note the password.
2. Go to **Settings → Pickup Addresses**, add your pickup address, and put its exact name in `SHIPROCKET_PICKUP_LOCATION`.
3. In `.env`, set `SHIPROCKET_EMAIL` and `SHIPROCKET_PASSWORD` (single-quoted) and a long random `SHIPROCKET_WEBHOOK_TOKEN`, then restart.
4. Go to **Settings → API → Webhooks**:
   - URL: `https://<your-domain>/api/delivery/updates`
   - Security token: your `SHIPROCKET_WEBHOOK_TOKEN`
   - Turn the webhook on.

   Shiprocket rejects webhook URLs containing the words "shiprocket", "kartrocket", "sr" or "kr", which is why the path is `/api/delivery/updates`. The webhook needs a public HTTPS address; on `localhost` the server still checks each shipment's tracking every 30 minutes instead.

From then on, every paid order is booked automatically:
1. A Shiprocket order is created.
2. A courier and AWB are assigned.
3. A pickup is requested.

Tracking updates arrive by webhook and show up live for the customer and in the admin's Deliveries tab. Customers must choose a delivery **state** at checkout, because Shiprocket requires it.

---

## Running in production

```bash
npm install
npm run build
NODE_ENV=production PORT=3000 npm start
```

(Windows PowerShell: `$env:NODE_ENV='production'; $env:PORT='3000'; npm start`.)

- Put the server behind HTTPS, for example with a reverse proxy such as Nginx or Caddy, or a platform that provides TLS. The login cookies are `Secure` in production, and HSTS is sent over HTTPS.
- Set `PUBLIC_URL` to the live address, and `TRUST_PROXY` to the number of proxies in front of the server.
- Before launch, fill in the business details in `src/data/business.js` (legal name, address, phone, GSTIN, grievance officer) and review the policy texts in `src/data/policies.js`.
- The production server compresses responses (Brotli/gzip), caches built assets for a year (their names change with each build) and renders each page's title, description and share tags on the server.
- Keep `.env` on the server only. Back up MongoDB and the `uploads/` folder, which holds product images added from the dashboard.
- Live updates (Server-Sent Events) and the delivery sync run in the server process. If you run several server instances, they need a shared message bus to see each other's events.

---

## How it works

- **One API, two hosts:** `server/api.js` is a plain Node request handler. `vite.config.js` mounts it during `npm run dev` and `npm run preview`; `server/index.js` mounts it in production next to the built files.
- **Accounts and sessions** (`server/auth.js`, `server/sessions.js`):
  - Passwords are hashed with scrypt.
  - The store and the admin panel use separate sessions: the cookies are `qc_session` (30 days) and `qc_admin_session` (sent only to `/api/admin`, `SameSite=Strict`, ending after 30 minutes idle or 8 hours at most).
  - Session tokens are random and stored only as hashes. Store sessions also end after 7 days without activity.
  - Logins are rate-limited per email + IP, per email and per IP; sign-ups, password-reset emails, guest orders and delivery checks are limited too. Every login, logout and failed attempt is recorded.
  - Password resets use single-use, 1-hour tokens stored as hashes; "forgot password" gives the same answer whether or not the email has an account. A reset ends every store session for that account.
  - Deleting an account removes the user, their sessions and saved items; their orders are kept for the store's records, marked as from a deleted account.
- **Security headers** (`server/http.js`): a Content Security Policy on pages, plus `nosniff`, frame blocking, a strict referrer policy and HSTS over HTTPS. Malformed URLs get a 400 instead of an error.
- **Pages for search engines** (`server/pages.js`, `src/lib/routes.js`): store and server share one route table. The server fills in each page's title, description, canonical link, share tags and product data, embeds the catalog so pages render without waiting for the API, and answers unknown addresses with a 404.
- **Payments** (`server/razorpay.js`): the server prices the cart from the database, creates the Razorpay order, and verifies the payment signature. Guest orders get a random tracking token, of which only a hash is stored (`server/guestOrders.js`). Then, after payment:
  - stock goes down;
  - the bought items leave the saved cart;
  - emails are sent;
  - a shipment is booked.
- **Delivery** (`server/delivery/`):
  - `shiprocket.js`: the API client, with a 10-day login token that renews automatically;
  - `shipments.js`: booking, webhook handling, and the sync loop that runs the demo courier and a 30-minute polling fallback;
  - `status.js`: turns Shiprocket's status labels into six customer-friendly steps.
- **Products** (`server/products.js`, `src/lib/catalog.js`): products live in MongoDB and are edited in the dashboard. The kit and fragrances keep their artwork and story pages in the frontend code, and show the original text for any detail not yet edited.
- **Live updates** (`server/events.js`, `src/hooks/useLiveUpdates.js`): open pages keep a Server-Sent Events connection open. The server sends "catalog", "saved" (cart/wishlist) and "shipment" signals, and pages re-fetch what changed.
- **Saved cart and wishlist** (`server/savedItems.js`, `src/hooks/useAccountSync.js`):
  - each change is sent as a single-item update, so tabs never overwrite each other;
  - on login, items picked as a guest are merged into the account's;
  - on logout, the device's copy is cleared.

---

## Data (MongoDB collections)

| Collection | One document per | Holds |
| --- | --- | --- |
| `users` | account | name, email, phone, role (`customer` / `admin`), password hash, saved address (with state), **`cart`** and **`wishlist`** (each item with name, price, quantity and dates), sign-up and last-login times |
| `sessions` | signed-in browser | hashed token, user, area (`store` / `admin`), created / last seen / expiry, IP, device. Expired sessions are removed automatically. |
| `logins` | login event | sign-up / login / failed / logout, area, email, IP, device, time |
| `products` | product | name, type (`kit` / `fragrance` / `product`), texts, price, MRP, stock (empty = unlimited), visibility, image, what's inside, specifications, pack options, scent profile |
| `orders` | order | user (or `guest: true` with a hashed tracking token), items with prices, amount (in paise), status, payment mode and ids, delivery address, email results, **delivery summary** |
| `passwordResets` | reset request | hashed token, user, expiry (removed automatically after 1 hour) |
| `shipments` | paid order | user, email, mode (`shiprocket` / `demo`), courier, AWB, Shiprocket ids, status, step, arrival date, pickup date, origin, destination and **every tracking scan** |

Indexes are created automatically on the first connection (`server/db.js`).

---

## API

All endpoints are under `/api` and exchange JSON. Requests that change data must send `Content-Type: application/json`, which blocks cross-site form posts. "(login)" means a store session is required; "(admin)" means an admin session.

<details>
<summary>Store endpoints</summary>

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/auth/me` | current store user or null |
| POST | `/api/auth/signup` | `{ name, email, phone?, password }` |
| POST | `/api/auth/login` | `{ email, password }` |
| POST | `/api/auth/logout` | |
| POST | `/api/auth/logout-all` | (login) end the user's store sessions on every device |
| POST | `/api/auth/forgot` | `{ email }`; emails a reset link if the account exists (same answer either way) |
| POST | `/api/auth/reset` | `{ token, password }` |
| DELETE | `/api/auth/account` | (login) `{ password }`; deletes the account |
| GET | `/api/account/saved` | (login) saved cart and wishlist |
| POST | `/api/account/saved/merge` | (login) add guest picks on login |
| PUT | `/api/account/cart/:slug` | (login) `{ qty }`; 0 removes the item |
| PUT / DELETE | `/api/account/wishlist/:slug` | (login) save / unsave |
| GET | `/api/events` | live update stream (Server-Sent Events) |
| GET | `/api/products` | visible products |
| GET | `/api/version` | changes when the server restarts with new code |
| GET | `/api/razorpay/config` | |
| POST | `/api/razorpay/order` | `{ items: [{ slug, qty }], customer }`; guests included |
| POST | `/api/razorpay/verify` | Razorpay's payment response; returns `guestToken` for guest orders |
| POST | `/api/orders/demo` | demo order, only while Razorpay keys are placeholders |
| GET | `/api/orders` | (login) the user's orders, with delivery summaries |
| GET | `/api/orders/:id/tracking?t=` | full tracking for one order: the owner's, or a guest's with its token |
| POST | `/api/orders/claim` | (login) `{ orderId, token }`; adds a guest order to the account |
| GET | `/api/delivery/estimate?pin=` | delivery time for a PIN code |
| GET | `/robots.txt`, `/sitemap.xml` | generated from the catalog |
| POST | `/api/delivery/updates` | Shiprocket webhook (`x-api-key` = `SHIPROCKET_WEBHOOK_TOKEN`) |

</details>

<details>
<summary>Admin endpoints</summary>

| Method | Path | Notes |
| --- | --- | --- |
| GET / POST / POST | `/api/admin/auth/me`, `/login`, `/logout` | admin session |
| GET | `/api/admin/stats` | dashboard numbers and 30-day revenue |
| GET | `/api/admin/users?q=` | customers, with cart and wishlist |
| GET | `/api/admin/logins` | login activity |
| GET | `/api/admin/sessions` | active sessions |
| DELETE | `/api/admin/sessions/:id`, `/api/admin/users/:id/sessions` | end one session / all of a user's sessions |
| GET | `/api/admin/orders` | all orders |
| GET | `/api/admin/orders/:id/invoice` | the invoice HTML |
| POST | `/api/admin/orders/:id/resend` | resend the invoice and admin alert |
| GET | `/api/admin/deliveries`, `/api/admin/deliveries/:id` | shipments / one shipment's tracking |
| POST | `/api/admin/deliveries/:id/refresh` | fetch tracking now (demo: next step) |
| POST | `/api/admin/deliveries/:id/retry` | book a missing or failed shipment |
| GET | `/api/admin/delivery-status` | Shiprocket or demo, pickup location |
| GET / POST | `/api/admin/mail-status`, `/api/admin/test-email` | email settings check / test email |
| GET / POST | `/api/admin/products` | list (including hidden) / create |
| PUT / DELETE | `/api/admin/products/:slug` | update / delete (added products only) |
| POST | `/api/admin/upload` | product image (PNG/JPG/WebP, up to 2 MB) |

</details>

The same list, with short notes, is at the top of `server/api.js`.

---

## Project structure

```
index.html                 store entry            admin/index.html   admin panel entry (/admin)
vite.config.js             dev server: mounts the API, builds both apps
server/                    Node API
  index.js                   production server (dist/ + API, compression, caching)
  pages.js                   per-page titles, share tags, product data, robots.txt, sitemap
  api.js                     all routes
  auth.js, sessions.js       accounts, login/logout, separate store/admin sessions
  account.js                 password reset and account deletion
  config.js, passwordPolicy.js, rateLimit.js   startup checks, password rules, limits
  guestOrders.js             guest order tracking tokens
  db.js                      MongoDB connection, indexes, first-run seeding
  products.js                catalog, dashboard edits, image uploads
  savedItems.js              cart + wishlist on the user record
  razorpay.js                checkout, payment verification, orders
  mailer.js                  invoices and admin alerts (SMTP or outbox/)
  admin.js                   dashboard data (stats, users, logins, sessions)
  events.js                  live updates (Server-Sent Events)
  delivery/                  Shiprocket client, shipments, status mapping, demo courier
  env.js, http.js, passwords.js
scripts/test-mail.mjs      npm run mail:test
tests/                     npm test (unit + API tests)
src/
  main.jsx, App.jsx        store entry and shell
  hooks/                   router, catalog, cart, saved items, account sync, auth,
                           checkout, live updates, version check, toast
  pages/                   Home, Shop, Product, Episode, Account, Tracking, policy pages,
                           password reset, 404
  components/
    layout/                  Navbar, Footer, StickyBuyBar, Toast, UpdateBanner
    home/                    hero and home-page sections
    kit3d/                   3D kit (three.js)
    product/                 product card, product page and its parts (detail/)
    cart/                    cart drawer and its checkout steps
    checkout/                demo Razorpay window, order confirmation
    auth/                    login / sign-up modal
    delivery/                tracking view (shared with the admin panel)
  admin/                   admin panel: login, dashboard, sections/, components/, utils/
  lib/                     API client, catalog, routes, page titles, Razorpay loader,
                           PropTypes shapes, storage
  data/                    episode copy, built-in products, Indian states, business details,
                           policy texts
  styles/                  store styles (store/*.css), shop, auth, admin, delivery
outbox/                    emails saved while SMTP isn't set up (git-ignored)
uploads/                   product images uploaded in the dashboard (git-ignored)
```

---

## Code quality

- `npm run lint`: ESLint with `eslint-plugin-sonarjs` (recommended rules), React, React Hooks and `jsx-a11y` rules. Browser code and server code are checked with their own globals. The codebase reports **0 problems**.
- `npm test`: unit tests for the password policy, startup checks, rate limits, routes and delivery statuses, and API tests for malformed URLs, login limits, the cart, the delivery webhook, guest tracking and the live-update limits.
- `sonar-project.properties` is ready for a SonarQube or SonarCloud scan with `sonar-scanner`.
- React components declare their props with PropTypes. Shared shapes are in `src/lib/propShapes.js` (store), `src/admin/utils/shapes.js` (admin) and `src/components/delivery/shapes.js`.

---

## Troubleshooting

| Problem | Fix |
| --- | --- |
| "The database is unavailable. Is MongoDB running?" | Start MongoDB (see [Getting started](#getting-started)) or check `MONGODB_URI`. |
| A page looks out of date, or checkout says "Please choose the delivery state." | The page was opened before an update. Click **Refresh** on the update notice, or press Ctrl + Shift + R. |
| Emails aren't arriving | Run `npm run mail:test`; it explains the error. Use port 587 and a Gmail **App Password**. Until SMTP works, emails are in `outbox/`. Failed sends can be resent from Admin → Orders. |
| Admin login doesn't work | Use exactly `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env` and restart after changing them. After 8 failed attempts, wait 15 minutes. |
| "Refusing to start until .env is fixed" | The message lists what to change: usually a placeholder or short `ADMIN_PASSWORD`, or a `SHIPROCKET_WEBHOOK_TOKEN` under 32 characters. |
| Password-reset or tracking links in emails are missing | Set `PUBLIC_URL`. |
| Deliveries stay on the demo courier | Set `SHIPROCKET_EMAIL` and `SHIPROCKET_PASSWORD`, then restart. Admin → Deliveries shows the current mode. |
| Shiprocket says the pickup location is invalid | `SHIPROCKET_PICKUP_LOCATION` must match a pickup address name in Shiprocket exactly. |
| A password with `$` or `#` doesn't work | Wrap it in single quotes in `.env`. |
| `git push` fails with "SSL certificate problem" on Windows (antivirus HTTPS scanning) | `git config --global http.sslBackend schannel` |
| Port 5173 is busy | Vite picks the next free port; check the address it prints. |
