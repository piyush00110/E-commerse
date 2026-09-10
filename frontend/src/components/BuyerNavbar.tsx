'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { cartAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { useScrollProgress } from '../hooks/useScrollProgress';

interface User {
  name: string;
  token: string;
  role?: string;
}

const CITIES = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'San Francisco', 'Seattle', 'Miami', 'Boston', 'Denver'];

const CATEGORIES = [
  { name: 'Electronics', slug: 'electronics' },
  { name: 'Fashion', slug: 'fashion' },
  { name: 'Home & Kitchen', slug: 'home-kitchen' },
  { name: 'Books', slug: 'books' },
  { name: 'Beauty', slug: 'beauty' },
  { name: 'Sports & Outdoors', slug: 'sports-outdoors' },
  { name: 'Toys & Games', slug: 'toys-games' },
  { name: 'Grocery', slug: 'grocery' },
  { name: 'Appliances', slug: 'appliances' },
  { name: 'Health', slug: 'health' },
];

const BuyerNavbar: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [deliverCity, setDeliverCity] = useState('New York');
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showMiniCart, setShowMiniCart] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const miniCartRef = useRef<HTMLDivElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const scrollProgress = useScrollProgress();

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) setUser(JSON.parse(stored));
    } catch { /* ignore corrupted data */ }
    const savedCity = localStorage.getItem('deliverCity');
    if (savedCity) setDeliverCity(savedCity);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (showMobileSearch && mobileSearchInputRef.current) {
      mobileSearchInputRef.current.focus();
    }
  }, [showMobileSearch]);

  useEffect(() => {
    if (showMobileSearch) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showMobileSearch]);

  const fetchCart = async () => {
    try {
      const stored = localStorage.getItem('user');
      if (!stored) return;
      const res = await cartAPI.get();
      const data = res.data.data;
      setCartCount(data.totalItems || 0);
      setCartItems(data.items || []);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    fetchCart();
    const interval = setInterval(fetchCart, 120000);
    const handleCartUpdate = () => fetchCart();
    window.addEventListener('cart-updated', handleCartUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener('cart-updated', handleCartUpdate);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (miniCartRef.current && !miniCartRef.current.contains(e.target as Node)) {
        setShowMiniCart(false);
      }
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setShowAccountMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowMobileSearch(false);
    }
  };

  const handleMobileSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowMobileSearch(false);
      setSearchQuery('');
    }
  };

  const handleLogout = async () => {
    const { supabase } = await import('../lib/supabase');
    await supabase.auth.signOut();
    localStorage.removeItem('user');
    setUser(null);
    router.push('/');
  };

  const selectCity = (city: string) => {
    setDeliverCity(city);
    localStorage.setItem('deliverCity', city);
    setShowCityPicker(false);
  };

  return (
    <>
      <div className="scroll-progress-bar" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: `${scrollProgress}%`,
        height: '3px',
        background: 'linear-gradient(90deg, var(--primary), var(--accent, #ff6b35))',
        zIndex: 10001,
        transition: 'width 0.1s ease-out'
      }} />

      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        {/* ── Top Bar: Location | Logo | Actions ── */}
        <div className="navbar-main" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16
        }}>
          {/* Left: Location */}
          <div className="navbar-location navbar-deliver-city" onClick={() => setShowCityPicker(!showCityPicker)}
            style={{ order: 1 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--primary)">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            <div>
              <span className="location-label">Deliver to</span>
              <strong className="location-city">{deliverCity}</strong>
            </div>
            {showCityPicker && (
              <div className="dropdown city-dropdown">
                <div className="dropdown-header">Choose location</div>
                {CITIES.map((city) => (
                  <div key={city} onClick={(e) => { e.stopPropagation(); selectCity(city); }}
                    className={`dropdown-item ${city === deliverCity ? 'active' : ''}`}>
                    {city === deliverCity && <span className="check-icon">{'\u2713'}</span>}
                    {city}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Center: Logo */}
          <Link href="/" className="navbar-logo" style={{ order: 2 }}>
            <span className="logo-icon">S</span>
            <span className="logo-text">Shop<span className="logo-accent">Smart</span></span>
          </Link>

          {/* Right: Actions */}
          <div className="navbar-actions" style={{ order: 3 }}>
            {/* SuperCoins badge */}
            <div className="navbar-action-item" style={{ cursor: 'default' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v12M8 10l4-4 4 4"/>
              </svg>
              <span className="action-sublabel" style={{ color: '#fbbf24' }}>0</span>
            </div>

            {/* Notifications */}
            <Link href="/orders" className="navbar-action-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 01-3.46 0"/>
              </svg>
              <span className="action-label">Returns</span>
              <span className="action-sublabel">{'&'} Orders</span>
            </Link>

            {/* Account / Profile */}
            {user ? (
              <div ref={accountRef} className="navbar-action-item account-toggle"
                onMouseEnter={() => setShowAccountMenu(true)}
                onMouseLeave={() => setShowAccountMenu(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <span className="action-label">Hello, {user.name.split(' ')[0]}</span>
                <span className="action-sublabel">Account</span>

                <div className={`account-dropdown ${showAccountMenu ? 'show' : ''}`}>
                  <Link href="/account" className="dropdown-link">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    Your Account
                  </Link>
                  <Link href="/orders" className="dropdown-link">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                    </svg>
                    Your Orders
                  </Link>
                  <Link href="/wishlist" className="dropdown-link">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                    </svg>
                    Your Wishlist
                  </Link>
                  <Link href="/help" className="dropdown-link">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
                    </svg>
                    Help Center
                  </Link>
                  <Link href="/buy" className="dropdown-link highlight">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                    </svg>
                    Quick Buy
                  </Link>
                  {user.role === 'admin' && (
                    <>
                      <div className="dropdown-divider" />
                      <Link href="/manage" className="dropdown-link admin">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                          <line x1="3" y1="9" x2="21" y2="9"/>
                          <line x1="9" y1="21" x2="9" y2="9"/>
                        </svg>
                        Manage Store
                      </Link>
                      <Link href="/shipping" className="dropdown-link admin">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="1" y="3" width="15" height="13"/>
                          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                        </svg>
                        Shipping Mgmt
                      </Link>
                      <Link href="/shipping-dashboard" className="dropdown-link admin">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2"/>
                          <line x1="3" y1="9" x2="21" y2="9"/>
                          <line x1="9" y1="21" x2="9" y2="9"/>
                        </svg>
                        Shipping Dashboard
                      </Link>
                      <Link href="/delivery" className="dropdown-link admin">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <polyline points="12 6 12 12 16 14"/>
                        </svg>
                        Delivery Portal
                      </Link>
                    </>
                  )}
                  <div className="dropdown-divider" />
                  <div onClick={handleLogout} className="dropdown-link logout">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                      <polyline points="16 17 21 12 16 7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Sign Out
                  </div>
                </div>
              </div>
            ) : (
              <Link href="/login" className="navbar-action-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <span className="action-label">Hello, Sign in</span>
                <span className="action-sublabel">Account</span>
              </Link>
            )}

            {/* Theme toggle */}
            <button onClick={toggleTheme} aria-label="Toggle theme" className="navbar-action-item theme-toggle">
              {theme === 'light' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/>
                  <line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              )}
            </button>

            {/* Cart */}
            <div ref={miniCartRef} className="cart-wrapper"
              onMouseEnter={() => setShowMiniCart(true)}
              onMouseLeave={() => setShowMiniCart(false)}>
              <Link href="/cart" className="navbar-action-item cart-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="21" r="1"/>
                  <circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
                </svg>
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                <span className="action-sublabel">Cart</span>
              </Link>

              {showMiniCart && user && cartItems.length > 0 && (
                <div className="mini-cart-dropdown">
                  <div className="mini-cart-header">
                    <span>Shopping Cart</span>
                    <span className="mini-cart-count">{cartCount} items</span>
                  </div>
                  <div className="mini-cart-items">
                    {cartItems.slice(0, 4).map((item: any, idx: number) => (
                      <div key={idx} className="mini-cart-item" onClick={() => { setShowMiniCart(false); router.push('/cart'); }}>
                        <img src={item.image || item.images?.[0]} alt={item.name} className="mini-cart-img" />
                        <div className="mini-cart-info">
                          <div className="mini-cart-name">{item.name}</div>
                          <div className="mini-cart-qty">Qty: {item.quantity}</div>
                        </div>
                        <div className="mini-cart-price">${((item.price ?? 0) * (item.quantity ?? 0)).toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                  {cartItems.length > 4 && (
                    <div className="mini-cart-more">+{cartItems.length - 4} more items</div>
                  )}
                  <Link href="/cart" className="mini-cart-view" onClick={() => setShowMiniCart(false)}>
                    View Cart & Checkout {'\u2192'}
                  </Link>
                </div>
              )}

              {showMiniCart && (!user || cartItems.length === 0) && (
                <div className="mini-cart-dropdown">
                  <div className="mini-cart-empty">
                    <div className="empty-cart-icon">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="9" cy="21" r="1"/>
                        <circle cx="20" cy="21" r="1"/>
                        <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
                      </svg>
                    </div>
                    <p>Your cart is empty</p>
                    <Link href="/products" className="mini-cart-view" onClick={() => setShowMiniCart(false)}>
                      Shop Now {'\u2192'}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Mobile hamburger (below top bar on mobile) ── */}
        <button className="hamburger-btn" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu"
          style={{ display: 'none', position: 'absolute', left: 8, top: '100%', transform: 'translateY(-100%)' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {/* ── Full-width Search Bar ── */}
        <form onSubmit={handleSearch} className="navbar-search" style={{
          maxWidth: '100%',
          padding: '0 24px 12px',
          background: 'var(--primary)',
        }}>
          <div className="search-input-wrapper" style={{
            borderRadius: 'var(--radius-full)',
            maxWidth: 900,
            margin: '0 auto',
            width: '100%',
          }}>
            <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search products, brands, categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ borderRadius: 'var(--radius-full)' }}
            />
            <button type="button" aria-label="Voice search" style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              color: 'var(--text-tertiary)',
              display: 'flex',
              alignItems: 'center',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
                <path d="M19 10v2a7 7 0 01-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            </button>
            <button type="button" aria-label="Camera search" style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              color: 'var(--text-tertiary)',
              display: 'flex',
              alignItems: 'center',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </button>
            <button type="submit" aria-label="Search" className="search-btn" style={{
              borderRadius: '0 var(--radius-full) var(--radius-full) 0',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </div>
        </form>

        {/* ── Mobile Menu Overlay ── */}
        {menuOpen && (
          <div className="mobile-menu-overlay" onClick={() => setMenuOpen(false)} />
        )}
        <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
          <div className="mobile-menu-header">
            <strong>Shop by Category</strong>
            <button onClick={() => setMenuOpen(false)} className="close-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="mobile-menu-content">
            {CATEGORIES.map((cat) => (
              <Link key={cat.slug} href={`/products?category=${cat.slug}`}
                className="mobile-menu-link" onClick={() => setMenuOpen(false)}>
                {cat.name}
              </Link>
            ))}
            <div className="mobile-menu-divider" />
            <div className="mobile-menu-section">Your Account</div>
            <Link href="/orders" className="mobile-menu-link" onClick={() => setMenuOpen(false)}>My Orders</Link>
            <Link href="/account" className="mobile-menu-link" onClick={() => setMenuOpen(false)}>Account</Link>
            <Link href="/wishlist" className="mobile-menu-link" onClick={() => setMenuOpen(false)}>Wishlist</Link>
            <Link href="/help" className="mobile-menu-link" onClick={() => setMenuOpen(false)}>Help Center</Link>
            {user?.role === 'admin' && (
              <>
                <div className="mobile-menu-divider" />
                <div className="mobile-menu-section">Admin</div>
                <Link href="/manage" className="mobile-menu-link" onClick={() => setMenuOpen(false)}>Manage Store</Link>
                <Link href="/shipping" className="mobile-menu-link" onClick={() => setMenuOpen(false)}>Shipping Mgmt</Link>
                <Link href="/delivery" className="mobile-menu-link" onClick={() => setMenuOpen(false)}>Delivery</Link>
              </>
            )}
          </div>
        </div>

        {/* ── Category Chips (horizontal scroll) ── */}
        <div className="subnavbar" style={{
          overflow: 'hidden',
          borderBottom: '1px solid var(--border-light)',
        }}>
          <div className="subnavbar-links" style={{
            display: 'flex',
            gap: 8,
            padding: '10px 24px',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}>
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/products?category=${cat.slug}`}
                style={{
                  flexShrink: 0,
                  padding: '6px 16px',
                  fontSize: 13,
                  fontWeight: 500,
                  color: pathname === `/products?category=${cat.slug}` ? 'var(--secondary)' : 'var(--text-secondary)',
                  background: pathname === `/products?category=${cat.slug}` ? 'rgba(99,102,241,0.08)' : 'var(--bg-container)',
                  borderRadius: 'var(--radius-full)',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                  border: pathname === `/products?category=${cat.slug}` ? '1px solid rgba(99,102,241,0.2)' : '1px solid transparent',
                }}
                className={pathname === `/products?category=${cat.slug}` ? 'active' : ''}
              >
                {cat.name}
              </Link>
            ))}
            <Link href="/help" style={{
              flexShrink: 0,
              padding: '6px 16px',
              fontSize: 13,
              fontWeight: 500,
              color: pathname === '/help' ? 'var(--secondary)' : 'var(--text-secondary)',
              background: pathname === '/help' ? 'rgba(99,102,241,0.08)' : 'var(--bg-container)',
              borderRadius: 'var(--radius-full)',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
              border: pathname === '/help' ? '1px solid rgba(99,102,241,0.2)' : '1px solid transparent',
            }}
              className={pathname === '/help' ? 'active' : ''}
            >
              Help
            </Link>
            <Link href="/seller/products/add" style={{
              flexShrink: 0,
              padding: '6px 16px',
              fontSize: 13,
              fontWeight: 600,
              color: 'white',
              background: 'var(--gradient-warm)',
              borderRadius: 'var(--radius-full)',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}>
              {'\u{1F4E1}'} Sell
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Mobile Search Overlay ── */}
      {showMobileSearch && (
        <div className="mobile-search-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'var(--bg-primary, #fff)',
          zIndex: 10002,
          display: 'flex',
          flexDirection: 'column',
          padding: '12px 16px',
          gap: '12px'
        }}>
          <form onSubmit={handleMobileSearch} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button type="button" onClick={() => { setShowMobileSearch(false); setSearchQuery(''); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-primary)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <div className="search-input-wrapper" style={{ flex: 1 }}>
              <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                ref={mobileSearchInputRef}
                type="text"
                placeholder="Search products, brands, categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button type="submit" aria-label="Search" className="search-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </form>
        </div>
      )}

      {/* ── Floating Pill Bottom Nav ── */}
      <div className="bottom-nav" style={{
        display: 'none',
        position: 'fixed',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 32px)',
        maxWidth: 420,
        height: 'auto',
        borderRadius: 'var(--radius-full)',
        background: 'rgba(255,255,255,0.72)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.3)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
        zIndex: 'var(--z-bottom-nav)',
        padding: '6px 8px',
      }}>
        <div className="bottom-nav-inner" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          height: 'auto',
        }}>
          <Link href="/" className="bottom-nav-item" style={{ flex: 1 }}>
            <span className="bottom-nav-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </span>
            <span>Home</span>
          </Link>

          <Link href="/products" className="bottom-nav-item" style={{ flex: 1 }}>
            <span className="bottom-nav-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </span>
            <span>Explore</span>
          </Link>

          <Link href="/cart" className="bottom-nav-item" style={{ flex: 1 }}>
            <span className="bottom-nav-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
              </svg>
              {cartCount > 0 && <span className="bottom-nav-badge">{cartCount}</span>}
            </span>
            <span>Cart</span>
          </Link>

          <Link href={user ? '/account' : '/login'} className="bottom-nav-item" style={{ flex: 1 }}>
            <span className="bottom-nav-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            <span>Profile</span>
          </Link>
        </div>
      </div>
    </>
  );
};

export default BuyerNavbar;
