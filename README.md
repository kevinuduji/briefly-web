# Briefly

Voice-first business intelligence: one spoken (or typed) update, structured intake, then a scored dashboard. React + Vite + Tailwind.

## Setup

```bash
npm install
```

Create `.env.local` in the project root (never commit it):

```
VITE_OPENAI_API_KEY=sk-...
```

Copy from [`.env.example`](./.env.example) if you like.

## Run locally

```bash
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). Use Chrome for Web Speech API.

## Build

```bash
npm run build
npm run preview
```

## Flow

1. **Journal** — One take: record (or type) a single update following the on-card checklist, then **Review my day →** (runs Extract).
2. **Form** — AI-pre-filled fields you can edit; **Build My Dashboard →** (Transform + Load).
3. **Dashboard** — Prioritized view, actions, automation drafts, in-session memory.

**Try sample demo** fills a realistic transcript and runs Extract so you land on the form without recording.

The old single-file `briefly.html` prototype was removed in favor of this app; use `.env.local` for keys instead of hard-coding.
