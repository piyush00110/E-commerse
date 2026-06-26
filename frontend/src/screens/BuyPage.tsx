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
  { id: 'upi', label: 'UPI', desc: 'Google Pay, PhonePe, Paytm', icon: '\u{1F4F1}' },
  { id: 'cod', label: 'Cash on Delivery', desc: 'Pay when you receive', icon: '\u{1F4B5}' },
];

const BuyPage: React.FC = () => {
  const navigate = useNavigate();
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
    if (!stored) { navigate('/login'); return; }
    const fetchCart = async () => {
      try {
        const res = await cartAPI.get();
        if (!res.data.data.items.length) { navigate('/cart'); return; }
        setCart(res.data.data);
      } catch { navigate('/cart'); }
      finally { setLoading(false); }
    };
    fetchCart();
    const addrs = loadAddresses();
    setSavedAddresses(addrs);
    if (addrs.length > 0) { setSelectedAddrId(addrs[0].id); }
    else { setUseNewAddr(true); setShowNewAddr(true); }
  }, [navigate]);

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
  const shippingPrice = cart.totalPrice > 50 ? 0 : 9.99;
  const giftWrapPrice = giftWrap ? GIFT_WRAP_PRICE : 0;
  const promoDiscountValue = promoDiscount > 10 ? cart.totalPrice * (promoDiscount / 100) : promoDiscount;
  const walletApplied = applyWallet ? Math.min(walletBalance, cart.totalPrice + taxPrice + shippingPrice + giftWrapPrice) : 0;
  const subtotalAfterDiscount = Math.max(0, cart.totalPrice - promoDiscountValue);
  const totalPrice = Math.max(0, subtotalAfterDiscount + taxPrice + shippingPrice + giftWrapPrice - walletApplied);
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
                    <button className="checkout-btn" onClick={handleSaveNewAddress} style={{ marginTop: 8 }}>
                      {'\u2713'} Save & Use
                    </button>
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
                  <button className="buy-primary-btn" onClick={handleNext}>
                    Continue to Payment {'\u2192'}
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="buy-form-section animate-in">
                <div className="buy-form-header">
                  <h2>{'\u{1F4B3}'} Payment Method</h2>
                  <p>Choose how you'd like to pay</p>
                </div>

                <div className="payment-options">
                  {PAYMENT_METHODS.map((pm) => (
                    <div key={pm.id} className={`payment-option ${paymentMethod === pm.id ? 'selected' : ''}`}
                      onClick={() => setPaymentMethod(pm.id)}>
                      <input type="radio" checked={paymentMethod === pm.id} readOnly style={{ display: 'none' }} />
                      <div className="payment-icon">{pm.icon}</div>
                      <div className="buy-payment-info" style={{ flex: 1 }}>
                        <strong>{pm.label}</strong>
                        <span className="buy-payment-desc" style={{ fontSize: 13, color: '#565959' }}>{pm.desc}</span>
                      </div>
                      {paymentMethod === pm.id && <div className="payment-check">{'\u2713'}</div>}
                    </div>
                  ))}
                </div>

                {paymentMethod === 'credit_card' && (
                  <div className="card-form animate-in">
                    <div className="buy-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <span style={{ fontWeight: 600 }}>Enter card details</span>
                      <div className="buy-card-logos" style={{ display: 'flex', gap: 6 }}>
                        <span style={{ padding: '3px 6px', border: '1px solid #ddd', borderRadius: 3, fontSize: 10, fontWeight: 800 }}>VISA</span>
                        <span style={{ padding: '3px 6px', border: '1px solid #ddd', borderRadius: 3, fontSize: 10, fontWeight: 800 }}>MC</span>
                        <span style={{ padding: '3px 6px', border: '1px solid #ddd', borderRadius: 3, fontSize: 10, fontWeight: 800 }}>AMEX</span>
                      </div>
                    </div>
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
                  <div className="buy-cod-notice animate-in">
                    <div className="buy-cod-icon">{'\u{1F4B5}'}</div>
                    <div>
                      <strong>Cash on Delivery</strong>
                      <p>Pay with cash when your order arrives. No additional fees.</p>
                    </div>
                  </div>
                )}

                <div className="buy-actions">
                  <button className="buy-secondary-btn" onClick={() => setStep(1)}>
                    {'\u2190'} Back to Shipping
                  </button>
                  <button className="buy-primary-btn" onClick={handleNext}>
                    Continue to Review {'\u2192'}
                  </button>
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
                    {PAYMENT_METHODS.find((p) => p.id === paymentMethod)?.icon} {PAYMENT_METHODS.find((p) => p.id === paymentMethod)?.label}
                    {paymentMethod === 'credit_card' && cardNumber && <span> ending in {cardNumber.slice(-4)}</span>}
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
                          <Link to={`/products/${typeof item.product === 'string' ? item.product : item.product._id}`}>{item.name}</Link>
                          <span>Qty: {item.quantity}</span>
                        </div>
                        <span className="review-item-price">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="buy-actions">
                  <button className="buy-secondary-btn" onClick={() => setStep(2)}>
                    {'\u2190'} Back to Payment
                  </button>
                  <button className="buy-primary-btn buy-place-order-btn" onClick={handlePlaceOrder} disabled={submitting}>
                    {submitting ? (
                      <><span className="buy-spinner" /> Placing Order...</>
                    ) : (
                      `Place Order — $${totalPrice.toFixed(2)}`
                    )}
                  </button>
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
                    <img src={item.image} alt={item.name} />
                    <div className="buy-sidebar-item-info">
                      <span className="buy-sidebar-item-name">{item.name}</span>
                      <span className="buy-sidebar-item-qty">Qty: {item.quantity}</span>
                    </div>
                    <span className="buy-sidebar-item-price">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                {cart.items.length > 3 && (
                  <div className="buy-sidebar-more">+{cart.items.length - 3} more item(s)</div>
                )}
              </div>

              <div className="buy-sidebar-breakdown">
                <div className="buy-sidebar-row">
                  <span>Items ({cart.totalItems})</span>
                  <span>${cart.totalPrice.toFixed(2)}</span>
                </div>
                <div className="buy-sidebar-row">
                  <span>Shipping</span>
                  <span style={{ color: shippingPrice === 0 ? '#067d62' : 'inherit', fontWeight: shippingPrice === 0 ? 700 : 400 }}>
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
