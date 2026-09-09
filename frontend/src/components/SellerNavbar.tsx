'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

interface User {
  name: string;
  token: string;
  role?: string;
  email?: string;
}

const NAV_LINKS = [
  { to: '/seller', label: 'Dashboard', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  )},
  { to: '/seller/products', label: 'Products', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  )},
  { to: '/seller/orders', label: 'Orders', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  )},
];

const SellerNavbar: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [dropdown, setDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) setUser(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setDropdown(false);
    router.push('/login');
  };

  const isActive = (path: string) => {
    if (path === '/seller') return pathname === '/seller';
    return pathname.startsWith(path);
  };

  return (
    <nav style={{
      background: 'var(--primary)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      borderBottom: '1px solid rgba(255,255,255,0.08)',
    }}>
      <div style={{
        maxWidth: 'var(--max-width-lg)',
        margin: '0 auto',
        padding: '0 24px',
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Left: Logo + Nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <Link href="/" style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            textDecoration: 'none',
            flexShrink: 0,
          }}>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: 20,
              fontWeight: 800,
              color: '#fff',
              letterSpacing: '-0.02em',
            }}>
              Shop<span style={{ color: 'var(--secondary-light)' }}>Smart</span>
            </span>
            <span style={{
              fontSize: 9,
              fontWeight: 800,
              color: 'var(--primary)',
              background: 'var(--secondary)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              letterSpacing: 1,
              textTransform: 'uppercase',
              lineHeight: 1.6,
            }}>
              SELLER
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div style={{
            display: 'flex',
            gap: 2,
          }}
          className="seller-nav-links"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                href={link.to}
                style={{
                  color: isActive(link.to) ? '#fff' : 'var(--text-light)',
                  fontSize: 13,
                  fontWeight: isActive(link.to) ? 600 : 500,
                  textDecoration: 'none',
                  padding: '8px 14px',
                  borderRadius: 'var(--radius)',
                  background: isActive(link.to) ? 'rgba(255,255,255,0.12)' : 'transparent',
                  transition: 'all var(--duration) var(--ease)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  borderBottom: isActive(link.to) ? '2px solid var(--secondary)' : '2px solid transparent',
                }}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}

            <Link
              href="/manage"
              style={{
                color: isActive('/manage') ? '#fff' : 'var(--text-light)',
                fontSize: 13,
                fontWeight: isActive('/manage') ? 600 : 500,
                textDecoration: 'none',
                padding: '8px 14px',
                borderRadius: 'var(--radius)',
                background: isActive('/manage') ? 'rgba(255,255,255,0.12)' : 'transparent',
                transition: 'all var(--duration) var(--ease)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                borderBottom: isActive('/manage') ? '2px solid var(--secondary)' : '2px solid transparent',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              Manage
            </Link>
          </div>
        </div>

        {/* Right: Buyer Mode + User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => router.push('/')}
            className="btn btn-secondary btn-sm"
            style={{
              fontSize: 12,
              padding: '6px 14px',
              borderColor: 'rgba(255,255,255,0.25)',
              color: 'var(--text-light)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Buyer Mode
          </button>

          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setDropdown(!dropdown)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 12px',
                background: dropdown ? 'rgba(255,255,255,0.12)' : 'transparent',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
                transition: 'all var(--duration) var(--ease)',
                color: 'var(--text-light)',
              }}
            >
              <div style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--secondary), var(--tertiary))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 700,
                color: '#fff',
              }}>
                {(user?.name || 'S')[0].toUpperCase()}
              </div>
              <span style={{
                fontSize: 13,
                fontWeight: 500,
                maxWidth: 100,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {user?.name || 'Seller'}
              </span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  transition: 'transform var(--duration) var(--ease)',
                  transform: dropdown ? 'rotate(180deg)' : '',
                }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {dropdown && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: 220,
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
                padding: 6,
                animation: 'fadeSlideDown 0.15s ease',
                zIndex: 1001,
              }}>
                <div style={{
                  padding: '12px 14px',
                  borderBottom: '1px solid var(--border)',
                  marginBottom: 4,
                }}>
                  <div style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: 'var(--text)',
                  }}>
                    {user?.name || 'Seller'}
                  </div>
                  <div style={{
                    fontSize: 12,
                    color: 'var(--text-tertiary)',
                    marginTop: 2,
                  }}>
                    {user?.email || ''}
                  </div>
                </div>

                <Link
                  href="/manage"
                  onClick={() => setDropdown(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 14px',
                    fontSize: 13,
                    fontWeight: 500,
                    color: 'var(--text)',
                    textDecoration: 'none',
                    borderRadius: 'var(--radius)',
                    transition: 'background var(--duration-fast) var(--ease)',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-container)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                  Settings
                </Link>

                <button
                  onClick={logout}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--error)',
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderRadius: 'var(--radius)',
                    transition: 'background var(--duration-fast) var(--ease)',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--error-light)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="seller-mobile-toggle"
            style={{
              display: 'none',
              padding: 8,
              color: 'var(--text-light)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {mobileMenuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div
          className="seller-mobile-menu"
          style={{
            display: 'none',
            padding: '8px 24px 16px',
            borderTop: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              href={link.to}
              onClick={() => setMobileMenuOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                fontSize: 14,
                fontWeight: isActive(link.to) ? 600 : 500,
                color: isActive(link.to) ? '#fff' : 'var(--text-light)',
                textDecoration: 'none',
                borderRadius: 'var(--radius)',
                background: isActive(link.to) ? 'rgba(255,255,255,0.12)' : 'transparent',
                transition: 'all var(--duration) var(--ease)',
              }}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
          <Link
            href="/manage"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              fontSize: 14,
              fontWeight: isActive('/manage') ? 600 : 500,
              color: isActive('/manage') ? '#fff' : 'var(--text-light)',
              textDecoration: 'none',
              borderRadius: 'var(--radius)',
              background: isActive('/manage') ? 'rgba(255,255,255,0.12)' : 'transparent',
              transition: 'all var(--duration) var(--ease)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Manage
          </Link>
        </div>
      )}

      <style jsx>{`
        @media (max-width: 768px) {
          .seller-nav-links {
            display: none !important;
          }
          .seller-mobile-toggle {
            display: flex !important;
          }
          .seller-mobile-menu {
            display: block !important;
          }
        }
      `}</style>
    </nav>
  );
};

export default SellerNavbar;
