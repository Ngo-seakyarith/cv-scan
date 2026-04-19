# CVScan (Next.js 16 + Bun + Neon + Better Auth + OpenRouter)

This project migrates the original Flask CV scanner flow into a Next.js App Router app while keeping the same user journey:

1. Landing page
2. Login/Register
3. Dashboard
4. Upload CV
5. Search + filter
6. Candidate detail + delete
7. Export to Excel

## Stack

- Next.js 16 (App Router)
- Bun (package manager + scripts)
- Tailwind CSS v4
- Better Auth (Google OAuth)
- Prisma + Neon (PostgreSQL)
- OpenRouter (CV data extraction)

## Setup

1. Copy environment variables

```bash
cp .env.example .env
```

2. Fill required values in `.env`

- `DATABASE_URL` and `DIRECT_DATABASE_URL` from Neon
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- `BETTER_AUTH_SECRET`
- `OPENROUTER_API_KEY`

3. Configure Google OAuth callback URL

```text
http://localhost:3000/api/auth/callback/google
```

4. Push Prisma schema to Neon

```bash
bun run db:push
```

5. Run the app

```bash
bun run dev
```

## Useful Commands

```bash
bun run dev
bun run lint
bun run build
bun run db:generate
bun run db:push
bun run db:migrate
```

## Notes

- `legacy_flask` contains the original Flask implementation kept for reference.
- Search skill matching uses fuzzy matching with a 0.6 threshold to preserve prior behavior.
