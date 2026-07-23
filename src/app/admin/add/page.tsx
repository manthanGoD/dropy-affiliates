'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Influencer } from '@/types';
import { generateDiscountCode, generateCampaignName, getDashboardUrl } from '@/lib/utils';
import QRCode from 'qrcode';

export default function AddInfluencer() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<Influencer | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState('');

  const [form, setForm] = useState<{
    name: string;
    platform: string;
    handle: string;
    profile_image_url: string;
    discount_code: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    commission_pct: number;
    payout_day: number;
    notes: string;
    combines_product: boolean;
    combines_order: boolean;
    combines_shipping: boolean;
  }>({
    name: '',
    platform: 'instagram',
    handle: '',
    profile_image_url: '',
    discount_code: '',
    discount_type: 'percentage',
    discount_value: 5,
    commission_pct: 5,
    payout_day: 1,
    notes: '',
    combines_product: true,
    combines_order: false,
    combines_shipping: false,
  });

  // Auto-generate discount code when name or discount_value changes
  useEffect(() => {
    if (form.name) {
      const suggested = generateDiscountCode(form.name, form.discount_value);
      setForm(prev => ({ ...prev, discount_code: suggested }));
    }
  }, [form.name, form.discount_value]);

  const campaignPreview = form.name ? generateCampaignName(form.name, form.platform) : '';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch('/api/influencers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(`Error: ${data.error}`);
        setSaving(false);
        return;
      }

      setResult(data);

      // Generate QR code
      if (data.shareable_link) {
        const qr = await QRCode.toDataURL(data.shareable_link, {
          width: 300,
          margin: 2,
          color: { dark: '#000000', light: '#ffffff' },
        });
        setQrDataUrl(qr);
      }
    } catch {
      alert('Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  async function copyToClipboard(text: string, label: string) {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  }

  function generateMessage() {
    if (!result) return '';
    const discountText = form.discount_type === 'percentage'
      ? `${form.discount_value}% off`
      : `₹${form.discount_value} off`;

    return `Hey ${result.name}! 🎉

Here's everything you need to start promoting Dropy:

🔗 Your unique link:
${result.shareable_link}

🏷️ Discount code for your followers:
${result.discount_code} (${discountText})

💰 Your commission: ${result.commission_pct}% on every order through your code

📊 Track your performance:
${getDashboardUrl(result.dashboard_token)}

Share the link in your bio and mention the code in your content. Let's get started! 🚀`;
  }

  // ─── Result Screen ──────────────────────────
  if (result) {
    const message = generateMessage();
    const dashboardUrl = getDashboardUrl(result.dashboard_token);

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✅</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{result.name} is set up!</h1>
          <p className="text-sm text-gray-500 mt-1">Campaign, discount code, and dashboard created</p>
        </div>

        {/* Quick copy cards */}
        <div className="space-y-3">
          <CopyCard
            label="Shareable Link"
            value={result.shareable_link || ''}
            copied={copied === 'link'}
            onCopy={() => copyToClipboard(result.shareable_link || '', 'link')}
          />
          <CopyCard
            label="Discount Code"
            value={result.discount_code}
            copied={copied === 'code'}
            onCopy={() => copyToClipboard(result.discount_code, 'code')}
          />
          <CopyCard
            label="Dashboard Link"
            value={dashboardUrl}
            copied={copied === 'dash'}
            onCopy={() => copyToClipboard(dashboardUrl, 'dash')}
          />
        </div>

        {/* QR Code */}
        {qrDataUrl && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <p className="text-sm font-medium text-gray-700 mb-3">QR Code</p>
            <img src={qrDataUrl} alt="QR Code" className="mx-auto w-48 h-48" />
            <a
              href={qrDataUrl}
              download={`${result.name}-qr.png`}
              className="inline-block mt-3 text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Download PNG
            </a>
          </div>
        )}

        {/* Ready-to-send message */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-700">Ready-to-send message</p>
            <button
              onClick={() => copyToClipboard(message, 'msg')}
              className="text-sm text-gray-500 hover:text-gray-700 font-medium"
            >
              {copied === 'msg' ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
          <pre className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 rounded-lg p-4 font-sans">
            {message}
          </pre>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => { setResult(null); setForm({ name: '', platform: 'instagram', handle: '', profile_image_url: '', discount_code: '', discount_type: 'percentage', discount_value: 5, commission_pct: 5, payout_day: 1, notes: '', combines_product: true, combines_order: false, combines_shipping: false }); }}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            + Add Another
          </button>
          <button
            onClick={() => router.push('/admin')}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ─── Form ───────────────────────────────────
  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Add Influencer</h1>
        <p className="text-sm text-gray-500 mt-1">Creates Shopify campaign + discount code automatically</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Section title="Influencer Info">
          <Field label="Name" required>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Dia"
              className="input"
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Platform">
              <select
                value={form.platform}
                onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}
                className="input"
              >
                <option value="instagram">Instagram</option>
                <option value="youtube">YouTube</option>
                <option value="twitter">Twitter / X</option>
                <option value="facebook">Facebook</option>
                <option value="other">Other</option>
              </select>
            </Field>

            <Field label="Handle">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
                <input
                  type="text"
                  value={form.handle}
                  onChange={e => setForm(f => ({ ...f, handle: e.target.value }))}
                  placeholder="username"
                  className="input pl-7"
                />
              </div>
            </Field>
          </div>

          <Field label="Profile Image URL">
            <input
              type="url"
              value={form.profile_image_url}
              onChange={e => setForm(f => ({ ...f, profile_image_url: e.target.value }))}
              placeholder="https://..."
              className="input"
            />
            {form.profile_image_url && (
              <img src={form.profile_image_url} alt="Preview" className="w-12 h-12 rounded-full mt-2 object-cover" />
            )}
          </Field>
        </Section>

        {/* Discount */}
        <Section title="Customer Discount">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Type">
              <select
                value={form.discount_type}
                onChange={e => setForm(f => ({ ...f, discount_type: e.target.value as 'percentage' | 'fixed' }))}
                className="input"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </Field>
            <Field label="Value">
              <div className="relative">
                <input
                  type="number"
                  value={form.discount_value}
                  onChange={e => setForm(f => ({ ...f, discount_value: Number(e.target.value) }))}
                  className="input pr-8"
                  min={1}
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  {form.discount_type === 'percentage' ? '%' : '₹'}
                </span>
              </div>
            </Field>
          </div>

          <Field label="Discount Code">
            <input
              type="text"
              value={form.discount_code}
              onChange={e => setForm(f => ({ ...f, discount_code: e.target.value }))}
              placeholder="Auto-generated from name"
              className="input font-mono uppercase"
              required
            />
            <p className="text-xs text-gray-400 mt-1">Auto-suggested. Edit before saving if needed.</p>
          </Field>
        </Section>

        {/* Combinations */}
        <Section title="Discount Stacking Rules">
          <p className="text-xs mb-3" style={{ color: 'var(--text-sec, #666)' }}>Choose which other discounts can be used together with this influencer code at checkout.</p>
          <div className="space-y-3">
            <CombinationToggle
              label="Product Discounts"
              checked={form.combines_product}
              onChange={v => setForm(f => ({ ...f, combines_product: v }))}
              tooltip="Includes Buy-X-Get-Y, free gifts, and percentage-off on specific products or collections. Enable this so your free gift offers (like CeraVe) still work alongside the influencer code."
              recommended
            />
            <CombinationToggle
              label="Order Discounts"
              checked={form.combines_order}
              onChange={v => setForm(f => ({ ...f, combines_order: v }))}
              tooltip="Includes flat-off codes (like FIRST200), other influencer codes, and any order-level discounts. Keep this OFF to prevent customers from stacking multiple discount codes — protects your margins."
            />
            <CombinationToggle
              label="Shipping Discounts"
              checked={form.combines_shipping}
              onChange={v => setForm(f => ({ ...f, combines_shipping: v }))}
              tooltip="Allows the influencer code to be used alongside free shipping or discounted shipping offers. Usually safe to leave OFF unless you run shipping promos."
            />
          </div>
        </Section>

        {/* Commission */}
        <Section title="Commission & Payout">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Commission %">
              <div className="relative">
                <input
                  type="number"
                  value={form.commission_pct}
                  onChange={e => setForm(f => ({ ...f, commission_pct: Number(e.target.value) }))}
                  className="input pr-8"
                  min={1}
                  max={50}
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
              </div>
            </Field>
            <Field label="Payout Day (of month)">
              <input
                type="number"
                value={form.payout_day}
                onChange={e => setForm(f => ({ ...f, payout_day: Number(e.target.value) }))}
                className="input"
                min={1}
                max={28}
              />
            </Field>
          </div>
        </Section>

        {/* Campaign Preview */}
        {campaignPreview && (
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">Will Create</p>
            <div className="space-y-1.5 text-sm">
              <p><span className="text-gray-500">Campaign:</span> <span className="font-medium">{campaignPreview}</span></p>
              <p><span className="text-gray-500">Code:</span> <span className="font-mono font-medium">{form.discount_code.toUpperCase()}</span></p>
              <p><span className="text-gray-500">Customer gets:</span> <span className="font-medium">{form.discount_type === 'percentage' ? `${form.discount_value}%` : `₹${form.discount_value}`} off</span></p>
              <p><span className="text-gray-500">Influencer gets:</span> <span className="font-medium">{form.commission_pct}% commission</span></p>
              <p><span className="text-gray-500">Stacks with:</span> <span className="font-medium">{[form.combines_product && 'Product', form.combines_order && 'Order', form.combines_shipping && 'Shipping'].filter(Boolean).join(', ') || 'Nothing (standalone)'}</span></p>
            </div>
          </div>
        )}

        {/* Notes */}
        <Field label="Notes (optional)">
          <textarea
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Any notes about the deal..."
            className="input resize-none"
            rows={2}
          />
        </Field>

        {/* Submit */}
        <button
          type="submit"
          disabled={saving || !form.name}
          className="w-full py-3 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Creating...' : 'Create Influencer + Shopify Campaign'}
        </button>
      </form>
    </div>
  );
}

// ─── Helper Components ──────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

function CopyCard({ label, value, copied, onCopy }: { label: string; value: string; copied: boolean; onCopy: () => void }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-sm text-gray-900 font-mono truncate mt-0.5">{value}</p>
      </div>
      <button
        onClick={onCopy}
        className="shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
      >
        {copied ? '✓ Copied' : 'Copy'}
      </button>
    </div>
  );
}

function CombinationToggle({ label, checked, onChange, tooltip, recommended }: { label: string; checked: boolean; onChange: (v: boolean) => void; tooltip: string; recommended?: boolean }) {
  const [showTip, setShowTip] = useState(false);
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl border transition-colors" style={{ borderColor: checked ? 'rgba(108,92,231,0.3)' : 'rgba(0,0,0,0.06)', background: checked ? 'rgba(108,92,231,0.03)' : 'transparent' }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="mt-0.5 rounded"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium" style={{ color: 'var(--text, #1a1a1a)' }}>{label}</span>
          {recommended && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700">RECOMMENDED</span>}
          <button
            type="button"
            onClick={() => setShowTip(!showTip)}
            className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
            style={{ background: 'rgba(0,0,0,0.06)', color: '#888' }}
          >
            ?
          </button>
        </div>
        {showTip && (
          <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'var(--text-sec, #666)' }}>{tooltip}</p>
        )}
      </div>
    </div>
  );
}
