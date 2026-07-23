import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import * as XLSX from 'xlsx';

export async function GET() {
  try {
    // Fetch all influencers
    const { data: influencers } = await supabaseAdmin
      .from('influencers')
      .select('*')
      .order('created_at', { ascending: false });

    // Fetch all orders grouped by influencer
    const { data: orders } = await supabaseAdmin
      .from('orders')
      .select('*')
      .order('order_date', { ascending: false });

    // Fetch all payouts
    const { data: payouts } = await supabaseAdmin
      .from('payouts')
      .select('*')
      .order('month', { ascending: false });

    const wb = XLSX.utils.book_new();

    // ── Sheet 1: Influencer Summary ──
    const summaryRows = (influencers || []).map(inf => {
      const infOrders = (orders || []).filter(o => o.influencer_id === inf.id);
      const infPayouts = (payouts || []).filter(p => p.influencer_id === inf.id);
      const totalRevenue = infOrders.reduce((s, o) => s + Number(o.gross_revenue), 0);
      const totalDiscount = infOrders.reduce((s, o) => s + Number(o.discount_amount), 0);
      const totalCommission = infOrders.reduce((s, o) => s + Number(o.commission_amount), 0);
      const totalPaid = infPayouts.filter(p => p.paid).reduce((s, p) => s + Number(p.total_commission), 0);

      return {
        'Name': inf.name,
        'Platform': inf.platform,
        'Handle': inf.handle || '',
        'Discount Code': inf.discount_code,
        'Commission %': inf.commission_pct,
        'Status': inf.status,
        'Total Orders': infOrders.length,
        'Gross Revenue (₹)': totalRevenue,
        'Discounts Given (₹)': totalDiscount,
        'Total Commission (₹)': totalCommission,
        'Total Paid (₹)': totalPaid,
        'Outstanding (₹)': totalCommission - totalPaid,
        'Joined': new Date(inf.created_at).toLocaleDateString('en-IN'),
      };
    });

    const ws1 = XLSX.utils.json_to_sheet(summaryRows);
    ws1['!cols'] = [
      { wch: 15 }, { wch: 10 }, { wch: 18 }, { wch: 14 }, { wch: 12 },
      { wch: 8 }, { wch: 12 }, { wch: 16 }, { wch: 16 }, { wch: 18 },
      { wch: 14 }, { wch: 14 }, { wch: 12 },
    ];
    XLSX.utils.book_append_sheet(wb, ws1, 'Influencer Summary');

    // ── Sheet 2: All Orders ──
    const orderRows = (orders || []).map(o => {
      const inf = (influencers || []).find(i => i.id === o.influencer_id);
      return {
        'Influencer': inf?.name || 'Unknown',
        'Order #': o.shopify_order_number || o.shopify_order_id,
        'Date': new Date(o.order_date).toLocaleDateString('en-IN'),
        'Customer': o.customer_name || '',
        'Gross Revenue (₹)': Number(o.gross_revenue),
        'Discount (₹)': Number(o.discount_amount),
        'Net Revenue (₹)': Number(o.net_revenue),
        'Commission (₹)': Number(o.commission_amount),
        'Source': o.source,
      };
    });

    const ws2 = XLSX.utils.json_to_sheet(orderRows);
    ws2['!cols'] = [
      { wch: 15 }, { wch: 14 }, { wch: 12 }, { wch: 18 },
      { wch: 16 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 8 },
    ];
    XLSX.utils.book_append_sheet(wb, ws2, 'All Orders');

    // ── Sheet 3: Payouts ──
    const payoutRows = (payouts || []).map(p => {
      const inf = (influencers || []).find(i => i.id === p.influencer_id);
      return {
        'Influencer': inf?.name || 'Unknown',
        'Month': p.month,
        'Orders': p.total_orders,
        'Revenue (₹)': Number(p.total_revenue),
        'Commission (₹)': Number(p.total_commission),
        'Status': p.paid ? 'Paid' : 'Pending',
        'Paid Date': p.paid_date || '',
        'Payment Ref': p.payment_ref || '',
      };
    });

    const ws3 = XLSX.utils.json_to_sheet(payoutRows);
    ws3['!cols'] = [
      { wch: 15 }, { wch: 10 }, { wch: 8 }, { wch: 14 },
      { wch: 14 }, { wch: 8 }, { wch: 12 }, { wch: 20 },
    ];
    XLSX.utils.book_append_sheet(wb, ws3, 'Payouts');

    // Generate buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const date = new Date().toISOString().slice(0, 10);
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Dropy_Affiliates_Report_${date}.xlsx"`,
      },
    });
  } catch (err) {
    console.error('Report generation failed:', err);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
