'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cartAPI } from '../services/api';
import { Cart } from '../types';
import { useToast } from '../context/ToastContext';
import { CartSkeleton } from '../components/Skeleton';

const CartPage: React.FC = () => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [bouncingIds, setBouncingIds] = useState<Set<string>>(new Set());
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const [hoveredRemoveId, setHoveredRemoveId] = useState<string | null>(null);
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

  return (
    <div className="cart-layout">
      <div className="cart-items">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>
            Shopping Cart
            <span className="badge" style={{ marginLeft: 12, fontSize: 13, fontWeight: 500 }}>
              {cart.totalItems} {cart.totalItems === 1 ? 'item' : 'items'}
            </span>
          </h2>
          <Link href="/products" style={{ fontSize: 13, color: 'var(--color-secondary)', textDecoration: 'none', fontWeight: 500 }}>
            + Add More Items
          </Link>
        </div>

        {cart.items.map((item, index) => {
          const isRemoving = removingIds.has(item._id ?? '');
          const isBouncing = bouncingIds.has(item._id ?? '');

          return (
            <div
              key={item._id}
              className={`card animate-in animate-in-delay-${Math.min(index, 5)}`}
              style={{
                display: 'flex', gap: 20, alignItems: 'flex-start',
                padding: isRemoving ? '0 20px' : 20,
                marginBottom: isRemoving ? 0 : 16,
                opacity: isRemoving ? 0 : 1,
                transform: isRemoving ? 'translateX(-20px) scale(0.97)' : 'translateX(0) scale(1)',
                maxHeight: isRemoving ? 0 : '500px',
                overflow: 'hidden',
                transition: 'opacity 0.35s ease, transform 0.35s ease, max-height 0.35s ease, margin 0.35s ease, padding 0.35s ease',
              }}
            >
              <Link href={`/products/${typeof item.product === 'string' ? item.product : item.product?._id ?? ''}`}
                style={{ flexShrink: 0 }}>
                <div className="bg-container-low" style={{ width: 120, height: 120, borderRadius: 12, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img
                    src={item.image}
                    alt={item.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              </Link>

              <div style={{ flex: 1, minWidth: 0 }}>
                <Link href={`/products/${typeof item.product === 'string' ? item.product : item.product?._id ?? ''}`}
                  style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 15, textDecoration: 'none', display: 'block', marginBottom: 4 }}>
                  {item.name}
                </Link>
                <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 4 }}>
                  In Stock
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
                  ${(item.price ?? 0).toFixed(2)}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: 8, overflow: 'hidden' }}>
                    <button
                      onClick={() => handleQuantityChange(item._id ?? '', item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      style={{
                        width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'transparent', border: 'none', cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer',
                        fontSize: 16, color: item.quantity <= 1 ? 'var(--text-tertiary)' : 'var(--text-primary)', opacity: item.quantity <= 1 ? 0.4 : 1,
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={(e) => { if (item.quantity > 1) e.currentTarget.style.background = 'var(--bg-container, #f8fafc)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    </button>
                    <span style={{
                      width: 44, textAlign: 'center', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)',
                      borderLeft: '1px solid var(--border-color, #e2e8f0)', borderRight: '1px solid var(--border-color, #e2e8f0)', lineHeight: '36px',
                      animation: isBouncing ? 'cartBounce 0.4s ease' : 'none'
                    }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(item._id ?? '', item.quantity + 1)}
                      style={{
                        width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        fontSize: 16, color: 'var(--text-primary)', transition: 'background 0.15s'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-container, #f8fafc)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    </button>
                  </div>

                  <button
                    onClick={() => handleRemove(item._id ?? '')}
                    onMouseEnter={() => setHoveredRemoveId(item._id ?? '')}
                    onMouseLeave={() => setHoveredRemoveId(null)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      fontSize: 13, color: 'var(--color-error, #ef4444)', fontWeight: 500,
                      padding: '6px 10px', borderRadius: 6, transition: 'background 0.15s',
                      animation: hoveredRemoveId === item._id ? 'shake 0.4s ease' : 'none'
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                    Remove
                  </button>
                </div>
              </div>

              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                  ${((item.price ?? 0) * (item.quantity ?? 0)).toFixed(2)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="order-summary animate-slide-in-right">
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: 'var(--text-primary)' }}>Order Summary</h2>

        <div className="summary-row">
          <span>Items ({cart.totalItems})</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="summary-row">
          <span>Shipping</span>
          <span style={{ color: shipping === 0 ? 'var(--color-success)' : 'inherit', fontWeight: shipping === 0 ? 600 : 400 }}>
            {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
          </span>
        </div>
        <div className="summary-row">
          <span>Estimated Tax</span>
          <span>${tax.toFixed(2)}</span>
        </div>

        {subtotal < 50 && subtotal > 0 && (
          <div style={{ fontSize: 12, color: 'var(--color-secondary)', marginTop: 4, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            Add ${(50 - subtotal).toFixed(2)} more for FREE shipping!
          </div>
        )}

        <div className="summary-row total">
          <span>Order Total</span>
          <span>${total.toFixed(2)}</span>
        </div>

        <button
          className="btn btn-primary"
          style={{ width: '100%', marginTop: 16, padding: '14px 24px', fontSize: 15, fontWeight: 600, borderRadius: 12 }}
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
        .animate-in { animation: fadeInUp 0.5s ease both; }
        .animate-in-delay-0 { animation-delay: 0s; }
        .animate-in-delay-1 { animation-delay: 0.08s; }
        .animate-in-delay-2 { animation-delay: 0.16s; }
        .animate-in-delay-3 { animation-delay: 0.24s; }
        .animate-in-delay-4 { animation-delay: 0.32s; }
        .animate-in-delay-5 { animation-delay: 0.4s; }
        .animate-slide-in-right { animation: slideInRight 0.5s ease both; animation-delay: 0.2s; }
      `}</style>
    </div>
  );
};

export default CartPage;
