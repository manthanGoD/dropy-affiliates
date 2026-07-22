import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { fetchOrdersByDiscount } from '@/lib/shopify';

// POST — sync orders from Shopify for one or all influencers
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const influencerId = body.influencer_id;

    // Get influencers to sync
    let query = supabaseAdmin.from('influencers').select('id, discount_code, commission_pct');
    if (influencerId) {
      query = query.eq('id', influencerId);
    } else {
      query = query.eq('status', 'active');
    }

    const { data: influencers, error } = await query;
    if (error || !influencers?.length) {
      return NextResponse.json({ error: 'No influencers found' }, { status: 404 });
    }

    let totalSynced = 0;

    for (const inf of influencers) {
      try {
        const shopifyOrders = await fetchOrdersByDiscount(inf.discount_code);

        for (const order of shopifyOrders) {
          const orderId = order.id.replace('gid://shopify/Order/', '');
          const grossRevenue = parseFloat(order.totalPriceSet.shopMoney.amount);
          const discountAmount = parseFloat(order.totalDiscountsSet.shopMoney.amount);
          const netRevenue = grossRevenue;
          const commissionAmount = netRevenue * (inf.commission_pct / 100);

          const { error: upsertError } = await supabaseAdmin
            .from('orders')
            .upsert(
              {
                shopify_order_id: orderId,
                influencer_id: inf.id,
                shopify_order_number: order.name,
                order_date: order.createdAt,
                gross_revenue: grossRevenue,
                discount_amount: discountAmount,
                net_revenue: netRevenue,
                commission_amount: commissionAmount,
                customer_name: order.customer?.displayName || null,
                source: 'code',
              },
              { onConflict: 'shopify_order_id' }
            );

          if (!upsertError) totalSynced++;
        }
      } catch (err) {
        console.error(`Sync failed for ${inf.discount_code}:`, err);
      }
    }

    return NextResponse.json({
      synced: totalSynced,
      influencers_processed: influencers.length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Sync failed' },
      { status: 500 }
    );
  }
}
