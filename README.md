# Startup Guess Who

Two-player Guess Who, but the faces are unicorn startups past and present. Create a room, send the 6-letter code, and take turns asking yes/no questions until someone names the other player's secret company.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173. Vite serves the React app and proxies `/api` to a local Express server on port 3001 that runs the same handlers as the Vercel function. Locally, rooms live in memory, so no accounts or environment variables are needed.

## Rules

- Both players see the same 24 companies. Each player is secretly one of them.
- On your turn, ask any yes/no question. Your opponent answers based on their secret company.
- Flip cards down as you rule them out. Your opponent can see how many you have left.
- Guess when you're sure. A correct guess wins, a wrong guess loses.
- Refreshing or reopening the link puts you back in your seat. Rooms are deleted 15 minutes after the last player leaves.

## Tests

```bash
npm test        # game reducer unit tests
npm run typecheck
```

## Deploy to Vercel

The app is a static Vite build plus one Vercel Function at `api/[...path].ts`. Room state is kept in Upstash Redis so every function invocation sees the same rooms. Clients poll the API about once a second during the opponent's turn.

1. Push this repo to GitHub and import it in Vercel. `vercel.json` already sets the build command and output directory, so leave the framework preset as Other.
2. Add Redis: in the Vercel project, open Storage, choose Upstash Redis from the Marketplace, and connect it to the project. This sets `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (the older `KV_REST_API_URL` / `KV_REST_API_TOKEN` names also work). The Upstash free tier is plenty for this game.
3. Deploy. Without Redis credentials the function falls back to in-memory rooms, which do not persist across serverless instances, so the app will appear to lose rooms in production until Redis is connected.
4. Custom domain: Project Settings, Domains, add your domain, then create the DNS records Vercel shows you. Invite links use whatever origin the page is served from, so they pick up your domain automatically.

## Layout

- `shared/` types, room code helpers, and the company dataset
- `server/src/game.ts` pure game reducer with vitest tests
- `server/src/api.ts` room handlers with optimistic concurrency; `store.ts` Redis or in-memory storage; `http.ts` router; `dev.ts` local Express wrapper
- `api/` one tiny Vercel Function per route, each re-exporting `server/src/vercel.ts`
- `client/` Vite + React + Tailwind

Deploys automatically from the `main` branch via the Vercel GitHub integration.
