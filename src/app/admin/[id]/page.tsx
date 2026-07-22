'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Influencer, Order, Payout } from '@/types';
import { formatCurrency, getStatusColor, getDashboardUrl } from '@/lib/utils';
import { format } from 'date-fns';

interface InfluencerDetail extends Influencer {
  orders: Order[];
  payouts: Payout[];
  stats: {
    total_orders: number;
    total_revenue: number;
    total_discounts: number;
    total_net_revenue: number;
    total_commission: number;
  };
}

export default function InfluencerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<InfluencerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [copied, setCopied] = useState('');
  const [showEdit, setShowEdit] = useState(false);
  const [showPayout, setShowPayout] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  async function fetchData() {
    const res = await fetch(`/api/influencers/${params.id}`);
    if (!res.ok) { router.push('/admin'); return; }
    setData(await res.json());
    setLoading(false);
  }

  async function syncOrders() {
    setSyncing(true);
    await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ influencer_id: params.id }),
    });
    await fetchData();
    setSyncing(false);
  }

  async function deleteInfluencer() {
    const res = await fetch(`/api/influencers/${params.id}`, { method: 'DELETE' });
    if (res.ok) router.push('/admin');
  }

  async function copy(text: string, label: string) {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  }

  useEffect(() => { fetchData(); }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  const dashboardUrl = getDashboardUrl(data.dashboard_token);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/admin')} className="text-gray-400 hover:text-gray-600">←</button>
          {data.profile_image_url ? (
            <img src={data.profile_image_url} alt={data.name} className="w-14 h-14 rounded-full object-cover" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-xl font-medium text-gray-500">
              {data.name.charAt(0)}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">{data.name}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(data.status)}`}>
                {data.status}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              {data.handle ? `@${data.handle} · ` : ''}{data.platform} · {data.commission_pct}% commission
            </p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowEdit(true)} className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            ✏️ Edit
          </button>
          <button onClick={syncOrders} disabled={syncing} className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">
            {syncing ? '⟳ Syncing...' : '⟳ Sync'}
          </button>
          <button onClick={() => setShowPayout(true)} className="px-3 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700">
            💰 Record Payout
          </button>
          <button onClick={() => setShowDelete(true)} className="px-3 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50">
            🗑
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Orders" value={String(data.stats.total_orders)} />
        <StatCard label="Gross Revenue" value={formatCurrency(data.stats.total_revenue)} />
        <StatCard label="Net Revenue" value={formatCurrency(data.stats.total_net_revenue)} />
        <StatCard label="Commission Owed" value={formatCurrency(data.stats.total_commission)} highlight />
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <QuickCopy label="Shareable Link" value={data.shareable_link || ''} copied={copied === 'link'} onCopy={() => copy(data.shareable_link || '', 'link')} />
        <QuickCopy label="Discount Code" value={data.discount_code} copied={copied === 'code'} onCopy={() => copy(data.discount_code, 'code')} />
        <QuickCopy label="Dashboard Link" value={dashboardUrl} copied={copied === 'dash'} onCopy={() => copy(dashboardUrl, 'dash')} />
      </div>

      {/* Orders Table */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Orders ({data.orders.length})</h2>
        {data.orders.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-500 text-sm">No orders yet. Click &quot;Sync&quot; to pull from Shopify.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Order</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Discount</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{order.shopify_order_number || order.shopify_order_id}</td>
                    <td className="px-4 py-3 text-gray-500">{format(new Date(order.order_date), 'dd MMM yyyy')}</td>
                    <td className="px-4 py-3 text-gray-500">{order.customer_name || '—'}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(order.gross_revenue)}</td>
                    <td className="px-4 py-3 text-right text-red-600">-{formatCurrency(order.discount_amount)}</td>
                    <td className="px-4 py-3 text-right font-medium text-emerald-700">{formatCurrency(order.commission_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payouts */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Payouts</h2>
        {data.payouts.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-500 text-sm">No payouts recorded yet. Click &quot;Record Payout&quot; to add one.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Month</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Orders</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Commission</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.payouts.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 font-medium">{p.month}</td>
                    <td className="px-4 py-3 text-right">{p.total_orders}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(p.total_revenue)}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(p.total_commission)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.paid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {p.paid ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{p.payment_ref || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEdit && <EditModal influencer={data} onClose={() => setShowEdit(false)} onSave={() => { setShowEdit(false); fetchData(); }} />}

      {/* Payout Modal */}
      {showPayout && <PayoutModal influencerId={data.id} stats={data.stats} onClose={() => setShowPayout(false)} onSave={() => { setShowPayout(false); fetchData(); }} />}

      {/* Delete Confirmation */}
      {showDelete && (
        <Modal onClose={() => setShowDelete(false)}>
          <div className="text-center">
            <p className="text-4xl mb-3">⚠️</p>
            <h3 className="text-lg font-bold text-gray-900">Delete {data.name}?</h3>
            <p className="text-sm text-gray-500 mt-2">This removes all orders and payouts for this influencer. The Shopify campaign and discount code will remain — delete those manually in Shopify if needed.</p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowDelete(false)} className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={deleteInfluencer} className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700">Delete</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Modal Wrapper ──────────────────────────
function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

// ─── Edit Modal ─────────────────────────────
function EditModal({ influencer, onClose, onSave }: { influencer: InfluencerDetail; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({
    name: influencer.name,
    platform: influencer.platform,
    handle: influencer.handle || '',
    profile_image_url: influencer.profile_image_url || '',
    commission_pct: influencer.commission_pct,
    payout_day: influencer.payout_day,
    status: influencer.status,
    notes: influencer.notes || '',
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/influencers/${influencer.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        handle: form.handle || null,
        profile_image_url: form.profile_image_url || null,
        notes: form.notes || null,
      }),
    });
    if (res.ok) onSave();
    setSaving(false);
  }

  return (
    <Modal onClose={onClose}>
      <h3 className="text-lg font-bold text-gray-900 mb-4">Edit {influencer.name}</h3>
      <div className="space-y-3">
        <Field label="Name">
          <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Platform">
            <select className="input" value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}>
              <option value="instagram">Instagram</option>
              <option value="youtube">YouTube</option>
              <option value="twitter">Twitter / X</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field label="Handle">
            <input className="input" value={form.handle} onChange={e => setForm(f => ({ ...f, handle: e.target.value }))} placeholder="@username" />
          </Field>
        </div>
        <Field label="Profile Image URL">
          <input className="input" value={form.profile_image_url} onChange={e => setForm(f => ({ ...f, profile_image_url: e.target.value }))} placeholder="https://..." />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Commission %">
            <input className="input" type="number" value={form.commission_pct} onChange={e => setForm(f => ({ ...f, commission_pct: Number(e.target.value) }))} />
          </Field>
          <Field label="Payout Day">
            <input className="input" type="number" min={1} max={28} value={form.payout_day} onChange={e => setForm(f => ({ ...f, payout_day: Number(e.target.value) }))} />
          </Field>
          <Field label="Status">
            <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as 'active' | 'paused' | 'ended' }))}>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="ended">Ended</option>
            </select>
          </Field>
        </div>
        <Field label="Notes">
          <textarea className="input resize-none" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </Field>
      </div>
      <div className="flex gap-3 mt-5">
        <button onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
        <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </Modal>
  );
}

// ─── Payout Modal ───────────────────────────
function PayoutModal({ influencerId, stats, onClose, onSave }: {
  influencerId: string;
  stats: { total_orders: number; total_revenue: number; total_commission: number };
  onClose: () => void;
  onSave: () => void;
}) {
  const now = new Date();
  const [form, setForm] = useState({
    month: format(now, 'MMM-yy'),
    total_orders: stats.total_orders,
    total_revenue: stats.total_revenue,
    total_commission: stats.total_commission,
    paid: true,
    paid_date: format(now, 'yyyy-MM-dd'),
    payment_ref: '',
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const res = await fetch('/api/payouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ influencer_id: influencerId, ...form }),
    });
    if (res.ok) onSave();
    setSaving(false);
  }

  return (
    <Modal onClose={onClose}>
      <h3 className="text-lg font-bold text-gray-900 mb-4">Record Payout</h3>
      <div className="space-y-3">
        <Field label="Month">
          <input className="input" value={form.month} onChange={e => setForm(f => ({ ...f, month: e.target.value }))} placeholder="Jul-26" />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Orders">
            <input className="input" type="number" value={form.total_orders} onChange={e => setForm(f => ({ ...f, total_orders: Number(e.target.value) }))} />
          </Field>
          <Field label="Revenue">
            <input className="input" type="number" value={form.total_revenue} onChange={e => setForm(f => ({ ...f, total_revenue: Number(e.target.value) }))} />
          </Field>
          <Field label="Commission">
            <input className="input" type="number" value={form.total_commission} onChange={e => setForm(f => ({ ...f, total_commission: Number(e.target.value) }))} />
          </Field>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.paid} onChange={e => setForm(f => ({ ...f, paid: e.target.checked }))} className="rounded" />
            Paid
          </label>
        </div>
        {form.paid && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Paid Date">
              <input className="input" type="date" value={form.paid_date} onChange={e => setForm(f => ({ ...f, paid_date: e.target.value }))} />
            </Field>
            <Field label="Payment Ref (UPI/Bank)">
              <input className="input" value={form.payment_ref} onChange={e => setForm(f => ({ ...f, payment_ref: e.target.value }))} placeholder="UPI ref or txn ID" />
            </Field>
          </div>
        )}
      </div>
      <div className="flex gap-3 mt-5">
        <button onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
        <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Payout'}
        </button>
      </div>
    </Modal>
  );
}

// ─── Helpers ────────────────────────────────
function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 sm:p-5 ${highlight ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-200'}`}>
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
      <p className={`text-xl sm:text-2xl font-bold mt-1 ${highlight ? 'text-emerald-700' : 'text-gray-900'}`}>{value}</p>
    </div>
  );
}

function QuickCopy({ label, value, copied, onCopy }: { label: string; value: string; copied: boolean; onCopy: () => void }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      <p className="text-xs text-gray-500 font-medium mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <p className="text-xs text-gray-700 font-mono truncate flex-1">{value}</p>
        <button onClick={onCopy} className="shrink-0 text-xs text-gray-400 hover:text-gray-600">
          {copied ? '✓' : '⎘'}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );
}
