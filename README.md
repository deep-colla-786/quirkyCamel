# Quirky Camel

React + Vite storefront with a small Node API for accounts (MongoDB) and payments (Razorpay).

## Run locally

1. Start MongoDB (default `mongodb://127.0.0.1:27017`).
2. `cp .env.example .env` and fill in your values (see below).
3. `npm install`
4. `npm run dev` → http://localhost:5173

Production: `npm run build && npm start` (serves `dist/` and the API on `PORT`, default 3000).

## Environment (`.env`)

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | Connection string; the database name is the path (default `quirkycamel`). |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Razorpay API keys. While the dummy placeholders are in place, checkout runs in demo mode (no payment, order saved as `mode: "demo"`). |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | The admin account. Created on server start and re-synced if you change the password here (stored hashed). |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | Email for invoices and admin order alerts. Empty = emails are saved to `outbox/` as .html files instead. |
| `NODE_ENV=production` | Marks the session cookie `Secure` (HTTPS only). |

## How it fits together

- **Accounts:** `server/auth.js`. Passwords are hashed with scrypt.
- **Sessions:** `server/sessions.js`. The store and the admin panel have **separate sessions**, so signing in or out of one never affects the other:
  - Store: cookie `qc_session`, lasts 30 days. Customers can "Log out everywhere" from their account page.
  - Admin: cookie `qc_admin_session` (sent only to `/api/admin`, `SameSite=Strict`), ends after 30 minutes without activity or 8 hours at most. Only admin accounts can open one.
  - Tokens are random and stored hashed; signing in replaces the browser's previous session; at most 10 sessions per user and area.
  - The admin **Sessions** tab lists everyone signed in and can end a session, or all of a user's sessions.
  - When a session ends (timeout, logout elsewhere, ended by an admin), the open page notices on its next request or when the tab is focused again.
- **Checkout requires login.** Browsing and the cart are open; "Buy now", "Proceed to checkout" and all `/api/razorpay/*` and `/api/orders*` routes need a session.
- **Payments:** `server/razorpay.js` creates the Razorpay order server-side (price computed on the server) and verifies the payment signature before marking an order `paid`.
- **Admin panel:** a separate app at `/admin` (e.g. http://localhost:5173/admin), with its own login that only admin accounts can pass. It is built as its own bundle (`admin/index.html` → `src/admin/`), so store visitors never download it and the store has no link to it. Overview, orders (with **View invoice** for every paid order, shown exactly as emailed), users, login activity, sessions, and products (add / edit / hide, image upload to `uploads/`).
- **Delivery (Shiprocket)** (`server/delivery/`): when an order is paid, a shipment is booked: Shiprocket order → courier + AWB → pickup request. Tracking arrives through Shiprocket's webhook (`POST /api/delivery/updates`, security token = `SHIPROCKET_WEBHOOK_TOKEN`, sent as `x-api-key`) with a 30-minute polling fallback. Each shipment is stored in `shipments` (one per order, with the user, courier, AWB, ETA and every scan) and summarised on the order. Customers see it at `#track/<order>` (arrival date, progress, route through each hub, full history) and on their account page, updating live; the admin **Deliveries** tab shows every shipment with the same detail. Until `SHIPROCKET_EMAIL` (your Shiprocket API user's email) is set, a demo courier simulates the journey. Setup in Shiprocket: Settings → API → create the API user; Settings → Pickup Addresses (name = `SHIPROCKET_PICKUP_LOCATION`); Settings → API → Webhooks: URL `https://<your-domain>/api/delivery/updates` + the token.
- **Emails:** `server/mailer.js` sends an HTML invoice to the customer and a new-order alert to `ADMIN_EMAIL` after each paid order; the result is stored on the order.
- **Products live in MongoDB.** The kit and six fragrances are seeded on first run. Everything customers see is edited from the dashboard: name, small heading, tagline, description, MRP, discount % and selling price (for every product: a fragrance with no price is sold only inside the kit; give it a price and the single sachet can be bought too), stock, visibility, image (extras), "What's inside", specifications, the kit's pack options, and each fragrance's scent profile and notes. Built-in products show their original copy until edited. Checkout prices always come from the database.
- **Stock** is shown on every product page (in stock / only N left / out of stock); out-of-stock products can't be added to the cart, and paid orders reduce stock.
- **Live updates** (`server/events.js`, `src/hooks/useLiveUpdates.js`): open store pages get a Server-Sent Events stream. Adding, editing, hiding or showing a product in the dashboard, or a sale changing stock, updates every open page without a refresh; a shopper's cart and wishlist stay in sync across their open tabs and devices.
- **Cart and wishlist follow the account** (`server/savedItems.js`, `src/hooks/useAccountSync.js`). While signed in, each change is saved on the user's own document in `users` (`cart` and `wishlist` lists with product name, price, quantity and dates; also shown in the admin Users tab); logging out clears them from the device; logging in again (on any device) brings them back, merged with anything added as a guest, with a "You have N items in your cart" message.
- **Collections:** `users` (including each user's cart and wishlist), `sessions`, `logins`, `products`, `orders`, `shipments`. Indexes are created on first connection (`server/db.js`).
- **API routes:** listed at the top of `server/api.js`.

## Code quality

- `npm run lint:sonar` runs ESLint with the SonarJS rules (the open-source rule set behind SonarQube's JavaScript analysis) plus the React and hooks rules. It should report 0 problems.
- `sonar-project.properties` is ready for a SonarQube / SonarCloud scan (`sonar-scanner`).
- React components declare their props with PropTypes; shared shapes are in `src/lib/propShapes.js` (store) and `src/admin/utils/shapes.js` (admin).

## Project structure

```
index.html                 store entry          admin/index.html   admin entry (/admin)
src/
  main.jsx                 store bootstrap (styles + <App/>)
  App.jsx                  store shell: wires hooks to pages, layout and modals
  hooks/                   store state, one concern per hook
    useHashRouter.js         #routes → current view, goTo(), handleNavigate()
    useCatalog.js            products from the API (falls back to the built-in copy)
    useCart.js               cart contents, drawer state, add-to-cart / buy-now
    useSavedItems.js         wishlist + recently viewed
    useAccountSync.js        saves cart + wishlist to the account, restores them on login
    useLiveUpdates.js        live catalog / cart updates from the server (no refresh needed)
    useAuth.js               session user, login modal, requireLogin(), session-ended handling
    useCheckout.js           Razorpay / demo payment and order confirmation
    useToast.js              toast message
  pages/                   one component per route
    HomePage, ShopPage, ProductPage (#product/<slug>), EpisodePage, AccountPage,
    TrackingPage (#track/<order>)
  components/
    layout/                  Navbar, Footer, StickyBuyBar, Toast
    home/                    HeroSection and the other home-page sections
    kit3d/                   Hero3D (three.js kit, used on home and product pages)
    product/                 ProductCard, ProductDetail, productArt
      detail/                  Gallery, BuyPanel, Tabs + productTabs, HowToUse,
                               ShippingReturns, Reviews, RelatedProducts, RecentlyViewed
    cart/                    CartDrawer → CartStep, ShippingStep, ReviewStep, LineThumb
    checkout/                RazorpayModal (demo checkout), OrderSuccessModal
    auth/                    AuthModal
    delivery/                TrackingDetails, DeliveryProgress, RouteView, ScanTimeline, DeliveryBadge
                             (shared by the store and the admin panel)
  admin/                   admin app (separate bundle)
    main.jsx, AdminApp.jsx   entry + session gate
    AdminLogin.jsx, AdminDashboard.jsx
    sections/                Overview, Orders, Deliveries, UsersTab, Logins, Sessions, Products
    components/              Stat, EmailBadge, MailBar, ResendButton, InvoiceModal, RevenueChart,
                             ProductEditor (+ RowsEditor for its lists)
    utils/                   format, downloadCsv, shapes (PropTypes), productForm (editor logic), rowKeys
  lib/                     api client, catalog, razorpay loader, localStorage helpers
  data/                    episodes (copy, prices) and products
  utils/svgGenerators.js   generated sachet / kit / scene artwork
  styles/
    index.css                imports store/*.css in cascade order (one file per section)
    shop.css, auth.css       shop + product pages, login modal
    admin.css                admin panel only
server/                    Node API (one module per concern: api routes, auth, sessions, db,
                           products, savedItems, events (live updates), razorpay, mailer, admin,
                           env loader, http helpers, delivery/ (Shiprocket client, shipments,
                           status mapping, demo courier),
                           passwords)
```
