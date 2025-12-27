# Create R2 Bucket for EarningsJr

## Error
```
R2 bucket 'earningsjr-assets' not found. Please use a different name and try again.
```

## Solution: Create the R2 Bucket

### Option 1: Via Cloudflare Dashboard (Recommended)

1. **Go to Cloudflare Dashboard:**
   - Navigate to: https://dash.cloudflare.com
   - Go to: **Workers & Pages** → **R2**

2. **Create Bucket:**
   - Click **"Create bucket"** button
   - Enter bucket name: `earningsjr-assets`
   - Click **"Create bucket"**

3. **Verify:**
   - The bucket should appear in your R2 bucket list
   - No additional configuration needed - the Worker will automatically have access

### Option 2: Via Wrangler CLI

```bash
cd workers/api
npx wrangler r2 bucket create earningsjr-assets
```

## After Creating the Bucket

1. **Redeploy the Worker:**
   - The deployment should now succeed
   - Or push a new commit to trigger GitHub Actions

2. **Verify Access:**
   - The Worker can now read/write to the bucket
   - Used for storing user-uploaded assets, images, etc.

## Bucket Configuration

The bucket is already configured in `wrangler.toml`:
```toml
[[r2_buckets]]
binding = "ASSETS"
bucket_name = "earningsjr-assets"
```

Once the bucket exists, the Worker will automatically have access to it via the `ASSETS` binding.

## Troubleshooting

### Bucket name already taken?
- Try: `earningsjr-assets-production`
- Or: `earningsjr-assets-1`
- Update `wrangler.toml` with the new name

### Still getting errors?
- Verify the bucket exists in Cloudflare Dashboard
- Check that you're using the correct account
- Ensure the bucket name matches exactly (case-sensitive)

