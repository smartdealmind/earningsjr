-- Add subscription fields to Family table
ALTER TABLE Family ADD COLUMN stripe_customer_id TEXT;
ALTER TABLE Family ADD COLUMN stripe_subscription_id TEXT;
ALTER TABLE Family ADD COLUMN subscription_status TEXT CHECK(subscription_status IN ('free', 'trialing', 'active', 'past_due', 'canceled', 'unpaid')) DEFAULT 'free';
ALTER TABLE Family ADD COLUMN subscription_plan TEXT; -- e.g., 'premium_monthly', 'premium_yearly'
ALTER TABLE Family ADD COLUMN subscription_current_period_end INTEGER; -- Unix timestamp
ALTER TABLE Family ADD COLUMN subscription_trial_end INTEGER; -- Unix timestamp, null if no trial

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_family_stripe_customer ON Family(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_family_subscription_status ON Family(subscription_status);

