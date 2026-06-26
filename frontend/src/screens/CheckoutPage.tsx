import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);

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
    if (!stored) { navigate('/login?redirect=%2Fcheckout'); return; }
    let cancelled = false;
    const fetchCart = async () => {
      try {
        const res = await cartAPI.get();
        if (cancelled) return;
        if (!res.data.data.items.length) { navigate('/cart'); return; }
        setCart(res.data.data);
      } catch {
        if (!cancelled) navigate('/cart');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchCart();
    const addrs = loadAddresses();
    setSavedAddresses(addrs);
    if (addrs.length > 0) { setSelectedAddrId(addrs[0].id); }
    else { setUseNewAddr(true); setShowNewAddr(true); }
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
    setSubmitting(true);
    try {
      const res = await orderAPI.create({ shippingAddress: addr, paymentMethod });
      showToast('Order placed successfully!', 'success');
      navigate(`/order-confirmation/${res.data.data._id}`);
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

  return (
    <div className="checkout-page">
      <div className="checkout-form">
        <h2 style={{ marginBottom: 24, fontSize: 24 }}>Checkout</h2>

        {/* Step Indicator */}
        <div className="checkout-steps">
          {[{ num: 1, label: 'Shipping' }, { num: 2, label: 'Payment' }, { num: 3, label: 'Review' }].map((s) => (
            <div key={s.num} className={`checkout-step-indicator ${step === s.num ? 'active' : step > s.num ? 'completed' : ''}`}>
              <div className="step-circle">{step > s.num ? '\u2713' : s.num}</div>
              <span className="step-label">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Step 1: Shipping */}
        {step === 1 && (
          <div className="checkout-step-content">
            <h3>Shipping Address</h3>

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
                      <div>{addr.street}</div>
                      <div>{addr.city}, {addr.state} {addr.zip}</div>
                      <div>{addr.phone}</div>
                    </div>
                    <button className="addr-delete-btn" onClick={(e) => { e.stopPropagation(); handleDeleteAddress(addr.id); }}>
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
              <div className="new-addr-form">
                <div className="form-group">
                  <label>Street Address</label>
                  <input type="text" value={newAddr.street} onChange={(e) => setNewAddr({ ...newAddr, street: e.target.value })}
                    placeholder="123 Main Street, Apt 4B" />
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
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>ZIP Code</label>
                    <input type="text" value={newAddr.zip} onChange={(e) => setNewAddr({ ...newAddr, zip: e.target.value })} placeholder="10001" />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input type="tel" value={newAddr.phone} onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })} placeholder="+1 (555) 000-0000" />
                  </div>
                </div>
                <button className="submit-btn" onClick={handleSaveNewAddress} style={{ maxWidth: 200 }}>
                  Save & Use
                </button>
              </div>
            )}

            <div className="gift-options">
              <h3>Gift options</h3>
              <label className="gift-wrap-toggle">
                <input type="checkbox" checked={giftWrap} onChange={(e) => setGiftWrap(e.target.checked)} />
                <span>This order contains a gift</span>
                <span className="gift-wrap-price">+${GIFT_WRAP_PRICE.toFixed(2)} gift wrap</span>
              </label>
              {giftWrap && (
                <div className="gift-message-input">
                  <label>Gift message (optional)</label>
                  <textarea placeholder="Write a gift message..." value={giftMessage}
                    onChange={(e) => setGiftMessage(e.target.value)} rows={2}
                    maxLength={200} />
                  <span className="gift-char-count">{giftMessage.length}/200</span>
                </div>
              )}
            </div>

            <div className="step-actions">
              <button className="btn-primary" onClick={handleNext} style={{ maxWidth: 200 }}>
                Continue to Payment {'\u2192'}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Payment */}
        {step === 2 && (
          <div className="checkout-step-content">
            <h3>Payment Method</h3>
            <div className="payment-options">
              {PAYMENT_METHODS.map((pm) => (
                <div key={pm.id} className={`payment-option ${paymentMethod === pm.id ? 'selected' : ''}`}
                  onClick={() => setPaymentMethod(pm.id)}>
                  <input type="radio" checked={paymentMethod === pm.id} readOnly />
                  <span className="payment-icon">{pm.icon}</span>
                  <div>
                    <strong>{pm.label}</strong>
                    <div style={{ fontSize: 12, color: '#565959' }}>{pm.desc}</div>
                  </div>
                  {paymentMethod === pm.id && <span className="payment-check">{'\u2713'}</span>}
                </div>
              ))}
            </div>

            {paymentMethod === 'credit_card' && (
              <div className="card-form">
                <div className="form-group">
                  <label>Card Number</label>
                  <input type="text" value={cardNumber} onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim())}
                    placeholder="1234 5678 9012 3456" maxLength={19} />
                </div>
                <div className="form-group">
                  <label>Name on Card</label>
                  <input type="text" value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="John Doe" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Expiry Date</label>
                    <input type="text" value={cardExpiry} onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '');
                      if (v.length <= 4) setCardExpiry(v.length > 2 ? v.slice(0, 2) + '/' + v.slice(2) : v);
                    }} placeholder="MM/YY" maxLength={5} />
                  </div>
                  <div className="form-group">
                    <label>CVV</label>
                    <input type="text" value={cardCvv} onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="123" maxLength={4} />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'cod' && (
              <div style={{ background: '#fff8e1', borderRadius: 8, padding: 16, fontSize: 14, color: '#856404', marginTop: 12 }}>
                Pay with cash when your order is delivered. No additional fees.
              </div>
            )}

            <div className="step-actions" style={{ justifyContent: 'space-between' }}>
              <button className="step-back-btn" onClick={() => setStep(1)}>{'\u2190'} Back to Shipping</button>
              <button className="btn-primary" onClick={handleNext} style={{ maxWidth: 200 }}>
                Continue to Review {'\u2192'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="checkout-step-content">
            <h3>Review Your Order</h3>

            <div className="review-section compact">
              <div className="review-section-header">
                <strong>Shipping to</strong>
                <button className="edit-link" onClick={() => setStep(1)}>Edit</button>
              </div>
              {activeAddr && (
                <div className="review-address">
                  <div>{activeAddr.street}</div>
                  <div>{activeAddr.city}, {activeAddr.state} {activeAddr.zip}</div>
                  <div>{activeAddr.phone}</div>
                </div>
              )}
            </div>

            <div className="review-section compact">
              <div className="review-section-header">
                <strong>Payment method</strong>
                <button className="edit-link" onClick={() => setStep(2)}>Edit</button>
              </div>
              <div className="review-payment">
                {PAYMENT_METHODS.find((p) => p.id === paymentMethod)?.icon} {PAYMENT_METHODS.find((p) => p.id === paymentMethod)?.label}
                {paymentMethod === 'credit_card' && cardNumber && <span> ending in {cardNumber.slice(-4)}</span>}
              </div>
            </div>

            {giftWrap && (
              <div className="review-section compact">
                <div className="review-section-header">
                  <strong>Gift options</strong>
                  <button className="edit-link" onClick={() => setStep(1)}>Edit</button>
                </div>
                <div className="review-gift">
                  <div>{'\u{1F381}'} Gift wrap included</div>
                  {giftMessage && <div className="review-gift-msg">"{giftMessage}"</div>}
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
                    <img src={item.image} alt={item.name} />
                    <div className="review-item-info">
                      <Link to={`/products/${typeof item.product === 'string' ? item.product : item.product._id}`}
                        style={{ color: '#007185', fontSize: 14 }}>{item.name}</Link>
                      <div style={{ fontSize: 13, color: '#565959' }}>Qty: {item.quantity}</div>
                    </div>
                    <div className="review-item-price">${(item.price * item.quantity).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="step-actions" style={{ justifyContent: 'space-between' }}>
              <button className="step-back-btn" onClick={() => setStep(2)}>{'\u2190'} Back to Payment</button>
              <button className="checkout-btn" onClick={handlePlaceOrder} disabled={submitting}
                style={{ maxWidth: 260, opacity: submitting ? 0.6 : 1 }}>
                {submitting ? 'Placing Order...' : `Place Order - $${totalPrice.toFixed(2)}`}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="order-summary">
        <h2>Order Summary</h2>
        <div className="summary-row">
          <span>Items ({cart.totalItems})</span>
          <span>${cart.totalPrice.toFixed(2)}</span>
        </div>
        <div className="summary-row">
          <span>Shipping</span>
          <span style={{ color: shippingPrice === 0 ? '#067d62' : 'inherit', fontWeight: shippingPrice === 0 ? 600 : 400 }}>
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
          <div className="summary-row" style={{ color: '#067d62' }}>
            <span>Promo Discount</span>
            <span>-${promoDiscountValue.toFixed(2)}</span>
          </div>
        )}
        {applyWallet && walletApplied > 0 && (
          <div className="summary-row" style={{ color: '#067d62' }}>
            <span>Gift Card</span>
            <span>-${walletApplied.toFixed(2)}</span>
          </div>
        )}
        {cart.totalPrice < 50 && cart.totalPrice > 0 && (
          <div style={{ fontSize: 12, color: '#b12704', marginTop: -8, marginBottom: 8 }}>
            Add ${(50 - cart.totalPrice).toFixed(2)} more for FREE shipping
          </div>
        )}
        <div className="summary-row total">
          <span>Order Total</span>
          <span>${totalPrice.toFixed(2)}</span>
        </div>

        {/* Promo Code */}
        <div className="promo-section">
          <div className="promo-input-row">
            <input type="text" placeholder="Enter coupon code" value={promoCode}
              onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoError(''); }} />
            <button className="promo-apply-btn" onClick={handleApplyPromo}>Apply</button>
          </div>
          {promoError && <div className="promo-error">{promoError}</div>}
        </div>

        {/* Wallet */}
        {walletBalance > 0 && (
          <div className="wallet-section">
            <label className="wallet-toggle">
              <input type="checkbox" checked={applyWallet} onChange={(e) => setApplyWallet(e.target.checked)} />
              <span>Use Gift Card Balance</span>
            </label>
            <div className="wallet-balance">Available: ${walletBalance.toFixed(2)}</div>
          </div>
        )}

        {step === 1 && (
          <div style={{ background: '#f0f8ff', borderRadius: 8, padding: 12, fontSize: 12, color: '#565959', marginTop: 16 }}>
            <strong style={{ color: '#067d62' }}>{'\u2713'} Free returns</strong>
            <div>Free 30-day returns on all eligible items.</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutPage;
