import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createCampaign, createDiscountCode } from '@/lib/shopify';
import { generateCampaignName } from '@/lib/utils';

// GET — list all influencers with stats
export async function GET() {
  // Try the view first, fall back to base table
  let { data, error } = await supabaseAdmin
    .from('influencer_stats')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('View query failed, falling back to base table:', error.message);
    const fallback = await supabaseAdmin
      .from('influencers')
      .select('*')
      .order('created_at', { ascending: false });

    if (fallback.error) {
      return NextResponse.json({ error: fallback.error.message }, { status: 500 });
    }

    // Add zero stats to each influencer
    data = (fallback.data || []).map(inf => ({
      ...inf,
      total_orders: 0,
      total_revenue: 0,
      total_discounts: 0,
      total_net_revenue: 0,
      total_commission: 0,
    }));
  }

  return NextResponse.json(data || []);
}

// POST — add new influencer + create Shopify campaign & discount
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      platform,
      handle,
      profile_image_url,
      discount_code,
      discount_type,
      discount_value,
      commission_pct,
      payout_day,
      notes,
      combines_product,
      combines_order,
      combines_shipping,
    } = body;

    console.log('[1] Starting influencer creation for:', name);

    // 1. Generate campaign name
    const campaignName = generateCampaignName(name, platform);
    console.log('[2] Campaign name:', campaignName);

    // 2. Create Shopify campaign
    let campaignResult = { campaign_id: '', shareable_link: '' };
    try {
      campaignResult = await createCampaign(campaignName);
      console.log('[3] Shopify campaign created:', campaignResult.campaign_id);
    } catch (err) {
      console.log('[3] Campaign creation failed (using fallback):', (err as Error).message);
      const utmCampaign = name.toLowerCase().replace(/\s+/g, '-');
      campaignResult = {
        campaign_id: utmCampaign,
        shareable_link: `https://dropy.in?utm_campaign=${utmCampaign}&utm_source=influencer&utm_medium=social`,
      };
    }

    // 3. Create Shopify discount code (skip if no customer discount)
    let discountResult = { discount_id: '', code: discount_code };
    if (discount_value > 0) {
      try {
        discountResult = await createDiscountCode(discount_code, discount_type, discount_value, {
          productDiscounts: combines_product ?? true,
          orderDiscounts: combines_order ?? false,
          shippingDiscounts: combines_shipping ?? false,
        });
        console.log('[4] Shopify discount created:', discountResult.code);
      } catch (err) {
        console.log('[4] Discount creation failed (using fallback):', (err as Error).message);
      }
    } else {
      console.log('[4] No customer discount — skipping Shopify discount creation');
    }

    // 4. Build shareable link
    const discountLink = discount_value > 0
      ? `https://dropy.in/discount/${discount_code.toUpperCase()}?utm_campaign=${campaignResult.campaign_id}&utm_source=influencer&utm_medium=social`
      : `https://dropy.in?utm_campaign=${campaignResult.campaign_id}&utm_source=influencer&utm_medium=social`;
    console.log('[5] Shareable link:', discountLink);

    // 5. Save to Supabase
    const insertPayload = {
      name,
      platform,
      handle: handle || null,
      profile_image_url: profile_image_url || null,
      campaign_name: campaignName,
      campaign_id: campaignResult.campaign_id,
      shareable_link: discountLink,
      discount_code: discount_code.toUpperCase(),
      discount_type,
      discount_value,
      shopify_discount_id: discountResult.discount_id || null,
      commission_pct,
      payout_day: payout_day || 1,
      notes: notes || null,
    };
    console.log('[6] Inserting to Supabase:', JSON.stringify(insertPayload));

    const { data, error } = await supabaseAdmin
      .from('influencers')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error('[7] SUPABASE INSERT FAILED:', error.message, error.details, error.hint);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('[7] SUCCESS — influencer saved:', data.id);
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error('[FATAL] Unhandled error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
