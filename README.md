# WLADZ

A web platform of educational games for Algerian children and teenagers, commissioned by the Ministry of Youth.
The interface is in Arabic (right to left).

## Run it locally

You need Node.js 22.13 or newer.

```bash
cd wladz
npm ci
npm run dev
```

Then open http://localhost:3000.

## Where things are

- `wladz/`: the Next.js app (Next.js 16, React 19, TypeScript, Tailwind CSS 4, SQLite).
- `wladz/app/dashboard/games/<slug>/`: one folder per game, opened at `/dashboard/games/<slug>`. Copy `_template/` to start a new game.
- `wladz/public/games/<slug>/`: the images and sounds of each game.

## Before you change anything

Read the team rules:

- [`wladz/WLADZ_TEAM_PROMPT.md`](wladz/WLADZ_TEAM_PROMPT.md): how we work (stack, folders, Git, content rules).
- [`wladz/CRITICAL_CHANGES.md`](wladz/CRITICAL_CHANGES.md): decisions that change those rules.
