'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cartAPI, orderAPI } from '../services/api';
import { Cart, Address } from '../types';
import { useToast } from '../context/ToastContext';
import { getAppliedCoupons } from '../components/CouponClip';
import { GradientButton } from '@/components/ui/gradient-button';
import { PAYMENT_METHODS, paymentMethodLabel } from '../lib/paymentMethods';
import { getRazorpayStatus, payOrderWithRazorpay, RazorpayCheckoutError } from '../lib/razorpay';

interface SavedAddress extends Address {
  id: string;
  label: string;
}

const STORAGE_KEY = 'savedAddresses';

const loadAddresses = (): SavedAddress[] => {
  try {
    if (typeof window === 'undefined') return [];
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
};

const saveAddresses = (addrs: SavedAddress[]) => {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(addrs));
  } catch { /* storage unavailable */ }
};

const EMPTY_ADDRESS: Address = { street: '', city: '', state: '', zip: '', country: 'US', phone: '' };

const readCustomer = (): { name?: string; email?: string } => {
  try {
    if (typeof window === 'undefined') return {};
    const raw = localStorage.getItem('user');
    if (!raw) return {};
    const user = JSON.parse(raw) as { name?: string; email?: string };
    return { name: user?.name, email: user?.email };
  } catch {
    return {};
  }
};

const BuyPage: React.FC = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [expressCheckout, setExpressCheckout] = useState(false);

  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddrId, setSelectedAddrId] = useState<string>('');
  const [showNewAddr, setShowNewAddr] = useState(false);
  const [newAddr, setNewAddr] = useState<Address>({ ...EMPTY_ADDRESS });
  const [useNewAddr, setUseNewAddr] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [razorpayReady, setRazorpayReady] = useState<boolean | null>(null);
  const [razorpayConfigured, setRazorpayConfigured] = useState(false);
  const [razorpayOrderSync, setRazorpayOrderSync] = useState(false);
  const [razorpayCurrency, setRazorpayCurrency] = useState('USD');
  const [razorpayRate, setRazorpayRate] = useState(0);
  const [giftWrap, setGiftWrap] = useState(false);
  const [giftMessage, setGiftMessage] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoError, setPromoError] = useState('');
  const [walletBalance, setWalletBalance] = useState(() => {
    try {
      if (typeof window === 'undefined') return 0;
      return Number(localStorage.getItem('walletBalance')) || 0;
    } catch { return 0; }
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
    if (!stored) { router.push('/login'); return; }
    const fetchCart = async () => {
      try {
        const res = await cartAPI.get();
        if (!res.data.data?.items?.length) { router.push('/cart'); return; }
        setCart(res.data.data);
      } catch { router.push('/cart'); }
      finally { setLoading(false); }
    };
    fetchCart();
  }, [router]);

  useEffect(() => {
    const addrs = loadAddresses();
    setSavedAddresses(addrs);
    if (addrs.length > 0) { setSelectedAddrId(addrs[0].id); }
    else { setUseNewAddr(true); setShowNewAddr(true); }
  }, []);

  useEffect(() => {
    let cancelled = false;
    getRazorpayStatus()
      .then((status) => {
        if (cancelled) return;
        setRazorpayReady(status.ready);
        setRazorpayConfigured(status.configured);
        setRazorpayOrderSync(status.orderSync);
        setRazorpayCurrency(status.currency);
        setRazorpayRate(status.exchangeRate);
      })
      .catch(() => { if (!cancelled) setRazorpayReady(false); });
    return () => { cancelled = true; };
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
      if (paymentMethod === 'razorpay' && (razorpayReady === false || (razorpayCurrency === 'INR' && razorpayRate <= 0))) {
        showToast('Online payments are not available right now. Please choose Cash on Delivery.', 'warning');
        return false;
      }
      return true;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) setStep(step + 1);
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
    if (paymentMethod === 'razorpay' && razorpayReady === false) {
      showToast('Online payments are not available right now. Please choose Cash on Delivery.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await orderAPI.create({
        shippingAddress: {
          ...addr,
          giftWrap,
          giftMessage: giftWrap ? giftMessage : '',
          walletApplied,
          promoDiscount: promoDiscountValue,
        },
        paymentMethod,
      });
      const order = res.data.data;

      if (paymentMethod === 'razorpay') {
        try {
          const result = await payOrderWithRazorpay({
            orderId: order._id,
            amount: order.totalPrice,
            customer: { ...readCustomer(), contact: addr.phone },
            description: `Order #${order._id.slice(-8).toUpperCase()}`,
          });
          if (!result.orderUpdated) {
            showToast('Payment received. Your order is being confirmed — this can take a moment.', 'info');
            router.push(`/orders/${order._id}`);
            return;
          }
          showToast('Payment successful! Your order is confirmed.', 'success');
          router.push(`/order-confirmation/${order._id}`);
        } catch (paymentErr) {
          const message = paymentErr instanceof RazorpayCheckoutError
            ? paymentErr.message
            : 'Payment could not be completed. Please try again.';
          const dismissed = paymentErr instanceof RazorpayCheckoutError && paymentErr.code === 'DISMISSED';
          showToast(message, dismissed ? 'info' : 'error');
          router.push(`/orders/${order._id}`);
        }
        return;
      }

      showToast('Order placed successfully!', 'success');
      router.push(`/order-confirmation/${order._id}`);
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to place order', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExpressCheckout = () => {
    setExpressCheckout(true);
    setStep(3);
  };

  if (loading) {
    return (
      <div className="bp-loading">
        <div className="bp-skeleton" style={{ width: '60%', height: 40, margin: '0 auto' }} />
        <div className="bp-skeleton" style={{ width: '100%', height: 400, marginTop: 24 }} />
      </div>
    );
  }

  if (!cart) return null;

  const taxPrice = Math.round(cart.totalPrice * 0.08 * 100) / 100;
  const shippingPrice = cart.totalPrice >= 50 ? 0 : 9.99;
  const giftWrapPrice = giftWrap ? GIFT_WRAP_PRICE : 0;
  const promoDiscountValue = promoDiscount > 10 ? cart.totalPrice * (promoDiscount / 100) : promoDiscount;
  const subtotalAfterDiscount = Math.max(0, cart.totalPrice - promoDiscountValue);
  const beforeWallet = Math.max(0, subtotalAfterDiscount + taxPrice + shippingPrice + giftWrapPrice);
  const walletApplied = applyWallet ? Math.min(walletBalance, beforeWallet) : 0;
  const totalPrice = Math.max(0, beforeWallet - walletApplied);
  const activeAddr = getActiveAddress();

  return (
    <div className="buy-page">
      <div className="buy-container">
        <div className="buy-main">
          <div className="buy-header">
            <h1>{'\u{1F6D2}'} Complete Your Purchase</h1>
            <p>Secure checkout powered by ShopSmart</p>
            <div className="buy-secure-badge">
              <span>{'\u{1F512}'}</span>
              <span>Secure payment</span>
              <span>·</span>
              <span>Free returns</span>
              <span>·</span>
              <span>100% protected</span>
            </div>
          </div>

          <div className="buy-express" onClick={handleExpressCheckout}>
            <div className="buy-express-icon">{'\u26A1'}</div>
            <div className="buy-express-text">
              <strong>Express Checkout</strong>
              <span>Skip the steps — use saved defaults and buy now</span>
            </div>
            <div className="buy-express-arrow">{'\u2192'}</div>
          </div>

          <div className="buy-steps">
            {[
              { num: 1, label: 'Shipping', icon: '\u{1F4E6}' },
              { num: 2, label: 'Payment', icon: '\u{1F4B3}' },
              { num: 3, label: 'Review', icon: '\u2705' },
            ].map((s) => (
              <div key={s.num} className={`buy-step ${step === s.num ? 'active' : step > s.num ? 'completed' : ''}`}>
                <div className="buy-step-circle">
                  {step > s.num ? '\u2713' : s.icon}
                </div>
                <span className="buy-step-label">{s.label}</span>
                <div className="buy-step-line" />
              </div>
            ))}
          </div>

          <div className="buy-step-content">
            {step === 1 && (
              <div className="buy-form-section animate-in">
                <div className="buy-form-header">
                  <h2>{'\u{1F4E6}'} Shipping Address</h2>
                  <p>Where should we deliver your order?</p>
                </div>

                {savedAddresses.length > 0 && !showNewAddr && (
                  <div className="saved-addresses">
                    {savedAddresses.map((addr) => (
                      <div key={addr.id}
                        className={`saved-addr-card ${selectedAddrId === addr.id ? 'selected' : ''}`}
                        onClick={() => { setSelectedAddrId(addr.id); setUseNewAddr(false); }}>
                        <div className="saved-addr-radio">
                          <div className={`radio-circle ${selectedAddrId === addr.id ? 'checked' : ''}`} />
                        </div>
                        <div className="saved-addr-info">
                          <strong>{addr.label}</strong>
                          <span>{addr.street}</span>
                          <span>{addr.city}, {addr.state} {addr.zip}</span>
                          <span className="buy-address-phone">{addr.phone}</span>
                        </div>
                        <button type="button" aria-label="Delete address" className="addr-delete-btn" onClick={(e) => { e.stopPropagation(); handleDeleteAddress(addr.id); }}>
                          {'\u2717'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button className="new-addr-btn" onClick={() => { setShowNewAddr(!showNewAddr); setUseNewAddr(true); }}>
                  {showNewAddr ? '\u2212 Cancel' : '+ Add new address'}
                </button>

                {showNewAddr && (
                  <div className="new-addr-form animate-in">
                    <div className="form-group">
                      <label>Street Address</label>
                      <input type="text" value={newAddr.street} onChange={(e) => setNewAddr({ ...newAddr, street: e.target.value })} placeholder="123 Main Street, Apt 4B" />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>City</label>
                        <input type="text" value={newAddr.city} onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })} placeholder="New York" />
                      </div>
                      <div className="form-group">
                        <label>State</label>
                        <input type="text" value={newAddr.state} onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })} placeholder="NY" />
                      </div>
                      <div className="form-group">
                        <label>ZIP Code</label>
                        <input type="text" value={newAddr.zip} onChange={(e) => setNewAddr({ ...newAddr, zip: e.target.value })} placeholder="10001" />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Phone</label>
                      <input type="tel" value={newAddr.phone} onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })} placeholder="+1 (555) 000-0000" />
                    </div>
                    <GradientButton onClick={handleSaveNewAddress} style={{ marginTop: 8 }}>
                      {'\u2713'} Save & Use
                    </GradientButton>
                  </div>
                )}

                <div className="buy-section-divider" />

                <div className="buy-gift-section">
                  <h3>Gift Options</h3>
                  <label className="buy-gift-toggle">
                    <input type="checkbox" checked={giftWrap} onChange={(e) => setGiftWrap(e.target.checked)} />
                    <span className="buy-gift-check" />
                    <div>
                      <strong>This order contains a gift</strong>
                      <span className="buy-gift-price">+${GIFT_WRAP_PRICE.toFixed(2)} gift wrap</span>
                    </div>
                  </label>
                  {giftWrap && (
                    <div className="buy-gift-message animate-in">
                      <label>Gift message (optional, max 200 characters)</label>
                      <textarea placeholder="Write a heartfelt message..." value={giftMessage}
                        onChange={(e) => setGiftMessage(e.target.value)} rows={2} maxLength={200} />
                      <span className="buy-char-count">{giftMessage.length}/200</span>
                    </div>
                  )}
                </div>

                <div className="buy-actions">
                  <GradientButton onClick={handleNext}>
                    Continue to Payment {'\u2192'}
                  </GradientButton>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="buy-form-section animate-in">
                <div className="buy-form-header">
                  <h2>{'\u{1F4B3}'} Payment Method</h2>
                  <p>Choose how you&apos;d like to pay</p>
                </div>

                <div className="payment-options">
                  {PAYMENT_METHODS.map((pm) => (
                    <div key={pm.id} className={`payment-option ${paymentMethod === pm.id ? 'selected' : ''}`}
                      onClick={() => setPaymentMethod(pm.id)}>
                      <input type="radio" checked={paymentMethod === pm.id} readOnly style={{ display: 'none' }} />
                      <div className="payment-icon">{pm.icon}</div>
                      <div className="buy-payment-info" style={{ flex: 1 }}>
                        <strong>{pm.label}</strong>
                        <span className="buy-payment-desc" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{pm.desc}</span>
                      </div>
                      {paymentMethod === pm.id && <div className="payment-check">{'\u2713'}</div>}
                    </div>
                  ))}
                </div>

                {paymentMethod === 'razorpay' && (
                  <div className="card-form animate-in">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                      <div style={{
                        width: 46, height: 46, borderRadius: 12, flexShrink: 0,
                        background: 'linear-gradient(135deg, #0b72e7 0%, #3395ff 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: 22, fontWeight: 800,
                        boxShadow: '0 6px 16px rgba(11,114,231,0.25)',
                      }}>R</div>
                      <div>
                        <strong style={{ display: 'block', fontSize: 15 }}>Pay securely with Razorpay</strong>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                          Complete payment in Razorpay&apos;s PCI-DSS compliant checkout.
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                      {['Cards', 'UPI', 'NetBanking', 'Wallets', 'EMI'].map((method) => (
                        <span key={method} style={{
                          padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                          background: 'var(--bg-container, #f1f5f9)', color: 'var(--text-secondary)',
                          border: '1px solid var(--border, #e2e8f0)',
                        }}>{method}</span>
                      ))}
                    </div>
                    {(razorpayReady === false || (razorpayCurrency === 'INR' && razorpayRate <= 0)) && (
                      <div style={{
                        padding: '12px 14px', borderRadius: 10, marginBottom: 12,
                        background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
                        fontSize: 13, color: '#92400e', lineHeight: 1.5,
                      }}>
                        {razorpayCurrency === 'INR' && razorpayRate <= 0
                          ? 'INR payments are not configured. Set RAZORPAY_USD_TO_INR or choose Cash on Delivery.'
                          : razorpayConfigured && !razorpayOrderSync
                            ? 'Online payments are being set up. Add SUPABASE_SERVICE_ROLE_KEY on the server so payments can be recorded, or choose Cash on Delivery.'
                            : 'Online payments are not configured yet. Add your Razorpay keys to enable cards/UPI, or choose Cash on Delivery.'}
                      </div>
                    )}
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {'\u{1F512}'} 256-bit SSL encrypted &middot; We never see or store your card details
                    </div>
                    {razorpayCurrency !== 'USD' && (
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 10 }}>
                        {razorpayCurrency === 'INR' && razorpayRate > 0 ? (
                          <>You&apos;ll be charged approximately <strong>{'\u20B9'}{(totalPrice * razorpayRate).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</strong> at the current exchange rate.</>
                        ) : (
                          <>Payment will be charged in <strong>{razorpayCurrency}</strong>.</>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {paymentMethod === 'cod' && (
                  <div className="buy-cod-notice animate-in">
                    <div className="buy-cod-icon">{'\u{1F4B5}'}</div>
                    <div>
                      <strong>Cash on Delivery</strong>
                      <p>Pay with cash when your order arrives. No additional fees.</p>
                    </div>
                  </div>
                )}

                <div className="buy-actions">
                  <GradientButton variant="secondary" onClick={() => setStep(1)}>
                    {'\u2190'} Back to Shipping
                  </GradientButton>
                  <GradientButton onClick={handleNext}>
                    Continue to Review {'\u2192'}
                  </GradientButton>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="buy-form-section animate-in">
                <div className="buy-form-header">
                  <h2>{'\u2705'} Review Your Order</h2>
                  <p>Please verify everything looks correct</p>
                </div>

                <div className="review-section">
                  <div className="review-section-header">
                    <strong>{'\u{1F4E6}'} Shipping To</strong>
                    <button className="edit-link" onClick={() => setStep(1)}>Edit</button>
                  </div>
                  <div className="review-address">
                    <div>{activeAddr?.street}, {activeAddr?.city}, {activeAddr?.state} {activeAddr?.zip}</div>
                    <div>{activeAddr?.phone}</div>
                  </div>
                </div>

                <div className="review-section compact">
                  <div className="review-section-header">
                    <strong>{'\u{1F4B3}'} Payment Method</strong>
                    <button className="edit-link" onClick={() => setStep(2)}>Edit</button>
                  </div>
                  <div className="review-payment">
                    {PAYMENT_METHODS.find((p) => p.id === paymentMethod)?.icon} {paymentMethodLabel(paymentMethod)}
                    {paymentMethod === 'razorpay' && <span> · secure Razorpay checkout</span>}
                  </div>
                </div>

                {giftWrap && (
                  <div className="review-section compact">
                    <div className="review-section-header">
                      <strong>{'\u{1F381}'} Gift Options</strong>
                      <button className="edit-link" onClick={() => setStep(1)}>Edit</button>
                    </div>
                    <div>
                      <div>{'\u{1F381}'} Included</div>
                      {giftMessage && <div className="review-gift-msg">&quot;{giftMessage}&quot;</div>}
                    </div>
                  </div>
                )}

                <div className="review-section">
                  <div className="review-section-header">
                    <strong>Items ({cart.items.length})</strong>
                  </div>
                  <div className="review-items">
                    {cart.items.map((item) => (
                      <div key={item._id} className="review-item">
                        <img src={item.image || ''} alt={item.name} onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNmM2Y0ZjYiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI2E2YThiNCIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='; }} />
                        <div className="review-item-info">
                          <Link href={`/products/${typeof item.product === 'string' ? item.product : item.product._id}`}>{item.name}</Link>
                          <span>Qty: {item.quantity}</span>
                        </div>
                        <span className="review-item-price">${((item.price || 0) * (item.quantity || 0)).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="buy-actions">
                  <GradientButton variant="secondary" onClick={() => setStep(2)}>
                    {'\u2190'} Back to Payment
                  </GradientButton>
                  <GradientButton onClick={handlePlaceOrder} disabled={submitting} loading={submitting}>
                    {submitting ? (
                      <>{paymentMethod === 'razorpay' ? 'Opening Razorpay...' : 'Placing Order...'}</>
                    ) : (
                      paymentMethod === 'razorpay'
                        ? `Pay Securely — $${totalPrice.toFixed(2)}`
                        : `Place Order — $${totalPrice.toFixed(2)}`
                    )}
                  </GradientButton>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="buy-sidebar">
          <div className="buy-sidebar-sticky">
            <div className="buy-sidebar-card">
              <h3>Order Summary</h3>

              <div className="buy-sidebar-items">
                {cart.items.slice(0, 3).map((item) => (
                  <div key={item._id} className="buy-sidebar-item">
                    <img src={item.image || ''} alt={item.name} onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNmM2Y0ZjYiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI2E2YThiNCIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='; }} />
                    <div className="buy-sidebar-item-info">
                      <span className="buy-sidebar-item-name">{item.name}</span>
                      <span className="buy-sidebar-item-qty">Qty: {item.quantity}</span>
                    </div>
                    <span className="buy-sidebar-item-price">${((item.price || 0) * (item.quantity || 0)).toFixed(2)}</span>
                  </div>
                ))}
                {cart.items.length > 3 && (
                  <div className="buy-sidebar-more">+{cart.items.length - 3} more item(s)</div>
                )}
              </div>

              <div className="buy-sidebar-breakdown">
                <div className="buy-sidebar-row">
                  <span>Items ({cart.totalItems})</span>
                  <span>${(cart.totalPrice || 0).toFixed(2)}</span>
                </div>
                <div className="buy-sidebar-row">
                  <span>Shipping</span>
                  <span style={{ color: shippingPrice === 0 ? 'var(--success)' : 'inherit', fontWeight: shippingPrice === 0 ? 700 : 400 }}>
                    {shippingPrice === 0 ? 'FREE' : `$${shippingPrice.toFixed(2)}`}
                  </span>
                </div>
                <div className="buy-sidebar-row">
                  <span>Estimated Tax</span>
                  <span>${taxPrice.toFixed(2)}</span>
                </div>
                {giftWrap && (
                  <div className="buy-sidebar-row">
                    <span>Gift Wrap</span>
                    <span>${giftWrapPrice.toFixed(2)}</span>
                  </div>
                )}
                {promoDiscount > 0 && (
                  <div className="buy-sidebar-row discount">
                    <span>Promo Discount</span>
                    <span>-${promoDiscountValue.toFixed(2)}</span>
                  </div>
                )}
                {applyWallet && walletApplied > 0 && (
                  <div className="buy-sidebar-row discount">
                    <span>Gift Card</span>
                    <span>-${walletApplied.toFixed(2)}</span>
                  </div>
                )}
                {cart.totalPrice < 50 && cart.totalPrice > 0 && (
                  <div className="buy-free-shipping-msg">
                    Add ${(50 - cart.totalPrice).toFixed(2)} more for FREE shipping
                  </div>
                )}
                <div className="buy-sidebar-row total">
                  <span>Order Total</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
              </div>

              <div className="buy-sidebar-promo">
                <h4>Have a coupon?</h4>
                <div className="buy-promo-input">
                  <input type="text" placeholder="Enter coupon code" value={promoCode}
                    onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoError(''); }} />
                  <button onClick={handleApplyPromo}>Apply</button>
                </div>
                {promoError && <div className="buy-promo-error">{promoError}</div>}
              </div>

              {walletBalance > 0 && (
                <div className="buy-sidebar-wallet">
                  <label className="buy-wallet-toggle">
                    <input type="checkbox" checked={applyWallet} onChange={(e) => setApplyWallet(e.target.checked)} />
                    <span>Use Gift Card Balance</span>
                  </label>
                  <div className="buy-wallet-balance">Available: ${walletBalance.toFixed(2)}</div>
                </div>
              )}

              <div className="buy-sidebar-footer">
                <div className="buy-sidebar-footer-item">
                  <span>{'\u{1F512}'}</span> Secure transaction
                </div>
                <div className="buy-sidebar-footer-item">
                  <span>{'\u{1F504}'}</span> Free 30-day returns
                </div>
                <div className="buy-sidebar-footer-item">
                  <span>{'\u{1F3F0}'}</span> Order protection
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyPage;
