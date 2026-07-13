import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

interface User { name: string; token: string; role?: string; email?: string; }

const NAV_LINKS = [
  { to: '/seller', label: 'Dashboard', icon: '\u{1F4CA}' },
  { to: '/seller/products', label: 'Products', icon: '\u{1F4E6}' },
  { to: '/seller/orders', label: 'Orders', icon: '\u{1F4E8}' },
];

const SellerNavbar: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [dropdown, setDropdown] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
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
    navigate('/login');
  };

  const isActive = (path: string) => {
    if (path === '/seller') return location.pathname === '/seller';
    return location.pathname.startsWith(path);
  };

  return (
    <nav style={{
      background: 'var(--tertiary)', color: 'var(--text-white)', position: 'sticky',
      top: 0, zIndex: 1000, boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        maxWidth: 1440, margin: '0 auto', padding: '0 24px', height: 56,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <Link to="/" style={{
            fontSize: 20, fontWeight: 700, color: 'var(--secondary)',
            whiteSpace: 'nowrap', textDecoration: 'none', display: 'flex', alignItems: 'baseline', gap: 6,
          }}>
            Shop<span style={{ color: 'var(--text-light)', fontWeight: 300 }}>Smart</span>
            <span style={{
              fontSize: 9, color: 'var(--tertiary)', fontWeight: 800,
              background: 'rgba(255,255,255,0.15)', padding: '2px 6px', borderRadius: 4,
              letterSpacing: 1, textTransform: 'uppercase',
            }}>SELLER</span>
          </Link>
          <div style={{ display: 'flex', gap: 4 }}>
            {NAV_LINKS.map((link) => (
              <Link key={link.to} to={link.to} style={{
                color: isActive(link.to) ? 'var(--secondary)' : 'var(--text-light)',
                fontSize: 13, fontWeight: isActive(link.to) ? 700 : 500,
                textDecoration: 'none', padding: '8px 14px', borderRadius: 8,
                background: isActive(link.to) ? 'rgba(255,255,255,0.12)' : 'transparent',
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <span style={{ fontSize: 14 }}>{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>
          <Link to="/manage" style={{
            color: isActive('/manage') ? 'var(--secondary)' : 'var(--text-light)',
            fontSize: 13, fontWeight: isActive('/manage') ? 700 : 500,
            textDecoration: 'none', padding: '8px 14px', borderRadius: 8,
            background: isActive('/manage') ? 'rgba(255,255,255,0.12)' : 'transparent',
            transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ fontSize: 14 }}>{'\u2699'}</span>
            Manage
          </Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/')} style={{
            padding: '6px 14px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            color: 'var(--text-light)', whiteSpace: 'nowrap', transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          >
            {'\u{1F464}'} Buyer Mode
          </button>
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button onClick={() => setDropdown(!dropdown)} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px',
              background: dropdown ? 'rgba(255,255,255,0.15)' : 'transparent',
              border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8,
              cursor: 'pointer', transition: 'all 0.2s', color: 'var(--text-light)',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
            onMouseLeave={(e) => { if (!dropdown) e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: '50%', background: 'var(--secondary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: 'var(--primary)',
              }}>{(user?.name || 'S')[0].toUpperCase()}</div>
              <span style={{ fontSize: 13, fontWeight: 500, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name || 'Seller'}
              </span>
              <span style={{ fontSize: 10, transition: 'transform 0.2s', transform: dropdown ? 'rotate(180deg)' : '' }}>{'\u25BC'}</span>
            </button>
            {dropdown && (
              <div style={{
                position: 'absolute', top: '100%', right: 0, marginTop: 8, width: 200,
                background: 'var(--bg-card)', border: '1px solid var(--border-light)',
                borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', padding: 6,
                animation: 'fadeSlideUp 0.15s ease', zIndex: 1001,
              }}>
                <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-light)', marginBottom: 4 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{user?.name || 'Seller'}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{user?.email || ''}</div>
                </div>
                <Link to="/manage" onClick={() => setDropdown(false)} style={{
                  display: 'block', padding: '8px 12px', fontSize: 13, fontWeight: 500,
                  color: 'var(--text)', textDecoration: 'none', borderRadius: 6,
                  transition: 'background 0.15s',
                }}>{'\u2699'} Settings</Link>
                <button onClick={logout} style={{
                  display: 'block', width: '100%', padding: '8px 12px', fontSize: 13, fontWeight: 600,
                  color: 'var(--error)', background: 'none', border: 'none', textAlign: 'left',
                  cursor: 'pointer', borderRadius: 6, transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--error-light)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >{'\u{1F6AA}'} Logout</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default SellerNavbar;
