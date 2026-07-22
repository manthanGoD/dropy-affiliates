'use client';
import { useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const nav = [
  { href: '/admin', label: 'Dashboard', icon: '◉' },
  { href: '/admin/add', label: 'Add Creator', icon: '＋' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  return (
    <div className="flex h-screen" style={{ background: 'var(--bg)' }}>
      {open && <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden" onClick={close} />}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-[200px] flex flex-col transform transition-transform duration-200 lg:transform-none rounded-r-3xl lg:rounded-none overflow-hidden ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ background: 'var(--sidebar)' }}>
        <div className="p-5 pb-8">
          <Link href="/admin" className="flex items-center gap-2.5" onClick={close}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/20 backdrop-blur">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <div>
              <h1 className="font-bold text-white text-[15px]">Dropy</h1>
              <p className="text-[10px] text-white/40 tracking-[0.2em]">AFFILIATES</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {nav.map(item => {
            const active = path === item.href;
            return (
              <Link key={item.href} href={item.href} onClick={close}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150"
                style={{ background: active ? 'rgba(255,255,255,0.2)' : 'transparent', color: active ? '#fff' : 'rgba(255,255,255,0.5)' }}>
                <span className="text-sm w-5 text-center">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4">
          <div className="rounded-xl p-3 bg-white/10 backdrop-blur text-center">
            <p className="text-[10px] text-white/40">POWERED BY</p>
            <p className="text-[11px] text-white font-semibold mt-0.5">dropy.in</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 glass sticky top-0 z-30 rounded-none border-0 border-b" style={{ borderColor: 'var(--border-outer)' }}>
          <button onClick={() => setOpen(true)} style={{ color: 'var(--purple)' }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 10h14M3 5h14M3 15h14"/></svg>
          </button>
          <span className="font-bold text-sm">Dropy Affiliates</span>
        </div>
        <div className="p-4 sm:p-6 lg:p-8 page-enter">{children}</div>
      </main>
    </div>
  );
}
