# WLADZ app

The Next.js application of WLADZ. The [main README](../README.md) has the overview and the team rules.

## Commands

Run them in this folder:

```bash
npm ci        # install the exact dependency versions
npm run dev   # start the app at http://localhost:3000
npm run lint  # check the code
```

## Accounts and database

- Node.js 22.13 or newer is required (it provides the built-in `node:sqlite` module).
- The database is created at `.data/auth.sqlite` on first use. Set `AUTH_DATABASE_PATH` to use another file. The `.data/` folder is ignored by Git.
- Account API:
  - `POST /api/auth/register` with `{ "email": "...", "password": "..." }` (password: 12 to 128 characters)
  - `POST /api/auth/login` with the same body
  - `POST /api/auth/logout`
  - `GET /api/auth/me`
