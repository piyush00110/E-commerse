import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
      location: shippingCities[Math.floor(Math.random() * shippingCities.length)] || 'Customer Address',
      description: `Package delivered. Left at front door. Signed by: Customer.`,
      icon: '\u2705',
    });
  }

  return events;
};

const shippingCities = ['San Francisco, CA', 'Austin, TX', 'Portland, OR', 'Denver, CO'];

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: '#856404', bg: '#fff3cd' },
  processing: { label: 'Processing', color: '#004085', bg: '#cce5ff' },
  shipped: { label: 'Shipped', color: '#155724', bg: '#d4edda' },
  delivered: { label: 'Delivered', color: '#155724', bg: '#d4edda' },
  cancelled: { label: 'Cancelled', color: '#721c24', bg: '#f8d7da' },
};

const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [order, setOrder] = useState<FullOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState<TrackingEvent[]>([]);
  const [trackingNumber, setTrackingNumber] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) { navigate('/login'); return; }
    const fetchOrder = async () => {
      try {
        const res = await orderAPI.getById(id!);
        const o = res.data.data;
        setOrder(o);
        setTracking(generateTracking(o.status, o.createdAt));
        const tn = 'TRK' + o._id.slice(-8).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
        setTrackingNumber(tn);
      } catch {
        showToast('Failed to load order', 'error');
        navigate('/orders');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id, navigate]);

  if (loading) return <div className="spinner" />;
  if (!order) return null;

  const statusInfo = statusConfig[order.status] || statusConfig.pending;
  const itemsTotal = order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link to="/">Home</Link>
        <Link to="/orders">My Orders</Link>
        <span className="breadcrumb-current">Order #{order._id.slice(-8).toUpperCase()}</span>
      </div>

      {/* Order Header */}
      <div style={{
        background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 20,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, fontFamily: 'monospace' }}>Order #{order._id.slice(-8).toUpperCase()}</h1>
            <p style={{ color: '#565959', fontSize: 14, marginTop: 4 }}>
              Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{
              display: 'inline-block', padding: '8px 20px', borderRadius: 20, fontSize: 14, fontWeight: 600,
              background: statusInfo.bg, color: statusInfo.color,
            }}>
              {statusInfo.label}
            </span>
            {order.deliveredAt && (
              <div style={{ fontSize: 13, color: '#565959', marginTop: 4 }}>
                Delivered {new Date(order.deliveredAt).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, borderTop: '1px solid #eee', paddingTop: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: '#565959', marginBottom: 2 }}>Total</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>${order.totalPrice.toFixed(2)}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#565959', marginBottom: 2 }}>Items</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{order.items.length} {order.items.length === 1 ? 'item' : 'items'}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#565959', marginBottom: 2 }}>Payment</div>
            <div style={{ fontSize: 16, fontWeight: 600, textTransform: 'capitalize' }}>{order.paymentMethod.replace('_', ' ')}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#565959', marginBottom: 2 }}>Ship to</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{order.shippingAddress.city}, {order.shippingAddress.state}</div>
          </div>
        </div>
      </div>

      {/* Tracking Section */}
      <div style={{
        background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 20,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>Shipment Tracking</h2>
          {order.status !== 'pending' && order.status !== 'cancelled' && (
            <div style={{ fontSize: 13, color: '#565959' }}>
              Carrier: <strong>{CARRIERS[Math.floor(Math.random() * CARRIERS.length)]}</strong>
              &nbsp;| Tracking #: <strong style={{ fontFamily: 'monospace', color: '#007185' }}>{trackingNumber}</strong>
            </div>
          )}
        </div>

        {order.status === 'cancelled' ? (
          <div style={{ textAlign: 'center', padding: 32, background: '#f8d7da', borderRadius: 8, color: '#721c24' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{'\u274C'}</div>
            <h3 style={{ marginBottom: 4 }}>Order Cancelled</h3>
            <p style={{ fontSize: 14 }}>This order has been cancelled. No shipments were made.</p>
          </div>
        ) : (
          <>
            {/* Tracking Progress Bar */}
            <div className="order-progress-bar" style={{ marginBottom: 24, padding: '8px 0' }}>
              {['pending', 'processing', 'shipped', 'delivered'].map((s, idx) => {
                const statusOrder = ['pending', 'processing', 'shipped', 'delivered'];
                const currentIdx = statusOrder.indexOf(order.status);
                const isComplete = idx <= currentIdx;
                const isCurrent = idx === currentIdx;
                const labels = ['Order Placed', 'Processing', 'Shipped', 'Delivered'];
                return (
                  <React.Fragment key={s}>
                    <div className="progress-step">
                      <div className={`progress-dot ${isComplete ? 'complete' : ''} ${isCurrent ? 'current' : ''}`}
                        style={{
                          width: order.status === 'delivered' && idx === 3 ? 36 : 32,
                          height: order.status === 'delivered' && idx === 3 ? 36 : 32,
                          fontSize: order.status === 'delivered' && idx === 3 ? 16 : 14,
                        }}>
                        {idx === 3 && order.status === 'delivered' ? '\u2713' : isComplete ? '\u2713' : idx + 1}
                      </div>
                      <div className="progress-label" style={{ fontSize: 12, fontWeight: isCurrent ? 600 : 400 }}>{labels[idx]}</div>
                      {isCurrent && order.status !== 'delivered' && (
                        <div style={{ fontSize: 11, color: '#007185', marginTop: 2 }}>
                          {order.status === 'pending' ? 'Awaiting confirmation' : order.status === 'processing' ? 'In progress' : order.status === 'shipped' ? 'On the way' : ''}
                        </div>
                      )}
                    </div>
                    {idx < 3 && <div className={`progress-line ${isComplete ? 'complete' : ''}`} />}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Delivery Estimate */}
            {order.status !== 'delivered' && (
              <div style={{
                background: 'linear-gradient(135deg, #232f3e, #37475a)', borderRadius: 8, padding: '12px 16px',
                color: 'white', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <span style={{ fontSize: 24 }}>{'\u{1F69A}'}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>
                    {order.status === 'pending' ? 'Preparing your order' :
                     order.status === 'processing' ? 'Estimated delivery: ' + new Date(Date.now() + 3 * 86400000).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) :
                     'Package on the way'}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>
                    {order.status === 'shipped' ? `Expected ${new Date(Date.now() + 2 * 86400000).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}` : 'We\'ll notify you when it ships'}
                  </div>
                </div>
              </div>
            )}

            {/* Tracking Timeline */}
            <div className="tracking-timeline">
              {tracking.map((event, idx) => (
                <div key={idx} className={`tracking-event ${idx === 0 ? 'latest' : ''}`}>
                  <div className="tracking-icon-wrapper">
                    <div className="tracking-icon">{event.icon}</div>
                    {idx < tracking.length - 1 && <div className="tracking-line" />}
                  </div>
                  <div className="tracking-content">
                    <div className="tracking-date">{event.date}</div>
                    <div className="tracking-location">{event.location}</div>
                    <div className="tracking-desc">{event.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Shipping Info */}
      <div style={{
        background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 20,
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Shipping Information</h2>
        <div className="shipping-detail-grid">
          <div className="shipping-detail-card">
            <div className="shipping-detail-label">Shipping Address</div>
            <div className="shipping-detail-value">
              <div>{order.shippingAddress.street}</div>
              <div>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</div>
              <div>{order.shippingAddress.country}</div>
            </div>
          </div>
          <div className="shipping-detail-card">
            <div className="shipping-detail-label">Contact</div>
            <div className="shipping-detail-value">
              <div>{order.user?.name}</div>
              <div>{order.user?.email}</div>
              <div>{order.shippingAddress.phone}</div>
            </div>
          </div>
          <div className="shipping-detail-card">
            <div className="shipping-detail-label">Shipping Method</div>
            <div className="shipping-detail-value">
              <div>Standard Shipping</div>
              <div style={{ color: order.shippingPrice === 0 ? '#067d62' : 'inherit', fontWeight: order.shippingPrice === 0 ? 600 : 400 }}>
                {order.shippingPrice === 0 ? 'FREE' : `$${order.shippingPrice.toFixed(2)}`}
              </div>
              <div style={{ fontSize: 12, color: '#565959' }}>Estimated 3-5 business days</div>
            </div>
          </div>
        </div>
      </div>

      {/* Items */}
      <div style={{
        background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 20,
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Items in this order</h2>
        <div>
          {order.items.map((item, idx) => (
            <div key={idx} style={{
              display: 'flex', gap: 16, alignItems: 'center', padding: '12px 0',
              borderBottom: idx < order.items.length - 1 ? '1px solid #eee' : 'none',
            }}>
              <Link to={`/products/${item.product}`}>
                <img src={item.image} alt="" style={{
                  width: 80, height: 80, borderRadius: 8, objectFit: 'contain',
                  background: '#f8f8f8', border: '1px solid #eee',
                }} />
              </Link>
              <div style={{ flex: 1 }}>
                <Link to={`/products/${item.product}`} style={{ color: '#007185', fontWeight: 500, fontSize: 14 }}>
                  {item.name}
                </Link>
                <div style={{ fontSize: 13, color: '#565959', marginTop: 4 }}>
                  Qty: {item.quantity} | ${item.price.toFixed(2)} each
                </div>
                <div style={{ fontSize: 12, color: '#067d62', marginTop: 4 }}>
                  {'\u2713'} Item delivered
                </div>
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, whiteSpace: 'nowrap' }}>
                ${(item.price * item.quantity).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Price Summary */}
      <div style={{
        background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Order Summary</h2>
        <div className="summary-row">
          <span>Items ({order.items.reduce((s, i) => s + i.quantity, 0)} total)</span>
          <span>${itemsTotal.toFixed(2)}</span>
        </div>
        <div className="summary-row">
          <span>Shipping</span>
          <span style={{ color: order.shippingPrice === 0 ? '#067d62' : 'inherit', fontWeight: order.shippingPrice === 0 ? 600 : 400 }}>
            {order.shippingPrice === 0 ? 'FREE' : `$${order.shippingPrice.toFixed(2)}`}
          </span>
        </div>
        <div className="summary-row">
          <span>Tax</span>
          <span>${order.taxPrice.toFixed(2)}</span>
        </div>
        <div className="summary-row total">
          <span>Total</span>
          <span>${order.totalPrice.toFixed(2)}</span>
        </div>
        <div style={{ fontSize: 12, color: '#565959', textAlign: 'center', marginTop: 12 }}>
          {order.isPaid ? 'Payment collected' : 'Payment pending'}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to="/orders" style={{
          padding: '10px 24px', background: '#232f3e', color: 'white', borderRadius: 8,
          fontWeight: 600, fontSize: 14, textDecoration: 'none',
        }}>
          {'\u2190'} Back to Orders
        </Link>
        {order.status !== 'cancelled' && (
          <button onClick={() => {
            const tn = trackingNumber;
            navigator.clipboard?.writeText(tn);
            showToast(`Tracking # copied: ${tn}`, 'success');
          }} style={{
            padding: '10px 24px', background: 'white', border: '1px solid #ddd', borderRadius: 8,
            fontWeight: 600, fontSize: 14, cursor: 'pointer', color: '#0f1111',
          }}>
            Copy Tracking #
          </button>
        )}
      </div>
    </div>
  );
};

export default OrderDetailPage;
