import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import * as XLSX from 'xlsx';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: inf } = await supabaseAdmin
      .from('influencers')
      .select('*')
      .eq('id', id)
      .single();

    if (!inf) {
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

    const wb = XLSX.utils.book_new();

    // ── Sheet 1: Overview ──
    const totalRevenue = (orders || []).reduce((s, o) => s + Number(o.gross_revenue), 0);
    const totalDiscount = (orders || []).reduce((s, o) => s + Number(o.discount_amount), 0);
    const totalCommission = (orders || []).reduce((s, o) => s + Number(o.commission_amount), 0);
    const totalPaid = (payouts || []).filter(p => p.paid).reduce((s, p) => s + Number(p.total_commission), 0);

    const overviewData = [
      { 'Field': 'Name', 'Value': inf.name },
      { 'Field': 'Platform', 'Value': inf.platform },
      { 'Field': 'Handle', 'Value': inf.handle || '' },
      { 'Field': 'Discount Code', 'Value': inf.discount_code },
      { 'Field': 'Commission %', 'Value': `${inf.commission_pct}%` },
      { 'Field': 'Status', 'Value': inf.status },
      { 'Field': 'Joined', 'Value': new Date(inf.created_at).toLocaleDateString('en-IN') },
      { 'Field': '', 'Value': '' },
      { 'Field': 'Total Orders', 'Value': (orders || []).length },
      { 'Field': 'Gross Revenue', 'Value': `₹${totalRevenue.toLocaleString('en-IN')}` },
      { 'Field': 'Discounts Given', 'Value': `₹${totalDiscount.toLocaleString('en-IN')}` },
      { 'Field': 'Total Commission', 'Value': `₹${totalCommission.toLocaleString('en-IN')}` },
      { 'Field': 'Total Paid', 'Value': `₹${totalPaid.toLocaleString('en-IN')}` },
      { 'Field': 'Outstanding', 'Value': `₹${(totalCommission - totalPaid).toLocaleString('en-IN')}` },
    ];

    const ws1 = XLSX.utils.json_to_sheet(overviewData);
    ws1['!cols'] = [{ wch: 18 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, ws1, 'Overview');

    // ── Sheet 2: Orders ──
    const orderRows = (orders || []).map(o => ({
      'Order #': o.shopify_order_number || o.shopify_order_id,
      'Date': new Date(o.order_date).toLocaleDateString('en-IN'),
      'Customer': o.customer_name || '',
      'Gross Revenue (₹)': Number(o.gross_revenue),
      'Discount (₹)': Number(o.discount_amount),
      'Net Revenue (₹)': Number(o.net_revenue),
      'Commission (₹)': Number(o.commission_amount),
    }));

    const ws2 = XLSX.utils.json_to_sheet(orderRows);
    ws2['!cols'] = [
      { wch: 14 }, { wch: 12 }, { wch: 18 },
      { wch: 16 }, { wch: 12 }, { wch: 14 }, { wch: 14 },
    ];
    XLSX.utils.book_append_sheet(wb, ws2, 'Orders');

    // ── Sheet 3: Payouts ──
    const payoutRows = (payouts || []).map(p => ({
      'Month': p.month,
      'Orders': p.total_orders,
      'Revenue (₹)': Number(p.total_revenue),
      'Commission (₹)': Number(p.total_commission),
      'Status': p.paid ? 'Paid' : 'Pending',
      'Paid Date': p.paid_date || '',
      'Payment Ref': p.payment_ref || '',
    }));

    const ws3 = XLSX.utils.json_to_sheet(payoutRows);
    ws3['!cols'] = [
      { wch: 10 }, { wch: 8 }, { wch: 14 },
      { wch: 14 }, { wch: 8 }, { wch: 12 }, { wch: 20 },
    ];
    XLSX.utils.book_append_sheet(wb, ws3, 'Payouts');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const safeName = inf.name.replace(/[^a-zA-Z0-9]/g, '_');
    const date = new Date().toISOString().slice(0, 10);

    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${safeName}_Report_${date}.xlsx"`,
      },
    });
  } catch (err) {
    console.error('Report generation failed:', err);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
