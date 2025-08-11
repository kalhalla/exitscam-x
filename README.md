# ExitScamCoin – X.com Viral Game (MVP)

Node.js (TypeScript) + Express + twitter-api-v2 + Prisma/Postgres + Redis + Solana SPL.

## Quick Start
```bash
cp .env.example .env
# fill envs
npm i
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

## Webhooks & Cron (MVP)
- Poller auto-runs if `POLLING_ENABLED=true`.
- Internal scheduler runs if `INTERNAL_SCHEDULER=true`.
- Manual cron endpoints:
  - POST /api/cron/daily-payout
  - POST /api/cron/weekly-jackpot
```