-- Reset all kid points to 0 and remove duplicate weekly allowances
-- Run this via: npx wrangler d1 execute earningsjr_db --file=reset-points.sql

-- Step 1: Reset all kid balances to 0
UPDATE KidProfile SET points_balance = 0;

-- Step 2: Delete all weekly_allowance entries from today (2025-12-27)
-- These are the duplicate entries that were created every 15 minutes
DELETE FROM PointsLedger 
WHERE reason = 'weekly_allowance' 
AND created_at >= 1735315200000; -- 2025-12-27 00:00:00 UTC

-- Step 3: Verify (optional - check results)
-- SELECT user_id, display_name, points_balance FROM KidProfile;
-- SELECT COUNT(*) as deleted_entries FROM PointsLedger WHERE reason = 'weekly_allowance';

