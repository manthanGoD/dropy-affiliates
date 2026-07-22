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
  const [copiedField, setCopiedField] = useState('');

  useEffect(() => {
    fetch(`/api/dashboard/${params.token}`)
      .then(res => { if (!res.ok) throw new Error(); return res.json(); })
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [params.token]);

  function copyText(text: string, field: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(''), 2000);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="space-y-4 w-full max-w-lg px-6">
          <div className="skeleton h-16 rounded-2xl" />
          <div className="skeleton h-10 rounded-xl" />
          <div className="grid grid-cols-3 gap-3">
            {[1,2,3].map(i => <div key={i} className="skeleton h-24 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔒</span>
          </div>
          <p className="text-gray-900 font-medium text-sm">Dashboard not found</p>
          <p className="text-xs text-gray-400 mt-1">This link may be invalid or expired</p>
        </div>
      </div>
    );
  }

  const inf = data.influencer;
  const stats = data.stats[tab];
  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-5 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {inf.profile_image_url ? (
                <img src={inf.profile_image_url} alt={inf.name} className="w-11 h-11 rounded-full object-cover ring-2 ring-gray-100" />
              ) : (
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-base font-semibold text-gray-500">
                  {inf.name.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="text-base font-bold text-gray-900 tracking-tight">{inf.name}</h1>
                <p className="text-[11px] text-gray-400">
                  {inf.handle ? `@${inf.handle} · ` : ''}{inf.platform} · {inf.commission_pct}% commission
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-black rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-[10px]">D</span>
              </div>
              <span className="text-xs font-semibold text-gray-600 tracking-tight hidden sm:block">Dropy</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-6 space-y-5">
        {/* Period Tabs */}
        <div className="flex bg-white rounded-xl border border-gray-100 p-1">
          {(['daily', 'weekly', 'monthly', 'all_time'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all duration-200 ${
                tab === t ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              {t === 'all_time' ? 'All Time' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">{stats.orders}</p>
            <p className="text-[10px] text-gray-400 mt-1 font-medium uppercase tracking-widest">Orders</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">{fmt(stats.revenue)}</p>
            <p className="text-[10px] text-gray-400 mt-1 font-medium uppercase tracking-widest">Revenue</p>
          </div>
          <div className="bg-emerald-50/60 rounded-xl border border-emerald-100 p-4 text-center">
            <p className="text-2xl sm:text-3xl font-bold text-emerald-700 tracking-tight">{fmt(stats.commission)}</p>
            <p className="text-[10px] text-emerald-500 mt-1 font-medium uppercase tracking-widest">Earnings</p>
          </div>
        </div>

        {/* Your Links */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-2">
          <h2 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Your Links</h2>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between bg-gray-50/80 rounded-lg px-3 py-2.5">
              <div className="min-w-0 mr-3">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Link</p>
                <p className="text-xs font-mono text-gray-600 truncate">{inf.shareable_link}</p>
              </div>
              <button onClick={() => copyText(inf.shareable_link, 'link')} className="shrink-0 text-[11px] font-medium text-gray-400 hover:text-gray-700 transition-colors">
                {copiedField === 'link' ? '✓' : 'Copy'}
              </button>
            </div>
            <div className="flex items-center justify-between bg-gray-50/80 rounded-lg px-3 py-2.5">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Code</p>
                <p className="text-sm font-mono font-bold text-gray-900">{inf.discount_code}</p>
              </div>
              <button onClick={() => copyText(inf.discount_code, 'code')} className="text-[11px] font-medium text-gray-400 hover:text-gray-700 transition-colors">
                {copiedField === 'code' ? '✓' : 'Copy'}
              </button>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        {data.recent_orders.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50">
              <h2 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Recent Orders</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {data.recent_orders.map((o, i) => (
                <div key={i} className="px-4 py-3 flex items-center justify-between">
                  <p className="text-xs text-gray-500">{format(new Date(o.date), 'dd MMM yyyy, h:mm a')}</p>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-gray-900">{fmt(o.revenue)}</p>
                    <p className="text-[10px] text-emerald-600 font-medium">+{fmt(o.commission)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payout History */}
        {data.payouts.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50">
              <h2 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Payouts</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {data.payouts.map((p, i) => (
                <div key={i} className="px-4 py-3 flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-700">{p.month}</p>
                  <div className="flex items-center gap-3">
                    <p className="text-xs font-semibold text-gray-900">{fmt(p.total_commission)}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      p.paid ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
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
        <div className="text-center pt-4 pb-8">
          <p className="text-[10px] text-gray-300 uppercase tracking-widest">
            Powered by Dropy India · Since {format(new Date(inf.member_since), 'MMM yyyy')}
          </p>
        </div>
      </div>
    </div>
  );
}
