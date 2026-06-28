import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) { navigate('/login'); return; }
    const fetchOrders = async () => {
      try {
        const res = await orderAPI.getMine();
        setOrders(res.data.data);
      } catch { showToast('Failed to load orders', 'error'); }
      finally { setLoading(false); }
    };
    fetchOrders();
  }, [navigate]);

  if (loading) return <div className="spinner" />;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>My Orders</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          {orders.length === 0 ? 'You haven\'t placed any orders yet.' : `${orders.length} total ${orders.length === 1 ? 'order' : 'orders'}`}
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 72, marginBottom: 16 }}>{'\u{1F4ED}'}</div>
          <h2>No orders yet</h2>
          <p>You haven't placed any orders yet. Start shopping to see your orders here.</p>
          <Link to="/products" className="hero-cta" style={{ textDecoration: 'none', display: 'inline-block' }}>
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
              <div key={order._id} onClick={() => navigate(`/orders/${order._id}`)}
                style={{ background: 'var(--surface)', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', cursor: 'pointer', transition: 'box-shadow 0.15s', border: '1px solid transparent' }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--tertiary)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'transparent')}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 600 }}>
                      Order #{order._id.slice(-8).toUpperCase()}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>${order.totalPrice?.toFixed(2)}</div>
                </div>

                <div className="order-items-list">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="order-item-row">
                      <img src={item.image} alt="" />
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--tertiary)' }}>{item.name}</span>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Qty: {item.quantity}</div>
                      </div>
                      <div style={{ fontWeight: 600 }}>${(item.price * item.quantity).toFixed(2)}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{
                      padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                      background: order.isDelivered ? 'var(--success-light)' : order.isPaid ? 'var(--tertiary-container)' : 'var(--secondary-container)',
                      color: order.isDelivered ? 'var(--success)' : order.isPaid ? 'var(--tertiary-dim)' : 'var(--on-secondary-container)',
                    }}>
                      {order.isDelivered ? 'Delivered' : order.isPaid ? 'Processing' : 'Pending'}
                    </span>
                    {order.isDelivered && order.deliveredAt && (
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        Delivered {new Date(order.deliveredAt).toLocaleDateString()}
                      </span>
                    )}
                    <span style={{ fontSize: 12, color: 'var(--tertiary)', fontWeight: 500 }}>
                      View details {'\u2192'}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    {order.paymentMethod?.replace('_', ' ')} | {order.shippingAddress?.city || 'N/A'}
                  </div>
                </div>

                {!order.isDelivered && (
                  <div style={{ marginTop: 16, background: 'var(--surface-dim)', borderRadius: 8, padding: 16 }}>
                    <div className="order-progress-bar">
                      {steps.map((step, idx) => {
                        const isComplete = idx <= currentIdx;
                        const isCurrent = idx === currentIdx;
                        return (
                          <React.Fragment key={step}>
                            <div className="progress-step">
                              <div className={`progress-dot ${isComplete ? 'complete' : ''} ${isCurrent ? 'current' : ''}`}>
                                {isComplete ? '\u2713' : idx + 1}
                              </div>
                              <div className="progress-label">{step}</div>
                            </div>
                            {idx < steps.length - 1 && (
                              <div className={`progress-line ${isComplete ? 'complete' : ''}`} />
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
