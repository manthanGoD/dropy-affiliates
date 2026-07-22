'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Influencer, Order, Payout } from '@/types';
import { formatCurrency, getStatusColor, getDashboardUrl } from '@/lib/utils';
import { format } from 'date-fns';

interface InfluencerDetail extends Influencer {
  orders: Order[];
  payouts: Payout[];
  stats: {
    total_orders: number;
    total_revenue: number;
    total_discounts: number;
    total_net_revenue: number;
    total_commission: number;
  };
}

export default function InfluencerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<InfluencerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [copied, setCopied] = useState('');

  async function fetchData() {
    const res = await fetch(`/api/influencers/${params.id}`);
    if (!res.ok) { router.push('/admin'); return; }
    setData(await res.json());
    setLoading(false);
  }

  async function syncOrders() {
    setSyncing(true);
    await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ influencer_id: params.id }),
    });
    await fetchData();
    setSyncing(false);
  }

  async function copy(text: string, label: string) {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  }

  useEffect(() => { fetchData(); }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  const dashboardUrl = getDashboardUrl(data.dashboard_token);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/admin')} className="text-gray-400 hover:text-gray-600">
            ← 
          </button>
          {data.profile_image_url ? (
            <img src={data.profile_image_url} alt={data.name} className="w-14 h-14 rounded-full object-cover" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-xl font-medium text-gray-500">
              {data.name.charAt(0)}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">{data.name}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(data.status)}`}>
                {data.status}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              {data.handle ? `@${data.handle} · ` : ''}{data.platform} · {data.commission_pct}% commission
            </p>
          </div>
        </div>

        <button
          onClick={syncOrders}
          disabled={syncing}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          {syncing ? '⟳ Syncing...' : '⟳ Sync Orders'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Orders" value={String(data.stats.total_orders)} />
        <StatCard label="Gross Revenue" value={formatCurrency(data.stats.total_revenue)} />
        <StatCard label="Net Revenue" value={formatCurrency(data.stats.total_net_revenue)} />
        <StatCard label="Commission Owed" value={formatCurrency(data.stats.total_commission)} highlight />
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-3 gap-3">
        <QuickCopy label="Shareable Link" value={data.shareable_link || ''} copied={copied === 'link'} onCopy={() => copy(data.shareable_link || '', 'link')} />
        <QuickCopy label="Discount Code" value={data.discount_code} copied={copied === 'code'} onCopy={() => copy(data.discount_code, 'code')} />
        <QuickCopy label="Dashboard Link" value={dashboardUrl} copied={copied === 'dash'} onCopy={() => copy(dashboardUrl, 'dash')} />
      </div>

      {/* Orders Table */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Orders ({data.orders.length})</h2>
        {data.orders.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-500 text-sm">No orders yet. Click &quot;Sync Orders&quot; to pull from Shopify.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Order</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Discount</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{order.shopify_order_number || order.shopify_order_id}</td>
                    <td className="px-4 py-3 text-gray-500">{format(new Date(order.order_date), 'dd MMM yyyy')}</td>
                    <td className="px-4 py-3 text-gray-500">{order.customer_name || '—'}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(order.gross_revenue)}</td>
                    <td className="px-4 py-3 text-right text-red-600">-{formatCurrency(order.discount_amount)}</td>
                    <td className="px-4 py-3 text-right font-medium text-emerald-700">{formatCurrency(order.commission_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payouts */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Payouts</h2>
        {data.payouts.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-500 text-sm">No payouts recorded yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Month</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Commission</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Payment Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.payouts.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 font-medium">{p.month}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(p.total_commission)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.paid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {p.paid ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{p.payment_ref || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-5 ${highlight ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-200'}`}>
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${highlight ? 'text-emerald-700' : 'text-gray-900'}`}>{value}</p>
    </div>
  );
}

function QuickCopy({ label, value, copied, onCopy }: { label: string; value: string; copied: boolean; onCopy: () => void }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      <p className="text-xs text-gray-500 font-medium mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <p className="text-xs text-gray-700 font-mono truncate flex-1">{value}</p>
        <button onClick={onCopy} className="shrink-0 text-xs text-gray-400 hover:text-gray-600">
          {copied ? '✓' : '⎘'}
        </button>
      </div>
    </div>
  );
}
