'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { verifyAdminAccess, type AdminCheckResult } from '../../lib/admin';

const NAV_ITEMS = [
  { href: '/manage', icon: '\u2302', label: 'Dashboard' },
  { href: '/manage?tab=products', icon: '\u2261', label: 'Products' },
  { href: '/manage?tab=categories', icon: '\u25A4', label: 'Categories' },
  { href: '/manage?tab=orders', icon: '\u2299', label: 'Orders' },
  { href: '/manage?tab=analytics', icon: '\u2197', label: 'Analytics' },
  { href: '/manage?tab=users', icon: '\u263A', label: 'Users' },
  { href: '/shipping', icon: '\u2708', label: 'Shipping' },
  { href: '/shipping-dashboard', icon: '\u2699', label: 'Fulfillment' },
  { href: '/delivery', icon: '\u2699', label: 'Delivery' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [blocked, setBlocked] = useState<Exclude<AdminCheckResult, { ok: true }> | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await verifyAdminAccess();
      if (cancelled) return;
      if (result.ok) {
        setAuthorized(true);
      } else if (result.reason === 'not-logged-in') {
        router.replace('/login?redirect=%2Fmanage');
      } else {
        // Logged in but not the designated admin — show restricted screen,
        // do not reveal the panel contents.
        setBlocked(result);
      }
    })();
    return () => { cancelled = true; };
  }, [router]);

  const [search, setSearch] = useState('');
  useEffect(() => {
    if (typeof window !== 'undefined') setSearch(window.location.search);
  }, [pathname]);
  const currentPath = pathname + search;

  if (blocked) {
    return (
      <div style={{ maxWidth: 520, margin: '80px auto', padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Admin access restricted</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
          {blocked.reason === 'not-allowlisted'
            ? 'This store is managed by a single administrator. Your account does not have permission to view this panel.'
            : 'Your account does not have permission to view this panel.'}
        </p>
        <Link href="/" className="btn btn-primary" style={{ marginTop: 24, display: 'inline-block', textDecoration: 'none' }}>
          Back to Store
        </Link>
      </div>
    );
  }

  if (!authorized) return <div className="spinner" />;

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <div className="admin-sidebar-logo">S</div>
          <div>
            <div className="admin-sidebar-name">ShopSmart</div>
            <div className="admin-sidebar-role">Admin Panel</div>
          </div>
        </div>

        <nav className="admin-sidebar-nav">
          {NAV_ITEMS.map((item) => {
            const active = currentPath === item.href || (item.href === '/manage' && pathname === '/manage' && !search.includes('tab='));
            return (
              <Link key={item.href} href={item.href}
                className={`admin-sidebar-link ${active ? 'active' : ''}`}>
                <span className="admin-sidebar-icon">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <Link href="/" className="admin-sidebar-link">
            <span className="admin-sidebar-icon">{'\u2190'}</span>
            <span>Main Store</span>
          </Link>
          <div className="admin-sidebar-user">
            <div className="admin-sidebar-avatar">A</div>
            <div>
              <div className="admin-sidebar-username">Admin</div>
              <div className="admin-sidebar-userrole">Administrator</div>
            </div>
          </div>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-title">
            {NAV_ITEMS.find((i) => currentPath === i.href)?.label || 'Dashboard'}
          </div>
          <div className="admin-topbar-actions">
            <Link href="/" className="admin-topbar-btn">
              {'\u{1F3E0}'} View Store
            </Link>
          </div>
        </header>
        <main className="admin-content">
          {children}
        </main>
      </div>
    </div>
  );
}
