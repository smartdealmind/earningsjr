#!/bin/bash
# Reset all kid points to 0

echo "⚠️  WARNING: This will reset ALL kid points to 0!"
echo "Press Ctrl+C to cancel, or Enter to continue..."
read

echo "Resetting all kid balances to 0..."
npx wrangler d1 execute earningsjr_db --command "UPDATE KidProfile SET points_balance = 0;"

echo "Deleting duplicate weekly_allowance entries from today..."
# Delete entries from today (2025-12-27)
npx wrangler d1 execute earningsjr_db --command "DELETE FROM PointsLedger WHERE reason = 'weekly_allowance' AND created_at >= 1735315200000;"

echo "✅ Done! All points reset to 0."
echo ""
echo "Verifying..."
npx wrangler d1 execute earningsjr_db --command "SELECT user_id, display_name, points_balance FROM KidProfile;"
