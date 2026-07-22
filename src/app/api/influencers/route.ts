import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createCampaign, createDiscountCode } from '@/lib/shopify';
import { generateCampaignName } from '@/lib/utils';

// GET — list all influencers with stats
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('influencer_stats')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
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
    } = body;

    // 1. Generate campaign name
    const campaignName = generateCampaignName(name, platform);

    // 2. Create Shopify campaign
    let campaignResult = { campaign_id: '', shareable_link: '' };
    try {
      campaignResult = await createCampaign(campaignName);
    } catch (err) {
      console.error('Campaign creation failed (non-blocking):', err);
      // Generate manual UTM link as fallback
      const utmCampaign = name.toLowerCase().replace(/\s+/g, '-');
      campaignResult = {
        campaign_id: utmCampaign,
        shareable_link: `https://dropy.in?utm_campaign=${utmCampaign}&utm_source=influencer&utm_medium=social`,
      };
    }

    // 3. Create Shopify discount code
    let discountResult = { discount_id: '', code: discount_code };
    try {
      discountResult = await createDiscountCode(discount_code, discount_type, discount_value);
    } catch (err) {
      console.error('Discount creation failed:', err);
      // Continue — admin can create manually in Shopify
    }

    // 4. Build discount link (auto-applies discount + tracks campaign)
    const discountLink = `https://dropy.in/discount/${discount_code.toUpperCase()}?utm_campaign=${campaignResult.campaign_id}&utm_source=influencer&utm_medium=social`;

    // 5. Save to Supabase
    const { data, error } = await supabaseAdmin
      .from('influencers')
      .insert({
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
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error('Failed to create influencer:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
