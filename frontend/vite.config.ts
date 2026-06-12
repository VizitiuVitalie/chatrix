import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { createLogger, defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const BACKEND_DEV_URL = 'http://localhost:4321';

// Identifies this exact build. Baked into the bundle as `__BUILD_ID__`
// AND written to `dist/version.json`, so the running app can compare
// its own id against the deployed one and prompt for a reload when a
// newer build is live. `Date.now()` makes every build distinct (a
// deploy is always "newer"); a CI pipeline can pin it via `BUILD_ID`.
const buildId = process.env.BUILD_ID ?? Date.now().toString();

// Drops `version.json` at the build root next to `index.html`. Served
// fresh (nginx `no-store`) and polled by `useAppUpdateCheck`. Build-
// only — there is no bundle to annotate during `vite dev`.
const versionManifestPlugin: Plugin = {
  name: 'emit-version-manifest',
  apply: 'build',
  generateBundle(): void {
    this.emitFile({
      type: 'asset',
      fileName: 'version.json',
      source: JSON.stringify({ id: buildId }),
    });
  },
};

// When running the dev server behind an ngrok tunnel (e.g. testing
// mobile UX on a real phone via chatrix.ngrok.dev), Vite's HMR
// client must dial back to the PUBLIC origin via secure WebSocket,
// not the default `ws://localhost:5173`. The page is loaded from
// `https://chatrix.ngrok.dev`, so a `ws://localhost` connection
// fails cross-origin and the browser falls back to a full page
// reload every time the tab loses focus / phone unlocks.
//
// Localhost dev stays defaults: don't set `DEV_HMR_HOST` and Vite
// uses its own probing (same host as the page, ws to the dev port).
// To activate the tunnel path:
//   DEV_HMR_HOST=chatrix.ngrok.dev yarn dev
// (or persist it in `frontend/.env.development.local`).
const hmrTunnelHost = process.env.DEV_HMR_HOST;
const hmrConfig = hmrTunnelHost
  ? { protocol: 'wss', host: hmrTunnelHost, clientPort: 443 }
  : undefined;

// Vite's built-in proxy middleware logs every `ECONNRESET` /
// `ECONNABORTED` upstream disconnect as an error through
// `config.logger.error('ws proxy error:\n…')`. These fire constantly
// during normal usage (HMR reloads, backend restarts, socket.io
// reconnects) and drown out real failures.  Vite registers its own
// error handler AFTER the user-supplied `configure` callback, so a
// `proxy.on('error', …)` swallow there doesn't suppress the log line.
// The supported escape hatch is a custom logger that filters messages
// before they reach the terminal.
const logger = createLogger();
const originalError = logger.error.bind(logger);
const PROXY_DISCONNECT_NOISE = /(ws|http) proxy (error|socket error)/;
logger.error = (msg, options) => {
  if (PROXY_DISCONNECT_NOISE.test(msg) && /ECONNRESET|ECONNABORTED/.test(msg)) {
    return;
  }
  originalError(msg, options);
};

// In dev mode the service worker source lives at `/src/sw.ts` and
// Vite serves it from that path. Browsers default the SW's max
// scope to the directory the script sits in — `/src/` — but we want
// it to control the whole origin (`/`). Setting the
// `Service-Worker-Allowed: /` response header on the SW request
// lifts that restriction. In prod the SW ships at `/sw.js` (root)
// via the rollupOptions input, so the default scope already covers
// everything and this middleware is dev-only.
const swAllowedScopePlugin = {
  name: 'sw-allowed-scope',
  configureServer(server: import('vite').ViteDevServer): void {
    server.middlewares.use((req, res, next) => {
      const url = req.url ?? '';
      if (url === '/src/sw.ts' || url.startsWith('/src/sw.ts?')) {
        res.setHeader('Service-Worker-Allowed', '/');
      }
      next();
    });
  },
};

// https://vite.dev/config/
export default defineConfig({
  customLogger: logger,
  define: {
    __BUILD_ID__: JSON.stringify(buildId),
  },
  plugins: [
    react(),
    tailwindcss(),
    swAllowedScopePlugin,
    versionManifestPlugin,
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // Hosts that may load the dev server. Vite 5+ refuses requests
    // whose Host header isn't in this list — without the ngrok entry
    // browsers visiting the tunnel get "Blocked request: This host is
    // not allowed." `localhost` and `127.0.0.1` stay implicit defaults.
    allowedHosts: ['chatrix.ngrok.dev'],
    hmr: hmrConfig,
    proxy: {
      '/api': {
        target: BACKEND_DEV_URL,
        changeOrigin: true,
      },
      '/socket.io': {
        target: BACKEND_DEV_URL,
        changeOrigin: true,
        ws: true,
      },
    },
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      // `src/sw.ts` is a SECOND entry alongside `index.html` so the
      // service worker ships as `/sw.js` at the build root with the
      // exact filename the runtime registration helper expects. The
      // SPA chunks keep their hashed names; only the SW gets a
      // stable name so re-deploys don't break the existing
      // registration URL on returning visitors.
      input: {
        main: resolve(__dirname, 'index.html'),
        sw: resolve(__dirname, 'src/sw.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) =>
          chunkInfo.name === 'sw' ? 'sw.js' : 'assets/[name]-[hash].js',
      },
    },
  },
});
