'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cartAPI, productAPI } from '../services/api';
import { Cart, Product } from '../types';
import { useToast } from '../context/ToastContext';
import { CartSkeleton } from '../components/Skeleton';

const CartPage: React.FC = () => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [bouncingIds, setBouncingIds] = useState<Set<string>>(new Set());
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const [hoveredRemoveId, setHoveredRemoveId] = useState<string | null>(null);
  const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([]);
  const router = useRouter();
  const { showToast } = useToast();

  const fetchCart = async () => {
    try {
      const res = await cartAPI.get();
      setCart(res.data.data);
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
    const fetchSuggested = async () => {
      try {
        const res = await productAPI.getAll({ limit: 8, sort: '-rating' });
        setSuggestedProducts(res.data.data || []);
      } catch { /* ignore */ }
    };
    fetchSuggested();
  }, []);

  const triggerBounce = (itemId: string) => {
    setBouncingIds((prev) => new Set(prev).add(itemId));
    setTimeout(() => {
      setBouncingIds((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }, 400);
  };

  const handleQuantityChange = async (itemId: string, newQty: number) => {
    if (newQty < 1) return;
    triggerBounce(itemId);
    try {
      const res = await cartAPI.update(itemId, newQty);
      setCart(res.data.data);
      window.dispatchEvent(new Event('cart-updated'));
    } catch {
      showToast('Failed to update quantity', 'error');
    }
  };

  const handleRemove = async (itemId: string) => {
    setRemovingIds((prev) => new Set(prev).add(itemId));
    await new Promise((r) => setTimeout(r, 350));
    try {
      const res = await cartAPI.remove(itemId);
      setCart(res.data.data);
      window.dispatchEvent(new Event('cart-updated'));
      showToast('Item removed from cart', 'info');
    } catch {
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
      showToast('Failed to remove item', 'error');
    }
  };

  if (loading) return <CartSkeleton />;

  if (!cart || cart.items.length === 0) {
    return (
      <div className="empty-state">
        <div style={{ fontSize: 72, marginBottom: 16, opacity: 0.3, animation: 'floatingIcon 3s ease-in-out infinite' }}>
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
        </div>
        <h2>Your Cart is Empty</h2>
        <p>Looks like you haven&apos;t added any items yet.</p>
        <Link href="/products" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-block', marginTop: 8 }}>
          Continue Shopping
        </Link>
        <style>{`
          @keyframes floatingIcon {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-12px); }
          }
        `}</style>
      </div>
    );
  }

  const subtotal = cart.items.reduce((sum, item) => sum + (item.price ?? 0) * (item.quantity ?? 0), 0);
  const shipping = subtotal > 50 ? 0 : 9.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;
  const freeShippingThreshold = 50;
  const freeShippingRemaining = Math.max(freeShippingThreshold - subtotal, 0);
  const freeShippingProgress = Math.min((subtotal / freeShippingThreshold) * 100, 100);
  const discount = subtotal * 0.05;

  const today = new Date();
  const deliveryDate = new Date(today);
  deliveryDate.setDate(today.getDate() + 5);
  const deliveryDateStr = deliveryDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div className="cart-layout">
      <div className="cart-items">
        <div className="reveal" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', margin: 0 }}>
              My Bag
            </h1>
            <span className="badge" style={{ fontSize: 14, fontWeight: 600, padding: '4px 12px', borderRadius: 20, background: 'var(--primary, #6366f1)', color: '#fff' }}>
              {cart.totalItems} {cart.totalItems === 1 ? 'item' : 'items'}
            </span>
          </div>

          <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 16, background: 'var(--bg-container, #f8fafc)', border: '1px solid var(--border, #e2e8f0)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--primary, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  Home - 123 Main Street, Apt 4B
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                  Delivery by {deliveryDateStr}
                </div>
              </div>
            </div>
            <button style={{ background: 'none', border: 'none', color: 'var(--primary, #6366f1)', fontWeight: 600, fontSize: 13, cursor: 'pointer', padding: '6px 12px', borderRadius: 8, transition: 'background 0.15s', flexShrink: 0 }} onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-container, #f1f5f9)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}>
              Change
            </button>
          </div>

          {freeShippingRemaining > 0 && (
            <div className="card" style={{ marginTop: 12, padding: 16, borderRadius: 16, background: 'var(--bg-container, #f8fafc)', border: '1px solid var(--border, #e2e8f0)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success, #22c55e)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="3" width="15" height="13" />
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                  Add <span style={{ color: 'var(--success, #22c55e)' }}>${freeShippingRemaining.toFixed(2)}</span> more for FREE delivery
                </span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: 'var(--border, #e2e8f0)', overflow: 'hidden' }}>
                <div className="shipping-progress-bar" style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, var(--primary, #6366f1), var(--success, #22c55e))', width: `${freeShippingProgress}%`, transition: 'width 0.6s ease' }} />
              </div>
            </div>
          )}
          {freeShippingRemaining <= 0 && (
            <div className="card" style={{ marginTop: 12, padding: 16, borderRadius: 16, background: 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(34,197,94,0.03))', border: '1px solid rgba(34,197,94,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 24, height: 24, borderRadius: 12, background: 'var(--success, #22c55e)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--success, #22c55e)' }}>
                  You qualify for FREE delivery!
                </span>
              </div>
            </div>
          )}
        </div>

        {cart.items.map((item, index) => {
          const isRemoving = removingIds.has(item._id ?? '');
          const isBouncing = bouncingIds.has(item._id ?? '');
          const originalPrice = (item.price ?? 0) * 1.2;
          const itemDiscount = ((originalPrice - (item.price ?? 0)) / originalPrice) * 100;

          return (
            <div
              key={item._id}
              className={`card reveal reveal-delay-${Math.min(index, 5)}`}
              style={{
                display: 'flex', gap: 16, alignItems: 'flex-start',
                padding: isRemoving ? '0 16px' : 16,
                marginBottom: isRemoving ? 0 : 12,
                opacity: isRemoving ? 0 : 1,
                transform: isRemoving ? 'translateX(-20px) scale(0.97)' : 'translateX(0) scale(1)',
                maxHeight: isRemoving ? 0 : '500px',
                overflow: 'hidden',
                transition: 'opacity 0.35s ease, transform 0.35s ease, max-height 0.35s ease, margin 0.35s ease, padding 0.35s ease',
                borderRadius: 16,
              }}
            >
              <Link href={`/products/${typeof item.product === 'string' ? item.product : item.product?._id ?? ''}`}
                style={{ flexShrink: 0 }}>
                <div style={{ width: 110, height: 110, borderRadius: 14, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-container, #f8fafc)' }}>
                  <img
                    src={item.image || ''}
                    alt={item.name}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNmM2Y0ZjYiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI2E2YThiNCIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
                    }}
                  />
                </div>
              </Link>

              <div style={{ flex: 1, minWidth: 0 }}>
                <Link href={`/products/${typeof item.product === 'string' ? item.product : item.product?._id ?? ''}`}
                  style={{ color: 'var(--text)', fontWeight: 600, fontSize: 15, textDecoration: 'none', display: 'block', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.name}
                </Link>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 2 }}>
                  <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 6, background: 'var(--bg-container, #f1f5f9)', fontSize: 11, fontWeight: 500 }}>Size: M</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                    ${((item.price ?? 0) * (item.quantity ?? 0)).toFixed(2)}
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--text-tertiary)', textDecoration: 'line-through' }}>
                    ${(originalPrice * (item.quantity ?? 0)).toFixed(2)}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--error, #ef4444)', background: 'rgba(239,68,68,0.08)', padding: '2px 6px', borderRadius: 4 }}>
                    -{itemDiscount.toFixed(0)}%
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border, #e2e8f0)' }}>
                    <button
                      onClick={() => handleQuantityChange(item._id ?? '', item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      style={{
                        width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'var(--bg-container, #f8fafc)', border: 'none', cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer',
                        fontSize: 14, color: item.quantity <= 1 ? 'var(--text-tertiary)' : 'var(--text)', opacity: item.quantity <= 1 ? 0.4 : 1,
                        transition: 'background 0.15s'
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    </button>
                    <span style={{
                      width: 40, textAlign: 'center', fontSize: 14, fontWeight: 700, color: 'var(--text)',
                      lineHeight: '34px',
                      animation: isBouncing ? 'cartBounce 0.4s ease' : 'none'
                    }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(item._id ?? '', item.quantity + 1)}
                      style={{
                        width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'var(--bg-container, #f8fafc)', border: 'none', cursor: 'pointer',
                        fontSize: 14, color: 'var(--text)', transition: 'background 0.15s'
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    </button>
                  </div>

                  <button
                    onClick={() => handleRemove(item._id ?? '')}
                    onMouseEnter={() => setHoveredRemoveId(item._id ?? '')}
                    onMouseLeave={() => setHoveredRemoveId(null)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      fontSize: 12, color: 'var(--error, #ef4444)', fontWeight: 500,
                      padding: '6px 8px', borderRadius: 8, transition: 'background 0.15s',
                      animation: hoveredRemoveId === item._id ? 'shake 0.4s ease' : 'none'
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                    Remove
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        <div className="card reveal" style={{ marginTop: 16, padding: 16, borderRadius: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary, #6366f1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 5H3" />
              <path d="M21 12H3" />
              <path d="M21 19H3" />
            </svg>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Apply Coupon</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              placeholder="Enter coupon code"
              className="form-input"
              style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border, #e2e8f0)', fontSize: 13, background: 'var(--bg-container, #f8fafc)' }}
            />
            <button className="btn btn-primary" style={{ padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
              Apply
            </button>
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['SAVE10', 'FIRST20', 'FLAT50'].map((coupon) => (
              <div key={coupon} className="coupon-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: '1px dashed var(--primary, #6366f1)', background: 'rgba(99,102,241,0.04)', cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(99,102,241,0.04)'; }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--primary, #6366f1)" strokeWidth="2">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                  <line x1="7" y1="7" x2="7.01" y2="7" />
                </svg>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary, #6366f1)' }}>{coupon}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card reveal" style={{ marginTop: 12, padding: 16, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Use SuperCoins</div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>You have 250 SuperCoins available</div>
            </div>
          </div>
          <div style={{ position: 'relative', width: 44, height: 24 }}>
            <input type="checkbox" id="supercoins-toggle" style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
            <label htmlFor="supercoins-toggle" style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--border, #e2e8f0)', borderRadius: 12, transition: 'background 0.3s' }}>
              <span style={{ position: 'absolute', content: '', height: 18, width: 18, left: 3, bottom: 3, background: '#fff', borderRadius: '50%', transition: 'transform 0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }} />
            </label>
          </div>
        </div>
      </div>

      <div className="order-summary reveal">
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: 'var(--text)' }}>Order Summary</h2>

        <div className="summary-row">
          <span style={{ fontSize: 14 }}>Subtotal ({cart.totalItems} items)</span>
          <span style={{ fontSize: 14, fontWeight: 600 }}>${subtotal.toFixed(2)}</span>
        </div>
        <div className="summary-row">
          <span style={{ fontSize: 14 }}>Discount</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--success, #22c55e)' }}>-${discount.toFixed(2)}</span>
        </div>
        <div className="summary-row">
          <span style={{ fontSize: 14 }}>Delivery</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: shipping === 0 ? 'var(--success, #22c55e)' : 'var(--text)' }}>
            {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
          </span>
        </div>
        <div className="summary-row">
          <span style={{ fontSize: 14 }}>Tax</span>
          <span style={{ fontSize: 14, fontWeight: 600 }}>${tax.toFixed(2)}</span>
        </div>

        <div style={{ height: 1, background: 'var(--border, #e2e8f0)', margin: '12px 0' }} />

        <div className="summary-row total">
          <span style={{ fontSize: 16, fontWeight: 700 }}>Total</span>
          <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>${(total - discount).toFixed(2)}</span>
        </div>

        <div style={{ fontSize: 12, color: 'var(--success, #22c55e)', fontWeight: 500, textAlign: 'right', marginBottom: 12 }}>
          You save ${discount.toFixed(2)} on this order!
        </div>

        <button
          className="btn btn-primary btn-lg btn-full"
          style={{ padding: '16px 24px', fontSize: 15, fontWeight: 700, borderRadius: 14, letterSpacing: '0.02em' }}
          onClick={() => {
            const stored = localStorage.getItem('user');
            if (!stored) { router.push('/login?redirect=%2Fcheckout'); return; }
            router.push('/checkout');
          }}
        >
          Proceed to Checkout
        </button>

        <Link href="/products" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500, transition: 'color 0.15s' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Continue Shopping
        </Link>
      </div>

        {suggestedProducts.length > 0 && (
        <div style={{ gridColumn: '1 / -1', marginTop: 32 }} className="reveal">
          <div className="section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 className="section-title" style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: 0 }}>You might also like</h2>
            <Link href="/products" style={{ fontSize: 13, color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
              View All
            </Link>
          </div>
          <div className="carousel-scroll" style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, scrollSnapType: 'x mandatory', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {suggestedProducts.map((product) => (
              <Link key={product._id} href={`/products/${product._id}`} className="product-card" style={{ flexShrink: 0, width: 160, borderRadius: 16, overflow: 'hidden', background: 'var(--bg-card)', border: '1px solid var(--border)', textDecoration: 'none', scrollSnapAlign: 'start', transition: 'transform 0.2s, box-shadow 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ width: '100%', height: 140, background: 'var(--bg-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  <img
                    src={product.images?.[0] || ''}
                    alt={product.name}
                    style={{ width: '80%', height: '80%', objectFit: 'contain' }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
                <div style={{ padding: '10px 12px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
                    {product.name}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
                    ${(product.price ?? 0).toFixed(2)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
        )}

      <style>{`
        @keyframes cartBounce {
          0% { transform: scale(1); }
          30% { transform: scale(1.3); }
          50% { transform: scale(0.9); }
          70% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-3px); }
          40% { transform: translateX(3px); }
          60% { transform: translateX(-2px); }
          80% { transform: translateX(2px); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .reveal { animation: fadeInUp 0.5s ease both; }
        .reveal-delay-0 { animation-delay: 0s; }
        .reveal-delay-1 { animation-delay: 0.08s; }
        .reveal-delay-2 { animation-delay: 0.16s; }
        .reveal-delay-3 { animation-delay: 0.24s; }
        .reveal-delay-4 { animation-delay: 0.32s; }
        .reveal-delay-5 { animation-delay: 0.4s; }
        .order-summary { animation: slideInRight 0.5s ease both; animation-delay: 0.2s; }
        .carousel-scroll::-webkit-scrollbar { display: none; }
        .carousel-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes progressPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        .shipping-progress-bar { animation: progressPulse 2s ease-in-out infinite; }
        @media (max-width: 768px) {
          .cart-layout { grid-template-columns: 1fr !important; }
          .order-summary { position: relative !important; top: auto !important; }
        }
        @media (min-width: 769px) {
          .cart-layout { grid-template-columns: 1fr 380px; gap: 24px; align-items: start; }
          .order-summary { position: sticky; top: 24px; }
        }
      `}</style>
    </div>
  );
};

export default CartPage;
