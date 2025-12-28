#!/bin/bash

# Stripe Setup Script for EarningsJr
# This script helps you create the necessary Stripe products and prices

set -e

echo "🎯 EarningsJr Stripe Setup"
echo "=========================="
echo ""
echo "This script will help you create:"
echo "  1. Premium Product"
echo "  2. Monthly Price ($9.99/month)"
echo "  3. Yearly Price ($99/year)"
echo ""

# Check if Stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    echo "❌ Stripe CLI not found!"
    echo ""
    echo "Please install it first:"
    echo "  macOS: brew install stripe/stripe-cli/stripe"
    echo "  Linux: See https://stripe.com/docs/stripe-cli"
    echo ""
    exit 1
fi

# Check if logged in
if ! stripe config --list &> /dev/null; then
    echo "⚠️  Not logged in to Stripe CLI"
    echo "Running: stripe login"
    stripe login
fi

echo "📦 Step 1: Creating Premium Product..."
PRODUCT_OUTPUT=$(stripe products create \
  --name="EarningsJr Premium" \
  --description="Unlimited kids, chores, goals, and achievements for families" \
  --expand=default_price 2>&1)

PRODUCT_ID=$(echo "$PRODUCT_OUTPUT" | grep -o 'prod_[a-zA-Z0-9]*' | head -1)

if [ -z "$PRODUCT_ID" ]; then
    echo "❌ Failed to create product"
    echo "$PRODUCT_OUTPUT"
    exit 1
fi

echo "✅ Product created: $PRODUCT_ID"
echo ""

echo "💰 Step 2: Creating Monthly Price ($9.99/month)..."
MONTHLY_OUTPUT=$(stripe prices create \
  --product="$PRODUCT_ID" \
  --unit-amount=999 \
  --currency=usd \
  --recurring[interval]=month 2>&1)

MONTHLY_PRICE_ID=$(echo "$MONTHLY_OUTPUT" | grep -o 'price_[a-zA-Z0-9]*' | head -1)

if [ -z "$MONTHLY_PRICE_ID" ]; then
    echo "❌ Failed to create monthly price"
    echo "$MONTHLY_OUTPUT"
    exit 1
fi

echo "✅ Monthly price created: $MONTHLY_PRICE_ID"
echo ""

echo "💰 Step 3: Creating Yearly Price ($99/year)..."
YEARLY_OUTPUT=$(stripe prices create \
  --product="$PRODUCT_ID" \
  --unit-amount=9900 \
  --currency=usd \
  --recurring[interval]=year 2>&1)

YEARLY_PRICE_ID=$(echo "$YEARLY_OUTPUT" | grep -o 'price_[a-zA-Z0-9]*' | head -1)

if [ -z "$YEARLY_PRICE_ID" ]; then
    echo "❌ Failed to create yearly price"
    echo "$YEARLY_OUTPUT"
    exit 1
fi

echo "✅ Yearly price created: $YEARLY_PRICE_ID"
echo ""

echo "📋 Summary"
echo "=========="
echo "Product ID: $PRODUCT_ID"
echo "Monthly Price ID: $MONTHLY_PRICE_ID"
echo "Yearly Price ID: $YEARLY_PRICE_ID"
echo ""

echo "🔑 Next Steps:"
echo "1. Add to GitHub Secrets (Settings → Secrets → Actions):"
echo "   - VITE_STRIPE_PRICE_ID_MONTHLY = $MONTHLY_PRICE_ID"
echo "   - VITE_STRIPE_PRICE_ID_YEARLY = $YEARLY_PRICE_ID"
echo ""
echo "2. Get your API keys from: https://dashboard.stripe.com/test/apikeys"
echo "   - Add VITE_STRIPE_PUBLISHABLE_KEY to GitHub Secrets"
echo "   - Add STRIPE_SECRET_KEY to Cloudflare Worker Secrets"
echo ""
echo "3. Create webhook endpoint:"
echo "   URL: https://api.earningsjr.com/stripe/webhook"
echo "   Events: checkout.session.completed, customer.subscription.*"
echo "   - Add STRIPE_WEBHOOK_SECRET to Cloudflare Worker Secrets"
echo ""

echo "✅ Setup complete!"

