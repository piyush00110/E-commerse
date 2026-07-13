import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { productAPI, orderAPI } from '../services/api';
import AdminUsersPage from './AdminUsersPage';

type ManageTab = 'dashboard' | 'products' | 'orders' | 'analytics' | 'users';

interface Product {
  _id: string;
  name: string;
  price: number;
  comparePrice?: number;
  countInStock: number;
  rating: number;
  numReviews: number;
  images: string[];
  category?: string;
  description?: string;
}

interface Order {
  _id: string;
  items: { product: string; name: string; image: string; price: number; quantity: number }[];
  user: { _id: string; name: string; email: string };
  shippingAddress: { street: string; city: string; state: string; zip: string; phone: string };
  paymentMethod: string;
  taxPrice: number;
  shippingPrice: number;
  totalPrice: number;
  isPaid: boolean;
  isDelivered: boolean;
  status: string;
  createdAt: string;
}

const ManagePage: React.FC = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ManageTab>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [orderFilter, setOrderFilter] = useState<string>('all');
  const [productSearch, setProductSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab') as ManageTab;
    if (tab && ['dashboard', 'products', 'orders', 'analytics', 'users'].includes(tab)) {
      setActiveTab(tab);
    }
  }, []);

  const switchTab = useCallback((tab: ManageTab) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    if (tab === 'dashboard') { url.searchParams.delete('tab'); }
    else { url.searchParams.set('tab', tab); }
    window.history.pushState({}, '', url.toString());
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, orderRes] = await Promise.all([
          productAPI.getAll({ limit: 200 }),
          orderAPI.getAll(),
        ]);
        setProducts(prodRes.data.data || []);
        setOrders(orderRes.data.data || []);
      } catch (err) {
        console.error('Failed to load data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = useMemo(() => {
    const totalProducts = products.length;
    const totalOrders = orders.length;
    const paidOrders = orders.filter((o) => o.isPaid);
    const revenue = paidOrders.reduce((sum, o) => sum + o.totalPrice, 0);
    const lowStock = products.filter((p) => p.countInStock < 10).length;
    const pendingOrders = orders.filter((o) => o.status === 'pending').length;
    const shippedOrders = orders.filter((o) => o.status === 'shipped').length;
    const deliveredOrders = orders.filter((o) => o.status === 'delivered').length;
    const cancelledOrders = orders.filter((o) => o.status === 'cancelled').length;
    const processingOrders = orders.filter((o) => o.status === 'processing').length;
    const avgRating = products.length ? (products.reduce((s, p) => s + (p.rating || 0), 0) / products.length) : 0;
    const avgOrderValue = totalOrders ? revenue / paidOrders.length : 0;
    return { totalProducts, totalOrders, revenue, lowStock, pendingOrders, shippedOrders, deliveredOrders, cancelledOrders, processingOrders, avgRating, avgOrderValue };
  }, [products, orders]);

  const filteredProducts = useMemo(() => {
    if (!productSearch) return products;
    const q = productSearch.toLowerCase();
    return products.filter((p) =>
      p.name.toLowerCase().includes(q) || p._id.toLowerCase().includes(q)
    );
  }, [products, productSearch]);

  const filteredOrders = useMemo(() => {
    let result = orders;
    if (orderFilter !== 'all') result = result.filter((o) => o.status === orderFilter);
    if (orderSearch) {
      const q = orderSearch.toLowerCase();
      result = result.filter((o) =>
        o._id.toLowerCase().includes(q) ||
        (o.user?.name || '').toLowerCase().includes(q) ||
        (o.shippingAddress?.city || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [orders, orderFilter, orderSearch]);

  const startEdit = (product: Product) => {
    setEditingId(product._id);
    setEditForm({ name: product.name, price: product.price, comparePrice: product.comparePrice || '', countInStock: product.countInStock, description: product.description });
  };

  const saveEdit = async (id: string) => {
    try {
      const data: Record<string, unknown> = {
        name: editForm.name, price: parseFloat(editForm.price),
        countInStock: parseInt(editForm.countInStock, 10), description: editForm.description,
      };
      if (editForm.comparePrice) data.comparePrice = parseFloat(editForm.comparePrice);
      await productAPI.update(id, data);
      setProducts(products.map((p) => p._id === id ? { ...p, ...data } as Product : p));
      setEditingId(null);
    } catch (err) { console.error('Failed to update product', err); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this product permanently?')) return;
    try { await productAPI.delete(id); setProducts(products.filter((p) => p._id !== id)); }
    catch (err) { console.error('Failed to delete product', err); }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const data: any = {};
      if (newStatus === 'delivered') { data.isDelivered = true; data.status = 'delivered'; }
      else { data.status = newStatus; }
      await orderAPI.updateStatus(id, data);
      setOrders(orders.map((o) => o._id === id ? { ...o, ...data, status: newStatus, isDelivered: newStatus === 'delivered' } : o));
    } catch (err) { console.error('Failed to update order', err); }
    finally { setUpdatingId(null); }
  };

  const statusColor = (status: string) => {
    const map: Record<string, string> = {
      pending: 'var(--warning)', processing: 'var(--tertiary-dim)',
      shipped: 'var(--accent)', delivered: 'var(--success)', cancelled: 'var(--error)',
    };
    return map[status] || 'var(--text-secondary)';
  };

  const statusBg = (status: string) => {
    const map: Record<string, string> = {
      pending: 'var(--secondary-container)', processing: 'var(--tertiary-container)',
      shipped: 'var(--tertiary-container)', delivered: 'var(--success-light)', cancelled: 'var(--error-light)',
    };
    return map[status] || 'var(--surface-container)';
  };

  if (loading) return <div className="mg-loading"><div className="spinner" /></div>;

  return (
    <div className="mg-page">
      {activeTab === 'dashboard' && (
        <div className="mg-section animate-in">
          <div className="mg-header">
            <div><h1 className="mg-title">Dashboard</h1><p className="mg-subtitle">Overview of your store performance</p></div>
          </div>

          <div className="mg-stats-grid">
            {[
              { icon: '\u{1F4E6}', value: stats.totalProducts, label: 'Products', color: 'var(--accent)', bg: 'var(--tertiary-container)' },
              { icon: '\u{1F4CB}', value: stats.totalOrders, label: 'Orders', color: 'var(--tertiary-dim)', bg: 'var(--tertiary-container)' },
              { icon: '\u{1F4B5}', value: `$${stats.revenue.toFixed(2)}`, label: 'Revenue', color: 'var(--success)', bg: 'var(--success-light)' },
              { icon: '\u26A0', value: stats.lowStock, label: 'Low Stock', color: stats.lowStock > 0 ? 'var(--error)' : 'var(--success)', bg: stats.lowStock > 0 ? 'var(--error-light)' : 'var(--success-light)' },
              { icon: '\u23F3', value: stats.pendingOrders, label: 'Pending', color: 'var(--warning)', bg: 'var(--secondary-container)' },
              { icon: '\u{1F69A}', value: stats.shippedOrders, label: 'In Transit', color: 'var(--accent)', bg: 'var(--tertiary-container)' },
            ].map((s, i) => (
              <div key={i} className="mg-stat-card">
                <div className="mg-stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                <div className="mg-stat-info">
                  <div className="mg-stat-value" style={{ color: s.color }}>{s.value}</div>
                  <div className="mg-stat-label">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mg-card">
            <div className="mg-card-header"><h2>Recent Orders</h2></div>
            {orders.length === 0 ? <div className="mg-empty">No orders yet</div> : (
              <div className="mg-table-wrap">
                <table className="mg-table">
                  <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
                  <tbody>
                    {orders.slice(0, 8).map((o) => (
                      <tr key={o._id}>
                        <td className="mg-mono">#{o._id.slice(-8).toUpperCase()}</td>
                        <td>{o.user?.name || 'N/A'}</td>
                        <td>{o.items?.length || 0}</td>
                        <td className="mg-price">${o.totalPrice?.toFixed(2)}</td>
                        <td><span className="mg-badge" style={{ background: statusBg(o.status), color: statusColor(o.status) }}>{o.status}</span></td>
                        <td className="mg-date">{new Date(o.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="mg-section animate-in">
          <div className="mg-header">
            <div><h1 className="mg-title">Products</h1><p className="mg-subtitle">{products.length} products in your store</p></div>
            <div className="mg-header-actions">
              <input type="text" className="mg-search" placeholder="Search products..." value={productSearch} onChange={(e) => setProductSearch(e.target.value)} />
              <a href="/seller/products/add" className="mg-btn-primary">+ Add Product</a>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="mg-empty-state">
              <div className="mg-empty-icon">{'\u{1F4E6}'}</div>
              <h3>{productSearch ? 'No matching products' : 'No products yet'}</h3>
              <p>{productSearch ? 'Try a different search' : 'Add your first product to start selling'}</p>
            </div>
          ) : (
            <div className="mg-card">
              <div className="mg-table-wrap">
                <table className="mg-table">
                  <thead><tr><th>Product</th><th>Price</th><th>Stock</th><th>Rating</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {filteredProducts.map((p) => (
                      <tr key={p._id}>
                        {editingId === p._id ? (
                          <>
                            <td><input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="mg-inline-input" /></td>
                            <td><input type="number" step="0.01" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} className="mg-inline-input" style={{ width: 90 }} /></td>
                            <td><input type="number" value={editForm.countInStock} onChange={(e) => setEditForm({ ...editForm, countInStock: e.target.value })} className="mg-inline-input" style={{ width: 70 }} /></td>
                            <td className="mg-date">{p.rating?.toFixed(1)}</td>
                            <td><span className={`mg-badge ${p.countInStock > 0 ? 'mg-badge-success' : 'mg-badge-error'}`}>{p.countInStock > 0 ? 'Active' : 'Out'}</span></td>
                            <td><div className="mg-actions"><button className="mg-btn-sm mg-btn-save" onClick={() => saveEdit(p._id)}>Save</button><button className="mg-btn-sm mg-btn-cancel" onClick={() => { setEditingId(null); setEditForm({}); }}>Cancel</button></div></td>
                          </>
                        ) : (
                          <>
                            <td>
                              <div className="mg-product-cell">
                                <img src={p.images?.[0]} alt="" className="mg-product-thumb" />
                                <div><div className="mg-product-name">{p.name}</div><div className="mg-product-id">ID: {p._id.slice(-8)}</div></div>
                              </div>
                            </td>
                            <td className="mg-price">${p.price?.toFixed(2)}</td>
                            <td><span className={`mg-stock ${p.countInStock < 10 ? 'low' : ''}`}>{p.countInStock}</span></td>
                            <td className="mg-date">{'\u2605'.repeat(Math.floor(p.rating || 0))}{'\u2606'.repeat(5 - Math.floor(p.rating || 0))}</td>
                            <td><span className={`mg-badge ${p.countInStock > 0 ? 'mg-badge-success' : 'mg-badge-error'}`}>{p.countInStock > 0 ? 'Active' : 'Out of Stock'}</span></td>
                            <td><div className="mg-actions"><button className="mg-btn-sm mg-btn-edit" onClick={() => startEdit(p)}>Edit</button><button className="mg-btn-sm mg-btn-delete" onClick={() => handleDelete(p._id)}>{'\u2717'}</button></div></td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="mg-section animate-in">
          <div className="mg-header">
            <div><h1 className="mg-title">Orders</h1><p className="mg-subtitle">{orders.length} total orders</p></div>
            <div className="mg-header-actions">
              <input type="text" className="mg-search" placeholder="Search orders..." value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)} />
            </div>
          </div>

          <div className="mg-filter-row">
            {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((f) => (
              <button key={f} className={`mg-filter ${orderFilter === f ? 'active' : ''}`} onClick={() => setOrderFilter(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {f !== 'all' && <span className="mg-filter-count">{orders.filter((o) => o.status === f).length}</span>}
              </button>
            ))}
          </div>

          {filteredOrders.length === 0 ? (
            <div className="mg-empty-state"><div className="mg-empty-icon">{'\u{1F4ED}'}</div><h3>No orders found</h3></div>
          ) : (
            <div className="mg-order-list">
              {filteredOrders.map((order) => (
                <div key={order._id} className="mg-order-card">
                  <div className="mg-order-top">
                    <div className="mg-order-id">#{order._id.slice(-8).toUpperCase()}</div>
                    <div className="mg-order-top-right">
                      <span className="mg-badge" style={{ background: statusBg(order.status), color: statusColor(order.status) }}>{order.status}</span>
                      <span className="mg-order-total">${order.totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="mg-order-info">
                    <div className="mg-order-detail"><span className="mg-label">Customer</span><span>{order.user?.name || 'N/A'}</span><span className="mg-sub">{order.user?.email || ''}</span></div>
                    <div className="mg-order-detail"><span className="mg-label">Ship To</span><span>{order.shippingAddress?.city}, {order.shippingAddress?.state}</span><span className="mg-sub">{order.shippingAddress?.street}</span></div>
                    <div className="mg-order-detail"><span className="mg-label">Payment</span><span style={{ textTransform: 'capitalize' }}>{order.paymentMethod?.replace('_', ' ')}</span><span className="mg-sub">{order.isPaid ? 'Paid' : 'Unpaid'}</span></div>
                    <div className="mg-order-detail"><span className="mg-label">Date</span><span>{new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span></div>
                  </div>
                  <div className="mg-order-items">
                    {order.items?.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="mg-item-chip"><img src={item.image} alt="" /><span>{item.name.slice(0, 28)}</span><span className="mg-item-qty">x{item.quantity}</span></div>
                    ))}
                    {(order.items?.length || 0) > 3 && <div className="mg-more">+{order.items!.length - 3} more</div>}
                  </div>
                  <div className="mg-order-actions">
                    <select value={order.status} onChange={(e) => handleStatusUpdate(order._id, e.target.value)} disabled={updatingId === order._id} className="mg-status-select">
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="mg-section animate-in">
          <div className="mg-header"><div><h1 className="mg-title">Analytics</h1><p className="mg-subtitle">Performance insights</p></div></div>

          <div className="mg-analytics-grid">
            <div className="mg-card mg-card-wide">
              <h3 className="mg-card-title">Order Status Breakdown</h3>
              <div className="mg-bar-chart">
                {[
                  { label: 'Pending', value: stats.pendingOrders, color: 'var(--warning)', pct: orders.length ? (stats.pendingOrders / orders.length * 100) : 0 },
                  { label: 'Processing', value: stats.processingOrders, color: 'var(--tertiary-dim)', pct: orders.length ? (stats.processingOrders / orders.length * 100) : 0 },
                  { label: 'Shipped', value: stats.shippedOrders, color: 'var(--accent)', pct: orders.length ? (stats.shippedOrders / orders.length * 100) : 0 },
                  { label: 'Delivered', value: stats.deliveredOrders, color: 'var(--success)', pct: orders.length ? (stats.deliveredOrders / orders.length * 100) : 0 },
                  { label: 'Cancelled', value: stats.cancelledOrders, color: 'var(--error)', pct: orders.length ? (stats.cancelledOrders / orders.length * 100) : 0 },
                ].map((bar) => (
                  <div key={bar.label} className="mg-bar-row">
                    <span className="mg-bar-label">{bar.label}</span>
                    <div className="mg-bar-track"><div className="mg-bar-fill" style={{ width: `${bar.pct}%`, background: bar.color }} /></div>
                    <span className="mg-bar-value">{bar.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mg-card">
              <h3 className="mg-card-title">Product Stats</h3>
              <div className="mg-metrics">
                {[
                  { icon: '\u{1F4E6}', value: stats.totalProducts, label: 'Total Products' },
                  { icon: '\u2B50', value: stats.avgRating.toFixed(1), label: 'Avg Rating' },
                  { icon: '\u{1F4AD}', value: products.reduce((s, p) => s + (p.numReviews || 0), 0), label: 'Total Reviews' },
                  { icon: '\u26A0', value: stats.lowStock, label: 'Low Stock' },
                ].map((m, i) => (
                  <div key={i} className="mg-metric"><div className="mg-metric-icon">{m.icon}</div><div><div className="mg-metric-value">{m.value}</div><div className="mg-metric-label">{m.label}</div></div></div>
                ))}
              </div>
            </div>

            <div className="mg-card">
              <h3 className="mg-card-title">Revenue</h3>
              <div className="mg-revenue">
                <div className="mg-revenue-item"><span className="mg-revenue-label">Total Revenue</span><span className="mg-revenue-num">${stats.revenue.toFixed(2)}</span></div>
                <div className="mg-revenue-divider" />
                <div className="mg-revenue-item"><span className="mg-revenue-label">Avg Order Value</span><span className="mg-revenue-num">${stats.avgOrderValue.toFixed(2)}</span></div>
                <div className="mg-revenue-divider" />
                <div className="mg-revenue-item"><span className="mg-revenue-label">Paid Orders</span><span className="mg-revenue-num">{orders.filter(o => o.isPaid).length}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="mg-section animate-in">
          <AdminUsersPage />
        </div>
      )}
    </div>
  );
};

export default ManagePage;
