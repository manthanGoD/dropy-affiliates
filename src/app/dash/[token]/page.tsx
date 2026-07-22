'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';

interface DashboardData {
  influencer: {
    name: string;
    platform: string;
    handle: string | null;
    profile_image_url: string | null;
    discount_code: string;
    commission_pct: number;
    shareable_link: string;
    member_since: string;
  };
  stats: {
    all_time: { orders: number; revenue: number; commission: number };
    daily: { orders: number; revenue: number; commission: number };
    weekly: { orders: number; revenue: number; commission: number };
    monthly: { orders: number; revenue: number; commission: number };
  };
  recent_orders: { date: string; revenue: number; commission: number }[];
  payouts: { month: string; total_commission: number; paid: boolean; paid_date: string | null }[];
}

export default function InfluencerDashboard() {
  const params = useParams();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<'daily' | 'weekly' | 'monthly' | 'all_time'>('monthly');

  useEffect(() => {
    fetch(`/api/dashboard/${params.token}`)
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [params.token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-3">🔒</p>
          <p className="text-gray-900 font-medium">Dashboard not found</p>
          <p className="text-sm text-gray-500 mt-1">This link may be invalid or expired</p>
        </div>
      </div>
    );
  }

  const inf = data.influencer;
  const stats = data.stats[tab];
  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {inf.profile_image_url ? (
                <img src={inf.profile_image_url} alt={inf.name} className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-lg font-medium text-gray-500">
                  {inf.name.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="text-lg font-bold text-gray-900">{inf.name}</h1>
                <p className="text-sm text-gray-500">
                  {inf.handle ? `@${inf.handle} · ` : ''}{inf.platform} · {inf.commission_pct}% commission
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">D</span>
              </div>
              <span className="text-sm font-medium text-gray-700">Dropy</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Period Tabs */}
        <div className="flex gap-1 bg-white rounded-lg border border-gray-200 p-1">
          {(['daily', 'weekly', 'monthly', 'all_time'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                tab === t ? 'bg-black text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t === 'all_time' ? 'All Time' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
            <p className="text-3xl font-bold text-gray-900">{stats.orders}</p>
            <p className="text-xs text-gray-500 mt-1 font-medium uppercase tracking-wide">Orders</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
            <p className="text-3xl font-bold text-gray-900">{fmt(stats.revenue)}</p>
            <p className="text-xs text-gray-500 mt-1 font-medium uppercase tracking-wide">Revenue</p>
          </div>
          <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-5 text-center">
            <p className="text-3xl font-bold text-emerald-700">{fmt(stats.commission)}</p>
            <p className="text-xs text-emerald-600 mt-1 font-medium uppercase tracking-wide">Your Earnings</p>
          </div>
        </div>

        {/* Your Links */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-900">Your Links</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
              <div>
                <p className="text-xs text-gray-500">Shareable Link</p>
                <p className="text-sm font-mono text-gray-700 truncate max-w-md">{inf.shareable_link}</p>
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(inf.shareable_link)}
                className="text-xs text-gray-500 hover:text-gray-700 font-medium ml-3"
              >
                Copy
              </button>
            </div>
            <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
              <div>
                <p className="text-xs text-gray-500">Discount Code</p>
                <p className="text-sm font-mono font-bold text-gray-900">{inf.discount_code}</p>
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(inf.discount_code)}
                className="text-xs text-gray-500 hover:text-gray-700 font-medium ml-3"
              >
                Copy
              </button>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        {data.recent_orders.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Recent Orders</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {data.recent_orders.map((o, i) => (
                <div key={i} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-700">{format(new Date(o.date), 'dd MMM yyyy, h:mm a')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{fmt(o.revenue)}</p>
                    <p className="text-xs text-emerald-600">+{fmt(o.commission)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payout History */}
        {data.payouts.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Payout History</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {data.payouts.map((p, i) => (
                <div key={i} className="px-5 py-3 flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">{p.month}</p>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-medium">{fmt(p.total_commission)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      p.paid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {p.paid ? 'Paid' : 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-xs text-gray-400">
            Powered by <span className="font-medium">Dropy India</span> · Member since {format(new Date(inf.member_since), 'MMM yyyy')}
          </p>
        </div>
      </div>
    </div>
  );
}
