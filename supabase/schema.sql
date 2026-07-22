-- =============================================
-- DROPY AFFILIATES — Database Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Influencers ────────────────────────────
CREATE TABLE influencers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'instagram',
  handle TEXT,
  profile_image_url TEXT,
  
  -- Shopify campaign
  campaign_name TEXT NOT NULL,
  campaign_id TEXT,
  shopify_campaign_id TEXT,
  shareable_link TEXT,
  
  -- Discount
  discount_code TEXT NOT NULL,
  discount_type TEXT NOT NULL DEFAULT 'percentage', -- 'percentage' | 'fixed'
  discount_value NUMERIC NOT NULL DEFAULT 5,
  shopify_discount_id TEXT,
  
  -- Commission
  commission_pct NUMERIC NOT NULL DEFAULT 5,
  
  -- Dashboard
  dashboard_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  
  -- Payout
  payout_day INTEGER DEFAULT 1, -- Day of month
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'paused' | 'ended'
  notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Orders (synced from Shopify) ───────────
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  influencer_id UUID NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  shopify_order_id TEXT UNIQUE NOT NULL,
  shopify_order_number TEXT,
  order_date TIMESTAMPTZ NOT NULL,
  
  gross_revenue NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  net_revenue NUMERIC NOT NULL DEFAULT 0,
  commission_amount NUMERIC NOT NULL DEFAULT 0,
  
  customer_name TEXT,
  source TEXT DEFAULT 'code', -- 'code' | 'link'
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Payouts ────────────────────────────────
CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  influencer_id UUID NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- 'Jul-26', 'Aug-26'
  
  total_orders INTEGER DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0,
  total_commission NUMERIC DEFAULT 0,
  
  paid BOOLEAN DEFAULT FALSE,
  paid_date DATE,
  payment_ref TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(influencer_id, month)
);

-- ─── Indexes ────────────────────────────────
CREATE INDEX idx_orders_influencer ON orders(influencer_id);
CREATE INDEX idx_orders_date ON orders(order_date DESC);
CREATE INDEX idx_orders_shopify_id ON orders(shopify_order_id);
CREATE INDEX idx_payouts_influencer ON payouts(influencer_id);
CREATE INDEX idx_influencers_token ON influencers(dashboard_token);
CREATE INDEX idx_influencers_discount ON influencers(discount_code);

-- ─── Updated_at trigger ─────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_influencers_updated
  BEFORE UPDATE ON influencers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── RLS Policies ───────────────────────────
ALTER TABLE influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

-- Service role (API routes) can do everything
CREATE POLICY "service_all_influencers" ON influencers FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "service_all_orders" ON orders FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "service_all_payouts" ON payouts FOR ALL
  USING (true) WITH CHECK (true);

-- ─── View: influencer_stats ─────────────────
CREATE OR REPLACE VIEW influencer_stats AS
SELECT
  i.id,
  i.name,
  i.platform,
  i.handle,
  i.profile_image_url,
  i.campaign_name,
  i.discount_code,
  i.commission_pct,
  i.status,
  i.dashboard_token,
  i.shareable_link,
  i.created_at,
  COALESCE(COUNT(o.id), 0)::INTEGER AS total_orders,
  COALESCE(SUM(o.gross_revenue), 0) AS total_revenue,
  COALESCE(SUM(o.discount_amount), 0) AS total_discounts,
  COALESCE(SUM(o.net_revenue), 0) AS total_net_revenue,
  COALESCE(SUM(o.commission_amount), 0) AS total_commission
FROM influencers i
LEFT JOIN orders o ON o.influencer_id = i.id
GROUP BY i.id;
