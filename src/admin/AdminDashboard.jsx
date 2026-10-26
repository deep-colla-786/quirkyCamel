import React, { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { LayoutDashboard, ShoppingCart, Users, LogIn, Package, RefreshCw, LogOut, KeyRound, Truck } from 'lucide-react';
import { adminApi } from '../lib/api';
import ProductEditor from './components/ProductEditor';
import LoadError from './components/LoadError';
import Overview from './sections/Overview';
import Orders from './sections/Orders';
import UsersTab from './sections/UsersTab';
import Logins from './sections/Logins';
import Sessions from './sections/Sessions';
import Deliveries from './sections/Deliveries';
import Products from './sections/Products';

const TABS = [
  ['overview', 'Overview', LayoutDashboard],
  ['orders', 'Orders', ShoppingCart],
  ['deliveries', 'Deliveries', Truck],
  ['users', 'Users', Users],
  ['logins', 'Login activity', LogIn],
  ['sessions', 'Sessions', KeyRound],
  ['products', 'Products', Package]
];
const FLASH_MS = 2500;
const TAB_IDS = new Set(TABS.map(([id]) => id));
// The open tab lives in the address (/admin#orders), so a refresh stays on it.
const tabFromUrl = () => {
  const id = globalThis.location.hash.slice(1);
  return TAB_IDS.has(id) ? id : 'overview';
};
const CLOSED = undefined; // product editor: CLOSED, null = new product, object = edit

export default function AdminDashboard({ user, onLogout }) {
  const [tab, setTabState] = useState(tabFromUrl);
  const [loadError, setLoadError] = useState('');
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState(null);
  const [products, setProducts] = useState(null);
  const [editing, setEditing] = useState(CLOSED);
  const [flash, setFlash] = useState('');
  // Bumped by "Refresh" so sections that load their own data fetch it again.
  const [refreshKey, setRefreshKey] = useState(0);
  // Order whose delivery to open when switching to the Deliveries tab from Orders.
  const [deliveryOrder, setDeliveryOrder] = useState(null);
  const flashTimer = useRef(null);

  // A 401 is handled by AdminApp (session ended); 403 means the account lost admin rights.
  const load = useCallback(async () => {
    const results = await Promise.all([adminApi.stats(), adminApi.orders(), adminApi.products()]);
    const [s, o, p] = results;
    if (results.some((r) => r.status === 403)) return onLogout();
    if (s.ok) setStats(s.data);
    if (o.ok) setOrders(o.data.orders);
    if (p.ok) setProducts(p.data.products);
    const failed = results.find((r) => !r.ok && r.status !== 401);
    setLoadError(failed ? failed.data.error || 'Couldn’t load the dashboard data.' : '');
  }, [onLogout]);

  const setTab = useCallback((id) => {
    setTabState(id);
    globalThis.history.replaceState(null, '', `#${id}`);
  }, []);

  useEffect(() => {
    const onHash = () => setTabState(tabFromUrl());
    globalThis.addEventListener('hashchange', onHash);
    return () => globalThis.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => () => clearTimeout(flashTimer.current), []);

  const say = useCallback((msg) => {
    clearTimeout(flashTimer.current);
    setFlash(msg);
    flashTimer.current = setTimeout(() => setFlash(''), FLASH_MS);
  }, []);

  const refresh = () => {
    setRefreshKey((k) => k + 1);
    load();
  };

  const afterProductChange = (product, action) => {
    setEditing(CLOSED);
    say(`${product.name} ${action}.`);
    load();
  };

  const toggle = async (p) => {
    const res = await adminApi.updateProduct(p.slug, { active: !p.active });
    if (!res.ok) return say(res.data.error || 'Could not update.');
    afterProductChange(res.data.product, res.data.product.active ? 'is now visible' : 'is now hidden');
  };

  const sections = {
    overview: () => <Overview stats={stats} orders={orders} onGo={setTab} />,
    orders: () => (
      <Orders
        orders={orders}
        onChanged={load}
        onTrack={(id) => {
          setDeliveryOrder(id);
          setTab('deliveries');
        }}
      />
    ),
    deliveries: () => <Deliveries openOrderId={deliveryOrder} onOpen={setDeliveryOrder} />,
    users: () => <UsersTab />,
    logins: () => <Logins />,
    sessions: () => <Sessions onFlash={say} />,
    products: () => <Products products={products} onEdit={setEditing} onAdd={() => setEditing(null)} onToggle={toggle} />
  };
  const title = TABS.find((t) => t[0] === tab)[1];

  return (
    <div className="admin">
      <aside className="ad-side">
        <div className="ad-brand">
          <span className="icon" />
          <div>
            <b>Quirky Camel</b>
            <small>Admin</small>
          </div>
        </div>
        <nav aria-label="Admin sections">
          {TABS.map(([id, label, Icon]) => (
            <button key={id} aria-current={tab === id ? 'page' : undefined} onClick={() => setTab(id)}>
              <Icon size={18} /> {label}
            </button>
          ))}
        </nav>
        <div className="ad-side-foot">
          <a className="ad-store-link" href="/" target="_blank" rel="noreferrer">
            View store ↗
          </a>
          <button className="ad-store-link" onClick={onLogout}>
            <LogOut size={15} /> Log out
          </button>
        </div>
      </aside>

      <div className="ad-main">
        <header className="ad-top">
          <div>
            <h1>{title}</h1>
            <p>Signed in as {user.email}</p>
          </div>
          <button className="btn ghost-dark ad-btn-sm" onClick={refresh}>
            <RefreshCw size={15} /> Refresh
          </button>
        </header>

        {loadError && <LoadError message={loadError} onRetry={refresh} />}
        <React.Fragment key={`${tab}-${refreshKey}`}>{sections[tab]()}</React.Fragment>
      </div>

      {editing !== CLOSED && (
        <ProductEditor product={editing} onClose={() => setEditing(CLOSED)} onSaved={afterProductChange} />
      )}
      {flash && (
        <div className="ad-flash" role="status">
          {flash}
        </div>
      )}
    </div>
  );
}

AdminDashboard.propTypes = {
  user: PropTypes.shape({ email: PropTypes.string.isRequired }).isRequired,
  onLogout: PropTypes.func.isRequired
};
