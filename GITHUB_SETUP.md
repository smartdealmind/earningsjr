# GitHub Repository Setup for EarningsJr

This repository is configured for automated deployment to Cloudflare using GitHub Actions.

## Repository

- **GitHub**: https://github.com/smartdealmind/earningsjr
- **Account**: smartdealmind

## GitHub Actions Workflows

Two workflows are configured for automated deployment:

### 1. Cloudflare Pages Deployment (`deploy-pages.yml`)

Deploys the web app to Cloudflare Pages when changes are pushed to `main` branch in:
- `apps/web/**` directory
- Workflow file itself

**Triggers:**
- Push to `main` branch (with path filters)
- Manual trigger via GitHub Actions UI

**Requirements:**
- `CLOUDFLARE_API_TOKEN` - Cloudflare API token with Pages edit permissions
- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID
- `VITE_API_URL` (optional) - API URL for the frontend (defaults to workers.dev URL)

### 2. Cloudflare Workers Deployment (`deploy-workers.yml`)

Deploys the API worker to Cloudflare Workers when changes are pushed to `main` branch in:
- `workers/api/**` directory
- Workflow file itself

**Triggers:**
- Push to `main` branch (with path filters)
- Manual trigger via GitHub Actions UI

**Requirements:**
- `CLOUDFLARE_API_TOKEN` - Cloudflare API token with Workers edit permissions
- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID

## Setting Up GitHub Secrets

1. Go to: https://github.com/smartdealmind/earningsjr/settings/secrets/actions
2. Add the following secrets:

### Required Secrets

```
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

### Optional Secrets

```
VITE_API_URL  # If you want to override the default API URL
```

## Getting Your Cloudflare Credentials

### API Token

1. Go to Cloudflare Dashboard → My Profile → API Tokens
2. Click "Create Token"
3. Use "Edit Cloudflare Workers" template or create custom token with:
   - **Account** → **Cloudflare Workers** → **Edit**
   - **Account** → **Cloudflare Pages** → **Edit**
   - **Zone** → **Zone Settings** → **Read** (if using custom domains)
4. Copy the token and add it as `CLOUDFLARE_API_TOKEN`

### Account ID

1. Go to Cloudflare Dashboard
2. Select your account (right sidebar)
3. Copy the Account ID from the URL or sidebar
4. Add it as `CLOUDFLARE_ACCOUNT_ID`

## Deployment Process

### Automatic Deployment

1. Push changes to `main` branch
2. GitHub Actions automatically:
   - Builds the web app (if `apps/web/**` changed)
   - Deploys to Cloudflare Pages (if web app changed)
   - Deploys to Cloudflare Workers (if `workers/api/**` changed)

### Manual Deployment

1. Go to: https://github.com/smartdealmind/earningsjr/actions
2. Select the workflow you want to run
3. Click "Run workflow" → Select branch → "Run workflow"

## Project Structure

```
earningsjr/
├── .github/
│   └── workflows/
│       ├── deploy-pages.yml    # Web app deployment
│       └── deploy-workers.yml  # API worker deployment
├── apps/
│   └── web/                    # React frontend
└── workers/
    └── api/                    # Cloudflare Workers API
```

## Troubleshooting

### Workflow Fails with "Authentication Error"

- Verify `CLOUDFLARE_API_TOKEN` is correct and has proper permissions
- Check that `CLOUDFLARE_ACCOUNT_ID` matches your account

### Pages Deployment Fails

- Ensure the Pages project `earningsjr` exists in Cloudflare
- Check that the API token has Pages edit permissions
- Verify the build output directory is `apps/web/dist`

### Workers Deployment Fails

- Ensure `wrangler.toml` is correctly configured
- Check that all required bindings (D1, KV, R2) exist
- Verify the API token has Workers edit permissions

## Next Steps

1. Add the required secrets to GitHub
2. Push to `main` branch to trigger first deployment
3. Monitor deployments in GitHub Actions tab
4. Check Cloudflare Dashboard for deployment status

