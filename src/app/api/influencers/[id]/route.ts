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

// DELETE — remove influencer and related data
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Orders and payouts cascade-delete via FK
  const { error } = await supabaseAdmin
    .from('influencers')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
