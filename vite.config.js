import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { fileURLToPath } from 'node:url'
import { apiMiddleware } from './server/api.js'
import { loadEnv as loadServerEnv } from './server/env.js'

// Serves /api/* (auth, Razorpay, orders) during `npm run dev` and `npm run preview`.
// Secrets come from .env (no VITE_ prefix, so they never reach the browser bundle).
// Send /admin to /admin/ so the dev server picks the admin app's index.html.
const adminRedirect = (req, res, next) => {
  if (req.url === '/admin' || req.url.startsWith('/admin?')) {
    res.statusCode = 302
    res.setHeader('Location', '/admin/' + req.url.slice(6))
    return res.end()
  }
  next()
}

function api(env) {
  return {
    name: 'quirky-camel-api',
    configureServer(server) {
      server.middlewares.use(adminRedirect)
      server.middlewares.use(apiMiddleware(env))
    },
    configurePreviewServer(server) {
      server.middlewares.use(adminRedirect)
      server.middlewares.use(apiMiddleware(env))
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // .env values come from the server's own loader, which keeps characters like $ and #
  // exactly as written (Vite's loader expands $NAME inside values).
  const env = { ...loadEnv(mode, process.cwd(), ''), ...loadServerEnv(process.cwd()) }
  return {
    plugins: [react(), api(env)],
    build: {
      rollupOptions: {
        // Two separate apps: the store (/) and the admin panel (/admin).
        input: {
          main: fileURLToPath(new URL('./index.html', import.meta.url)),
          admin: fileURLToPath(new URL('./admin/index.html', import.meta.url)),
        },
      },
    },
  }
})
