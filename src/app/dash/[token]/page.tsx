'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';

interface DashboardData {
  influencer: { name: string; platform: string; handle: string | null; profile_image_url: string | null; discount_code: string; commission_pct: number; shareable_link: string; member_since: string; };
  stats: { all_time: S; daily: S; weekly: S; monthly: S; };
  recent_orders: { date: string; revenue: number; commission: number }[];
  payouts: { month: string; total_commission: number; paid: boolean; paid_date: string | null }[];
}
type S = { orders: number; revenue: number; commission: number };

export default function InfluencerDashboard() {
  const params = useParams();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<'daily' | 'weekly' | 'monthly' | 'all_time'>('monthly');
  const [copied, setCopied] = useState('');

  useEffect(() => {
    fetch(`/api/dashboard/${params.token}`)
      .then(r => { if (!r.ok) throw 0; return r.json(); })
      .then(setData).catch(() => setError(true)).finally(() => setLoading(false));
  }, [params.token]);

  function cp(t: string, l: string) { navigator.clipboard.writeText(t); setCopied(l); setTimeout(() => setCopied(''), 2000); }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#fafaf8' }}>
      <div className="space-y-4 w-full max-w-lg px-6">
        <div className="skeleton h-16 rounded-2xl" /><div className="skeleton h-12 rounded-xl" />
        <div className="grid grid-cols-3 gap-3">{[1,2,3].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)}</div>
      </div>
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#fafaf8' }}>
      <div className="text-center"><p className="text-3xl mb-3">🔒</p><p className="font-semibold text-sm">Dashboard not found</p><p className="text-xs text-gray-400 mt-1">This link may be invalid</p></div>
    </div>
  );

  const inf = data.influencer;
  const stats = data.stats[tab];
  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="min-h-screen" style={{ background: '#fafaf8' }}>
      {/* Header */}
      <div className="border-b" style={{ background: '#013E37', borderColor: '#013E37' }}>
        <div className="max-w-2xl mx-auto px-5 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {inf.profile_image_url ? (
                <img src={inf.profile_image_url} alt={inf.name} className="w-11 h-11 rounded-full object-cover ring-2 ring-white/20" />
              ) : (
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-base font-bold" style={{ background: 'rgba(255,239,178,0.2)', color: '#FFEFB2' }}>
                  {inf.name.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="text-base font-bold text-white tracking-tight">{inf.name}</h1>
                <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {inf.handle ? `@${inf.handle} · ` : ''}{inf.commission_pct}% commission
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: '#D05B37' }}>
                <span className="text-white font-bold text-[9px]">D</span>
              </div>
              <span className="text-[11px] font-semibold text-white/70 hidden sm:block">Dropy</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-6 space-y-4">
        {/* Tabs */}
        <div className="flex rounded-xl p-1 border" style={{ background: 'white', borderColor: 'var(--border)' }}>
          {(['daily', 'weekly', 'monthly', 'all_time'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className="flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200" style={{
              background: tab === t ? '#013E37' : 'transparent',
              color: tab === t ? '#FFEFB2' : '#999',
            }}>
              {t === 'all_time' ? 'All Time' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border p-4 text-center" style={{ background: 'white', borderColor: 'var(--border)' }}>
            <p className="text-2xl sm:text-3xl font-bold tracking-tight">{stats.orders}</p>
            <p className="text-[10px] uppercase tracking-widest mt-1" style={{ color: 'var(--text-muted)' }}>Orders</p>
          </div>
          <div className="rounded-2xl border p-4 text-center" style={{ background: 'white', borderColor: 'var(--border)' }}>
            <p className="text-2xl sm:text-3xl font-bold tracking-tight">{fmt(stats.revenue)}</p>
            <p className="text-[10px] uppercase tracking-widest mt-1" style={{ color: 'var(--text-muted)' }}>Revenue</p>
          </div>
          <div className="rounded-2xl p-4 text-center" style={{ background: '#013E37' }}>
            <p className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: '#FFEFB2' }}>{fmt(stats.commission)}</p>
            <p className="text-[10px] uppercase tracking-widest mt-1" style={{ color: 'rgba(255,239,178,0.5)' }}>Earned</p>
          </div>
        </div>

        {/* Links */}
        <div className="rounded-2xl border p-4" style={{ background: 'white', borderColor: 'var(--border)' }}>
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Your Tools</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-xl px-3 py-3" style={{ background: '#fafaf8' }}>
              <div className="min-w-0 mr-3">
                <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Shareable Link</p>
                <p className="text-xs font-mono truncate mt-0.5" style={{ color: 'var(--text-secondary)' }}>{inf.shareable_link}</p>
              </div>
              <button onClick={() => cp(inf.shareable_link, 'link')} className="shrink-0 px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all" style={{ background: copied === 'link' ? '#013E37' : 'white', color: copied === 'link' ? '#FFEFB2' : '#666', border: '1px solid #eee' }}>
                {copied === 'link' ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <div className="flex items-center justify-between rounded-xl px-3 py-3" style={{ background: '#fafaf8' }}>
              <div>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Discount Code</p>
                <p className="text-sm font-mono font-bold mt-0.5">{inf.discount_code}</p>
              </div>
              <button onClick={() => cp(inf.discount_code, 'code')} className="shrink-0 px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all" style={{ background: copied === 'code' ? '#013E37' : 'white', color: copied === 'code' ? '#FFEFB2' : '#666', border: '1px solid #eee' }}>
                {copied === 'code' ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </div>

        {/* Orders */}
        {data.recent_orders.length > 0 && (
          <div className="rounded-2xl border overflow-hidden" style={{ background: 'white', borderColor: 'var(--border)' }}>
            <div className="px-4 py-3 border-b" style={{ borderColor: '#f5f5f5' }}>
              <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Recent Orders</h2>
            </div>
            {data.recent_orders.map((o, i) => (
              <div key={i} className="px-4 py-3 flex items-center justify-between border-b last:border-0" style={{ borderColor: '#fafafa' }}>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{format(new Date(o.date), 'dd MMM, h:mm a')}</p>
                <div className="text-right">
                  <p className="text-xs font-bold">{fmt(o.revenue)}</p>
                  <p className="text-[10px] font-semibold" style={{ color: '#013E37' }}>+{fmt(o.commission)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Payouts */}
        {data.payouts.length > 0 && (
          <div className="rounded-2xl border overflow-hidden" style={{ background: 'white', borderColor: 'var(--border)' }}>
            <div className="px-4 py-3 border-b" style={{ borderColor: '#f5f5f5' }}>
              <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Payouts</h2>
            </div>
            {data.payouts.map((p, i) => (
              <div key={i} className="px-4 py-3 flex items-center justify-between border-b last:border-0" style={{ borderColor: '#fafafa' }}>
                <p className="text-xs font-semibold">{p.month}</p>
                <div className="flex items-center gap-2.5">
                  <p className="text-xs font-bold">{fmt(p.total_commission)}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{
                    background: p.paid ? 'rgba(1,62,55,0.08)' : 'rgba(217,119,6,0.08)',
                    color: p.paid ? '#013E37' : '#d97706',
                  }}>
                    {p.paid ? '✓ Paid' : 'Pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-center pt-4 pb-8">
          <p className="text-[10px] uppercase tracking-widest" style={{ color: '#d4d4d4' }}>
            Powered by Dropy India · Since {format(new Date(inf.member_since), 'MMM yyyy')}
          </p>
        </div>
      </div>
    </div>
  );
}
