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
  const [tab, setTab] = useState<'daily'|'weekly'|'monthly'|'all_time'>('monthly');
  const [copied, setCopied] = useState('');

  useEffect(() => {
    fetch(`/api/dashboard/${params.token}`)
      .then(r => { if (!r.ok) throw 0; return r.json(); })
      .then(setData).catch(() => setError(true)).finally(() => setLoading(false));
  }, [params.token]);

  function cp(t: string, l: string) { navigator.clipboard.writeText(t); setCopied(l); setTimeout(() => setCopied(''), 2000); }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="space-y-4 w-full max-w-lg px-6">
        <div className="skeleton h-16 rounded-2xl" /><div className="skeleton h-12 rounded-xl" />
        <div className="grid grid-cols-3 gap-3">{[1,2,3].map(i=><div key={i} className="skeleton h-28 rounded-2xl" />)}</div>
      </div>
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="text-center"><p className="text-3xl mb-3">🔒</p><p className="font-semibold">Not found</p></div>
    </div>
  );

  const inf = data.influencer;
  const stats = data.stats[tab];
  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #065f46 0%, #022c22 100%)', borderBottom: '1px solid rgba(34,197,94,0.1)' }}>
        <div className="max-w-2xl mx-auto px-5 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {inf.profile_image_url ? (
                <img src={inf.profile_image_url} alt={inf.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-white/20" />
              ) : (
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold" style={{ background: 'rgba(255,255,255,0.1)', color: '#86efac' }}>
                  {inf.name.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">{inf.name}</h1>
                <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {inf.handle ? `@${inf.handle} · ` : ''}{inf.commission_pct}% commission
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center gradient-orange">
                <span className="text-white font-bold text-[10px]">D</span>
              </div>
              <span className="text-[11px] font-semibold text-white/50 hidden sm:block">Dropy</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-6 space-y-4">
        {/* Tabs */}
        <div className="flex card rounded-xl p-1">
          {(['daily','weekly','monthly','all_time'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className="flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all duration-200" style={{
              background: tab === t ? 'linear-gradient(135deg, #065f46, #022c22)' : 'transparent',
              color: tab === t ? '#86efac' : 'var(--text-muted)',
            }}>
              {t === 'all_time' ? 'All Time' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="card rounded-2xl p-4 text-center">
            <p className="text-3xl font-bold">{stats.orders}</p>
            <p className="text-[10px] uppercase tracking-[0.15em] mt-1.5" style={{ color: 'var(--text-muted)' }}>Orders</p>
          </div>
          <div className="card rounded-2xl p-4 text-center">
            <p className="text-3xl font-bold">{fmt(stats.revenue)}</p>
            <p className="text-[10px] uppercase tracking-[0.15em] mt-1.5" style={{ color: 'var(--text-muted)' }}>Revenue</p>
          </div>
          <div className="gradient-green glow-green rounded-2xl p-4 text-center">
            <p className="text-3xl font-bold" style={{ color: '#86efac' }}>{fmt(stats.commission)}</p>
            <p className="text-[10px] uppercase tracking-[0.15em] mt-1.5" style={{ color: 'rgba(134,239,172,0.5)' }}>Earned</p>
          </div>
        </div>

        {/* Tools */}
        <div className="card rounded-2xl p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] mb-3" style={{ color: 'var(--text-muted)' }}>Your Tools</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="min-w-0 mr-3">
                <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Link</p>
                <p className="text-xs font-mono truncate mt-0.5" style={{ color: 'var(--text-secondary)' }}>{inf.shareable_link}</p>
              </div>
              <button onClick={() => cp(inf.shareable_link, 'link')} className="shrink-0 px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-all" style={{ background: copied === 'link' ? 'var(--green)' : 'rgba(255,255,255,0.06)', color: copied === 'link' ? '#000' : 'var(--text-secondary)' }}>
                {copied === 'link' ? '✓' : 'Copy'}
              </button>
            </div>
            <div className="flex items-center justify-between rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Code</p>
                <p className="text-sm font-mono font-bold mt-0.5">{inf.discount_code}</p>
              </div>
              <button onClick={() => cp(inf.discount_code, 'code')} className="shrink-0 px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-all" style={{ background: copied === 'code' ? 'var(--green)' : 'rgba(255,255,255,0.06)', color: copied === 'code' ? '#000' : 'var(--text-secondary)' }}>
                {copied === 'code' ? '✓' : 'Copy'}
              </button>
            </div>
          </div>
        </div>

        {/* Orders */}
        {data.recent_orders.length > 0 && (
          <div className="card rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: 'var(--text-muted)' }}>Recent Orders</p>
            </div>
            {data.recent_orders.map((o,i) => (
              <div key={i} className="px-5 py-3 flex items-center justify-between border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{format(new Date(o.date), 'dd MMM, h:mm a')}</p>
                <div className="text-right">
                  <p className="text-xs font-bold">{fmt(o.revenue)}</p>
                  <p className="text-[10px] font-semibold" style={{ color: 'var(--green)' }}>+{fmt(o.commission)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Payouts */}
        {data.payouts.length > 0 && (
          <div className="card rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: 'var(--text-muted)' }}>Payouts</p>
            </div>
            {data.payouts.map((p,i) => (
              <div key={i} className="px-5 py-3 flex items-center justify-between border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                <p className="text-xs font-semibold">{p.month}</p>
                <div className="flex items-center gap-2.5">
                  <p className="text-xs font-bold">{fmt(p.total_commission)}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{
                    background: p.paid ? 'rgba(34,197,94,0.1)' : 'rgba(234,179,8,0.1)',
                    color: p.paid ? 'var(--green)' : '#eab308',
                  }}>
                    {p.paid ? '✓ Paid' : 'Pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-center pt-6 pb-8">
          <p className="text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
            Dropy India · Since {format(new Date(inf.member_since), 'MMM yyyy')}
          </p>
        </div>
      </div>
    </div>
  );
}
