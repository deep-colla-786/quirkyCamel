// Admin panel entry (served at /admin). Built as its own bundle, so none of this
// code is downloaded by store visitors.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../styles/index.css';
import '../styles/admin.css';
import '../styles/delivery.css';
import '../styles/update-banner.css';
import AdminApp from './AdminApp.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AdminApp />
  </StrictMode>
);
