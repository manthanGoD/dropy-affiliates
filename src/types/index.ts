export interface Influencer {
  id: string;
  name: string;
  platform: string;
  handle: string | null;
  profile_image_url: string | null;
  campaign_name: string;
  campaign_id: string | null;
  shopify_campaign_id: string | null;
  shareable_link: string | null;
  discount_code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  shopify_discount_id: string | null;
  commission_pct: number;
  dashboard_token: string;
  payout_day: number;
  status: 'active' | 'paused' | 'ended';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InfluencerStats extends Influencer {
  total_orders: number;
  total_revenue: number;
  total_discounts: number;
  total_net_revenue: number;
  total_commission: number;
}

export interface Order {
  id: string;
  influencer_id: string;
  shopify_order_id: string;
  shopify_order_number: string | null;
  order_date: string;
  gross_revenue: number;
  discount_amount: number;
  net_revenue: number;
  commission_amount: number;
  customer_name: string | null;
  source: 'code' | 'link';
  created_at: string;
}

export interface Payout {
  id: string;
  influencer_id: string;
  month: string;
  total_orders: number;
  total_revenue: number;
  total_commission: number;
  paid: boolean;
  paid_date: string | null;
  payment_ref: string | null;
  created_at: string;
}

export interface AddInfluencerForm {
  name: string;
  platform: string;
  handle: string;
  profile_image_url: string;
  discount_code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  commission_pct: number;
  payout_day: number;
  notes: string;
}

export interface ShopifyCampaignResult {
  campaign_id: string;
  shareable_link: string;
}

export interface ShopifyDiscountResult {
  discount_id: string;
  code: string;
}
