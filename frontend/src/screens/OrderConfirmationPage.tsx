'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { orderAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

interface OrderData {
  _id: string;
  items: { product: string; name: string; image: string; price: number; quantity: number }[];
  shippingAddress: { street: string; city: string; state: string; zip: string; phone: string };
  paymentMethod: string;
  taxPrice: number;
  shippingPrice: number;
  totalPrice: number;
  isPaid: boolean;
  createdAt: string;
}

const OrderConfirmationPage: React.FC = () => {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { showToast } = useToast();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [customerName, setCustomerName] = useState('Customer');

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('user');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.name) setCustomerName(parsed.name);
        }
      }
    } catch { /* ignore */ }
    const stored = typeof window === 'undefined' ? null : localStorage.getItem('user');
    if (!stored) { router.push('/login'); return; }
    if (!id) { router.push('/orders'); return; }
    const fetchOrder = async () => {
      try {
        const res = await orderAPI.getById(id);
        setOrder(res.data.data);
      } catch {
        showToast('Failed to load order', 'error');
        router.push('/orders');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, router]);

  if (loading) return <div className="spinner" />;

  if (!order) return null;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ textAlign: 'center', background: 'var(--surface)', borderRadius: 16, padding: '48px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', marginBottom: 24 }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%', background: 'var(--success-light)', color: 'var(--success)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, margin: '0 auto 16px',
        }}>
          {'\u2713'}
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Order Placed!</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 16, marginBottom: 4 }}>
          Thank you for your purchase, <strong>{customerName}</strong>!
        </p>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Order #{order._id?.slice(-8).toUpperCase() ?? 'N/A'}
        </p>
        <p style={{ color: 'var(--success)', fontSize: 14, fontWeight: 500, marginTop: 12 }}>
          {'\u{1F4E6}'} We&apos;ll send a confirmation when it ships.
        </p>
      </div>

      <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, marginBottom: 16 }}>Order Details</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Order Number</div>
            <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>#{order._id?.slice(-8).toUpperCase() ?? 'N/A'}</div>
          </div>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Order Date</div>
            <div style={{ fontWeight: 600 }}>{new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Payment</div>
            <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{order.paymentMethod.replace('_', ' ')}</div>
          </div>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Status</div>
            <span style={{
              padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600,
              background: order.isPaid ? 'var(--success-light)' : 'var(--secondary-container)',
              color: order.isPaid ? 'var(--success)' : 'var(--on-secondary-container)',
            }}>
              {order.isPaid ? 'Paid' : 'Pending'}
            </span>
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, marginBottom: 16 }}>Shipping Address</h2>
        <div style={{ fontSize: 14, lineHeight: 1.6 }}>
          <div>{order.shippingAddress.street}</div>
          <div>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</div>
          <div>{order.shippingAddress.phone}</div>
        </div>
      </div>

      <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, marginBottom: 16 }}>Items Ordered</h2>
        {order.items.map((item, idx) => (
          <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 0', borderBottom: idx < order.items.length - 1 ? '1px solid var(--outline-variant)' : 'none' }}>
            <img src={item.image || ''} alt="" onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNmM2Y0ZjYiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI2E2YThiNCIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='; }} style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'contain', background: 'var(--surface-dim)' }} />
            <div style={{ flex: 1 }}>
              <Link href={`/products/${item.product}`} style={{ color: 'var(--tertiary)', fontSize: 14, fontWeight: 500 }}>{item.name}</Link>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Qty: {item.quantity}</div>
            </div>
            <div style={{ fontWeight: 600 }}>${((item.price ?? 0) * (item.quantity ?? 0)).toFixed(2)}</div>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, marginBottom: 16 }}>Order Total</h2>
        <div className="summary-row"><span>Items Total</span><span>${((order.totalPrice ?? 0) - (order.taxPrice ?? 0) - (order.shippingPrice ?? 0)).toFixed(2)}</span></div>
        <div className="summary-row"><span>Shipping</span><span style={{ color: order.shippingPrice === 0 ? 'var(--success)' : 'inherit', fontWeight: order.shippingPrice === 0 ? 600 : 400 }}>{order.shippingPrice === 0 ? 'FREE' : `$${(order.shippingPrice ?? 0).toFixed(2)}`}</span></div>
        <div className="summary-row"><span>Tax</span><span>${(order.taxPrice ?? 0).toFixed(2)}</span></div>
        <div className="summary-row total"><span>Total</span><span>${(order.totalPrice ?? 0).toFixed(2)}</span></div>
      </div>

      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link href="/orders" style={{
          padding: '12px 32px', background: 'var(--tertiary-dim)', color: 'var(--surface)', borderRadius: 8, fontWeight: 600, fontSize: 15, textDecoration: 'none',
        }}>
          View All Orders
        </Link>
        <Link href="/products" style={{
          padding: '12px 32px', background: 'var(--tertiary)', color: 'var(--text)', borderRadius: 8, fontWeight: 600, fontSize: 15, textDecoration: 'none',
        }}>
          Continue Shopping
        </Link>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;
