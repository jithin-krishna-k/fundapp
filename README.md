# FUND · ഫണ്ട് ഗ്രൂപ്പ്

Standalone copy of the Base44 "FUND" app (TanStack Start + React + Tailwind), running on Neon:
**Lakebase Postgres** for all data (records, uploads, user preferences; nothing is kept in local files or browser storage), **Neon Auth** (Managed Better Auth) for sign-in, and **Neon Realtime**
for live updates between members.

## Run

```bash
npm install
neon env pull          # or `neon deploy`: writes DATABASE_URL, NEON_AUTH_*, NEON_REALTIME_* to .env.local
npm run db:migrate     # applies db/migrations/*.sql (direct connection)
npm run dev            # http://localhost:3000
npm run build && npm start   # production build, served on :3000
```

`.env.local` also needs two app-side values (already added locally):

- `NEON_AUTH_COOKIE_SECRET`: 32+ random characters, signs the session cookie and private file links.
- `VITE_NEON_REALTIME_URL=$NEON_REALTIME_URL`: the browser's copy of the Realtime URL.

Neon services are declared in `neon.ts`. Every origin the browser app runs on must be listed in
`preview.realtime.allowedOrigins` (currently `http://localhost:3000` and `:3001`), then `neon deploy -y`.

## How it fits together

| Piece | Files |
| --- | --- |
| Postgres (`pg` pool over pooled `DATABASE_URL`) | `src/lib/pg.server.js`, `src/lib/db.server.js` (entity API over `app_records`), `db/migrations/` |
| Neon Auth (cookie session via same-origin proxy) | `src/routes/api/auth/$.js`, `src/lib/neon-auth.server.js`, `src/lib/auth-middleware.js`, `src/api/base44Client.js` |
| Realtime (sealed live query, `useLiveQuery`) | `src/lib/realtime.server.js`, `sealRecordChanges` in `src/lib/backend-fns.js`, `src/components/fund/LiveSync.jsx` |
| Private uploads | `app_files` table, signed links from `src/lib/file-links.server.js`, served by `src/routes/api/files.$token.js` |

`src/api/base44Client.js` keeps the `@base44/sdk` method names the pages were written against, so the
page code is unchanged. Business rules stay in `src/lib/server-fns.js`.

Realtime subscribes to `SELECT id, entity, updated_date FROM app_records` (ids and times only). When a
change commits, open dashboards reload their data through the normal authorized server functions.

## Accounts

Sign up at `/register` (email + password, or Google via Neon's shared OAuth credentials). Email
verification at sign-up is off on the branch, so sign-up signs you straight in. A new account becomes a
**pending** member until the fund admin approves it. Signing up with the email of an existing member links
you to that member (the super admin carried over from the original app is its owner).

Password-reset emails are links, and Neon's shared mail sender only supports codes, so set up custom
SMTP before relying on reset in production: https://neon.com/docs/auth/production-checklist.md

Two-step verification (MFA) is not offered by Managed Neon Auth yet.
