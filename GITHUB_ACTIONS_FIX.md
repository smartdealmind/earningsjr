# GitHub Actions Deployment Fix

## ✅ Fixed Issues

1. **Added permissions** to workflows for GitHub deployments
2. **Updated path filters** to include dependency files
3. **Created alternative workflow** for always-deploy option

## Current Workflow Setup

### Option 1: Smart Deploy (Current - Recommended)
- **`deploy-pages.yml`**: Deploys Pages when `apps/web/**` changes
- **`deploy-workers.yml`**: Deploys Workers when `workers/api/**` changes
- **Benefits**: Only deploys what changed, saves build time

### Option 2: Always Deploy (Alternative)
- **`deploy-all.yml`**: Deploys both Pages and Workers on every push to main
- **Benefits**: Simple, always in sync
- **Note**: You can disable the individual workflows and use this one instead

## Permissions Fix

Added `permissions` block to workflows:
```yaml
permissions:
  contents: read
  deployments: write  # Required for GitHub deployment status
```

This fixes the "Resource not accessible by integration" error.

## How to Use

### Current Setup (Smart Deploy)
- Push changes to `apps/web/**` → Pages deploys automatically
- Push changes to `workers/api/**` → Workers deploys automatically
- Both workflows run in parallel if both paths change

### Alternative Setup (Always Deploy)
1. Go to: `.github/workflows/`
2. Disable `deploy-pages.yml` and `deploy-workers.yml` (rename to `.yml.disabled`)
3. Use `deploy-all.yml` instead
4. Every push to main will deploy both

## Troubleshooting

### Still getting "Resource not accessible" error?

**Option A: Remove GitHub deployment status (simpler)**
Edit `.github/workflows/deploy-pages.yml`:
```yaml
- name: Deploy to Cloudflare Pages
  uses: cloudflare/pages-action@v1
  with:
    # ... other settings ...
    # Remove or comment out this line:
    # gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

**Option B: Check repository settings**
1. Go to: Repository → Settings → Actions → General
2. Under "Workflow permissions", ensure:
   - "Read and write permissions" is selected
   - Or "Read repository contents and packages permissions" with "Allow GitHub Actions to create and approve pull requests" checked

### Workflows not triggering?

1. **Check path filters**: Workflows only trigger when specified paths change
2. **Check branch**: Must be `main` branch
3. **Manual trigger**: Use "workflow_dispatch" to test manually

### Want to deploy everything always?

Use `deploy-all.yml` workflow instead. It deploys both on every push to main.

## Verification

After pushing these changes:
1. Check GitHub Actions tab
2. Workflows should run successfully
3. Check Cloudflare Dashboard for deployments
4. Verify sites are live

## Next Steps

1. ✅ Permissions are fixed
2. ✅ Workflows are configured
3. 🔄 Push a test commit to verify auto-deployment works
4. 🎉 Your deployments should now work automatically!

