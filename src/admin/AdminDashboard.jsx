import React, { useCallback, useEffect, useState } from 'react';
import { LayoutDashboard, ShoppingCart, Users, LogIn, Package, RefreshCw, LogOut } from 'lucide-react';
import { adminApi } from '../lib/api';
import ProductEditor from './components/ProductEditor';
import Overview from './sections/Overview';
import Orders from './sections/Orders';
import UsersTab from './sections/UsersTab';
import Logins from './sections/Logins';
import Products from './sections/Products';

const TABS = [
  ['overview', 'Overview', LayoutDashboard],
  ['orders', 'Orders', ShoppingCart],
  ['users', 'Users', Users],
  ['logins', 'Login activity', LogIn],
  ['products', 'Products', Package]
];

export default function AdminDashboard({ user, onLogout }) {
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState(null);
  const [products, setProducts] = useState(null);
  const [editing, setEditing] = useState(undefined); // undefined = closed, null = new, object = edit
  const [flash, setFlash] = useState('');

  const load = useCallback(async () => {
    const [s, o, p] = await Promise.all([adminApi.stats(), adminApi.orders(), adminApi.products()]);
    if ([s, o, p].some((r) => r.status === 401 || r.status === 403)) return onLogout(); // session ended
    if (s.ok) setStats(s.data);
    if (o.ok) setOrders(o.data.orders);
    if (p.ok) setProducts(p.data.products);
  }, [onLogout]);

  useEffect(() => {
    load();
  }, [load]);

  const say = (msg) => {
    setFlash(msg);
    setTimeout(() => setFlash(''), 2500);
  };

  const afterProductChange = (product, action) => {
    setEditing(undefined);
    say(`${product.name} ${action}.`);
    load();
  };

  const toggle = async (p) => {
    const res = await adminApi.updateProduct(p.slug, { active: !p.active });
    if (res.ok) afterProductChange(res.data.product, res.data.product.active ? 'is now visible' : 'is now hidden');
    else say(res.data.error || 'Could not update.');
  };

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
            <h1>{TABS.find((t) => t[0] === tab)[1]}</h1>
            <p>Signed in as {user.email}</p>
          </div>
          <button className="btn ghost-dark ad-btn-sm" onClick={load}>
            <RefreshCw size={15} /> Refresh
          </button>
        </header>

        {tab === 'overview' && <Overview stats={stats} orders={orders} onGo={setTab} />}
        {tab === 'orders' && <Orders orders={orders} onChanged={load} />}
        {tab === 'users' && <UsersTab />}
        {tab === 'logins' && <Logins />}
        {tab === 'products' && (
          <Products products={products} onEdit={(p) => setEditing(p)} onAdd={() => setEditing(null)} onToggle={toggle} />
        )}
      </div>

      {editing !== undefined && (
        <ProductEditor product={editing} onClose={() => setEditing(undefined)} onSaved={afterProductChange} />
      )}
      {flash && (
        <div className="ad-flash" role="status">
          {flash}
        </div>
      )}
    </div>
  );
}
