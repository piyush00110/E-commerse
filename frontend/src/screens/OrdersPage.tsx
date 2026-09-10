'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { orderAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

interface OrderItem {
  product: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

interface Order {
  _id: string;
  items: OrderItem[];
  shippingAddress: { city: string };
  paymentMethod: string;
  totalPrice: number;
  isPaid: boolean;
  isDelivered: boolean;
  status: string;
  paidAt?: string;
  deliveredAt?: string;
  createdAt: string;
}

const statusLabel = (order: Order): string => {
  if (order.isDelivered) return 'Delivered';
  if (order.status === 'cancelled') return 'Cancelled';
  if (order.status === 'shipped') return 'Shipped';
  if (order.isPaid || order.status === 'processing') return 'Processing';
  return 'Pending';
};

const statusClass = (order: Order): string => {
  if (order.isDelivered) return 'badge badge-success';
  if (order.status === 'cancelled') return 'badge badge-error';
  if (order.status === 'shipped') return 'badge badge-warning';
  if (order.isPaid || order.status === 'processing') return 'badge badge-success';
  return 'badge badge-warning';
};

const OrdersPage: React.FC = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) { router.push('/login'); return; }
    const fetchOrders = async () => {
      try {
        const res = await orderAPI.getMine();
        setOrders(res.data.data);
      } catch { showToast('Failed to load orders', 'error'); }
      finally { setLoading(false); }
    };
    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="card" style={{ padding: 24, animation: 'pulse 2s infinite' }}>
              <div style={{ height: 20, background: '#e2e8f0', borderRadius: 8, width: '40%', marginBottom: 12 }} />
              <div style={{ height: 16, background: '#e2e8f0', borderRadius: 8, width: '60%', marginBottom: 16 }} />
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ width: 60, height: 60, background: '#e2e8f0', borderRadius: 8 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: 14, background: '#e2e8f0', borderRadius: 8, width: '70%', marginBottom: 6 }} />
                  <div style={{ height: 12, background: '#e2e8f0', borderRadius: 8, width: '40%' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 32, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>My Orders</h1>
        <p style={{ color: '#64748b', fontSize: 14 }}>
          {orders.length === 0 ? 'You haven\'t placed any orders yet.' : `${orders.length} total ${orders.length === 1 ? 'order' : 'orders'}`}
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state" style={{ textAlign: 'center', padding: '80px 24px' }}>
          <div style={{ fontSize: 72, marginBottom: 16 }}>{'\u{1F4ED}'}</div>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 24, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>No orders yet</h2>
          <p style={{ color: '#64748b', marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
            You haven&apos;t placed any orders yet. Start shopping to see your orders here.
          </p>
          <Link href="/products" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>
            Start Shopping
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {orders.map((order) => {
            const statusOrder = ['pending', 'processing', 'shipped', 'delivered'];
            const currentIdx = statusOrder.indexOf(order.status || 'pending');
            const steps = ['Pending', 'Processing', 'Shipped', 'Delivered'];

            return (
              <div key={order._id}
                className="card"
                onClick={() => router.push(`/orders/${order._id}`)}
                style={{ padding: 20, cursor: 'pointer', transition: 'all 0.2s', position: 'relative', overflow: 'hidden' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}>
                {/* Order Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>
                      Order #{order._id.slice(-8).toUpperCase()}
                    </div>
                    <div style={{ fontSize: 13, color: '#64748b' }}>
                      Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className={statusClass(order)}>
                      {statusLabel(order)}
                    </span>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      ${order.totalPrice?.toFixed(2) ?? '0.00'}
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  {order.items?.slice(0, 3).map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <img src={item.image || ''} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'contain', background: '#f8fafc', border: '1px solid #e2e8f0' }} onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNmM2Y0ZjYiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI2E2YThiNCIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='; }} />
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{item.name}</span>
                        <div style={{ fontSize: 12, color: '#64748b' }}>Qty: {item.quantity}</div>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>${((item.price ?? 0) * (item.quantity ?? 0)).toFixed(2)}</div>
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <div style={{ fontSize: 12, color: '#6366f1', fontWeight: 500, paddingLeft: 60 }}>
                      +{order.items.length - 3} more {order.items.length - 3 === 1 ? 'item' : 'items'}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: '#64748b' }}>
                    <span>{order.paymentMethod?.replace('_', ' ')}</span>
                    <span style={{ color: '#cbd5e1' }}>{'\u2022'}</span>
                    <span>{order.shippingAddress?.city || 'N/A'}</span>
                    {order.isDelivered && order.deliveredAt && (
                      <>
                        <span style={{ color: '#cbd5e1' }}>{'\u2022'}</span>
                        <span>Delivered {new Date(order.deliveredAt).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                  <span style={{ fontSize: 13, color: '#6366f1', fontWeight: 600 }}>
                    View details {'\u2192'}
                  </span>
                </div>

                {/* Progress Bar */}
                {!order.isDelivered && order.status !== 'cancelled' && (
                  <div style={{ marginTop: 16, padding: 16, background: '#f8fafc', borderRadius: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                      {steps.map((step, idx) => {
                        const isComplete = idx <= currentIdx;
                        const isCurrent = idx === currentIdx;
                        return (
                          <React.Fragment key={step}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                              <div style={{
                                width: 32, height: 32, borderRadius: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 13, fontWeight: 700, marginBottom: 6,
                                background: isComplete ? '#6366f1' : '#e2e8f0',
                                color: isComplete ? '#fff' : '#94a3b8',
                                boxShadow: isCurrent ? '0 0 0 4px rgba(99,102,241,0.2)' : 'none',
                              }}>
                                {isComplete ? '\u2713' : idx + 1}
                              </div>
                              <div style={{
                                fontSize: 11, fontWeight: isCurrent ? 700 : 500,
                                color: isComplete ? '#0f172a' : '#94a3b8',
                              }}>{step}</div>
                            </div>
                            {idx < steps.length - 1 && (
                              <div style={{
                                flex: 1, height: 3, borderRadius: 9999, marginBottom: 20,
                                background: idx < currentIdx ? '#6366f1' : '#e2e8f0',
                              }} />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
