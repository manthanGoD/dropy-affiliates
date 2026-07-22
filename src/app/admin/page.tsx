'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { InfluencerStats } from '@/types';
import { formatCurrency, getStatusColor } from '@/lib/utils';

export default function AdminDashboard() {
  const [influencers, setInfluencers] = useState<InfluencerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  async function fetchData() {
    const res = await fetch('/api/influencers');
    const data = await res.json();
    setInfluencers(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function syncOrders() {
    setSyncing(true);
    await fetch('/api/sync', { method: 'POST', body: JSON.stringify({}) });
    await fetchData();
    setSyncing(false);
  }

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  const totalRevenue = influencers.reduce((s, i) => s + Number(i.total_revenue), 0);
  const totalCommission = influencers.reduce((s, i) => s + Number(i.total_commission), 0);
  const totalOrders = influencers.reduce((s, i) => s + i.total_orders, 0);
  const activeCount = influencers.filter(i => i.status === 'active').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your influencer affiliate program</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={syncOrders}
            disabled={syncing}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {syncing ? '⟳ Syncing...' : '⟳ Sync Orders'}
          </button>
          <Link
            href="/admin/add"
            className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition-colors"
          >
            + Add Influencer
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Active Influencers" value={String(activeCount)} />
        <StatCard label="Total Orders" value={String(totalOrders)} />
        <StatCard label="Total Revenue" value={formatCurrency(totalRevenue)} />
        <StatCard label="Commission Owed" value={formatCurrency(totalCommission)} />
      </div>

      {/* Influencer Grid */}
      {influencers.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <p className="text-4xl mb-3">👥</p>
          <p className="text-gray-900 font-medium">No influencers yet</p>
          <p className="text-sm text-gray-500 mt-1">Add your first influencer to get started</p>
          <Link
            href="/admin/add"
            className="inline-block mt-4 px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800"
          >
            + Add Influencer
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {influencers.map((inf) => (
            <Link
              key={inf.id}
              href={`/admin/${inf.id}`}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {inf.profile_image_url ? (
                    <img
                      src={inf.profile_image_url}
                      alt={inf.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-medium">
                      {inf.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-black">
                      {inf.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {inf.handle ? `@${inf.handle}` : inf.platform}
                    </p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(inf.status)}`}>
                  {inf.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Orders</p>
                  <p className="text-sm font-semibold text-gray-900">{inf.total_orders}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Revenue</p>
                  <p className="text-sm font-semibold text-gray-900">{formatCurrency(inf.total_revenue)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Commission</p>
                  <p className="text-sm font-semibold text-gray-900">{formatCurrency(inf.total_commission)}</p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-400">Code: {inf.discount_code}</span>
                <span className="text-xs text-gray-400">{inf.commission_pct}% commission</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}
