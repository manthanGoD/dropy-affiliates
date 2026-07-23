import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET — single influencer with orders
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: influencer, error } = await supabaseAdmin
    .from('influencers')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !influencer) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { data: orders } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('influencer_id', id)
    .order('order_date', { ascending: false });

  const { data: payouts } = await supabaseAdmin
    .from('payouts')
    .select('*')
    .eq('influencer_id', id)
    .order('month', { ascending: false });

  // Calculate stats
  const totalOrders = orders?.length || 0;
  const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.gross_revenue), 0) || 0;
  const totalDiscounts = orders?.reduce((sum, o) => sum + Number(o.discount_amount), 0) || 0;
  const totalNetRevenue = orders?.reduce((sum, o) => sum + Number(o.net_revenue), 0) || 0;
  const totalCommission = orders?.reduce((sum, o) => sum + Number(o.commission_amount), 0) || 0;

  return NextResponse.json({
    ...influencer,
    orders: orders || [],
    payouts: payouts || [],
    stats: {
      total_orders: totalOrders,
      total_revenue: totalRevenue,
      total_discounts: totalDiscounts,
      total_net_revenue: totalNetRevenue,
      total_commission: totalCommission,
    },
  });
}

// PATCH — update influencer
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const { data, error } = await supabaseAdmin
    .from('influencers')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE — remove influencer, Shopify campaign + discount, and related data
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // 1. Get influencer details for Shopify cleanup
  const { data: inf } = await supabaseAdmin
    .from('influencers')
    .select('discount_code, shopify_campaign_id, campaign_id')
    .eq('id', id)
    .single();

  // 2. Delete Shopify discount (price rule) if exists
  if (inf?.discount_code) {
    try {
      // Find price rule by discount code
      const DOMAIN = process.env.SHOPIFY_STORE_DOMAIN!;
      const TOKEN = process.env.SHOPIFY_ACCESS_TOKEN!;
      const headers = { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': TOKEN };

      // Search for the price rule
      const prRes = await fetch(`https://${DOMAIN}/admin/api/2024-10/price_rules.json`, { headers });
      if (prRes.ok) {
        const prData = await prRes.json();
        const rule = prData.price_rules?.find((r: { title: string }) => r.title === inf.discount_code);
        if (rule) {
          await fetch(`https://${DOMAIN}/admin/api/2024-10/price_rules/${rule.id}.json`, { method: 'DELETE', headers });
          console.log(`[DELETE] Shopify price rule ${rule.id} deleted for ${inf.discount_code}`);
        }
      }
    } catch (err) {
      console.log('[DELETE] Shopify discount cleanup failed (non-blocking):', err);
    }
  }

  // 3. Delete Shopify marketing event if exists
  if (inf?.shopify_campaign_id) {
    try {
      const DOMAIN = process.env.SHOPIFY_STORE_DOMAIN!;
      const TOKEN = process.env.SHOPIFY_ACCESS_TOKEN!;
      await fetch(`https://${DOMAIN}/admin/api/2024-10/marketing_events/${inf.shopify_campaign_id}.json`, {
        method: 'DELETE',
        headers: { 'X-Shopify-Access-Token': TOKEN },
      });
      console.log(`[DELETE] Shopify campaign ${inf.shopify_campaign_id} deleted`);
    } catch (err) {
      console.log('[DELETE] Shopify campaign cleanup failed (non-blocking):', err);
    }
  }

  // 4. Delete from Supabase (orders + payouts cascade)
  const { error } = await supabaseAdmin
    .from('influencers')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
