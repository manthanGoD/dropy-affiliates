import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const SHOPIFY_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN!;
const SHOPIFY_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN!;

// GET — find Shopify discount codes not tracked in our tool
export async function GET() {
  try {
    // Fetch all price rules from Shopify
    const res = await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/2024-10/price_rules.json?limit=250`, {
      headers: { 'X-Shopify-Access-Token': SHOPIFY_TOKEN },
    });
    const data = await res.json();
    const priceRules = data.price_rules || [];

    // Fetch all discount codes for each price rule
    const shopifyCodes: { code: string; value: string; value_type: string; title: string; id: string }[] = [];
    for (const rule of priceRules) {
      const codeRes = await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/2024-10/price_rules/${rule.id}/discount_codes.json`, {
        headers: { 'X-Shopify-Access-Token': SHOPIFY_TOKEN },
      });
      const codeData = await codeRes.json();
      for (const dc of codeData.discount_codes || []) {
        shopifyCodes.push({
          code: dc.code,
          value: rule.value,
          value_type: rule.value_type,
          title: rule.title,
          id: String(rule.id),
        });
      }
    }

    // Fetch existing influencers from Supabase
    const { data: existing } = await supabaseAdmin
      .from('influencers')
      .select('discount_code');

    const trackedCodes = new Set((existing || []).map(e => e.discount_code.toUpperCase()));

    // Find untracked codes
    const untracked = shopifyCodes.filter(c => !trackedCodes.has(c.code.toUpperCase()));

    return NextResponse.json({
      total_shopify: shopifyCodes.length,
      tracked: trackedCodes.size,
      untracked: untracked.map(c => ({
        code: c.code,
        discount: c.value_type === 'percentage' ? `${Math.abs(parseFloat(c.value))}%` : `₹${Math.abs(parseFloat(c.value))}`,
        value: Math.abs(parseFloat(c.value)),
        value_type: c.value_type === 'percentage' ? 'percentage' : 'fixed',
        title: c.title,
        price_rule_id: c.id,
      })),
    });
  } catch (err) {
    console.error('Import scan failed:', err);
    return NextResponse.json({ error: 'Failed to scan Shopify' }, { status: 500 });
  }
}

// POST — import a Shopify discount code into the tool
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, name, platform, commission_pct, discount_value, discount_type } = body;

    const { data, error } = await supabaseAdmin
      .from('influencers')
      .insert({
        name: name || code,
        platform: platform || 'instagram',
        discount_code: code.toUpperCase(),
        discount_type: discount_type || 'percentage',
        discount_value: discount_value || 0,
        commission_pct: commission_pct || 5,
        campaign_name: `${name || code} - Imported`,
        shareable_link: `https://dropy.in/discount/${code.toUpperCase()}`,
        status: 'active',
        payout_day: 1,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Import failed' }, { status: 500 });
  }
}
