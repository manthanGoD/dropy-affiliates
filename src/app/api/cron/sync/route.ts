import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { fetchOrdersByDiscount } from '@/lib/shopify';

export const maxDuration = 30;

export async function GET(req: NextRequest) {
  // Verify cron secret (prevents random hits)
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: influencers } = await supabaseAdmin
      .from('influencers')
      .select('id, discount_code, commission_pct')
      .eq('status', 'active');

    if (!influencers?.length) {
      return NextResponse.json({ message: 'No active influencers', synced: 0 });
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

          const { error } = await supabaseAdmin
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

          if (!error) totalSynced++;
        }
      } catch (err) {
        console.error(`Cron sync failed for ${inf.discount_code}:`, err);
      }
    }

    console.log(`[CRON] Synced ${totalSynced} orders across ${influencers.length} influencers`);

    return NextResponse.json({
      synced: totalSynced,
      influencers: influencers.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[CRON] Sync failed:', err);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
