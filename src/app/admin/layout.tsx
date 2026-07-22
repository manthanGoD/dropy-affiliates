'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: '◉' },
  { href: '/admin/add', label: 'Add Influencer', icon: '+' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  return (
    <div className="flex h-screen">
      {open && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={close} />}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-56 flex flex-col transform transition-transform duration-200 lg:transform-none ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`} style={{ background: 'var(--sidebar-bg)' }}>
        <div className="p-5">
          <Link href="/admin" className="flex items-center gap-2.5" onClick={close}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent)' }}>
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <div>
              <h1 className="font-bold text-white text-sm tracking-tight">Dropy</h1>
              <p className="text-[10px] tracking-wider" style={{ color: 'var(--sidebar-text)' }}>AFFILIATES</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-3 mt-4 space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                  isActive
                    ? 'text-white'
                    : 'hover:text-white'
                }`}
                style={{
                  color: isActive ? 'var(--sidebar-active)' : 'var(--sidebar-text)',
                  background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                }}
              >
                <span className="text-xs w-5 text-center">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4">
          <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <p className="text-[10px] font-medium" style={{ color: 'var(--sidebar-text)' }}>POWERED BY</p>
            <p className="text-[11px] text-white font-semibold mt-0.5">Dropy India</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto" style={{ background: 'var(--bg)' }}>
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b bg-white sticky top-0 z-30" style={{ borderColor: 'var(--border)' }}>
          <button onClick={() => setOpen(true)} className="text-gray-500">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 10h14M3 5h14M3 15h14"/></svg>
          </button>
          <span className="font-bold text-sm tracking-tight">Dropy Affiliates</span>
        </div>
        <div className="p-4 sm:p-6 lg:p-8 page-enter">{children}</div>
      </main>
    </div>
  );
}
