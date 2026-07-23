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

  const [showImport, setShowImport] = useState(false);
  const [untracked, setUntracked] = useState<{ code: string; discount: string; value: number; value_type: string; title: string }[]>([]);
  const [importing, setImporting] = useState('');

  async function scanShopify() {
    setShowImport(true);
    const res = await fetch('/api/import');
    const data = await res.json();
    setUntracked(data.untracked || []);
  }

  async function importCode(code: string) {
    setImporting(code);
    const item = untracked.find(u => u.code === code);
    await fetch('/api/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, name: item?.title || code, platform: 'instagram', commission_pct: 5, discount_value: item?.value || 0, discount_type: item?.value_type || 'percentage' }),
    });
    setUntracked(prev => prev.filter(u => u.code !== code));
    await fetchData();
    setImporting('');
  }

  if (loading) return (
    <div className="space-y-6 max-w-6xl">
      <div className="skeleton h-8 w-48" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1,2,3,4].map(i=><div key={i} className="skeleton h-32" />)}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{[1,2,3].map(i=><div key={i} className="skeleton h-52" />)}</div>
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
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Real-time affiliate performance</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <a href="/api/reports" download className="glass px-4 py-2.5 text-xs font-semibold transition-all hover:scale-[1.02] cursor-pointer" style={{ color: 'var(--text-sec)' }}>
            📥 Report
          </a>
          <button onClick={scanShopify} className="glass px-4 py-2.5 text-xs font-semibold transition-all hover:scale-[1.02]" style={{ color: 'var(--text-sec)' }}>
            📦 Import
          </button>
          <button onClick={syncOrders} disabled={syncing} className="glass px-4 py-2.5 text-xs font-semibold transition-all disabled:opacity-40 hover:scale-[1.02]" style={{ color: 'var(--text-sec)' }}>
            {syncing ? '⟳ Syncing...' : '⟳ Sync'}
          </button>
          <Link href="/admin/add" className="px-4 py-2.5 text-xs font-bold text-white rounded-[20px] transition-all hover:scale-[1.02] hover:shadow-lg" style={{ background: 'var(--sidebar)', boxShadow: '0 4px 20px rgba(108,92,231,0.3)' }}>
            + Invite Creator
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Creators" value={String(active)} sub="active" color="var(--purple)" bg="linear-gradient(135deg, #6c5ce7, #a29bfe)" />
        <StatCard label="Orders" value={String(orders)} color="var(--pink)" bg="linear-gradient(135deg, #e84393, #fd79a8)" />
        <StatCard label="Revenue" value={formatCurrency(rev)} color="var(--orange)" bg="linear-gradient(135deg, #e17055, #fab1a0)" />
        <StatCard label="Commission" value={formatCurrency(comm)} sub="owed" color="var(--green)" bg="linear-gradient(135deg, #00b894, #55efc4)" />
      </div>

      {/* Influencers */}
      {influencers.length === 0 ? (
        <div className="glass text-center py-20">
          <p className="text-4xl mb-3">👥</p>
          <p className="font-bold text-base" style={{ color: 'var(--text)' }}>No creators yet</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Invite your first influencer to get started</p>
          <Link href="/admin/add" className="inline-block mt-5 px-5 py-2.5 text-xs font-bold text-white rounded-xl" style={{ background: 'var(--sidebar)', boxShadow: '0 4px 20px rgba(108,92,231,0.3)' }}>
            + Invite Creator
          </Link>
        </div>
      ) : (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] mb-3" style={{ color: 'var(--text-muted)' }}>Creators</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {influencers.map(inf => (
              <Link key={inf.id} href={`/admin/${inf.id}`} className="glass p-5 group hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {inf.profile_image_url ? (
                      <img src={inf.profile_image_url} alt={inf.name} className="w-12 h-12 rounded-2xl object-cover shadow-sm" />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold text-white shadow-sm" style={{ background: 'var(--sidebar)' }}>
                        {inf.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-[15px]" style={{ color: 'var(--text)' }}>{inf.name}</h3>
                      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{inf.handle ? `@${inf.handle}` : inf.platform}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${getStatusColor(inf.status)}`}>{inf.status}</span>
                </div>

                <div className="grid grid-cols-3 gap-3 py-3 border-t border-b" style={{ borderColor: 'rgba(0,0,0,0.04)' }}>
                  <MiniStat label="Orders" value={String(inf.total_orders)} />
                  <MiniStat label="Revenue" value={formatCurrency(inf.total_revenue)} />
                  <MiniStat label="Earned" value={formatCurrency(inf.total_commission)} color="var(--green)" />
                </div>

                <div className="flex items-center justify-between pt-3">
                  <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>{inf.discount_code}</span>
                  <span className="text-[11px] font-bold group-hover:translate-x-1 transition-transform" style={{ color: 'var(--purple)' }}>View →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowImport(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()} style={{ background: 'var(--card-solid, #fff)' }}>
            <h3 className="text-lg font-bold mb-1">Import from Shopify</h3>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Discount codes found in Shopify but not tracked in your tool</p>
            
            {untracked.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-2xl mb-2">✅</p>
                <p className="text-sm font-medium">All synced!</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No untracked discount codes found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {untracked.map(u => (
                  <div key={u.code} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: 'var(--border, #eee)' }}>
                    <div>
                      <p className="text-sm font-bold font-mono">{u.code}</p>
                      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{u.discount} off · {u.title}</p>
                    </div>
                    <button
                      onClick={() => importCode(u.code)}
                      disabled={importing === u.code}
                      className="px-3 py-1.5 text-[11px] font-bold text-white rounded-lg disabled:opacity-50"
                      style={{ background: 'var(--purple, #6c5ce7)' }}
                    >
                      {importing === u.code ? '...' : 'Import'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button onClick={() => setShowImport(false)} className="w-full mt-4 py-2 text-xs font-medium rounded-xl border" style={{ borderColor: 'var(--border, #eee)', color: 'var(--text-sec)' }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, color, bg }: { label: string; value: string; sub?: string; color: string; bg: string }) {
  return (
    <div className="rounded-[20px] p-5 text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl" style={{ background: bg }}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/60">{label}</p>
      <div className="flex items-baseline gap-1.5 mt-2">
        <p className="text-3xl font-bold">{value}</p>
        {sub && <span className="text-[11px] text-white/50">{sub}</span>}
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-base font-bold mt-0.5" style={{ color: color || 'var(--text)' }}>{value}</p>
    </div>
  );
}
