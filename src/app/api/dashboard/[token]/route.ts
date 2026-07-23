import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

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

  // Fetch clicks
  const { data: clicks } = await supabaseAdmin
    .from('clicks')
    .select('clicked_at')
    .eq('influencer_id', influencer.id);

  const allOrders = orders || [];
  const allClicks = clicks || [];
  const allPayouts = payouts || [];
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const filterOrders = (since: string) => allOrders.filter(o => o.order_date >= since);
  const filterClicks = (since: string) => allClicks.filter(c => c.clicked_at >= since);

  const calcStats = (orderArr: typeof allOrders, clickArr: typeof allClicks) => ({
    clicks: clickArr.length,
    orders: orderArr.length,
    revenue: orderArr.reduce((s, o) => s + Number(o.net_revenue), 0),
    commission: orderArr.reduce((s, o) => s + Number(o.commission_amount), 0),
  });

  // Build daily chart data (last 14 days)
  const chartData = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayLabel = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

    const dayClicks = allClicks.filter(c => c.clicked_at.slice(0, 10) === dateStr).length;
    const dayOrders = allOrders.filter(o => o.order_date.slice(0, 10) === dateStr);
    const dayCommission = dayOrders.reduce((s, o) => s + Number(o.commission_amount), 0);

    chartData.push({
      date: dayLabel,
      clicks: dayClicks,
      orders: dayOrders.length,
      commission: dayCommission,
    });
  }

  // Payout/redeem stats
  const totalCommission = allOrders.reduce((s, o) => s + Number(o.commission_amount), 0);
  const totalPaid = allPayouts.filter(p => p.paid).reduce((s, p) => s + Number(p.total_commission), 0);

  // Build the tracking URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dropy-affiliates.vercel.app';
  const trackingLink = `${appUrl}/go/${influencer.discount_code}`;

  return NextResponse.json({
    influencer: {
      name: influencer.name,
      platform: influencer.platform,
      handle: influencer.handle,
      profile_image_url: influencer.profile_image_url,
      discount_code: influencer.discount_code,
      commission_pct: influencer.commission_pct,
      shareable_link: trackingLink,
      original_link: influencer.shareable_link,
      member_since: influencer.created_at,
    },
    stats: {
      all_time: calcStats(allOrders, allClicks),
      daily: calcStats(allOrders.filter(o => o.order_date.slice(0, 10) === today), allClicks.filter(c => c.clicked_at.slice(0, 10) === today)),
      weekly: calcStats(filterOrders(weekAgo), filterClicks(weekAgo)),
      monthly: calcStats(filterOrders(monthStart), filterClicks(monthStart)),
    },
    chart: chartData,
    redeem: {
      total_earned: totalCommission,
      total_paid: totalPaid,
      pending: totalCommission - totalPaid,
    },
    recent_orders: allOrders.slice(0, 20).map(o => ({
      date: o.order_date,
      revenue: Number(o.net_revenue),
      commission: Number(o.commission_amount),
    })),
    payouts: allPayouts,
  });
}
