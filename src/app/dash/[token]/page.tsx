'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface DashboardData {
  influencer: { name: string; platform: string; handle: string | null; profile_image_url: string | null; discount_code: string; commission_pct: number; shareable_link: string; original_link: string; member_since: string; };
  stats: { all_time: S; daily: S; weekly: S; monthly: S; };
  chart: { date: string; clicks: number; orders: number; commission: number }[];
  redeem: { total_earned: number; total_paid: number; pending: number };
  recent_orders: { date: string; revenue: number; commission: number }[];
  payouts: { month: string; total_commission: number; paid: boolean; paid_date: string | null }[];
}
type S = { clicks: number; orders: number; revenue: number; commission: number };

function AnimatedNumber({ value, prefix = '' }: { value: number; prefix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>(0);
  useEffect(() => {
    const start = ref.current;
    const diff = value - start;
    if (diff === 0) return;
    const duration = 800;
    const startTime = performance.now();
    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + diff * eased);
      setDisplay(current);
      if (progress < 1) requestAnimationFrame(tick);
      else ref.current = value;
    }
    requestAnimationFrame(tick);
  }, [value]);
  return <>{prefix}{display.toLocaleString('en-IN')}</>;
}

export default function InfluencerDashboard() {
  const params = useParams();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<'daily' | 'weekly' | 'monthly' | 'all_time'>('monthly');
  const [chartView, setChartView] = useState<'clicks' | 'orders' | 'commission'>('clicks');
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
        <div className="skeleton h-20" /><div className="skeleton h-12" />
        <div className="grid grid-cols-3 gap-3">{[1,2,3].map(i => <div key={i} className="skeleton h-28" />)}</div>
        <div className="skeleton h-64" />
      </div>
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="text-center"><p className="text-4xl mb-3">🔒</p><p className="font-bold">Not found</p></div>
    </div>
  );

  const inf = data.influencer;
  const stats = data.stats[tab];
  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  const chartColors: Record<string, string> = { clicks: '#6c5ce7', orders: '#e17055', commission: '#00b894' };
  const chartLabels: Record<string, string> = { clicks: 'Clicks', orders: 'Orders', commission: 'Commission' };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="rounded-b-3xl shadow-lg" style={{ background: 'var(--sidebar)', boxShadow: '0 8px 32px rgba(108,92,231,0.2)' }}>
        <div className="max-w-2xl mx-auto px-5 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {inf.profile_image_url ? (
                <img src={inf.profile_image_url} alt={inf.name} className="w-12 h-12 rounded-2xl object-cover ring-2 ring-white/20 shadow" />
              ) : (
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold bg-white/15 text-white backdrop-blur shadow">
                  {inf.name.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="text-lg font-bold text-white">{inf.name}</h1>
                <p className="text-[11px] text-white/40">{inf.handle ? `@${inf.handle} · ` : ''}{inf.commission_pct}% commission</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur rounded-xl px-3 py-1.5">
              <div className="w-5 h-5 rounded-md flex items-center justify-center bg-white/20"><span className="text-white font-bold text-[8px]">D</span></div>
              <span className="text-[11px] font-semibold text-white/70">Dropy</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-6 space-y-4">
        {/* Tabs */}
        <div className="glass flex p-1">
          {(['daily', 'weekly', 'monthly', 'all_time'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className="flex-1 py-2 sm:py-2.5 text-[10px] sm:text-xs font-semibold rounded-2xl transition-all duration-200" style={{
              background: tab === t ? 'var(--sidebar)' : 'transparent',
              color: tab === t ? '#fff' : 'var(--text-muted)',
              boxShadow: tab === t ? '0 4px 16px rgba(108,92,231,0.3)' : 'none',
            }}>
              {t === 'all_time' ? 'All Time' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Stats — 3 cards */}
        <div className="grid grid-cols-3 gap-3">
          {/* Clicks */}
          <div className="glass p-4 sm:p-5 text-center">
            <p className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--purple)' }}>
              <AnimatedNumber value={stats.clicks} />
            </p>
            <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.15em] mt-1.5" style={{ color: 'var(--text-muted)' }}>Clicks</p>
          </div>
          {/* Orders */}
          <div className="glass p-4 sm:p-5 text-center">
            <p className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--orange)' }}>
              <AnimatedNumber value={stats.orders} />
            </p>
            <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.15em] mt-1.5" style={{ color: 'var(--text-muted)' }}>Orders</p>
          </div>
          {/* Earned */}
          <div className="rounded-[20px] p-4 sm:p-5 text-center text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #00b894, #55efc4)', boxShadow: '0 8px 24px rgba(0,184,148,0.25)' }}>
            <p className="text-2xl sm:text-3xl font-bold">
              <AnimatedNumber value={stats.commission} prefix="₹" />
            </p>
            <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.15em] mt-1.5 text-white/60">Earned</p>
          </div>
        </div>

        {/* Redeem Card */}
        <div className="glass p-4 sm:p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] mb-3" style={{ color: 'var(--text-muted)' }}>Commission Status</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-lg sm:text-xl font-bold" style={{ color: 'var(--green)' }}>{fmt(data.redeem.total_earned)}</p>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Total Earned</p>
            </div>
            <div>
              <p className="text-lg sm:text-xl font-bold" style={{ color: 'var(--purple)' }}>{fmt(data.redeem.total_paid)}</p>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Redeemed</p>
            </div>
            <div>
              <p className="text-lg sm:text-xl font-bold" style={{ color: 'var(--orange)' }}>{fmt(data.redeem.pending)}</p>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Pending</p>
            </div>
          </div>
          {/* Progress bar */}
          {data.redeem.total_earned > 0 && (
            <div className="mt-3">
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(108,92,231,0.1)' }}>
                <div className="h-full rounded-full transition-all duration-700" style={{
                  width: `${Math.min((data.redeem.total_paid / data.redeem.total_earned) * 100, 100)}%`,
                  background: 'linear-gradient(90deg, #6c5ce7, #00b894)',
                }} />
              </div>
              <p className="text-[10px] text-right mt-1" style={{ color: 'var(--text-muted)' }}>
                {Math.round((data.redeem.total_paid / data.redeem.total_earned) * 100)}% redeemed
              </p>
            </div>
          )}
        </div>

        {/* Chart */}
        <div className="glass p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: 'var(--text-muted)' }}>Performance (14 days)</p>
            <div className="flex gap-1">
              {(['clicks', 'orders', 'commission'] as const).map(v => (
                <button key={v} onClick={() => setChartView(v)} className="px-2.5 py-1 text-[10px] font-semibold rounded-lg transition-all" style={{
                  background: chartView === v ? chartColors[v] : 'rgba(0,0,0,0.03)',
                  color: chartView === v ? '#fff' : 'var(--text-muted)',
                }}>
                  {chartLabels[v]}
                </button>
              ))}
            </div>
          </div>
          <div className="h-48 sm:h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.chart} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#999' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#999' }} axisLine={false} tickLine={false} width={30} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, fontSize: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
                  cursor={{ fill: 'rgba(108,92,231,0.04)' }}
                />
                <Bar dataKey={chartView} fill={chartColors[chartView]} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tools */}
        <div className="glass p-4 sm:p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] mb-3" style={{ color: 'var(--text-muted)' }}>Your Tools</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-2xl p-3" style={{ background: 'rgba(108,92,231,0.04)' }}>
              <div className="min-w-0 mr-3">
                <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Link</p>
                <p className="text-xs font-mono truncate mt-0.5" style={{ color: 'var(--text-sec)' }}>{inf.shareable_link}</p>
              </div>
              <button onClick={() => cp(inf.shareable_link, 'link')} className="shrink-0 px-3 py-1.5 text-[11px] font-bold rounded-xl transition-all" style={{ background: copied === 'link' ? 'var(--green)' : 'var(--purple)', color: '#fff' }}>
                {copied === 'link' ? '✓' : 'Copy'}
              </button>
            </div>
            <div className="flex items-center justify-between rounded-2xl p-3" style={{ background: 'rgba(108,92,231,0.04)' }}>
              <div>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Code</p>
                <p className="text-sm font-mono font-bold mt-0.5" style={{ color: 'var(--text)' }}>{inf.discount_code}</p>
              </div>
              <button onClick={() => cp(inf.discount_code, 'code')} className="shrink-0 px-3 py-1.5 text-[11px] font-bold rounded-xl transition-all" style={{ background: copied === 'code' ? 'var(--green)' : 'var(--purple)', color: '#fff' }}>
                {copied === 'code' ? '✓' : 'Copy'}
              </button>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        {data.recent_orders.length > 0 && (
          <div className="glass overflow-hidden">
            <div className="px-5 py-3 border-b" style={{ borderColor: 'rgba(0,0,0,0.04)' }}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: 'var(--text-muted)' }}>Recent Orders</p>
            </div>
            {data.recent_orders.map((o, i) => (
              <div key={i} className="px-5 py-3 flex items-center justify-between border-b last:border-0" style={{ borderColor: 'rgba(0,0,0,0.03)' }}>
                <p className="text-xs" style={{ color: 'var(--text-sec)' }}>{format(new Date(o.date), 'dd MMM, h:mm a')}</p>
                <p className="text-sm font-bold" style={{ color: 'var(--green)' }}>+{fmt(o.commission)}</p>
              </div>
            ))}
          </div>
        )}

        {/* Payouts */}
        {data.payouts.length > 0 && (
          <div className="glass overflow-hidden">
            <div className="px-5 py-3 border-b" style={{ borderColor: 'rgba(0,0,0,0.04)' }}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: 'var(--text-muted)' }}>Payouts</p>
            </div>
            {data.payouts.map((p, i) => (
              <div key={i} className="px-5 py-3 flex items-center justify-between border-b last:border-0" style={{ borderColor: 'rgba(0,0,0,0.03)' }}>
                <p className="text-xs font-semibold">{p.month}</p>
                <div className="flex items-center gap-2.5">
                  <p className="text-xs font-bold">{fmt(p.total_commission)}</p>
                  <span className="text-[10px] px-2.5 py-1 rounded-full font-bold" style={{
                    background: p.paid ? 'rgba(0,184,148,0.1)' : 'rgba(225,112,85,0.1)',
                    color: p.paid ? 'var(--green)' : 'var(--orange)',
                  }}>{p.paid ? '✓ Paid' : 'Pending'}</span>
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