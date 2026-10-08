# BulkFlow Frontend

React + Vite + Tailwind v4 client for the BulkFlow ingestion backend.

## Run it

```bash
npm install
cp .env.example .env     # points at http://localhost:3000 by default
npm run dev              # http://localhost:5173
```

The backend (API + `npm run dev:worker`), MongoDB and Redis must be running.
`CLIENT_URL` on the backend defaults to `http://localhost:5173`, which is what
CORS and Socket.IO expect.

| Script            | What it does                |
| ----------------- | --------------------------- |
| `npm run dev`     | Vite dev server             |
| `npm run build`   | Production build to `dist/` |
| `npm run preview` | Serve the production build  |
| `npm run lint`    | ESLint                      |

## Environment

| Variable          | Default                        |
| ----------------- | ------------------------------ |
| `VITE_API_URL`    | `http://localhost:3000/api/v1` |
| `VITE_SOCKET_URL` | `http://localhost:3000`        |

## Structure

Follows the planned tree: `pages/` (12 routes), `components/{ui,layout,dashboard,uploads,jobs,results,exports,enrichment}`,
`services/` (axios layer), `socket/`, `context/`, `hooks/`, `routes/`, `constants/`, `utils/`.
Imports use the `@/` alias for `src/`.

## Behaviour worth knowing

- **Auth**: tokens live in `localStorage`. A 401 from the auth middleware triggers one silent
  refresh (shared across concurrent requests); if that fails the user is sent to `/login`.
  Business 401s (e.g. wrong current password) are *not* treated as expired sessions.
- **New upload** = `POST /uploads` then `POST /jobs` (which queues ingestion), then redirect to the job.
- **Live progress**: the job page joins the `job:{id}` Socket.IO room and merges `job:status` /
  `job:progress` events into state. The header "Live Socket" pill reflects the real connection.
- **Exports** are polled until `completed`; downloads go through an authenticated blob fetch.
- **Results** are per-job (that's how the API is shaped). The search box filters the *current page* only.

## Not in the UI on purpose

The backend has no endpoint for these, so they are not faked: editing / reprocessing a single row,
per-job source filename in list views, cluster/latency telemetry, enrichment analytics.

## Changelog

See `CHANGELOG.md` for real bugs found and fixed during testing (live results
not updating, mobile nav drawer not closing, and two separate Socket.IO
reconnection bugs where the UI would silently stop receiving live updates).
