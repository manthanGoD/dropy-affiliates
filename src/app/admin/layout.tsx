'use client';
import { useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const nav = [
  { href: '/admin', label: 'Dashboard', icon: '⬡' },
  { href: '/admin/add', label: 'Add Creator', icon: '＋' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  return (
    <div className="flex h-screen" style={{ background: 'var(--bg)' }}>
      {open && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={close} />}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-[220px] flex flex-col border-r transform transition-transform duration-200 lg:transform-none ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`} style={{ background: 'rgba(13,13,15,0.95)', borderColor: 'var(--border)', backdropFilter: 'blur(20px)' }}>
        <div className="p-5 pb-6">
          <Link href="/admin" className="flex items-center gap-2.5" onClick={close}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center gradient-orange glow-orange">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <div>
              <h1 className="font-bold text-white text-[15px] tracking-tight">Dropy</h1>
              <p className="text-[10px] tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>AFFILIATES</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          <p className="text-[10px] font-semibold tracking-[0.15em] px-3 mb-2" style={{ color: 'var(--text-muted)' }}>MENU</p>
          {nav.map(item => {
            const active = path === item.href;
            return (
              <Link key={item.href} href={item.href} onClick={close}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150`}
                style={{ background: active ? 'rgba(255,255,255,0.06)' : 'transparent', color: active ? '#fff' : 'var(--text-secondary)' }}>
                <span className="text-sm w-5 text-center opacity-60">{item.icon}</span>
                {item.label}
                {active && <div className="ml-auto w-1.5 h-1.5 rounded-full gradient-orange" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4">
          <div className="card p-3 text-center">
            <p className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>POWERED BY</p>
            <p className="text-[11px] text-white font-semibold mt-0.5">dropy.in</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b sticky top-0 z-30" style={{ background: 'rgba(13,13,15,0.8)', backdropFilter: 'blur(20px)', borderColor: 'var(--border)' }}>
          <button onClick={() => setOpen(true)} className="text-white/60">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 10h14M3 5h14M3 15h14"/></svg>
          </button>
          <span className="font-bold text-sm">Dropy Affiliates</span>
        </div>
        <div className="p-4 sm:p-6 lg:p-8 page-enter">{children}</div>
      </main>
    </div>
  );
}
