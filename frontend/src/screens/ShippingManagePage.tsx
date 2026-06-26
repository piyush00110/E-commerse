import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

interface OrderItem {
  product: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

interface FullOrder {
  _id: string;
  items: OrderItem[];
  user: { _id: string; name: string; email: string };
  shippingAddress: { street: string; city: string; state: string; zip: string; phone: string };
  paymentMethod: string;
  taxPrice: number;
  shippingPrice: number;
  totalPrice: number;
  isPaid: boolean;
  isDelivered: boolean;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
}

type Tab = 'pending' | 'processing' | 'shipped' | 'delivered' | 'all';

const TABS: { key: Tab; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'all', label: 'All Orders' },
];

const ShippingManagePage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [orders, setOrders] = useState<FullOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('pending');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) { navigate('/login'); return; }
    const u = JSON.parse(stored);
    if (u.role !== 'admin') { navigate('/'); showToast('Admin access required', 'error'); return; }
    fetchAllOrders();
  }, [navigate]);

  const fetchAllOrders = async () => {
    try {
      const res = await orderAPI.getAll();
      setOrders(res.data.data);
    } catch { showToast('Failed to load orders', 'error'); }
    finally { setLoading(false); }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const data: any = {};
      if (newStatus === 'delivered') {
        data.isDelivered = true;
        data.status = 'delivered';
      } else {
        data.status = newStatus;
      }
      await orderAPI.updateStatus(orderId, data);
      showToast(`Order ${newStatus === 'delivered' ? 'marked delivered' : `moved to ${newStatus}`}!`, 'success');
      fetchAllOrders();
    } catch {
      showToast('Failed to update order', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = activeTab === 'all' ? orders : orders.filter((o) => o.status === activeTab);

  const statusBadge = (s: string) => {
    const map: Record<string, { color: string; bg: string }> = {
      pending: { color: '#856404', bg: '#fff3cd' },
      processing: { color: '#004085', bg: '#cce5ff' },
      shipped: { color: '#155724', bg: '#d4edda' },
      delivered: { color: '#155724', bg: '#d4edda' },
      cancelled: { color: '#721c24', bg: '#f8d7da' },
    };
    const style = map[s] || map.pending;
    return <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: style.bg, color: style.color }}>{s}</span>;
  };

  const nextAction = (status: string) => {
    switch (status) {
      case 'pending': return { label: '\u{1F4E6}' + ' Mark Processing', to: 'processing' };
      case 'processing': return { label: '\u{1F69A}' + ' Mark Shipped', to: 'shipped' };
      case 'shipped': return { label: '\u2705' + ' Mark Delivered', to: 'delivered' };
      default: return null;
    }
  };

  if (loading) return <div className="spinner" />;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>{'\u{1F69A}'} Shipping Management</h1>
        <p style={{ color: '#565959', fontSize: 14 }}>Manage order fulfillment, pick, pack, and ship orders.</p>
      </div>

      {/* Stats */}
      <div className="shipping-stats">
        {[
          { label: 'Pending', count: orders.filter((o) => o.status === 'pending').length, color: '#856404', bg: '#fff3cd' },
          { label: 'Processing', count: orders.filter((o) => o.status === 'processing').length, color: '#004085', bg: '#cce5ff' },
          { label: 'Shipped', count: orders.filter((o) => o.status === 'shipped').length, color: '#155724', bg: '#d4edda' },
          { label: 'Delivered', count: orders.filter((o) => o.status === 'delivered').length, color: '#155724', bg: '#d4edda' },
          { label: 'Total', count: orders.length, color: '#232f3e', bg: '#e0e0e0' },
        ].map((s) => (
          <div key={s.label} className="shipping-stat-card" style={{ borderLeft: `4px solid ${s.color}` }}>
            <div className="shipping-stat-count">{s.count}</div>
            <div className="shipping-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="shipping-tabs">
        {TABS.map((tab) => (
          <button key={tab.key} className={`shipping-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}>
            {tab.label}
            {tab.key !== 'all' && (
              <span className="shipping-tab-count">{orders.filter((o) => o.status === tab.key).length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Orders */}
      {filtered.length === 0 ? (
        <div className="empty-state" style={{ background: 'white', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>{'\u{1F4ED}'}</div>
          <h3>No {activeTab} orders</h3>
          <p style={{ color: '#565959' }}>All orders in this status are cleared.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((order) => {
            const action = nextAction(order.status);
            return (
              <div key={order._id} className="shipping-order-card">
                <div className="shipping-order-top">
                  <div>
                    <div className="shipping-order-id">#{order._id.slice(-8).toUpperCase()}</div>
                    <div className="shipping-order-date">
                      {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {statusBadge(order.status)}
                    <span style={{ fontSize: 18, fontWeight: 700 }}>${order.totalPrice.toFixed(2)}</span>
                  </div>
                </div>

                <div className="shipping-order-body">
                  <div className="shipping-order-info">
                    <div className="shipping-info-block">
                      <div className="shipping-info-label">Customer</div>
                      <div className="shipping-info-value">{order.user?.name || 'N/A'}</div>
                      <div className="shipping-info-sub">{order.user?.email || ''}</div>
                    </div>
                    <div className="shipping-info-block">
                      <div className="shipping-info-label">Ship To</div>
                      <div className="shipping-info-value">{order.shippingAddress?.city}, {order.shippingAddress?.state}</div>
                      <div className="shipping-info-sub">{order.shippingAddress?.street}</div>
                    </div>
                    <div className="shipping-info-block">
                      <div className="shipping-info-label">Payment</div>
                      <div className="shipping-info-value" style={{ textTransform: 'capitalize' }}>{order.paymentMethod?.replace('_', ' ')}</div>
                      <div className="shipping-info-sub">{order.isPaid ? 'Paid' : 'Unpaid'}</div>
                    </div>
                    <div className="shipping-info-block">
                      <div className="shipping-info-label">Items</div>
                      <div className="shipping-info-value">{order.items?.length || 0} items</div>
                      <div className="shipping-info-sub">{order.items?.reduce((s, i) => s + i.quantity, 0)} units</div>
                    </div>
                  </div>

                  <div className="shipping-order-items">
                    {order.items?.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="shipping-item-chip">
                        <img src={item.image} alt="" />
                        <span>{item.name.slice(0, 30)}...</span>
                        <span className="shipping-item-qty">x{item.quantity}</span>
                      </div>
                    ))}
                    {(order.items?.length || 0) > 3 && (
                      <div style={{ fontSize: 12, color: '#565959', padding: '4px 0' }}>+{order.items!.length - 3} more items</div>
                    )}
                  </div>
                </div>

                <div className="shipping-order-actions">
                  <button className="shipping-view-btn" onClick={() => navigate(`/orders/${order._id}`)}>
                    View Details
                  </button>
                  {action && (
                    <button className="shipping-action-btn"
                      onClick={() => handleUpdateStatus(order._id, action.to)}
                      disabled={updatingId === order._id}>
                      {updatingId === order._id ? 'Updating...' : action.label}
                    </button>
                  )}
                  {order.status === 'pending' && (
                    <button className="shipping-action-btn danger"
                      onClick={() => handleUpdateStatus(order._id, 'cancelled')}
                      disabled={updatingId === order._id}>
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ShippingManagePage;
