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
        <div style={{ height: 20, background: 'var(--border)', borderRadius: 8, width: '30%', marginBottom: 24 }} />
        <div className="card" style={{ padding: 24, marginBottom: 20, animation: 'pulse 2s infinite' }}>
          <div style={{ height: 24, background: 'var(--border)', borderRadius: 8, width: '50%', marginBottom: 12 }} />
          <div style={{ height: 16, background: 'var(--border)', borderRadius: 8, width: '70%' }} />
        </div>
      </div>
    );
  }

  if (!order) return null;

  const statusInfo = statusConfig[order.status] || statusConfig.pending;
  const itemsTotal = order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const statusOrder = ['pending', 'processing', 'shipped', 'delivered'];
  const currentIdx = statusOrder.indexOf(order.status);
  const carrier = CARRIERS[order._id.charCodeAt(0) % CARRIERS.length];

  const milestones = [
    { key: 'pending', label: 'Order Placed', icon: '\u2714' },
    { key: 'processing', label: 'Confirmed', icon: '\u2714' },
    { key: 'shipped', label: 'Shipped', icon: '\u{1F4E6}' },
    { key: 'out', label: 'Out for Delivery', icon: '\u{1F69A}' },
    { key: 'delivered', label: 'Delivered', icon: '\u2705' },
  ];

  const milestoneIdx = order.status === 'cancelled' ? -1 : currentIdx === -1 ? -1 : currentIdx === 3 ? 4 : currentIdx === 2 ? 2 : currentIdx + 1;

  const bannerGradient = order.status === 'delivered'
    ? 'linear-gradient(135deg, #059669 0%, var(--success) 50%, #34d399 100%)'
    : order.status === 'shipped'
    ? 'linear-gradient(135deg, #4f46e5 0%, var(--primary) 50%, #818cf8 100%)'
    : order.status === 'processing'
    ? 'linear-gradient(135deg, #d97706 0%, #f59e0b 50%, #fbbf24 100%)'
    : 'linear-gradient(135deg, #6b7280 0%, var(--text-tertiary) 50%, #d1d5db 100%)';

  const bannerText = order.status === 'delivered'
    ? 'Your order has been delivered!'
    : order.status === 'shipped'
    ? 'Your order is on the way!'
    : order.status === 'processing'
    ? 'Your order is being prepared'
    : 'Waiting for order confirmation';

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px', fontFamily: "'Inter', sans-serif" }}>
      {/* Breadcrumb */}
      <nav className="breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, fontSize: 13, color: 'var(--text-secondary)' }}>
        <Link href="/" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>Home</Link>
        <span style={{ color: '#cbd5e1' }}>{'/'}</span>
        <Link href="/orders" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>My Orders</Link>
        <span style={{ color: '#cbd5e1' }}>{'/'}</span>
        <span style={{ color: 'var(--text)', fontWeight: 600 }}>Order #{order._id.slice(-8).toUpperCase()}</span>
      </nav>

      {/* ─── Order Header ─── */}
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 22, fontWeight: 800, color: 'var(--text)', margin: 0 }}>
              Order #{order._id.slice(-8).toUpperCase()}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '4px 0 0' }}>
              {new Date(order.createdAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <span className={statusInfo.className} style={{ fontSize: 13, padding: '6px 16px' }}>
            {statusInfo.label}
          </span>
        </div>
      </div>

      {order.status === 'cancelled' ? (
        <div className="card" style={{ padding: 48, textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>{'\u274C'}</div>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, color: '#991b1b', marginBottom: 4, fontSize: 20 }}>Order Cancelled</h2>
          <p style={{ fontSize: 14, color: '#dc2626' }}>This order has been cancelled. No shipments were made.</p>
          <Link href="/orders" className="btn btn-secondary" style={{ textDecoration: 'none', display: 'inline-block', marginTop: 20, padding: '12px 28px' }}>
            {'\u2190'} Back to Orders
          </Link>
        </div>
      ) : (
        <>
          {/* ─── Live Status Banner ─── */}
          <div style={{
            background: bannerGradient, borderRadius: 16, padding: '20px 24px',
            color: 'var(--bg-card)', marginBottom: 20, display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
            boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 32 }}>{order.status === 'delivered' ? '\u2705' : order.status === 'shipped' ? '\u{1F69A}' : '\u23F3'}</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: 17, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{bannerText}</div>
                <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>
                  {order.status === 'shipped'
                    ? `Expected ${new Date(Date.now() + 2 * 86400000).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`
                    : order.status === 'delivered'
                    ? `Arrived ${order.deliveredAt ? new Date(order.deliveredAt).toLocaleDateString() : ''}`
                    : 'We\u2019ll notify you when it ships'}
                </div>
              </div>
            </div>
            {(order.status === 'shipped' || order.status === 'delivered') && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.2)', borderRadius: 12, padding: '8px 16px', backdropFilter: 'blur(4px)' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'linear-gradient(135deg,#c7d2fe,#a5b4fc)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 700, color: '#4f46e5',
                }}>
                  {carrier[0]}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{carrier} Courier</div>
                  <div style={{ fontSize: 11, opacity: 0.85 }}>{'\u2B50'} 4.8 &middot; {carrier}</div>
                </div>
              </div>
            )}
          </div>

          {/* ─── Map Area ─── */}
          <div style={{
            height: 180, borderRadius: 16, marginBottom: 20,
            background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 30%, #a5b4fc 60%, #818cf8 100%)',
            position: 'relative', overflow: 'hidden',
            border: '1px solid #e0e7ff',
          }}>
            {/* Grid lines */}
            <div style={{ position: 'absolute', inset: 0, opacity: 0.15 }}>
              {[...Array(12)].map((_, i) => (
                <div key={i} style={{ position: 'absolute', left: `${(i + 1) * 8}%`, top: 0, bottom: 0, width: 1, background: '#4f46e5' }} />
              ))}
              {[...Array(5)].map((_, i) => (
                <div key={`h${i}`} style={{ position: 'absolute', top: `${(i + 1) * 20}%`, left: 0, right: 0, height: 1, background: '#4f46e5' }} />
              ))}
            </div>
            {/* Route line */}
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 400 180" preserveAspectRatio="none">
              <path d="M 60 140 Q 140 40 200 90 T 340 50" fill="none" stroke="#4f46e5" strokeWidth="3" strokeDasharray="8 4" opacity="0.6" />
            </svg>
            {/* Warehouse pin */}
            <div style={{ position: 'absolute', left: '14%', top: '72%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'var(--bg-card)', boxShadow: '0 2px 8px rgba(79,70,229,0.4)' }}>{'\u{1F3ED}'}</div>
              <div style={{ fontSize: 10, color: '#4f46e5', fontWeight: 700, marginTop: 4, background: 'rgba(255,255,255,0.8)', padding: '2px 6px', borderRadius: 4 }}>Warehouse</div>
            </div>
            {/* Delivery pin */}
            <div style={{ position: 'absolute', right: '14%', top: '22%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'var(--bg-card)', boxShadow: '0 2px 8px rgba(5,150,105,0.4)' }}>{'\u{1F3E0}'}</div>
              <div style={{ fontSize: 10, color: '#059669', fontWeight: 700, marginTop: 4, background: 'rgba(255,255,255,0.8)', padding: '2px 6px', borderRadius: 4 }}>Delivery</div>
            </div>
            {/* Moving dot */}
            <div style={{
              position: 'absolute', left: '52%', top: '46%',
              width: 12, height: 12, borderRadius: '50%',
              background: 'var(--primary)', border: '2px solid var(--bg-card)',
              boxShadow: '0 0 0 4px rgba(99,102,241,0.3), 0 2px 8px rgba(99,102,241,0.3)',
              animation: 'pulse 2s infinite',
            }} />
            <div style={{ position: 'absolute', bottom: 10, right: 14, fontSize: 11, color: '#4f46e5', fontWeight: 600, background: 'rgba(255,255,255,0.7)', padding: '4px 10px', borderRadius: 6 }}>
              {'\u{1F4CD}'} Live Tracking
            </div>
          </div>

          {/* ─── Milestone Stepper ─── */}
          <div className="card" style={{ padding: 24, marginBottom: 20 }}>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 24 }}>Shipment Progress</h2>
            <div style={{ position: 'relative', paddingLeft: 8 }}>
              {milestones.map((ms, idx) => {
                const isComplete = idx < milestoneIdx;
                const isCurrent = idx === milestoneIdx;
                const isPending = idx > milestoneIdx;
                const stepTime = idx === 0
                  ? new Date(order.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
                  : idx <= currentIdx
                  ? new Date(new Date(order.createdAt).getTime() + idx * 86400000).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
                  : '';

                return (
                  <div key={ms.key} style={{ display: 'flex', gap: 16, position: 'relative', marginBottom: idx < milestones.length - 1 ? 0 : 0 }}>
                    {/* Connector line */}
                    {idx < milestones.length - 1 && (
                      <div style={{
                        position: 'absolute', left: 15, top: 36, bottom: -20,
                        width: 3,
                        background: isComplete
                          ? 'var(--success)'
                          : isCurrent
                          ? 'repeating-linear-gradient(135deg, var(--success) 0, var(--success) 4px, #d1d5db 4px, #d1d5db 8px)'
                          : '#e5e7eb',
                        borderRadius: 2,
                        ...(isCurrent && !isPending ? { animation: 'stripeMove 1s linear infinite' } : {}),
                      }} />
                    )}
                    {/* Circle */}
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: isComplete ? 14 : 13, fontWeight: 700,
                      background: isComplete ? 'var(--success)' : isCurrent ? 'var(--primary)' : '#e5e7eb',
                      color: isComplete || isCurrent ? 'var(--bg-card)' : 'var(--text-tertiary)',
                      boxShadow: isCurrent ? '0 0 0 5px rgba(99,102,241,0.25)' : 'none',
                      animation: isCurrent ? 'glowPulse 2s ease-in-out infinite' : 'none',
                      transition: 'all 0.3s',
                    }}>
                      {isComplete ? '\u2714' : isCurrent ? '\u25CF' : '\u25CB'}
                    </div>
                    {/* Content */}
                    <div style={{ flex: 1, paddingBottom: idx < milestones.length - 1 ? 24 : 0 }}>
                      <div style={{ fontSize: 14, fontWeight: isCurrent ? 800 : 600, color: isPending ? 'var(--text-tertiary)' : 'var(--text)' }}>
                        {ms.label}
                      </div>
                      {stepTime && (
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{stepTime}</div>
                      )}
                      {isCurrent && !isPending && (
                        <div style={{ fontSize: 12, color: 'var(--primary)', marginTop: 4, fontWeight: 600 }}>
                          {order.status === 'pending' ? 'Awaiting confirmation' : order.status === 'processing' ? 'Package being prepared' : order.status === 'shipped' ? 'In transit to you' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ─── Package Contents ─── */}
          <div className="card" style={{ padding: 24, marginBottom: 20 }}>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>Package Contents</h2>
            <div>
              {order.items.map((item, idx) => (
                <div key={idx} style={{
                  display: 'flex', gap: 14, alignItems: 'center', padding: '12px 0',
                  borderBottom: idx < order.items.length - 1 ? '1px solid var(--bg-container)' : 'none',
                }}>
                  <Link href={`/products/${item.product}`}>
                    <img src={item.image || 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="%23e5e7eb"><rect width="64" height="64" rx="8"/><text x="32" y="36" text-anchor="middle" fill="%239ca3af" font-size="11">No Image</text></svg>')} alt="" onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="%23e5e7eb"><rect width="64" height="64" rx="8"/><text x="32" y="36" text-anchor="middle" fill="%239ca3af" font-size="11">No Image</text></svg>'); }} style={{
                      width: 64, height: 64, borderRadius: 10, objectFit: 'contain',
                      background: 'var(--bg-card)', border: '1px solid var(--border)',
                    }} />
                  </Link>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link href={`/products/${item.product}`} style={{ color: '#4f46e5', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
                      {item.name}
                    </Link>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                      Qty: {item.quantity} &middot; ${(item.price ?? 0).toFixed(2)} each
                    </div>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', whiteSpace: 'nowrap', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    ${((item.price ?? 0) * (item.quantity ?? 0)).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ─── Action Grid ─── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Track Live', icon: '\u{1F4CD}', bg: '#eef2ff', color: '#4f46e5', action: () => showToast('Live tracking activated', 'success') },
              { label: 'Contact Seller', icon: '\u{1F4AC}', bg: '#f0fdf4', color: '#16a34a', action: () => showToast('Opening chat...', 'success') },
              { label: 'Return/Exchange', icon: '\u{1F504}', bg: '#fefce8', color: '#ca8a04', action: () => showToast('Return request initiated', 'success') },
              { label: 'Help', icon: '\u2753', bg: '#fef2f2', color: '#dc2626', action: () => showToast('Help center opening...', 'success') },
            ].map((btn) => (
              <button key={btn.label} className="btn btn-ghost" onClick={btn.action} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 8, padding: '20px 12px', borderRadius: 14, background: btn.bg,
                border: 'none', cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
              >
                <span style={{ fontSize: 24 }}>{btn.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: btn.color }}>{btn.label}</span>
              </button>
            ))}
          </div>

          {/* ─── Reorder Carousel ─── */}
          <div className="card" style={{ padding: 24, marginBottom: 20 }}>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>Order Again</h2>
            <div className="carousel-scroll" style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 8, scrollSnapType: 'x mandatory' }}>
              {order.items.map((item, idx) => (
                <Link key={idx} href={`/products/${item.product}`} className="product-card" style={{
                  flex: '0 0 160px', scrollSnapAlign: 'start',
                  background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)',
                  padding: 12, textDecoration: 'none', transition: 'box-shadow 0.2s, transform 0.2s',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
                >
                  <img src={item.image || 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" fill="%23e5e7eb"><rect width="80" height="80" rx="8"/><text x="40" y="44" text-anchor="middle" fill="%239ca3af" font-size="12">No Image</text></svg>')} alt="" onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" fill="%23e5e7eb"><rect width="80" height="80" rx="8"/><text x="40" y="44" text-anchor="middle" fill="%239ca3af" font-size="12">No Image</text></svg>'); }} style={{ width: '100%', height: 100, objectFit: 'contain', borderRadius: 8, background: 'var(--bg-card)', marginBottom: 8 }} />
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#4f46e5', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>${(item.price ?? 0).toFixed(2)}</div>
                </Link>
              ))}
            </div>
          </div>

          {/* ─── Order Summary ─── */}
          <div className="card" style={{ padding: 24, marginBottom: 20 }}>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>Order Summary</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#475569' }}>
                <span>Items ({order.items.reduce((s, i) => s + i.quantity, 0)} total)</span>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>${(itemsTotal ?? 0).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#475569' }}>
                <span>Shipping</span>
                <span style={{ color: order.shippingPrice === 0 ? 'var(--success)' : 'var(--text)', fontWeight: order.shippingPrice === 0 ? 700 : 600 }}>
                  {order.shippingPrice === 0 ? 'FREE' : `$${(order.shippingPrice ?? 0).toFixed(2)}`}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#475569' }}>
                <span>Tax</span>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>${(order.taxPrice ?? 0).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 800, color: 'var(--text)', borderTop: '2px solid var(--border)', paddingTop: 12, marginTop: 4, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <span>Total</span>
                <span>${(order.totalPrice ?? 0).toFixed(2)}</span>
              </div>
            </div>

            <div style={{ marginTop: 20, padding: 16, background: 'var(--bg-card)', borderRadius: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 4 }}>Payment</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', textTransform: 'capitalize' }}>{order.paymentMethod.replace('_', ' ')}</div>
                <div style={{ fontSize: 12, color: order.isPaid ? 'var(--success)' : '#f59e0b', marginTop: 2 }}>{order.isPaid ? '\u2713 Paid' : 'Pending'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 4 }}>Ship To</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{order.shippingAddress.street}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ─── Footer Actions ─── */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link href="/orders" className="btn btn-secondary" style={{ textDecoration: 'none', display: 'inline-flex', padding: '12px 24px' }}>
          {'\u2190'} Back to Orders
        </Link>
        {order.status !== 'cancelled' && (
          <button onClick={() => {
            navigator.clipboard?.writeText(trackingNumber);
            showToast(`Tracking # copied: ${trackingNumber}`, 'success');
          }} className="btn btn-ghost" style={{ padding: '12px 24px', border: '2px solid var(--border)' }}>
            Copy Tracking #
          </button>
        )}
      </div>

      {/* Keyframe animations injected via style tag */}
      <style>{`
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 0 5px rgba(99,102,241,0.25); }
          50% { box-shadow: 0 0 0 10px rgba(99,102,241,0.10), 0 0 20px rgba(99,102,241,0.20); }
        }
        @keyframes stripeMove {
          0% { background-position: 0 0; }
          100% { background-position: 11.31px 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        .carousel-scroll::-webkit-scrollbar { height: 4px; }
        .carousel-scroll::-webkit-scrollbar-track { background: var(--bg-container); border-radius: 4px; }
        .carousel-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      `}</style>
    </div>
  );
};

export default OrderDetailPage;
