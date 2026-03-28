# Ethical Money Maker

Next.js operator console for:

- ingesting hot-button narratives from TinyFish
- confirming events with Dune-style onchain checks
- drafting Base/fun.xyz launch packets
- generating approval-gated X drafts

## Stack

- Next.js 16 app router
- Clerk auth with demo fallback when keys are missing
- SQLite via `better-sqlite3` + Drizzle schema
- shadcn/ui for the dashboard surface
- OpenAI Responses API for launch/post draft generation

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment

`.env.local` is already wired locally for:

- TinyFish API key
- OpenAI API key
- X app key / secret / bearer token

You still need these for full outbound production behavior:

- `DUNE_API_KEY` plus real saved query IDs
- `FUNXYZ_API_URL` and `FUNXYZ_API_KEY`
- `X_ACCESS_TOKEN` and `X_ACCESS_TOKEN_SECRET`

Without those, the app still works end-to-end in operator mode:

- TinyFish sweep can ingest live events
- OpenAI can generate packet/post drafts
- launch packets remain draft-only
- X drafts can be approved internally but not published

## Important routes

- `/` landing page
- `/dashboard` operator console
- `/api/jobs/run` TinyFish sweep
- `/api/events/:id/confirm` Dune confirmation
- `/api/launches/:eventId/prepare` launch packet draft
- `/api/posts/:eventId/generate` X draft generation

## Superpowers install

Fetched from `https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.codex/INSTALL.md`:

```bash
git clone https://github.com/obra/superpowers.git ~/.codex/superpowers
ln -s ~/.codex/superpowers ~/.agents/skills/superpowers
```

Restart Codex after linking.

## Build

```bash
npm run lint
npx next build --webpack
```

Webpack build passes in this environment. Turbopack build panics in the sandbox, so use the Webpack build command for verification here.
