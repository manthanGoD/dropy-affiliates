import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET — public dashboard data (no auth, just token)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  // Find influencer by dashboard token
  const { data: influencer, error } = await supabaseAdmin
    .from('influencers')
    .select('id, name, platform, handle, profile_image_url, commission_pct, discount_code, shareable_link, created_at')
    .eq('dashboard_token', token)
    .single();

  if (error || !influencer) {
    return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 });
  }

  // Fetch orders
  const { data: orders } = await supabaseAdmin
    .from('orders')
    .select('order_date, gross_revenue, discount_amount, net_revenue, commission_amount')
    .eq('influencer_id', influencer.id)
    .order('order_date', { ascending: false });

  // Fetch payouts
  const { data: payouts } = await supabaseAdmin
    .from('payouts')
    .select('month, total_commission, paid, paid_date')
    .eq('influencer_id', influencer.id)
    .order('month', { ascending: false });

  // Calculate stats
  const allOrders = orders || [];
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const dailyOrders = allOrders.filter(o => o.order_date.slice(0, 10) === today);
  const weeklyOrders = allOrders.filter(o => o.order_date >= weekAgo);
  const monthlyOrders = allOrders.filter(o => o.order_date >= monthStart);

  const calcStats = (arr: typeof allOrders) => ({
    orders: arr.length,
    revenue: arr.reduce((s, o) => s + Number(o.net_revenue), 0),
    commission: arr.reduce((s, o) => s + Number(o.commission_amount), 0),
  });

  return NextResponse.json({
    influencer: {
      name: influencer.name,
      platform: influencer.platform,
      handle: influencer.handle,
      profile_image_url: influencer.profile_image_url,
      discount_code: influencer.discount_code,
      commission_pct: influencer.commission_pct,
      shareable_link: influencer.shareable_link,
      member_since: influencer.created_at,
    },
    stats: {
      all_time: calcStats(allOrders),
      daily: calcStats(dailyOrders),
      weekly: calcStats(weeklyOrders),
      monthly: calcStats(monthlyOrders),
    },
    recent_orders: allOrders.slice(0, 20).map(o => ({
      date: o.order_date,
      revenue: Number(o.net_revenue),
      commission: Number(o.commission_amount),
    })),
    payouts: payouts || [],
  });
}
