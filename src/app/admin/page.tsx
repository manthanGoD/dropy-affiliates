'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { InfluencerStats } from '@/types';
import { formatCurrency, getStatusColor } from '@/lib/utils';

export default function AdminDashboard() {
  const [influencers, setInfluencers] = useState<InfluencerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchData = useCallback(async () => {
    const res = await fetch('/api/influencers');
    const data = await res.json();
    setInfluencers(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  async function syncOrders() {
    setSyncing(true);
    await fetch('/api/sync', { method: 'POST', body: JSON.stringify({}) });
    await fetchData();
    setSyncing(false);
  }

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl">
        <div className="flex justify-between"><div className="skeleton h-8 w-48" /><div className="skeleton h-9 w-36 rounded-lg" /></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[1,2,3,4].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">{[1,2,3].map(i => <div key={i} className="skeleton h-44 rounded-2xl" />)}</div>
      </div>
    );
  }

  const totalRevenue = influencers.reduce((s, i) => s + Number(i.total_revenue), 0);
  const totalCommission = influencers.reduce((s, i) => s + Number(i.total_commission), 0);
  const totalOrders = influencers.reduce((s, i) => s + i.total_orders, 0);
  const activeCount = influencers.filter(i => i.status === 'active').length;

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Affiliate Dashboard</h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Real-time performance across your creator network</p>
        </div>
        <div className="flex gap-2">
          <button onClick={syncOrders} disabled={syncing} className="px-3.5 py-2 text-xs font-semibold rounded-lg border transition-all duration-150 disabled:opacity-40" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
            {syncing ? '⟳ Syncing...' : '⟳ Sync'}
          </button>
          <Link href="/admin/add" className="px-3.5 py-2 text-xs font-semibold text-white rounded-lg transition-all duration-150 hover:opacity-90" style={{ background: 'var(--accent)' }}>
            + Invite Creator
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Creators" value={String(activeCount)} sub="active" />
        <StatCard label="Total Orders" value={String(totalOrders)} />
        <StatCard label="Revenue" value={formatCurrency(totalRevenue)} />
        <StatCard label="Commission" value={formatCurrency(totalCommission)} earn />
      </div>

      {influencers.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--bg)' }}>
            <span className="text-2xl">👥</span>
          </div>
          <p className="font-semibold text-sm">No creators yet</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Invite your first influencer to get started</p>
          <Link href="/admin/add" className="inline-block mt-5 px-4 py-2 text-xs font-semibold text-white rounded-lg" style={{ background: 'var(--accent)' }}>
            + Invite Creator
          </Link>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Top Creators</h2>
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{influencers.length} total</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {influencers.map((inf) => (
              <Link
                key={inf.id}
                href={`/admin/${inf.id}`}
                className="rounded-2xl border p-4 transition-all duration-200 group hover:shadow-md hover:-translate-y-0.5"
                style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    {inf.profile_image_url ? (
                      <img src={inf.profile_image_url} alt={inf.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100" />
                    ) : (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: 'var(--earn-bg)' }}>
                        {inf.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-sm tracking-tight group-hover:opacity-80">{inf.name}</h3>
                      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{inf.handle ? `@${inf.handle}` : inf.platform}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${getStatusColor(inf.status)}`}>
                    {inf.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-3 border-t" style={{ borderColor: '#f5f5f5' }}>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Orders</p>
                    <p className="text-base font-bold mt-0.5">{inf.total_orders}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Revenue</p>
                    <p className="text-base font-bold mt-0.5">{formatCurrency(inf.total_revenue)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--accent)' }}>Earned</p>
                    <p className="text-base font-bold mt-0.5" style={{ color: 'var(--accent)' }}>{formatCurrency(inf.total_commission)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t" style={{ borderColor: '#f5f5f5' }}>
                  <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>{inf.discount_code}</span>
                  <span className="text-[11px] font-semibold" style={{ color: 'var(--accent)' }}>View →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, earn }: { label: string; value: string; sub?: string; earn?: boolean }) {
  return (
    <div className="rounded-2xl border p-4" style={{
      background: earn ? 'var(--earn-bg)' : 'var(--card)',
      borderColor: earn ? 'var(--earn-bg)' : 'var(--border)',
    }}>
      <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: earn ? 'rgba(255,239,178,0.6)' : 'var(--text-muted)' }}>{label}</p>
      <div className="flex items-baseline gap-1.5 mt-1">
        <p className="text-2xl font-bold tracking-tight" style={{ color: earn ? 'var(--earn-light)' : 'var(--text)' }}>{value}</p>
        {sub && <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{sub}</span>}
      </div>
    </div>
  );
}
