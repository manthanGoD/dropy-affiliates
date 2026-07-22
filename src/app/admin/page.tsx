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
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div><div className="skeleton h-7 w-40 mb-2" /><div className="skeleton h-4 w-64" /></div>
          <div className="flex gap-2"><div className="skeleton h-9 w-28 rounded-lg" /><div className="skeleton h-9 w-32 rounded-lg" /></div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-20 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="skeleton h-40 rounded-xl" />)}
        </div>
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
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage your influencer affiliate program</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={syncOrders}
            disabled={syncing}
            className="px-3.5 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:text-gray-900 disabled:opacity-40 transition-all duration-150"
          >
            {syncing ? '⟳ Syncing...' : '⟳ Sync Orders'}
          </button>
          <Link
            href="/admin/add"
            className="px-3.5 py-2 text-xs font-medium text-white bg-gray-900 rounded-lg hover:bg-black transition-colors duration-150"
          >
            + Add Influencer
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Active" value={String(activeCount)} />
        <StatCard label="Orders" value={String(totalOrders)} />
        <StatCard label="Revenue" value={formatCurrency(totalRevenue)} />
        <StatCard label="Commission" value={formatCurrency(totalCommission)} accent />
      </div>

      {influencers.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">👥</span>
          </div>
          <p className="text-gray-900 font-medium text-sm">No influencers yet</p>
          <p className="text-xs text-gray-400 mt-1">Add your first influencer to get started</p>
          <Link href="/admin/add" className="inline-block mt-5 px-4 py-2 text-xs font-medium text-white bg-gray-900 rounded-lg hover:bg-black transition-colors">
            + Add Influencer
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {influencers.map((inf) => (
            <Link
              key={inf.id}
              href={`/admin/${inf.id}`}
              className="bg-white rounded-xl border border-gray-100 p-4 hover:border-gray-200 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-200 group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  {inf.profile_image_url ? (
                    <img src={inf.profile_image_url} alt={inf.name} className="w-9 h-9 rounded-full object-cover ring-1 ring-gray-100" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 text-sm font-semibold">
                      {inf.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-sm text-gray-900 group-hover:text-black">{inf.name}</h3>
                    <p className="text-[11px] text-gray-400">{inf.handle ? `@${inf.handle}` : inf.platform}</p>
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getStatusColor(inf.status)}`}>
                  {inf.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 py-2.5 border-t border-gray-50">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Orders</p>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">{inf.total_orders}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Revenue</p>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">{formatCurrency(inf.total_revenue)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Earned</p>
                  <p className="text-sm font-bold text-emerald-600 mt-0.5">{formatCurrency(inf.total_commission)}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2.5 border-t border-gray-50">
                <span className="text-[11px] text-gray-300 font-mono">{inf.discount_code}</span>
                <span className="text-[11px] text-gray-300">{inf.commission_pct}%</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 transition-colors ${accent ? 'bg-emerald-50/50 border-emerald-100' : 'bg-white border-gray-100'}`}>
      <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">{label}</p>
      <p className={`text-xl font-bold mt-1 tracking-tight ${accent ? 'text-emerald-700' : 'text-gray-900'}`}>{value}</p>
    </div>
  );
}
