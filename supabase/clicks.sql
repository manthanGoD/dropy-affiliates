-- ─── Clicks tracking ─────────────────────────
CREATE TABLE clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  influencer_id UUID NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clicks_influencer ON clicks(influencer_id);
CREATE INDEX idx_clicks_date ON clicks(clicked_at DESC);

ALTER TABLE clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_all_clicks" ON clicks FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON public.clicks TO service_role;
