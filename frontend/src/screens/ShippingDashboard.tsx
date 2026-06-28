import React, { useState, useEffect, useMemo } from 'react';
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

type ShipTab = 'pickup' | 'pack' | 'ship' | 'deliver' | 'all';

const DELIVERY_DRIVERS = [
  { name: 'Mike Johnson', truck: 'Truck #A-142', phone: '555-0142', zone: 'Downtown' },
  { name: 'Sarah Williams', truck: 'Truck #B-207', phone: '555-0207', zone: 'Westside' },
  { name: 'David Brown', truck: 'Truck #C-089', phone: '555-0089', zone: 'Eastside' },
  { name: 'Emily Davis', truck: 'Truck #D-315', phone: '555-0315', zone: 'Northside' },
  { name: 'James Wilson', truck: 'Van #E-056', phone: '555-0056', zone: 'Southside' },
];

const ShippingDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [orders, setOrders] = useState<FullOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ShipTab>('pickup');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedDriverIdx, setSelectedDriverIdx] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) { navigate('/login'); return; }
    const u = JSON.parse(stored);
    if (u.role !== 'admin') { navigate('/'); showToast('Admin access required', 'error'); return; }
    fetchOrders();
  }, [navigate]);

  const fetchOrders = async () => {
    try {
      const res = await orderAPI.getAll();
      setOrders(res.data.data || []);
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
      showToast(`Order moved to ${newStatus}!`, 'success');
      fetchOrders();
    } catch {
      showToast('Failed to update order', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const stats = useMemo(() => ({
    pending: orders.filter((o) => o.status === 'pending').length,
    processing: orders.filter((o) => o.status === 'processing').length,
    shipped: orders.filter((o) => o.status === 'shipped').length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
  }), [orders]);

  const getTabOrders = (tab: ShipTab) => {
    switch (tab) {
      case 'pickup': return orders.filter((o) => o.status === 'pending');
      case 'pack': return orders.filter((o) => o.status === 'processing');
      case 'ship': return orders.filter((o) => o.status === 'shipped');
      case 'deliver': return orders.filter((o) => o.status === 'delivered');
      default: return orders;
    }
  };

  const filteredOrders = useMemo(() => {
    let result = getTabOrders(activeTab);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((o) =>
        o._id.toLowerCase().includes(q) ||
        (o.user?.name || '').toLowerCase().includes(q) ||
        (o.shippingAddress?.city || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [activeTab, orders, searchQuery]);

  const driver = DELIVERY_DRIVERS[selectedDriverIdx];
  const routeOrders = orders.filter((o) =>
    o.status === 'shipped' && o.shippingAddress?.city?.toLowerCase().includes(driver.zone.toLowerCase())
  ).slice(0, 5);

  const statusBadge = (s: string) => {
    const map: Record<string, { color: string; bg: string; label: string }> = {
      pending: { color: 'var(--on-secondary-container)', bg: 'var(--secondary-container)', label: 'Awaiting Pickup' },
      processing: { color: 'var(--tertiary-dim)', bg: 'var(--tertiary-container)', label: 'Packing' },
      shipped: { color: 'var(--success)', bg: 'var(--success-light)', label: 'In Transit' },
      delivered: { color: 'var(--success)', bg: 'var(--success-light)', label: 'Delivered' },
      cancelled: { color: 'var(--error)', bg: 'var(--error-light)', label: 'Cancelled' },
    };
    const m = map[s] || map.pending;
    return <span className="sd-badge" style={{ background: m.bg, color: m.color }}>{m.label}</span>;
  };

  if (loading) return <div className="spinner" />;

  return (
    <div className="sd-page">
      <div className="sd-header">
        <div className="sd-header-left">
          <h1>{'\u{1F69A}'} Shipping & Delivery Dashboard</h1>
          <p>End-to-end fulfillment — from pickup to delivery</p>
        </div>
        <div className="sd-header-right">
          <div className="sd-search">
            <input type="text" placeholder="Search orders, customers, addresses..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <button className="sd-refresh-btn" onClick={fetchOrders}>{'\u{1F504}'} Refresh</button>
        </div>
      </div>

      <div className="sd-stats">
        {[
          { key: 'pending', label: 'Pending Pickup', icon: '\u{1F4E6}', count: stats.pending, color: 'var(--on-secondary-container)', bg: 'var(--secondary-container)' },
          { key: 'processing', label: 'Packing', icon: '\u{1F4E3}', count: stats.processing, color: 'var(--tertiary-dim)', bg: 'var(--tertiary-container)' },
          { key: 'shipped', label: 'In Transit', icon: '\u{1F69A}', count: stats.shipped, color: 'var(--success)', bg: 'var(--success-light)' },
          { key: 'delivered', label: 'Delivered', icon: '\u2705', count: stats.delivered, color: 'var(--success)', bg: 'var(--success-light)' },
          { key: 'cancelled', label: 'Cancelled', icon: '\u{1F6AB}', count: stats.cancelled, color: 'var(--error)', bg: 'var(--error-light)' },
        ].map((s) => (
          <div key={s.key} className="sd-stat-card" style={{ borderLeft: `4px solid ${s.color}` }}
            onClick={() => setActiveTab(s.key as ShipTab)}>
            <div className="sd-stat-icon">{s.icon}</div>
            <div className="sd-stat-info">
              <span className="sd-stat-num">{s.count}</span>
              <span className="sd-stat-label">{s.label}</span>
            </div>
          </div>
        ))}
        <div className="sd-stat-card total" style={{ borderLeft: '4px solid var(--tertiary-dim)' }}>
          <div className="sd-stat-icon">{'\u{1F4CA}'}</div>
          <div className="sd-stat-info">
            <span className="sd-stat-num">{orders.length}</span>
            <span className="sd-stat-label">Total Orders</span>
          </div>
        </div>
      </div>

      <div className="sd-layout">
        <div className="sd-main">
          <div className="sd-tabs">
            {([
              { key: 'pickup' as ShipTab, label: 'Pickup', icon: '\u{1F4E6}', count: stats.pending },
              { key: 'pack' as ShipTab, label: 'Pack', icon: '\u{1F4E3}', count: stats.processing },
              { key: 'ship' as ShipTab, label: 'Ship', icon: '\u{1F69A}', count: stats.shipped },
              { key: 'deliver' as ShipTab, label: 'Deliver', icon: '\u{1F3F0}', count: stats.delivered },
              { key: 'all' as ShipTab, label: 'All', icon: '\u{1F4CB}', count: orders.length },
            ]).map((tab) => (
              <button key={tab.key}
                className={`sd-tab ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}>
                <span className="sd-tab-icon">{tab.icon}</span>
                <span className="sd-tab-label">{tab.label}</span>
                <span className="sd-tab-count">{tab.count}</span>
              </button>
            ))}
          </div>

          <div className="sd-order-list">
            {filteredOrders.length === 0 ? (
              <div className="sd-empty">
                <div className="sd-empty-icon">{'\u{1F4ED}'}</div>
                <h3>No {activeTab} orders</h3>
                <p>All orders in this stage are cleared</p>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <div key={order._id} className={`sd-order-card ${expandedId === order._id ? 'expanded' : ''}`}>
                  <div className="sd-order-main" onClick={() => setExpandedId(expandedId === order._id ? null : order._id)}>
                    <div className="sd-order-top">
                      <div className="sd-order-id">#{order._id.slice(-8).toUpperCase()}</div>
                      <div className="sd-order-status-wrap">
                        {statusBadge(order.status)}
                        <div className="sd-order-price">${order.totalPrice.toFixed(2)}</div>
                      </div>
                    </div>
                    <div className="sd-order-meta">
                      <div className="sd-meta-item">
                        <span className="sd-meta-label">Customer</span>
                        <span className="sd-meta-value">{order.user?.name || 'N/A'}</span>
                      </div>
                      <div className="sd-meta-item">
                        <span className="sd-meta-label">Destination</span>
                        <span className="sd-meta-value">{order.shippingAddress?.city}, {order.shippingAddress?.state}</span>
                      </div>
                      <div className="sd-meta-item">
                        <span className="sd-meta-label">Items</span>
                        <span className="sd-meta-value">{order.items?.length || 0} items · {order.items?.reduce((s, i) => s + i.quantity, 0)} units</span>
                      </div>
                      <div className="sd-meta-item">
                        <span className="sd-meta-label">Date</span>
                        <span className="sd-meta-value">{new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>
                    <div className="sd-order-expand">{expandedId === order._id ? '\u25B2' : '\u25BC'}</div>
                  </div>

                  {expandedId === order._id && (
                    <div className="sd-order-details anim-fade-up">
                      <div className="sd-detail-grid">
                        <div className="sd-detail-block">
                          <strong>{'\u{1F4CD}'} Shipping Address</strong>
                          <span>{order.shippingAddress?.street}</span>
                          <span>{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zip}</span>
                          <span className="sd-detail-phone">{order.shippingAddress?.phone}</span>
                        </div>
                        <div className="sd-detail-block">
                          <strong>{'\u{1F4B3}'} Payment</strong>
                          <span style={{ textTransform: 'capitalize' }}>{order.paymentMethod?.replace('_', ' ')}</span>
                          <span className={order.isPaid ? 'sd-paid' : 'sd-unpaid'}>{order.isPaid ? 'Paid' : 'Unpaid'}</span>
                        </div>
                        <div className="sd-detail-block">
                          <strong>{'\u{1F464}'} Customer</strong>
                          <span>{order.user?.name}</span>
                          <span className="sd-detail-email">{order.user?.email}</span>
                        </div>
                      </div>

                      <div className="sd-detail-items">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="sd-detail-item">
                            <img src={item.image} alt="" />
                            <div className="sd-detail-item-info">
                              <span>{item.name}</span>
                              <span>Qty: {item.quantity} x ${item.price.toFixed(2)}</span>
                            </div>
                            <span className="sd-detail-item-price">${(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="sd-detail-actions">
                        <button className="sd-btn outline" onClick={() => navigate(`/orders/${order._id}`)}>
                          Full Details
                        </button>
                        {order.status === 'pending' && (
                          <>
                            <button className="sd-btn primary"
                              onClick={() => handleUpdateStatus(order._id, 'processing')}
                              disabled={updatingId === order._id}>
                              {'\u{1F4E6}'} Start Packing
                            </button>
                            <button className="sd-btn danger"
                              onClick={() => handleUpdateStatus(order._id, 'cancelled')}
                              disabled={updatingId === order._id}>
                              Cancel
                            </button>
                          </>
                        )}
                        {order.status === 'processing' && (
                          <button className="sd-btn primary"
                            onClick={() => handleUpdateStatus(order._id, 'shipped')}
                            disabled={updatingId === order._id}>
                            {'\u{1F69A}'} Mark Shipped
                          </button>
                        )}
                        {order.status === 'shipped' && (
                          <button className="sd-btn success"
                            onClick={() => handleUpdateStatus(order._id, 'delivered')}
                            disabled={updatingId === order._id}>
                            {'\u2705'} Mark Delivered
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="sd-sidebar">
          <div className="sd-sidebar-card">
            <h3>{'\u{1F698}'} Driver Assignment</h3>
            <div className="sd-driver-select">
              <select value={selectedDriverIdx} onChange={(e) => setSelectedDriverIdx(Number(e.target.value))}>
                {DELIVERY_DRIVERS.map((d, i) => (
                  <option key={i} value={i}>{d.name} — {d.truck}</option>
                ))}
              </select>
            </div>
            <div className="sd-driver-info">
              <div className="sd-driver-avatar">
                {driver.name.split(' ').map((n) => n[0]).join('')}
              </div>
              <div className="sd-driver-details">
                <strong>{driver.name}</strong>
                <span>{driver.truck}</span>
                <span>{driver.phone}</span>
                <span className="sd-driver-zone">{'\u{1F4CD}'} {driver.zone} Zone</span>
              </div>
            </div>
          </div>

          <div className="sd-sidebar-card">
            <h3>{'\u{1F9ED}'} Route Overview</h3>
            {routeOrders.length === 0 ? (
              <div className="sd-route-empty">No deliveries in {driver.zone} zone</div>
            ) : (
              <div className="sd-route">
                <div className="sd-route-stop start">
                  <div className="sd-route-dot wh" />
                  <div>
                    <strong>ShopSmart Hub</strong>
                    <span>Warehouse ({driver.zone})</span>
                  </div>
                </div>
                {routeOrders.map((order, idx) => (
                  <div key={order._id} className="sd-route-stop">
                    <div className="sd-route-dot" />
                    <div>
                      <strong>{order.user?.name}</strong>
                      <span>{order.shippingAddress?.street}</span>
                      <span className="sd-route-city">{order.shippingAddress?.city} · #{order._id.slice(-6).toUpperCase()}</span>
                    </div>
                    <span className="sd-route-stop-num">{idx + 1}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="sd-sidebar-card">
            <h3>{'\u26A1'} Today's Summary</h3>
            <div className="sd-today-stats">
              <div className="sd-today-item">
                <span className="sd-today-num">{stats.delivered}</span>
                <span className="sd-today-label">Delivered</span>
              </div>
              <div className="sd-today-item">
                <span className="sd-today-num">{stats.shipped}</span>
                <span className="sd-today-label">In Transit</span>
              </div>
              <div className="sd-today-item">
                <span className="sd-today-num">{stats.pending + stats.processing}</span>
                <span className="sd-today-label">Needs Attention</span>
              </div>
            </div>
            <div className="sd-today-footer">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShippingDashboard;
