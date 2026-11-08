# Chatrix

Real-time chat application with direct and group conversations, file sharing,
read receipts, presence, and web push notifications.

- **Backend** — NestJS 11, PostgreSQL, TypeORM, Socket.io, MinIO (S3-compatible storage)
- **Frontend** — React 19, Vite, TypeScript, TailwindCSS, TanStack Query
- **Auth** — JWT access tokens + an httpOnly refresh cookie backed by rotating,
  revocable database sessions

## Features

- Direct and group chats with role-based permissions (owner / admin / member)
- Real-time messaging over a single Socket.io gateway: live send, edit and
  delete, typing / attachment activity, online presence and last-seen
- Three-tier read receipts (sent / read / all-read in groups)
- File attachments with magic-byte validation, image thumbnails (`sharp`),
  per-user storage quota, and background cleanup of orphaned files
- Web push notifications (VAPID) with per-session subscriptions
- Light / dark / system theme with cross-device persistence
- Installable PWA

## Project structure

```
backend/    NestJS API + Socket.io gateway + scheduled tasks
  src/
    common/   logging, request context, exception filters
    core/     env validation, database, object storage
    modules/  auth, sessions, users, chats, chat-members, messages, files, push, health
    sockets/  Socket.io transport (gateway, handshake auth, room registry)
    tasks/    scheduled jobs (orphan-file GC, expired-session cleanup)
  infra/      Dockerfile, nginx, docker-compose (dev + prod), deploy scripts
frontend/   React SPA
  src/
    app/      bootstrap (router, providers)
    shared/   cross-cutting (api client, guards, i18n, ui)
    modules/  auth, chats, messages, files, push, users, realtime
```

The backend and frontend are independent projects — no shared imports, no
shared types package. Each builds and ships on its own.

## Prerequisites

- **Node.js 22+**
- **Yarn 1.x** (backend) and **npm** (frontend)
- **Docker** with Docker Compose (Postgres, MinIO, and the production stack)
- **Cloudflare account and a domain** — optional, only to publish the production stack to the internet

## Local development

The backend runs natively; Postgres and MinIO run in Docker.

```bash
# Backend → http://localhost:4321
cd backend
cp .env.dev.example .env.dev      # defaults work out of the box
yarn install
yarn docker:up                    # start Postgres + MinIO
yarn migration:run:dev
yarn start:dev
```

```bash
# Frontend → http://localhost:5173
cd frontend
npm install
npm run dev                       # proxies /api and /socket.io to :4321
```

- API docs (Swagger): `http://localhost:4321/api/docs` (development only)
- MinIO console: `http://localhost:9001`

> The dev server feels slower than production: React StrictMode double-renders,
> the React Query devtools subscribe to every query, and Vite re-evaluates
> modules on save. Measure real performance with `npm run build && npm run preview`.

## Configuration

Every environment variable is documented inline in the `*.example` templates.
Copy each template and fill in the values:

| Template | Copy to | Purpose |
|---|---|---|
| `backend/.env.dev.example` | `backend/.env.dev` | Local development (defaults work) |
| `backend/.env.prod.example` | `backend/.env.prod` | Production backend |
| `backend/infra/.env.prod.infra.example` | `backend/infra/.env.prod.infra` | Cloudflare Tunnel token (kept out of the app container) |
| `frontend/.env.prod.example` | `frontend/.env.prod` | SPA build (`VITE_API_URL`) |

Secrets to generate for production:

```bash
openssl rand -hex 64               # JWT_ACCESS_SECRET
yarn web-push generate-vapid-keys  # VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY
```

Also set strong values for `POSTGRES_PASSWORD` and `S3_SECRET_KEY`, and point
`FRONTEND_ORIGIN`, `COOKIE_DOMAIN`, `S3_PUBLIC_URL`, and `VITE_API_URL` at your
public host. `VITE_API_URL` must include the `/api` suffix. The realtime socket
connects to the same origin the SPA is served from, so it needs no separate URL.

## Production deployment

The production stack is a single Docker Compose project — Postgres, MinIO, the
backend image, and an nginx reverse proxy. nginx serves the built SPA and
proxies `/api`, `/socket.io`, and `/storage` to the backend and MinIO, so the
whole app lives behind one origin (no CORS, no separate frontend host).

```bash
cd backend

# 1. Configure (see "Configuration" above)
cp .env.prod.example .env.prod && $EDITOR .env.prod

# 2. Build the SPA into the nginx mount
yarn build:spa

# 3. Build the backend image and start the stack (nginx on port 80)
yarn docker:up:prod

# 4. Verify
curl http://localhost/api/health
```

`docker:up:prod` rebuilds the backend image on every run, so source changes are
always picked up. The container applies pending migrations on startup and
refuses to boot on a broken schema. Tear down with `yarn docker:down:prod`
(volumes persist).

### Publishing with Cloudflare Tunnel (optional)

The `cloudflared` service dials out to Cloudflare, so the host needs no open web
ports and TLS is terminated at Cloudflare's edge. In the Cloudflare dashboard,
create a tunnel and add a published application that points your domain at
`http://nginx:80`. Then:

```bash
cp infra/.env.prod.infra.example infra/.env.prod.infra
# set TUNNEL_TOKEN to the tunnel token, then:
yarn docker:up:prod:tunnel
```

Set `FRONTEND_ORIGIN`, `S3_PUBLIC_URL`, and `VITE_API_URL` to the public domain
(`https://<domain>`, `https://<domain>/storage`, `https://<domain>/api`) before
building the SPA, and leave `COOKIE_DOMAIN` empty so the refresh cookie stays
host-only. nginx listens on `127.0.0.1:80` only, so the tunnel is the sole
public entrance.

## Scripts

**Backend** (`cd backend`)

| Command | Description |
|---|---|
| `yarn start:dev` | Watch-mode dev server |
| `yarn build` · `lint` · `format` | Compile / lint / format |
| `yarn docker:up` · `docker:down` · `docker:logs` | Dev stack (Postgres + MinIO) |
| `yarn docker:up:prod` · `docker:down:prod` · `docker:logs:prod` | Production stack |
| `yarn docker:up:prod:tunnel` | Production stack plus the Cloudflare Tunnel |
| `yarn build:spa` | Build the SPA into the nginx mount |
| `yarn migration:generate:dev` · `migration:run:dev` · `migration:revert:dev` | TypeORM migrations (`:prod` variants target the prod env) |

**Frontend** (`cd frontend`)

| Command | Description |
|---|---|
| `npm run dev` | Vite dev server (proxies to :4321) |
| `npm run build` · `preview` | Production build / preview |
| `npm run lint` · `format` | Lint / format |

## Architecture

- **Strict three-layer modules** — Controller → Service → Repository → Entity.
  Entities never leave their module; cross-module data moves as DTOs.
- **Whitelisted DTOs** — `@Expose()` only; secrets (passwords, token hashes) are
  never declared in any DTO.
- **Single Socket.io gateway** — `src/sockets/` is pure transport (handshake
  auth, rooms, emitter). Domain modules emit typed events and own their own side
  effects (WS broadcast, push, cleanup) through listeners.
- **Request context in logs** — `AsyncLocalStorage` carries request and user ids
  through HTTP requests, WebSocket events, and scheduled tasks automatically.
- **The frontend mirrors the backend** — one folder per domain under
  `src/modules/`, cross-cutting code in `src/shared/`, interfaces extracted into
  their own files.

## License

[PolyForm Noncommercial License 1.0.0](LICENSE) — © 2026 Vitalie Vizitiu.
You may view, run, test, and modify this project for any **noncommercial**
purpose. **Commercial use is not permitted** without prior permission. See
[`LICENSE`](LICENSE) for the full terms.
