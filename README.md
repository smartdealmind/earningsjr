# ChoreCoins

**Family chore management that teaches real money skills.**

Kids pick tasks, learn responsibility, and earn points that convert to money—with guardrails parents control. Required chores stay required. Rewards stay motivating.

## Tech Stack

- **Backend**: Cloudflare Workers API (Hono.js)
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare KV + R2
- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS with zinc glass aesthetic
- **Deployment**: Cloudflare Pages

## Features

- ✅ Parent-controlled exchange rates & weekly allowance
- ✅ Required chores (no points) vs. paid chores (points)
- ✅ Goals, requests, approvals, badges & payouts
- ✅ Achievements system with auto-awarded badges
- ✅ Daily reminders with timezone support
- ✅ Reward chart SVG generation
- ✅ Admin dashboard with audit logs
- ✅ Feature flags (global + per-family)
- ✅ Rate limiting & session management

## Development

```bash
# Install dependencies
pnpm install

# Run API locally
pnpm dev:api

# Run web locally
pnpm -C apps/web dev

# Deploy
pnpm deploy:api
# (Web deploys automatically via Cloudflare Pages)
```

---

**Powered by [SmartDealMind LLC](https://smartdealmind.com)**

