'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/add', label: 'Add Influencer', icon: '➕' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="flex h-screen bg-[var(--bg-primary)]">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden transition-opacity" onClick={closeSidebar} />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-60 bg-white border-r border-gray-100 flex flex-col transform transition-transform duration-200 ease-out lg:transform-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-5 border-b border-gray-100">
          <Link href="/admin" className="flex items-center gap-2.5" onClick={closeSidebar}>
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">D</span>
            </div>
            <div>
              <h1 className="font-semibold text-gray-900 text-[15px] leading-tight tracking-tight">Dropy Affiliates</h1>
              <p className="text-[11px] text-gray-400 tracking-wide">dropy.in</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeSidebar}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="text-sm">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <p className="text-[10px] text-gray-300 text-center uppercase tracking-widest">Built for Dropy India</p>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-500 hover:text-gray-900 transition-colors">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 10h14M3 5h14M3 15h14"/></svg>
          </button>
          <span className="font-semibold text-sm text-gray-900 tracking-tight">Dropy Affiliates</span>
        </div>

        <div className="p-4 sm:p-6 lg:p-8 page-enter">
          {children}
        </div>
      </main>
    </div>
  );
}
