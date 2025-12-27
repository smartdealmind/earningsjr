# Cloudflare Workers GitHub Integration Setup

When setting up the Worker project in Cloudflare Dashboard with GitHub integration, use these settings:

## Configuration

**Repository Path:** `smartdealmind/earningsjr`

**Project name:** `earningsjr-api`

**Build command:** (leave empty or use: `pnpm install --frozen-lockfile`)
- Cloudflare automatically installs dependencies, so this can be empty
- If you need a build step, use: `pnpm install --frozen-lockfile`

**Deploy command:** `pnpm deploy`
- This runs the root `deploy` script which executes `pnpm -C workers/api deploy`
- Wrangler will be found in `workers/api/node_modules/.bin/wrangler`

## Alternative Configuration

If the above doesn't work, you can also use:

**Build command:** `pnpm install --frozen-lockfile`

**Deploy command:** `cd workers/api && pnpm deploy`

Or directly:

**Deploy command:** `pnpm -C workers/api exec wrangler deploy`

## Important Notes

1. **Wrangler Location**: Wrangler is installed as a devDependency in `workers/api/`, not at the root level
2. **Working Directory**: The deploy command must run from `workers/api/` or use pnpm's `-C` flag to change directory
3. **Dependencies**: Make sure `pnpm install` runs first (Cloudflare does this automatically)

## Verification

After setup, the deployment should:
1. Clone the repository
2. Install dependencies (including wrangler in workers/api)
3. Run the deploy command from the correct directory
4. Deploy to Cloudflare Workers

## Troubleshooting

If you see "wrangler: not found":
- Ensure the deploy command uses `pnpm -C workers/api deploy` or changes to the workers/api directory first
- Verify wrangler is listed in `workers/api/package.json` devDependencies

