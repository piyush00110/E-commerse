import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { cartAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';

interface User {
  name: string;
  token: string;
  role?: string;
}

const CITIES = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'San Francisco', 'Seattle', 'Miami', 'Boston', 'Denver'];

const BuyerNavbar: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [deliverCity, setDeliverCity] = useState('New York');
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showMiniCart, setShowMiniCart] = useState(false);
  const miniCartRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
    const savedCity = localStorage.getItem('deliverCity');
    if (savedCity) setDeliverCity(savedCity);
  }, []);

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
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (miniCartRef.current && !miniCartRef.current.contains(e.target as Node)) {
        setShowMiniCart(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  const selectCity = (city: string) => {
    setDeliverCity(city);
    localStorage.setItem('deliverCity', city);
    setShowCityPicker(false);
  };

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 1000,
      background: 'var(--bg-white)',
      borderBottom: '1px solid var(--border-light)',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '10px 24px', maxWidth: 1440, margin: '0 auto',
      }}>
        <button onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu" style={{
          background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', padding: 4,
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <Link to="/" style={{
          fontSize: 22, fontWeight: 800, color: 'var(--tertiary)',
          whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', textDecoration: 'none',
          letterSpacing: '-0.5px',
        }}>
          Shop<span style={{ color: 'var(--secondary)', fontWeight: 300 }}>Smart</span>
        </Link>

        <div onClick={() => setShowCityPicker(!showCityPicker)} style={{
          position: 'relative', display: 'flex', alignItems: 'center', gap: 4,
          cursor: 'pointer', flexShrink: 0, padding: '4px 6px', borderRadius: 6,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--text-secondary)">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          <div style={{ lineHeight: 1.2 }}>
            <span style={{ fontSize: 10, color: 'var(--text-secondary)', display: 'block' }}>Deliver to</span>
            <strong style={{ fontSize: 12, color: 'var(--text)' }}>{deliverCity}</strong>
          </div>
          {showCityPicker && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, background: 'var(--bg-white)', color: 'var(--text)',
              borderRadius: 8, boxShadow: 'var(--shadow-lg)', padding: 12, zIndex: 1001, minWidth: 200,
              border: '1px solid var(--border)',
            }}>
              <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 13, color: 'var(--text-secondary)' }}>Choose location</div>
              {CITIES.map((city) => (
                <div key={city} onClick={(e) => { e.stopPropagation(); selectCity(city); }}
                  style={{
                    padding: '4px 8px', borderRadius: 4, fontSize: 13, cursor: 'pointer',
                    color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6,
                    background: city === deliverCity ? 'var(--primary-container)' : 'transparent',
                  }}>
                  {city === deliverCity && <span style={{ color: 'var(--tertiary)' }}>{'\u2713'}</span>}
                  {city}
                </div>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleSearch} style={{
          flex: 1, display: 'flex', maxWidth: 600, margin: '0 16px',
        }}>
          <input
            type="text"
            placeholder="Search ShopSmart"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1, padding: '9px 14px', border: '1px solid var(--outline-variant)',
              borderRadius: '8px 0 0 8px', fontSize: 14, outline: 'none',
              background: 'var(--surface-container-low)', color: 'var(--text)',
            }}
          />
          <button type="submit" aria-label="Search" style={{
            padding: '9px 16px', background: 'var(--tertiary)', border: 'none',
            borderRadius: '0 8px 8px 0', color: 'white', cursor: 'pointer',
            display: 'flex', alignItems: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {user ? (
            <>
              <Link to="/orders" style={{
                display: 'flex', flexDirection: 'column', fontSize: 11,
                color: 'var(--text-secondary)', textDecoration: 'none',
              }}>
                Returns
                <strong style={{ fontSize: 13, color: 'var(--text)' }}>& Orders</strong>
              </Link>
              <div style={{ position: 'relative', cursor: 'pointer' }}
                className="navbar-account-toggle">
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.2 }}>
                  Hello, {user.name.split(' ')[0]}
                </span>
                <strong style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.2 }}>Account</strong>
                <div className="account-dropdown" style={{
                  position: 'absolute', top: '100%', right: 0, background: 'var(--bg-white)',
                  color: 'var(--text)', borderRadius: 8, boxShadow: 'var(--shadow-lg)',
                  padding: 8, zIndex: 1001, minWidth: 200, display: 'none',
                  border: '1px solid var(--border)',
                }}>
                  <Link to="/account" style={{ display: 'block', padding: '6px 10px', borderRadius: 4, fontSize: 13, color: 'var(--text)' }}>Your Account</Link>
                  <Link to="/orders" style={{ display: 'block', padding: '6px 10px', borderRadius: 4, fontSize: 13, color: 'var(--text)' }}>Your Orders</Link>
                  <Link to="/wishlist" style={{ display: 'block', padding: '6px 10px', borderRadius: 4, fontSize: 13, color: 'var(--text)' }}>Your Wishlist</Link>
                  <Link to="/help" style={{ display: 'block', padding: '6px 10px', borderRadius: 4, fontSize: 13, color: 'var(--text)' }}>Help Center</Link>
                  <Link to="/buy" style={{ display: 'block', padding: '6px 10px', borderRadius: 4, fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>Quick Buy</Link>
                  {user.role === 'admin' && (
                    <>
                      <hr style={{ margin: '4px 0', borderColor: 'var(--border)' }} />
                      <Link to="/manage" style={{ display: 'block', padding: '6px 10px', borderRadius: 4, fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>Manage Store</Link>
                      <Link to="/shipping" style={{ display: 'block', padding: '6px 10px', borderRadius: 4, fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>Shipping Mgmt</Link>
                      <Link to="/shipping-dashboard" style={{ display: 'block', padding: '6px 10px', borderRadius: 4, fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>Shipping Dashboard</Link>
                      <Link to="/delivery" style={{ display: 'block', padding: '6px 10px', borderRadius: 4, fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>Delivery Portal</Link>
                    </>
                  )}
                  <hr style={{ margin: '4px 0', borderColor: 'var(--border)' }} />
                  <div onClick={handleLogout} style={{ padding: '6px 10px', borderRadius: 4, fontSize: 13, color: 'var(--error)', cursor: 'pointer' }}>Sign Out</div>
                </div>
              </div>
            </>
          ) : (
            <Link to="/login" style={{
              display: 'flex', flexDirection: 'column', fontSize: 11,
              color: 'var(--text-secondary)', textDecoration: 'none',
            }}>
              Hello, Sign in
              <strong style={{ fontSize: 13, color: 'var(--text)' }}>Account</strong>
            </Link>
          )}

          <button onClick={toggleTheme} aria-label="Toggle theme" style={{
            background: 'none', border: '1px solid var(--border)', borderRadius: 8,
            padding: '6px 8px', cursor: 'pointer', color: 'var(--text)', fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {theme === 'light' ? '\u{1F319}' : '\u2600\uFE0F'}
          </button>

          <div ref={miniCartRef} style={{ position: 'relative' }}
            onMouseEnter={() => setShowMiniCart(true)}
            onMouseLeave={() => setShowMiniCart(false)}>
            <Link to="/cart" style={{
              position: 'relative', display: 'flex', alignItems: 'center', gap: 4,
              color: 'var(--text)', textDecoration: 'none', padding: '4px 6px', borderRadius: 6,
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--text)">
                <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2S15.9 22 17 22s2-.9 2-2-.9-2-2-2zM7.17 14.75l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.86-7.01L19.42 4h-.01l-1.1 2-2.76 5H8.53l-.13-.27L6.16 6l-.95-2-.94-2H1v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25z"/>
              </svg>
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              <span style={{ fontSize: 11, lineHeight: 1 }}>Cart</span>
            </Link>
            {showMiniCart && user && cartItems.length > 0 && (
              <div className="mini-cart-dropdown">
                <div className="mini-cart-header">
                  <strong>Shopping Cart ({cartCount})</strong>
                </div>
                <div className="mini-cart-items">
                  {cartItems.slice(0, 4).map((item: any, idx: number) => (
                    <div key={idx} className="mini-cart-item" onClick={() => { setShowMiniCart(false); navigate('/cart'); }}>
                      <img src={item.image || item.images?.[0]} alt={item.name} className="mini-cart-img" />
                      <div className="mini-cart-info">
                        <div className="mini-cart-name">{item.name}</div>
                        <div className="mini-cart-qty">Qty: {item.quantity}</div>
                      </div>
                      <div className="mini-cart-price">${(item.price * item.quantity).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
                {cartItems.length > 4 && (
                  <div className="mini-cart-more">+{cartItems.length - 4} more items</div>
                )}
                <Link to="/cart" className="mini-cart-view" onClick={() => setShowMiniCart(false)}>
                  View Cart & Checkout {'\u2192'}
                </Link>
              </div>
            )}
            {showMiniCart && (!user || cartItems.length === 0) && (
              <div className="mini-cart-dropdown">
                <div className="mini-cart-empty">
                  <span style={{ fontSize: 32 }}>{'\u{1F6D2}'}</span>
                  <p style={{ marginTop: 8, fontSize: 14 }}>Your cart is empty</p>
                  <Link to="/products" className="mini-cart-view" onClick={() => setShowMiniCart(false)}>
                    Shop Now {'\u2192'}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {menuOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, bottom: 0, width: 280,
          background: 'var(--bg-white)', zIndex: 2000,
          boxShadow: '4px 0 16px rgba(0,0,0,0.15)', overflowY: 'auto',
        }}>
          <div style={{
            background: 'var(--surface-container)', color: 'var(--text)',
            padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <strong style={{ fontSize: 16 }}>Shop by Category</strong>
            <button onClick={() => setMenuOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: 20, cursor: 'pointer' }}>{'\u2715'}</button>
          </div>
          <div style={{ padding: 8 }}>
            {['Electronics', 'Fashion', 'Home & Kitchen', 'Books', 'Beauty', 'Sports & Outdoors', 'Toys & Games'].map((cat) => (
              <Link key={cat} to={`/products?category=${cat.toLowerCase().replace(/ & /g, '-').replace(/\s+/g, '-')}`} onClick={() => setMenuOpen(false)}
                style={{ display: 'block', padding: '10px 12px', borderRadius: 6, fontSize: 14, color: 'var(--text)', borderBottom: '1px solid var(--border)' }}>
                {cat}
              </Link>
            ))}
            <hr style={{ margin: '8px 0', borderColor: 'var(--border)' }} />
            <div style={{ padding: '8px 12px', fontWeight: 600, fontSize: 14, color: 'var(--text-secondary)' }}>Your Account</div>
            <Link to="/orders" onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '10px 12px', borderRadius: 6, fontSize: 14, color: 'var(--text)' }}>My Orders</Link>
            <Link to="/account" onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '10px 12px', borderRadius: 6, fontSize: 14, color: 'var(--text)' }}>Account</Link>
            <Link to="/wishlist" onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '10px 12px', borderRadius: 6, fontSize: 14, color: 'var(--text)' }}>Wishlist</Link>
            <Link to="/help" onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '10px 12px', borderRadius: 6, fontSize: 14, color: 'var(--text)' }}>Help Center</Link>
            {user?.role === 'admin' && (
              <>
                <Link to="/manage" onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '10px 12px', borderRadius: 6, fontSize: 14, color: 'var(--text)', fontWeight: 600 }}>Manage Store</Link>
                <Link to="/shipping" onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '10px 12px', borderRadius: 6, fontSize: 14, color: 'var(--text)', fontWeight: 600 }}>Shipping Mgmt</Link>
                <Link to="/delivery" onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '10px 12px', borderRadius: 6, fontSize: 14, color: 'var(--text)', fontWeight: 600 }}>Delivery</Link>
              </>
            )}
          </div>
        </div>
      )}

      <div className="navbar-sub">
        <div className="navbar-sub-links">
          <Link to="/products?category=electronics">Electronics</Link>
          <Link to="/products?category=fashion">Fashion</Link>
          <Link to="/products?category=home-kitchen">Home & Kitchen</Link>
          <Link to="/products?category=books">Books</Link>
          <Link to="/products?category=beauty">Beauty</Link>
          <Link to="/products?category=sports-outdoors">Sports</Link>
          <Link to="/products?category=toys-games">Toys & Games</Link>
          <Link to="/help">Help</Link>
          <Link to="/seller/products/add">{'\u{1F4E1}'} Sell</Link>
        </div>
      </div>
    </nav>
  );
};

export default BuyerNavbar;
