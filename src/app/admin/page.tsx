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

  async function syncOrders() { setSyncing(true); await fetch('/api/sync', { method: 'POST', body: '{}' }); await fetchData(); setSyncing(false); }
  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return (
    <div className="space-y-6 max-w-6xl">
      <div className="skeleton h-8 w-48" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[1,2,3,4].map(i=><div key={i} className="skeleton h-28 rounded-2xl" />)}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">{[1,2,3].map(i=><div key={i} className="skeleton h-48 rounded-2xl" />)}</div>
    </div>
  );

  const rev = influencers.reduce((s,i) => s+Number(i.total_revenue), 0);
  const comm = influencers.reduce((s,i) => s+Number(i.total_commission), 0);
  const orders = influencers.reduce((s,i) => s+i.total_orders, 0);
  const active = influencers.filter(i => i.status === 'active').length;

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Real-time affiliate performance</p>
        </div>
        <div className="flex gap-2">
          <button onClick={syncOrders} disabled={syncing} className="px-4 py-2.5 text-xs font-semibold rounded-xl card transition-all disabled:opacity-40" style={{ color: 'var(--text-secondary)' }}>
            {syncing ? '⟳ Syncing...' : '⟳ Sync'}
          </button>
          <Link href="/admin/add" className="px-4 py-2.5 text-xs font-bold text-white rounded-xl gradient-orange glow-orange transition-all hover:opacity-90">
            + Invite Creator
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card p-5 rounded-2xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: 'var(--text-muted)' }}>Creators</p>
          <p className="text-3xl font-bold mt-2">{active}</p>
          <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>active</p>
        </div>
        <div className="card p-5 rounded-2xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: 'var(--text-muted)' }}>Orders</p>
          <p className="text-3xl font-bold mt-2">{orders}</p>
        </div>
        <div className="card p-5 rounded-2xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: 'var(--text-muted)' }}>Revenue</p>
          <p className="text-3xl font-bold mt-2">{formatCurrency(rev)}</p>
        </div>
        <div className="gradient-green glow-green p-5 rounded-2xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: 'rgba(134,239,172,0.6)' }}>Commission</p>
          <p className="text-3xl font-bold mt-2" style={{ color: '#86efac' }}>{formatCurrency(comm)}</p>
          <p className="text-[11px] mt-1" style={{ color: 'rgba(134,239,172,0.4)' }}>total owed</p>
        </div>
      </div>

      {/* Influencers */}
      {influencers.length === 0 ? (
        <div className="card rounded-2xl text-center py-20">
          <p className="text-3xl mb-3">👥</p>
          <p className="font-semibold">No creators yet</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Invite your first influencer</p>
          <Link href="/admin/add" className="inline-block mt-5 px-5 py-2.5 text-xs font-bold text-white rounded-xl gradient-orange">+ Invite Creator</Link>
        </div>
      ) : (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] mb-3" style={{ color: 'var(--text-muted)' }}>Creators</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {influencers.map(inf => (
              <Link key={inf.id} href={`/admin/${inf.id}`} className="card rounded-2xl p-5 group hover:-translate-y-1 hover:shadow-lg hover:shadow-black/20 transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {inf.profile_image_url ? (
                      <img src={inf.profile_image_url} alt={inf.name} className="w-11 h-11 rounded-full object-cover ring-2 ring-white/10" />
                    ) : (
                      <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold gradient-green">
                        {inf.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-[15px] tracking-tight">{inf.name}</h3>
                      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{inf.handle ? `@${inf.handle}` : inf.platform}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${getStatusColor(inf.status)}`}>{inf.status}</span>
                </div>

                <div className="grid grid-cols-3 gap-3 py-3 border-t border-b" style={{ borderColor: 'var(--border)' }}>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Orders</p>
                    <p className="text-lg font-bold mt-0.5">{inf.total_orders}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Revenue</p>
                    <p className="text-lg font-bold mt-0.5">{formatCurrency(inf.total_revenue)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--green)' }}>Earned</p>
                    <p className="text-lg font-bold mt-0.5" style={{ color: 'var(--green)' }}>{formatCurrency(inf.total_commission)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3">
                  <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>{inf.discount_code}</span>
                  <span className="text-[11px] font-semibold group-hover:translate-x-1 transition-transform" style={{ color: 'var(--accent)' }}>View →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
