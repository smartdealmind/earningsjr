# Cloudflare Pages Configuration for EarningsJr

Since this is a monorepo with the web app in `apps/web/`, you have two deployment options:

## Option 1: Direct Cloudflare Pages Build (Recommended for simplicity)

Configure Cloudflare Pages to build directly from GitHub:

### Build Settings

**Framework preset:** `Vite` (or `None` if Vite isn't listed)

**Root directory (advanced):** `/`
- Keep as root since we need access to the workspace

**Build command:** 
```
pnpm install --frozen-lockfile && pnpm -C apps/web build
```
- Installs all workspace dependencies
- Builds the web app from `apps/web/`

**Build output directory:** `apps/web/dist`
- This is where Vite outputs the built files

**Environment variables (if needed):**
- `VITE_API_URL` - Your API URL (e.g., `https://earningsjr-api.smartdealmind.workers.dev`)
- `NODE_VERSION` - `20` (optional, Cloudflare usually detects this)

### Production Branch
- Set to: `main`

---

## Option 2: GitHub Actions Only (Current Setup)

If you prefer to use GitHub Actions (already configured):

1. **Disable Cloudflare Pages auto-build:**
   - Go to Pages → Settings → Builds & deployments
   - Disable "Automatic builds from Git"

2. **Deployments will happen via GitHub Actions:**
   - The `.github/workflows/deploy-pages.yml` workflow handles building and deploying
   - Triggers on pushes to `main` when `apps/web/**` changes

3. **Required GitHub Secrets:**
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `VITE_API_URL` (optional)

---

## Recommended: Option 1 (Direct Build)

For simplicity, use Option 1. Cloudflare Pages will:
- Automatically build on every push to `main`
- Handle caching and optimization
- Provide preview deployments for PRs

### Quick Setup Steps:

1. In Cloudflare Pages dashboard, go to your `earningsjr` project
2. Go to **Settings** → **Builds & deployments**
3. Update these fields:

   ```
   Framework preset: Vite (or None)
   Root directory: / (leave as root)
   Build command: pnpm install --frozen-lockfile && pnpm -C apps/web build
   Build output directory: apps/web/dist
   ```

4. Add environment variable (if needed):
   - `VITE_API_URL` = `https://earningsjr-api.smartdealmind.workers.dev`

5. Save and trigger a new deployment

---

## Troubleshooting

### Build fails with "pnpm: command not found"
- Cloudflare should auto-detect pnpm, but you can add:
  - Environment variable: `PNPM_VERSION` = `9.0.0`

### Build fails with "Cannot find module"
- Ensure root directory is `/` (not `apps/web`)
- The build command needs to run from root to access workspace dependencies

### Build succeeds but site shows 404
- Verify build output directory is exactly `apps/web/dist`
- Check that `index.html` exists in the output directory

### Preview deployments don't work
- Ensure the build command works from the root directory
- Check that all workspace dependencies are installed

