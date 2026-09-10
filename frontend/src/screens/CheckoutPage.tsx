'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cartAPI, orderAPI } from '../services/api';
import { Cart, Address } from '../types';
import { useToast } from '../context/ToastContext';
import { getAppliedCoupons } from '../components/CouponClip';

interface SavedAddress extends Address {
  id: string;
  label: string;
}

const STORAGE_KEY = 'savedAddresses';

const loadAddresses = (): SavedAddress[] => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
};

const saveAddresses = (addrs: SavedAddress[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(addrs));
};

const EMPTY_ADDRESS: Address = { street: '', city: '', state: '', zip: '', country: 'US', phone: '' };

const PAYMENT_METHODS = [
  { id: 'credit_card', label: 'Credit / Debit Card', desc: 'Visa, Mastercard, Amex, Discover', icon: '\u{1F4B3}' },
  { id: 'paypal', label: 'PayPal', desc: 'Fast & secure online payments', icon: '\u{1F4B1}' },
  { id: 'upi', label: 'UPI', desc: 'Google Pay, PhonePe, Paytm, BHIM', icon: '\u{1F4F1}' },
  { id: 'cod', label: 'Cash on Delivery', desc: 'Pay when you receive', icon: '\u{1F4B5}' },
];

const CheckoutPage: React.FC = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [stepDirection, setStepDirection] = useState<'forward' | 'backward'>('forward');
  const [hoveredPayment, setHoveredPayment] = useState<string | null>(null);

  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddrId, setSelectedAddrId] = useState<string>('');
  const [showNewAddr, setShowNewAddr] = useState(false);
  const [newAddr, setNewAddr] = useState<Address>({ ...EMPTY_ADDRESS });
  const [useNewAddr, setUseNewAddr] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [giftWrap, setGiftWrap] = useState(false);
  const [giftMessage, setGiftMessage] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoError, setPromoError] = useState('');
  const [walletBalance, setWalletBalance] = useState(() => {
    try { return Number(localStorage.getItem('walletBalance')) || 0; } catch { return 0; }
  });
  const [applyWallet, setApplyWallet] = useState(false);

  const GIFT_WRAP_PRICE = 4.99;

  const handleApplyPromo = () => {
    const clipped = getAppliedCoupons();
    const match = clipped.find((c) => c.code === promoCode.toUpperCase());
    if (promoCode.toUpperCase() === 'SAVE10' || match) {
      const discount = match?.discount || 10;
      setPromoDiscount(discount);
      setPromoError('');
      showToast(`Coupon applied! ${match?.description || 'Save 10%'}`, 'success');
    } else if (promoCode.toUpperCase() === 'WELCOME5') {
      setPromoDiscount(5);
      setPromoError('');
      showToast('$5 off coupon applied!', 'success');
    } else {
      setPromoError('Invalid coupon code');
      setPromoDiscount(0);
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) { router.push('/login?redirect=%2Fcheckout'); return; }
    let cancelled = false;
    const fetchCart = async () => {
      try {
        const res = await cartAPI.get();
        if (cancelled) return;
        if (!res.data.data?.items?.length) { router.push('/cart'); return; }
        setCart(res.data.data);
      } catch {
        if (!cancelled) router.push('/cart');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchCart();
    return () => { cancelled = true; };
  }, [router]);

  useEffect(() => {
    const addrs = loadAddresses();
    setSavedAddresses(addrs);
    if (addrs.length > 0) { setSelectedAddrId(addrs[0].id); }
    else { setUseNewAddr(true); setShowNewAddr(true); }
  }, []);

  const getActiveAddress = (): Address | null => {
    if (useNewAddr) return newAddr;
    const found = savedAddresses.find((a) => a.id === selectedAddrId);
    return found || null;
  };

  const validateStep = (): boolean => {
    if (step === 1) {
      const addr = getActiveAddress();
      if (!addr || !addr.street || !addr.city || !addr.state || !addr.zip || !addr.phone) {
        showToast('Please fill in all address fields', 'warning');
        return false;
      }
      return true;
    }
    if (step === 2) {
      if (paymentMethod === 'credit_card') {
        if (!cardNumber || !cardExpiry || !cardCvv || !cardName) {
          showToast('Please fill in all card details', 'warning');
          return false;
        }
      }
      return true;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStepDirection('forward');
      setStep(step + 1);
    }
  };

  const handleBack = (targetStep: number) => {
    setStepDirection('backward');
    setStep(targetStep);
  };

  const handleSaveNewAddress = () => {
    if (!newAddr.street || !newAddr.city || !newAddr.state || !newAddr.zip || !newAddr.phone) {
      showToast('Please fill in all address fields', 'warning');
      return;
    }
    const id = 'addr_' + Date.now();
    const label = `${newAddr.city}, ${newAddr.state}`;
    const saved: SavedAddress = { ...newAddr, id, label };
    const updated = [...savedAddresses, saved];
    setSavedAddresses(updated);
    saveAddresses(updated);
    setSelectedAddrId(id);
    setUseNewAddr(false);
    setShowNewAddr(false);
    showToast('Address saved!', 'success');
  };

  const handleDeleteAddress = (id: string) => {
    const updated = savedAddresses.filter((a) => a.id !== id);
    setSavedAddresses(updated);
    saveAddresses(updated);
    if (selectedAddrId === id) {
      if (updated.length > 0) { setSelectedAddrId(updated[0].id); }
      else { setUseNewAddr(true); setShowNewAddr(true); }
    }
    showToast('Address removed', 'info');
  };

  const handlePlaceOrder = async () => {
    if (!validateStep()) return;
    const addr = getActiveAddress();
    if (!addr) { showToast('Please provide a shipping address', 'warning'); return; }
    setSubmitting(true);
    try {
      const orderData = {
        shippingAddress: { ...addr, giftWrap, giftMessage: giftWrap ? giftMessage : '', walletApplied, promoDiscount: promoDiscountValue },
        paymentMethod,
      };
      const res = await orderAPI.create(orderData);
      showToast('Order placed successfully!', 'success');
      router.push(`/order-confirmation/${res.data.data._id}`);
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to place order', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>
        <div className="skeleton" style={{ width: '100%', height: 60, borderRadius: 8 }} />
        <div className="skeleton" style={{ width: '100%', height: 300, borderRadius: 8, marginTop: 24 }} />
        <div className="skeleton" style={{ width: '100%', height: 200, borderRadius: 8, marginTop: 16 }} />
      </div>
    );
  }

  if (!cart) return null;

  const taxPrice = Math.round(cart.totalPrice * 0.08 * 100) / 100;
  const shippingPrice = cart.totalPrice > 50 ? 0 : 9.99;
  const giftWrapPrice = giftWrap ? GIFT_WRAP_PRICE : 0;
  const promoDiscountValue = promoDiscount > 10 ? cart.totalPrice * (promoDiscount / 100) : promoDiscount;
  const walletApplied = applyWallet ? Math.min(walletBalance, cart.totalPrice + taxPrice + shippingPrice + giftWrapPrice) : 0;
  const subtotalAfterDiscount = Math.max(0, cart.totalPrice - promoDiscountValue);
  const totalPrice = Math.max(0, subtotalAfterDiscount + taxPrice + shippingPrice + giftWrapPrice - walletApplied);
  const activeAddr = getActiveAddress();

  const completionPercent = Math.round((step / 3) * 100);

  const steps = [
    { num: 1, label: 'Shipping', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg> },
    { num: 2, label: 'Payment', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg> },
    { num: 3, label: 'Review', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg> },
  ];

  return (
    <div className="checkout-layout">
      <div className="checkout-form">
        {/* Progress Bar */}
        <div style={{ width: '100%', height: 4, background: 'var(--border-color, #e2e8f0)', borderRadius: 2, marginBottom: 28, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${completionPercent}%`,
            background: 'linear-gradient(90deg, var(--color-secondary), var(--color-success, #10b981))',
            borderRadius: 2,
            transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
          }} />
        </div>

        {/* Step Indicator */}
        <div className="checkout-steps" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 40, padding: '0 20px' }}>
          {steps.map((s, i) => (
            <React.Fragment key={s.num}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, position: 'relative' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: step > s.num ? 'var(--color-success)' : step === s.num ? 'var(--color-secondary)' : 'var(--bg-container, #f1f5f9)',
                  color: step >= s.num ? '#fff' : 'var(--text-tertiary)',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: step === s.num ? '0 0 0 4px rgba(99,102,241,0.15), 0 4px 12px rgba(99,102,241,0.2)' : step > s.num ? '0 2px 8px rgba(16,185,129,0.3)' : 'none',
                  transform: step === s.num ? 'scale(1.1)' : 'scale(1)'
                }}>
                  {step > s.num ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  ) : s.icon}
                </div>
                <span style={{
                  fontSize: 13, fontWeight: step === s.num ? 600 : 500,
                  color: step === s.num ? 'var(--color-secondary)' : step > s.num ? 'var(--color-success)' : 'var(--text-tertiary)',
                  transition: 'color 0.3s ease'
                }}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div style={{
                  flex: 1, height: 2, margin: '0 12px', marginBottom: 24,
                  background: step > s.num ? 'var(--color-success)' : 'var(--border-color, #e2e8f0)',
                  transition: 'background 0.5s ease', maxWidth: 120
                }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1: Shipping */}
        {step === 1 && (
          <div className="checkout-step-content fade-slide-up">
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, color: 'var(--text-primary)' }}>Shipping Address</h3>

            {savedAddresses.length > 0 && !showNewAddr && (
              <div className="saved-addresses" style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                {savedAddresses.map((addr) => (
                  <div key={addr.id}
                    className="card"
                    style={{
                      display: 'flex', gap: 16, padding: 16, cursor: 'pointer',
                      border: selectedAddrId === addr.id ? '2px solid var(--color-secondary)' : '2px solid var(--border-color, #e2e8f0)',
                      transition: 'border-color 0.2s', alignItems: 'flex-start'
                    }}
                    onClick={() => { setSelectedAddrId(addr.id); setUseNewAddr(false); }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%', border: `2px solid ${selectedAddrId === addr.id ? 'var(--color-secondary)' : 'var(--text-tertiary)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2, transition: 'border-color 0.2s'
                    }}>
                      {selectedAddrId === addr.id && (
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--color-secondary)' }} />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{addr.label}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        <div>{addr.street}</div>
                        <div>{addr.city}, {addr.state} {addr.zip}</div>
                        <div>{addr.phone}</div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteAddress(addr.id); }}
                      style={{
                        background: 'transparent', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 6,
                        color: 'var(--text-tertiary)', transition: 'color 0.15s'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-error, #ef4444)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-tertiary)'; }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => { setShowNewAddr(!showNewAddr); setUseNewAddr(true); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', width: '100%',
                background: showNewAddr ? 'var(--bg-container, #f8fafc)' : 'transparent',
                border: `1px dashed ${showNewAddr ? 'var(--color-secondary)' : 'var(--border-color, #e2e8f0)'}`,
                borderRadius: 12, cursor: 'pointer', fontSize: 14, fontWeight: 500,
                color: showNewAddr ? 'var(--color-secondary)' : 'var(--text-secondary)',
                transition: 'all 0.2s', marginBottom: showNewAddr ? 16 : 0
              }}
            >
              {showNewAddr ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              )}
              {showNewAddr ? 'Cancel' : '+ Add New Address'}
            </button>

            {showNewAddr && (
              <div className="new-addr-form card" style={{ padding: 24, marginTop: 0 }}>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Street Address</label>
                  <input className="form-input" type="text" value={newAddr.street} onChange={(e) => setNewAddr({ ...newAddr, street: e.target.value })}
                    placeholder="123 Main Street, Apt 4B" style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border-color, #e2e8f0)', fontSize: 14, outline: 'none', transition: 'border-color 0.2s' }} />
                </div>
                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div className="form-group">
                    <label className="form-label" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>City</label>
                    <input className="form-input" type="text" value={newAddr.city} onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })} placeholder="New York"
                      style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border-color, #e2e8f0)', fontSize: 14, outline: 'none' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>State</label>
                    <input className="form-input" type="text" value={newAddr.state} onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })} placeholder="NY"
                      style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border-color, #e2e8f0)', fontSize: 14, outline: 'none' }} />
                  </div>
                </div>
                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                  <div className="form-group">
                    <label className="form-label" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>ZIP Code</label>
                    <input className="form-input" type="text" value={newAddr.zip} onChange={(e) => setNewAddr({ ...newAddr, zip: e.target.value })} placeholder="10001"
                      style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border-color, #e2e8f0)', fontSize: 14, outline: 'none' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Phone</label>
                    <input className="form-input" type="tel" value={newAddr.phone} onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })} placeholder="+1 (555) 000-0000"
                      style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border-color, #e2e8f0)', fontSize: 14, outline: 'none' }} />
                  </div>
                </div>
                <button className="btn btn-primary" onClick={handleSaveNewAddress} style={{ padding: '12px 28px', fontSize: 14, fontWeight: 600, borderRadius: 10 }}>
                  Save & Use This Address
                </button>
              </div>
            )}

            {/* Gift Options */}
            <div className="gift-options card" style={{ padding: 20, marginTop: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>Gift Options</h3>
              <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                <div style={{ position: 'relative' }}>
                  <input type="checkbox" checked={giftWrap} onChange={(e) => setGiftWrap(e.target.checked)} style={{ display: 'none' }} />
                  <div style={{
                    width: 44, height: 24, borderRadius: 12, cursor: 'pointer', transition: 'background 0.2s',
                    background: giftWrap ? 'var(--color-secondary)' : 'var(--border-color, #cbd5e1)',
                    position: 'relative'
                  }} onClick={(e) => { e.preventDefault(); setGiftWrap(!giftWrap); }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2,
                      left: giftWrap ? 22 : 2, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }} />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>This order contains a gift</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>+${GIFT_WRAP_PRICE.toFixed(2)} gift wrap fee</div>
                </div>
              </label>
              {giftWrap && (
                <div style={{ marginTop: 16 }}>
                  <label className="form-label" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Gift message (optional)</label>
                  <textarea className="form-input" placeholder="Write a gift message..." value={giftMessage}
                    onChange={(e) => setGiftMessage(e.target.value)} rows={3} maxLength={200}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border-color, #e2e8f0)', fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'right', marginTop: 4 }}>{giftMessage.length}/200</div>
                </div>
              )}
            </div>

            <div className="step-actions" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
              <button className="btn btn-primary" onClick={handleNext} style={{ padding: '14px 32px', fontSize: 15, fontWeight: 600, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                Continue to Payment
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Payment */}
        {step === 2 && (
          <div className="checkout-step-content fade-slide-up">
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, color: 'var(--text-primary)' }}>Payment Method</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              {PAYMENT_METHODS.map((pm) => (
                <div key={pm.id}
                  className="card payment-glow-card"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: 16, cursor: 'pointer',
                    border: paymentMethod === pm.id ? '2px solid var(--color-secondary)' : '2px solid var(--border-color, #e2e8f0)',
                    transition: 'all 0.25s ease',
                    boxShadow: hoveredPayment === pm.id
                      ? '0 0 20px rgba(99,102,241,0.15), 0 4px 16px rgba(99,102,241,0.1)'
                      : paymentMethod === pm.id
                        ? '0 0 0 3px rgba(99,102,241,0.1)'
                        : 'none',
                    transform: hoveredPayment === pm.id ? 'translateY(-1px)' : 'translateY(0)'
                  }}
                  onClick={() => setPaymentMethod(pm.id)}
                  onMouseEnter={() => setHoveredPayment(pm.id)}
                  onMouseLeave={() => setHoveredPayment(null)}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', border: `2px solid ${paymentMethod === pm.id ? 'var(--color-secondary)' : 'var(--text-tertiary)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'border-color 0.2s'
                  }}>
                    {paymentMethod === pm.id && (
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--color-secondary)' }} />
                    )}
                  </div>
                  <span style={{ fontSize: 24 }}>{pm.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{pm.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{pm.desc}</div>
                  </div>
                  {paymentMethod === pm.id && (
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--color-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {paymentMethod === 'credit_card' && (
              <div className="card" style={{ padding: 24 }}>
                <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: 'var(--text-primary)' }}>Card Details</h4>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Card Number</label>
                  <input className="form-input" type="text" value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim())}
                    placeholder="1234 5678 9012 3456" maxLength={19}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border-color, #e2e8f0)', fontSize: 14, outline: 'none', letterSpacing: 1 }} />
                </div>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Name on Card</label>
                  <input className="form-input" type="text" value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="John Doe"
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border-color, #e2e8f0)', fontSize: 14, outline: 'none' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Expiry Date</label>
                    <input className="form-input" type="text" value={cardExpiry} onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '');
                      if (v.length <= 4) setCardExpiry(v.length > 2 ? v.slice(0, 2) + '/' + v.slice(2) : v);
                    }} placeholder="MM/YY" maxLength={5}
                      style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border-color, #e2e8f0)', fontSize: 14, outline: 'none' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>CVV</label>
                    <input className="form-input" type="text" value={cardCvv} onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="123" maxLength={4}
                      style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border-color, #e2e8f0)', fontSize: 14, outline: 'none' }} />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'cod' && (
              <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Cash on Delivery</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Pay with cash when your order is delivered. No additional fees.</div>
                </div>
              </div>
            )}

            <div className="step-actions" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
              <button
                onClick={() => handleBack(1)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', background: 'transparent',
                  border: '1px solid var(--border-color, #e2e8f0)', borderRadius: 10, cursor: 'pointer',
                  fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)', transition: 'all 0.2s'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                Back
              </button>
              <button className="btn btn-primary" onClick={handleNext} style={{ padding: '14px 32px', fontSize: 15, fontWeight: 600, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                Continue to Review
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="checkout-step-content fade-slide-up">
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, color: 'var(--text-primary)' }}>Review Your Order</h3>

            <div className="card slide-in-right-card" style={{ padding: 20, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Shipping Address</span>
                <button onClick={() => handleBack(1)} style={{
                  background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  color: 'var(--color-secondary)', display: 'flex', alignItems: 'center', gap: 4
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                  Edit
                </button>
              </div>
              {activeAddr && (
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  <div>{activeAddr.street}</div>
                  <div>{activeAddr.city}, {activeAddr.state} {activeAddr.zip}</div>
                  <div>{activeAddr.phone}</div>
                </div>
              )}
            </div>

            <div className="card slide-in-right-card" style={{ padding: 20, marginBottom: 16, animationDelay: '0.1s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Payment Method</span>
                <button onClick={() => handleBack(2)} style={{
                  background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  color: 'var(--color-secondary)', display: 'flex', alignItems: 'center', gap: 4
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                  Edit
                </button>
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{PAYMENT_METHODS.find((p) => p.id === paymentMethod)?.icon}</span>
                <span>{PAYMENT_METHODS.find((p) => p.id === paymentMethod)?.label}</span>
                {paymentMethod === 'credit_card' && cardNumber && <span style={{ color: 'var(--text-tertiary)' }}>&middot;&middot;&middot;&middot; {cardNumber.slice(-4)}</span>}
              </div>
            </div>

            {giftWrap && (
              <div className="card slide-in-right-card" style={{ padding: 20, marginBottom: 16, animationDelay: '0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Gift Options</span>
                  <button onClick={() => handleBack(1)} style={{
                    background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    color: 'var(--color-secondary)', display: 'flex', alignItems: 'center', gap: 4
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                    Edit
                  </button>
                </div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>Gift wrap included</span>
                    <span className="badge" style={{ fontSize: 11 }}>+${GIFT_WRAP_PRICE.toFixed(2)}</span>
                  </div>
                  {giftMessage && <div style={{ marginTop: 8, fontStyle: 'italic', color: 'var(--text-tertiary)' }}>&quot;{giftMessage}&quot;</div>}
                </div>
              </div>
            )}

            <div className="card slide-in-right-card" style={{ padding: 20, marginBottom: 24, animationDelay: '0.3s' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Items ({cart.items.length})</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {cart.items.map((item) => (
                  <div key={item._id} style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                    <div style={{ width: 56, height: 56, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: 'var(--bg-container, #f8fafc)' }}>
                      <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Link href={`/products/${typeof item.product === 'string' ? item.product : item.product._id}`}
                        style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.name}
                      </Link>
                      <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Qty: {item.quantity}</div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', flexShrink: 0 }}>
                      ${((item.price ?? 0) * (item.quantity ?? 0)).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="step-actions" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                onClick={() => handleBack(2)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', background: 'transparent',
                  border: '1px solid var(--border-color, #e2e8f0)', borderRadius: 10, cursor: 'pointer',
                  fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)', transition: 'all 0.2s'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                Back
              </button>
              <button
                className="btn btn-primary"
                onClick={handlePlaceOrder}
                disabled={submitting}
                style={{
                  padding: '14px 36px', fontSize: 15, fontWeight: 700, borderRadius: 12,
                  opacity: submitting ? 0.8 : 1, display: 'flex', alignItems: 'center', gap: 10,
                  transition: 'all 0.3s ease',
                  position: 'relative', overflow: 'hidden',
                  minWidth: submitting ? 180 : 'auto'
                }}
              >
                {submitting && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                    animation: 'shimmer 1.5s infinite'
                  }} />
                )}
                {submitting ? (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 0.8s linear infinite' }}>
                      <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="32" strokeLinecap="round" />
                    </svg>
                    <span style={{ position: 'relative' }}>Placing Order...</span>
                  </>
                ) : (
                  <>
                    <span>Place Order &mdash; ${totalPrice.toFixed(2)}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="order-summary">
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: 'var(--text-primary)' }}>Order Summary</h2>

        {/* Item Thumbnails */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {cart.items.slice(0, 4).map((item) => (
            <div key={item._id} style={{ width: 52, height: 52, borderRadius: 8, overflow: 'hidden', background: 'var(--bg-container, #f8fafc)' }}>
              <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ))}
          {cart.items.length > 4 && (
            <div style={{
              width: 52, height: 52, borderRadius: 8, background: 'var(--bg-container, #f1f5f9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)'
            }}>
              +{cart.items.length - 4}
            </div>
          )}
        </div>

        <div className="summary-row">
          <span>Items ({cart.totalItems})</span>
          <span>${(cart.totalPrice ?? 0).toFixed(2)}</span>
        </div>
        <div className="summary-row">
          <span>Shipping</span>
          <span style={{ color: shippingPrice === 0 ? 'var(--color-success)' : 'inherit', fontWeight: shippingPrice === 0 ? 600 : 400 }}>
            {shippingPrice === 0 ? 'FREE' : `$${shippingPrice.toFixed(2)}`}
          </span>
        </div>
        <div className="summary-row">
          <span>Estimated Tax</span>
          <span>${taxPrice.toFixed(2)}</span>
        </div>
        {giftWrap && (
          <div className="summary-row">
            <span>Gift Wrap</span>
            <span>${giftWrapPrice.toFixed(2)}</span>
          </div>
        )}
        {promoDiscount > 0 && (
          <div className="summary-row" style={{ color: 'var(--color-success)' }}>
            <span>Promo Discount</span>
            <span>-${promoDiscountValue.toFixed(2)}</span>
          </div>
        )}
        {applyWallet && walletApplied > 0 && (
          <div className="summary-row" style={{ color: 'var(--color-success)' }}>
            <span>Gift Card</span>
            <span>-${walletApplied.toFixed(2)}</span>
          </div>
        )}
        {cart.totalPrice < 50 && cart.totalPrice > 0 && (
          <div style={{ fontSize: 12, color: 'var(--color-secondary)', marginTop: 4, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            Add ${(50 - cart.totalPrice).toFixed(2)} more for FREE shipping
          </div>
        )}
        <div className="summary-row total">
          <span>Order Total</span>
          <span>${totalPrice.toFixed(2)}</span>
        </div>

        {/* Promo Code */}
        <div style={{ marginTop: 20, padding: 16, background: 'var(--bg-container, #f8fafc)', borderRadius: 10 }}>
          <label className="form-label" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>Promo Code</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="text" placeholder="Enter code" value={promoCode}
              onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoError(''); }}
              style={{
                flex: 1, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color, #e2e8f0)',
                fontSize: 13, outline: 'none', textTransform: 'uppercase', letterSpacing: 0.5
              }} />
            <button className="btn btn-primary" onClick={handleApplyPromo}
              style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, borderRadius: 8, whiteSpace: 'nowrap' }}>
              Apply
            </button>
          </div>
          {promoError && <div style={{ fontSize: 12, color: 'var(--color-error, #ef4444)', marginTop: 8 }}>{promoError}</div>}
          {promoDiscount > 0 && !promoError && (
            <div style={{ fontSize: 12, color: 'var(--color-success)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
              Coupon applied! ${promoDiscountValue.toFixed(2)} off
            </div>
          )}
        </div>

        {/* Wallet */}
        {walletBalance > 0 && (
          <label style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', marginTop: 12,
            background: 'var(--bg-container, #f0fdf4)', borderRadius: 10, cursor: 'pointer', border: '1px solid rgba(16,185,129,0.2)'
          }}>
            <div style={{ position: 'relative' }}>
              <input type="checkbox" checked={applyWallet} onChange={(e) => setApplyWallet(e.target.checked)} style={{ display: 'none' }} />
              <div style={{
                width: 40, height: 22, borderRadius: 11, cursor: 'pointer', transition: 'background 0.2s',
                background: applyWallet ? 'var(--color-success)' : 'var(--border-color, #cbd5e1)',
                position: 'relative'
              }} onClick={(e) => { e.preventDefault(); setApplyWallet(!applyWallet); }}>
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2,
                  left: applyWallet ? 20 : 2, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Use Gift Card Balance</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Available: ${walletBalance.toFixed(2)}</div>
            </div>
          </label>
        )}

        {/* Security Badges */}
        <div style={{ marginTop: 24, padding: '16px 0', borderTop: '1px solid var(--border-color, #e2e8f0)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'var(--text-secondary)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>Secure checkout with SSL encryption</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'var(--text-secondary)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Free 30-day returns on all eligible items</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'var(--text-secondary)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>24/7 customer support</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          from { transform: translateX(-100%); }
          to { transform: translateX(100%); }
        }
        .fade-slide-up { animation: fadeSlideUp 0.45s cubic-bezier(0.4, 0, 0.2, 1) both; }
        .slide-in-right-card { animation: slideInRight 0.5s cubic-bezier(0.4, 0, 0.2, 1) both; }
        .slide-in-right-card:nth-child(1) { animation-delay: 0s; }
        .slide-in-right-card:nth-child(2) { animation-delay: 0.1s; }
        .slide-in-right-card:nth-child(3) { animation-delay: 0.2s; }
        .slide-in-right-card:nth-child(4) { animation-delay: 0.3s; }
      `}</style>
    </div>
  );
};

export default CheckoutPage;
