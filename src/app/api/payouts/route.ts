import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// POST — create or update a payout record
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { influencer_id, month, total_orders, total_revenue, total_commission, paid, paid_date, payment_ref } = body;

    const { data, error } = await supabaseAdmin
      .from('payouts')
      .upsert(
        {
          influencer_id,
          month,
          total_orders: total_orders || 0,
          total_revenue: total_revenue || 0,
          total_commission: total_commission || 0,
          paid: paid || false,
          paid_date: paid_date || null,
          payment_ref: payment_ref || null,
        },
        { onConflict: 'influencer_id,month' }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
