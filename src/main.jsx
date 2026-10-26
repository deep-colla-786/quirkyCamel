import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import './styles/shop.css'
import './styles/auth.css'
import './styles/delivery.css'
import './styles/update-banner.css'
import './styles/info.css'
import './styles/error-screen.css'
import App from './App.jsx'
import ErrorBoundary from './components/layout/ErrorBoundary.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
