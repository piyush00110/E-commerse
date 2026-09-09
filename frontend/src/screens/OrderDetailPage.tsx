'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { orderAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

interface TrackingEvent {
  date: string;
  location: string;
  description: string;
  icon: string;
}

interface FullOrder {
  _id: string;
  items: { product: string; name: string; image: string; price: number; quantity: number }[];
  shippingAddress: { street: string; city: string; state: string; zip: string; country: string; phone: string };
  paymentMethod: string;
  taxPrice: number;
  shippingPrice: number;
  totalPrice: number;
  isPaid: boolean;
  paidAt?: string;
  isDelivered: boolean;
  deliveredAt?: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  user: { name: string; email: string };
}

const CARRIERS = ['USPS', 'UPS', 'FedEx', 'DHL'];
const CITIES = ['Memphis, TN', 'Louisville, KY', 'Dallas, TX', 'Atlanta, GA', 'Phoenix, AZ', 'Seattle, WA', 'Newark, NJ', 'Los Angeles, CA', 'Chicago, IL', 'Miami, FL'];
const SHIPPING_CITIES = ['San Francisco, CA', 'Austin, TX', 'Portland, OR', 'Denver, CO'];

const generateTracking = (status: string, createdDate: string): TrackingEvent[] => {
  const created = new Date(createdDate);
  const events: TrackingEvent[] = [];
  const carrier = CARRIERS[Math.floor(Math.random() * CARRIERS.length)];
  const daysSinceOrder = Math.floor((Date.now() - created.getTime()) / 86400000);

  events.push({
    date: created.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    location: 'Order Processing Center',
    description: `Order placed. Payment confirmed via ${carrier} tracking.`,
    icon: '\u{1F4E6}',
  });

  if (status === 'cancelled') {
    events.push({
      date: new Date(created.getTime() + 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      location: 'Order Processing Center',
      description: 'Order has been cancelled.',
      icon: '\u274C',
    });
    return events;
  }

  if (daysSinceOrder >= 1 || status !== 'pending') {
    events.push({
      date: new Date(created.getTime() + 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      location: 'Fulfillment Center',
      description: `Package processed by ${carrier}. Estimated weight: ${(Math.random() * 5 + 1).toFixed(1)} lbs.`,
      icon: '\u{1F69A}',
    });
  }

  if (status === 'processing' || status === 'shipped' || status === 'delivered') {
    const city = CITIES[Math.floor(Math.random() * CITIES.length)];
    events.push({
      date: new Date(created.getTime() + 2 * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      location: `${city} Distribution Center`,
      description: `Package arrived at regional hub. In transit to next facility.`,
      icon: '\u{1F3ED}',
    });
  }

  if (status === 'shipped' || status === 'delivered') {
    events.push({
      date: new Date(created.getTime() + 3 * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      location: `Local Delivery Facility - ${CITIES[Math.floor(Math.random() * CITIES.length)].split(',')[0]}`,
      description: `Package out for delivery with ${carrier}. Expected between 2:00 PM - 6:00 PM.`,
      icon: '\u{1F9F3}',
    });
  }

  if (status === 'delivered') {
    events.push({
      date: new Date(created.getTime() + 4 * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      location: SHIPPING_CITIES[Math.floor(Math.random() * SHIPPING_CITIES.length)] || 'Customer Address',
      description: `Package delivered. Left at front door. Signed by: Customer.`,
      icon: '\u2705',
    });
  }

  return events;
};

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'badge badge-warning' },
  processing: { label: 'Processing', className: 'badge badge-success' },
  shipped: { label: 'Shipped', className: 'badge badge-warning' },
  delivered: { label: 'Delivered', className: 'badge badge-success' },
  cancelled: { label: 'Cancelled', className: 'badge badge-error' },
};

const OrderDetailPage: React.FC = () => {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { showToast } = useToast();
  const [order, setOrder] = useState<FullOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState<TrackingEvent[]>([]);
  const [trackingNumber, setTrackingNumber] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) { router.push('/login'); return; }
    if (!id) { router.push('/orders'); return; }
    const fetchOrder = async () => {
      try {
        const res = await orderAPI.getById(id);
        const o = res.data.data;
        setOrder(o);
        setTracking(generateTracking(o.status, o.createdAt));
        const tn = 'TRK' + o._id.slice(-8).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
        setTrackingNumber(tn);
      } catch {
        showToast('Failed to load order', 'error');
        router.push('/orders');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ height: 20, background: '#e2e8f0', borderRadius: 8, width: '30%', marginBottom: 24 }} />
        <div className="card" style={{ padding: 24, marginBottom: 20, animation: 'pulse 2s infinite' }}>
          <div style={{ height: 24, background: '#e2e8f0', borderRadius: 8, width: '50%', marginBottom: 12 }} />
          <div style={{ height: 16, background: '#e2e8f0', borderRadius: 8, width: '70%' }} />
        </div>
      </div>
    );
  }

  if (!order) return null;

  const statusInfo = statusConfig[order.status] || statusConfig.pending;
  const itemsTotal = order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const statusOrder = ['pending', 'processing', 'shipped', 'delivered'];
  const currentIdx = statusOrder.indexOf(order.status);

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px', fontFamily: "'Inter', sans-serif" }}>
      {/* Breadcrumb */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, fontSize: 13, color: '#64748b' }}>
        <Link href="/" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 500 }}>Home</Link>
        <span style={{ color: '#cbd5e1' }}>{'/'}</span>
        <Link href="/orders" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 500 }}>My Orders</Link>
        <span style={{ color: '#cbd5e1' }}>{'/'}</span>
        <span style={{ color: '#0f172a', fontWeight: 600 }}>Order #{order._id.slice(-8).toUpperCase()}</span>
      </nav>

      {/* Order Header */}
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <div>
            <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 24, fontWeight: 800, color: '#0f172a' }}>
              Order #{order._id.slice(-8).toUpperCase()}
            </h1>
            <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>
              Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className={statusInfo.className} style={{ fontSize: 14, padding: '6px 16px' }}>
              {statusInfo.label}
            </span>
            {order.deliveredAt && (
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                Delivered {new Date(order.deliveredAt).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, paddingTop: 20, borderTop: '1px solid #f1f5f9' }}>
          <div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 500 }}>Total</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>${(order.totalPrice ?? 0).toFixed(2)}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 500 }}>Items</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{order.items.length} {order.items.length === 1 ? 'item' : 'items'}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 500 }}>Payment</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', textTransform: 'capitalize' }}>{order.paymentMethod.replace('_', ' ')}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 500 }}>Ship to</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{order.shippingAddress.city}, {order.shippingAddress.state}</div>
          </div>
        </div>
      </div>

      {/* Tracking Section */}
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Shipment Tracking</h2>
          {order.status !== 'pending' && order.status !== 'cancelled' && (
            <div style={{ fontSize: 13, color: '#64748b' }}>
              Carrier: <strong>{CARRIERS[order._id.charCodeAt(0) % CARRIERS.length]}</strong>
              &nbsp;| Tracking #: <strong style={{ fontFamily: "'JetBrains Mono', monospace", color: '#6366f1' }}>{trackingNumber}</strong>
            </div>
          )}
        </div>

        {order.status === 'cancelled' ? (
          <div style={{ textAlign: 'center', padding: 40, background: '#fef2f2', borderRadius: 12, border: '1px solid #fecaca' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>{'\u274C'}</div>
            <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, color: '#991b1b', marginBottom: 4 }}>Order Cancelled</h3>
            <p style={{ fontSize: 14, color: '#dc2626' }}>This order has been cancelled. No shipments were made.</p>
          </div>
        ) : (
          <>
            {/* Progress Bar */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                {['Order Placed', 'Processing', 'Shipped', 'Delivered'].map((label, idx) => {
                  const isComplete = idx <= currentIdx;
                  const isCurrent = idx === currentIdx;
                  return (
                    <React.Fragment key={label}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                        <div style={{
                          width: order.status === 'delivered' && idx === 3 ? 40 : 36,
                          height: order.status === 'delivered' && idx === 3 ? 40 : 36,
                          borderRadius: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 15, fontWeight: 700, marginBottom: 8, transition: 'all 0.3s',
                          background: isComplete ? '#6366f1' : '#e2e8f0',
                          color: isComplete ? '#fff' : '#94a3b8',
                          boxShadow: isCurrent ? '0 0 0 4px rgba(99,102,241,0.2)' : 'none',
                        }}>
                          {isComplete ? '\u2713' : idx + 1}
                        </div>
                        <div style={{
                          fontSize: 12, fontWeight: isCurrent ? 700 : 500,
                          color: isComplete ? '#0f172a' : '#94a3b8',
                        }}>{label}</div>
                        {isCurrent && order.status !== 'delivered' && (
                          <div style={{ fontSize: 11, color: '#6366f1', marginTop: 2, fontWeight: 500 }}>
                            {order.status === 'pending' ? 'Awaiting confirmation' : order.status === 'processing' ? 'In progress' : order.status === 'shipped' ? 'On the way' : ''}
                          </div>
                        )}
                      </div>
                      {idx < 3 && (
                        <div style={{
                          flex: 1, height: 3, borderRadius: 9999, marginBottom: 24,
                          background: idx < currentIdx ? '#6366f1' : '#e2e8f0',
                          transition: 'background 0.3s',
                        }} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Delivery Estimate */}
            {order.status !== 'delivered' && (
              <div style={{
                background: 'linear-gradient(135deg, #6366f1, #818cf8)', borderRadius: 12, padding: '14px 20px',
                color: '#fff', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <span style={{ fontSize: 24 }}>{'\u{1F69A}'}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>
                    {order.status === 'pending' ? 'Preparing your order' :
                     order.status === 'processing' ? 'Estimated delivery: ' + new Date(Date.now() + 3 * 86400000).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) :
                     'Package on the way'}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.85 }}>
                    {order.status === 'shipped' ? `Expected ${new Date(Date.now() + 2 * 86400000).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}` : 'We\'ll notify you when it ships'}
                  </div>
                </div>
              </div>
            )}

            {/* Tracking Timeline */}
            <div style={{ position: 'relative', paddingLeft: 28 }}>
              {tracking.map((event, idx) => (
                <div key={idx} style={{
                  display: 'flex', gap: 16, marginBottom: idx < tracking.length - 1 ? 24 : 0,
                  position: 'relative',
                }}>
                  {/* Timeline line */}
                  {idx < tracking.length - 1 && (
                    <div style={{
                      position: 'absolute', left: 11, top: 28, bottom: -24,
                      width: 2, background: '#e2e8f0',
                    }} />
                  )}
                  {/* Icon */}
                  <div style={{
                    width: 24, height: 24, borderRadius: 9999, background: idx === 0 ? '#6366f1' : '#f1f5f9',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
                    flexShrink: 0, position: 'relative', zIndex: 1,
                  }}>
                    <span style={{ fontSize: 12 }}>{event.icon}</span>
                  </div>
                  {/* Content */}
                  <div style={{ flex: 1, paddingBottom: 0 }}>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 2 }}>{event.date}</div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 2 }}>{event.location}</div>
                    <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>{event.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Shipping Info */}
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Shipping Information</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div style={{ padding: 16, background: '#f8fafc', borderRadius: 12 }}>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Address</div>
            <div style={{ fontSize: 14, color: '#0f172a', lineHeight: 1.8 }}>
              <div>{order.shippingAddress.street}</div>
              <div>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</div>
              <div>{order.shippingAddress.country}</div>
            </div>
          </div>
          <div style={{ padding: 16, background: '#f8fafc', borderRadius: 12 }}>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact</div>
            <div style={{ fontSize: 14, color: '#0f172a', lineHeight: 1.8 }}>
              <div>{order.user?.name}</div>
              <div>{order.user?.email}</div>
              <div>{order.shippingAddress.phone}</div>
            </div>
          </div>
          <div style={{ padding: 16, background: '#f8fafc', borderRadius: 12 }}>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Shipping Method</div>
            <div style={{ fontSize: 14, color: '#0f172a', lineHeight: 1.8 }}>
              <div>Standard Shipping</div>
              <div style={{ color: order.shippingPrice === 0 ? '#10b981' : 'inherit', fontWeight: order.shippingPrice === 0 ? 700 : 400 }}>
                {order.shippingPrice === 0 ? 'FREE' : `$${(order.shippingPrice ?? 0).toFixed(2)}`}
              </div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Estimated 3-5 business days</div>
            </div>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Items in this order</h2>
        <div>
          {order.items.map((item, idx) => (
            <div key={idx} style={{
              display: 'flex', gap: 16, alignItems: 'center', padding: '14px 0',
              borderBottom: idx < order.items.length - 1 ? '1px solid #f1f5f9' : 'none',
            }}>
              <Link href={`/products/${item.product}`}>
                <img src={item.image} alt="" style={{
                  width: 80, height: 80, borderRadius: 12, objectFit: 'contain',
                  background: '#f8fafc', border: '1px solid #e2e8f0',
                }} />
              </Link>
              <div style={{ flex: 1 }}>
                <Link href={`/products/${item.product}`} style={{ color: '#6366f1', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
                  {item.name}
                </Link>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                  Qty: {item.quantity} | ${(item.price ?? 0).toFixed(2)} each
                </div>
                <div style={{ marginTop: 4 }}>
                  <span className={`badge ${order.isDelivered ? 'badge-success' : order.status === 'shipped' ? 'badge-warning' : order.status === 'processing' ? 'badge-success' : 'badge-warning'}`}
                    style={{ fontSize: 11, padding: '2px 8px' }}>
                    {order.isDelivered ? '\u2713 Delivered' : order.status === 'shipped' ? '\u{1F4E6} In transit' : order.status === 'processing' ? '\u2699 Processing' : '\u23F3 Pending'}
                  </span>
                </div>
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                ${((item.price ?? 0) * (item.quantity ?? 0)).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Summary */}
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Order Summary</h2>
        <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 14, color: '#475569' }}>
          <span>Items ({order.items.reduce((s, i) => s + i.quantity, 0)} total)</span>
          <span style={{ fontWeight: 600, color: '#0f172a' }}>${(itemsTotal ?? 0).toFixed(2)}</span>
        </div>
        <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 14, color: '#475569' }}>
          <span>Shipping</span>
          <span style={{ color: order.shippingPrice === 0 ? '#10b981' : '#0f172a', fontWeight: order.shippingPrice === 0 ? 700 : 600 }}>
            {order.shippingPrice === 0 ? 'FREE' : `$${(order.shippingPrice ?? 0).toFixed(2)}`}
          </span>
        </div>
        <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 14, color: '#475569' }}>
          <span>Tax</span>
          <span style={{ fontWeight: 600, color: '#0f172a' }}>${(order.taxPrice ?? 0).toFixed(2)}</span>
        </div>
        <div className="summary-row total" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontSize: 16, fontWeight: 800, color: '#0f172a', borderTop: '2px solid #e2e8f0', marginTop: 8, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <span>Total</span>
          <span>${(order.totalPrice ?? 0).toFixed(2)}</span>
        </div>
        <div style={{ fontSize: 12, color: '#64748b', textAlign: 'center', marginTop: 12 }}>
          {order.isPaid ? 'Payment collected' : 'Payment pending'}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link href="/orders" className="btn btn-secondary" style={{ textDecoration: 'none', display: 'inline-flex', padding: '12px 24px' }}>
          {'\u2190'} Back to Orders
        </Link>
        {order.status !== 'cancelled' && (
          <button onClick={() => {
            navigator.clipboard?.writeText(trackingNumber);
            showToast(`Tracking # copied: ${trackingNumber}`, 'success');
          }} className="btn btn-ghost" style={{ padding: '12px 24px', border: '2px solid #e2e8f0' }}>
            Copy Tracking #
          </button>
        )}
      </div>
    </div>
  );
};

export default OrderDetailPage;
