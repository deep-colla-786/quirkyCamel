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
- **Emails:** `server/mailer.js` sends an HTML invoice to the customer and a new-order alert to `ADMIN_EMAIL` after each paid order; the result is stored on the order.
- **Products live in MongoDB.** The kit and six fragrances are seeded on first run; prices, stock and visibility are edited from the dashboard and checkout prices come from the database.
- **Collections:** `users`, `sessions`, `logins`, `products`, `orders`. Indexes are created on first connection (`server/db.js`).
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
    useAuth.js               session user, login modal, requireLogin(), session-ended handling
    useCheckout.js           Razorpay / demo payment and order confirmation
    useToast.js              toast message
  pages/                   one component per route
    HomePage, ShopPage, ProductPage (#product/<slug>), EpisodePage, AccountPage
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
  admin/                   admin app (separate bundle)
    main.jsx, AdminApp.jsx   entry + session gate
    AdminLogin.jsx, AdminDashboard.jsx
    sections/                Overview, Orders, UsersTab, Logins, Sessions, Products
    components/              Stat, EmailBadge, MailBar, ResendButton, InvoiceModal, RevenueChart, ProductEditor
    utils/                   format (dates, items), downloadCsv, shapes (PropTypes)
  lib/                     api client, catalog, razorpay loader, localStorage helpers
  data/                    episodes (copy, prices) and products
  utils/svgGenerators.js   generated sachet / kit / scene artwork
  styles/
    index.css                imports store/*.css in cascade order (one file per section)
    shop.css, auth.css       shop + product pages, login modal
    admin.css                admin panel only
server/                    Node API (one module per concern: api routes, auth, sessions, db,
                           products, razorpay, mailer, admin, env loader, http helpers, passwords)
```
