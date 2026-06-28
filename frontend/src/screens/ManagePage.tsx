import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

const TABS_CONFIG: { key: ManageTab; label: string; icon: string }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: '\u{1F4CA}' },
  { key: 'products', label: 'Products', icon: '\u{1F4E6}' },
  { key: 'orders', label: 'Orders', icon: '\u{1F4CB}' },
  { key: 'analytics', label: 'Analytics', icon: '\u{1F4C8}' },
  { key: 'users', label: 'Users', icon: '\u{1F465}' },
];

const ManagePage: React.FC = () => {
  const navigate = useNavigate();
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
    const avgRating = products.length ? (products.reduce((s, p) => s + (p.rating || 0), 0) / products.length) : 0;
    return { totalProducts, totalOrders, revenue, lowStock, pendingOrders, shippedOrders, avgRating };
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
    if (orderFilter !== 'all') {
      result = result.filter((o) => o.status === orderFilter);
    }
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
    setEditForm({
      name: product.name,
      price: product.price,
      comparePrice: product.comparePrice || '',
      countInStock: product.countInStock,
      description: product.description,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async (id: string) => {
    try {
      const data: Record<string, unknown> = {
        name: editForm.name,
        price: parseFloat(editForm.price),
        countInStock: parseInt(editForm.countInStock, 10),
        description: editForm.description,
      };
      if (editForm.comparePrice) data.comparePrice = parseFloat(editForm.comparePrice);
      await productAPI.update(id, data);
      setProducts(products.map((p) => p._id === id ? { ...p, ...data } as Product : p));
      setEditingId(null);
    } catch (err) {
      console.error('Failed to update product', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this product permanently?')) return;
    try {
      await productAPI.delete(id);
      setProducts(products.filter((p) => p._id !== id));
    } catch (err) {
      console.error('Failed to delete product', err);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const data: any = {};
      if (newStatus === 'delivered') {
        data.isDelivered = true;
        data.status = 'delivered';
      } else {
        data.status = newStatus;
      }
      await orderAPI.updateStatus(id, data);
      setOrders(orders.map((o) =>
        o._id === id ? { ...o, ...data, status: newStatus, isDelivered: newStatus === 'delivered' } : o
      ));
    } catch (err) {
      console.error('Failed to update order', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { color: string; bg: string }> = {
      pending: { color: 'var(--on-secondary-container)', bg: 'var(--secondary-container)' },
      processing: { color: 'var(--tertiary-dim)', bg: 'var(--tertiary-container)' },
      shipped: { color: 'var(--success)', bg: 'var(--success-light)' },
      delivered: { color: 'var(--success)', bg: 'var(--success-light)' },
      cancelled: { color: 'var(--error)', bg: 'var(--error-light)' },
    };
    const s = map[status] || map.pending;
    return <span className="mg-badge" style={{ background: s.bg, color: s.color }}>{status}</span>;
  };

  if (loading) return <div className="manage-loading"><div className="spinner" /></div>;

  return (
    <div className="manage-page">
      <div className="manage-sidebar">
        <div className="manage-sidebar-header">
          <span className="manage-sidebar-logo">{'\u{1F6D2}'}</span>
          <strong>Store Manager</strong>
        </div>
        <nav className="manage-sidebar-nav">
          {TABS_CONFIG.map((item) => (
            <button key={item.key}
              className={`manage-sidebar-item ${activeTab === item.key ? 'active' : ''}`}
              onClick={() => setActiveTab(item.key)}>
              <span className="manage-sidebar-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="manage-sidebar-footer">
          <Link to="/seller/products/add" className="manage-sidebar-add-btn">
            + Add Product
          </Link>
        </div>
      </div>

      <div className="manage-content">
        {activeTab === 'dashboard' && (
          <div className="manage-dashboard animate-in">
            <div className="manage-page-header">
              <div>
                <h1>Dashboard</h1>
                <p>Overview of your store performance</p>
              </div>
              <Link to="/seller/products/add" className="manage-action-btn">
                + New Product
              </Link>
            </div>

            <div className="manage-stats-grid">
              <div className="manage-stat-card" style={{ borderLeft: '4px solid var(--success)' }}>
                <div className="manage-stat-icon" style={{ background: 'var(--success-light)' }}>{'\u{1F4E6}'}</div>
                <div>
                  <div className="manage-stat-value">{stats.totalProducts}</div>
                  <div className="manage-stat-label">Total Products</div>
                </div>
              </div>
              <div className="manage-stat-card" style={{ borderLeft: '4px solid var(--tertiary-dim)' }}>
                <div className="manage-stat-icon" style={{ background: 'var(--tertiary-container)' }}>{'\u{1F4CB}'}</div>
                <div>
                  <div className="manage-stat-value">{stats.totalOrders}</div>
                  <div className="manage-stat-label">Total Orders</div>
                </div>
              </div>
              <div className="manage-stat-card" style={{ borderLeft: '4px solid var(--success)' }}>
                <div className="manage-stat-icon" style={{ background: 'var(--success-light)' }}>{'\u{1F4B5}'}</div>
                <div>
                  <div className="manage-stat-value">${stats.revenue.toFixed(2)}</div>
                  <div className="manage-stat-label">Total Revenue</div>
                </div>
              </div>
              <div className="manage-stat-card" style={{ borderLeft: `4px solid ${stats.lowStock > 0 ? 'var(--error)' : 'var(--success)'}` }}>
                <div className="manage-stat-icon" style={{ background: stats.lowStock > 0 ? 'var(--error-light)' : 'var(--success-light)' }}>{'\u26A0'}</div>
                <div>
                  <div className="manage-stat-value" style={{ color: stats.lowStock > 0 ? 'var(--error)' : 'var(--success)' }}>{stats.lowStock}</div>
                  <div className="manage-stat-label">Low Stock Items</div>
                </div>
              </div>
              <div className="manage-stat-card" style={{ borderLeft: '4px solid var(--on-secondary-container)' }}>
                <div className="manage-stat-icon" style={{ background: 'var(--secondary-container)' }}>{'\u{23F3}'}</div>
                <div>
                  <div className="manage-stat-value">{stats.pendingOrders}</div>
                  <div className="manage-stat-label">Pending Orders</div>
                </div>
              </div>
              <div className="manage-stat-card" style={{ borderLeft: '4px solid var(--tertiary-dim)' }}>
                <div className="manage-stat-icon" style={{ background: 'var(--tertiary-container)' }}>{'\u{1F69A}'}</div>
                <div>
                  <div className="manage-stat-value">{stats.shippedOrders}</div>
                  <div className="manage-stat-label">In Transit</div>
                </div>
              </div>
            </div>

            <div className="manage-recent-section">
              <h2>Recent Orders</h2>
              {orders.length === 0 ? (
                <div className="manage-empty">No orders yet</div>
              ) : (
                <div className="manage-table-wrapper">
                  <table className="manage-table">
                    <thead>
                      <tr>
                        <th>Order</th>
                        <th>Customer</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.slice(0, 8).map((order) => (
                        <tr key={order._id}>
                          <td className="manage-id">#{order._id.slice(-8).toUpperCase()}</td>
                          <td>{order.user?.name || 'N/A'}</td>
                          <td>{order.items?.length || 0}</td>
                          <td className="manage-price">${order.totalPrice?.toFixed(2)}</td>
                          <td>{statusBadge(order.status)}</td>
                          <td className="manage-date">{new Date(order.createdAt).toLocaleDateString()}</td>
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
          <div className="manage-products animate-in">
            <div className="manage-page-header">
              <div>
                <h1>Products</h1>
                <p>{products.length} products in your store</p>
              </div>
              <div className="manage-header-actions">
                <div className="manage-search">
                  <input type="text" placeholder="Search products..." value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)} />
                </div>
                <Link to="/seller/products/add" className="manage-action-btn">+ Add Product</Link>
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="manage-empty-state">
                <div className="manage-empty-icon">{'\u{1F4E6}'}</div>
                <h3>{productSearch ? 'No matching products' : 'No products yet'}</h3>
                <p>{productSearch ? 'Try a different search' : 'Add your first product to start selling'}</p>
              </div>
            ) : (
              <div className="manage-table-wrapper">
                <table className="manage-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Rating</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((p) => (
                      <tr key={p._id}>
                        {editingId === p._id ? (
                          <>
                            <td><input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="manage-inline-input" /></td>
                            <td><input type="number" step="0.01" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} className="manage-inline-input" style={{ width: 90 }} /></td>
                            <td><input type="number" value={editForm.countInStock} onChange={(e) => setEditForm({ ...editForm, countInStock: e.target.value })} className="manage-inline-input" style={{ width: 70 }} /></td>
                            <td className="manage-rating">{p.rating?.toFixed(1)}</td>
                            <td><span className={`manage-stock-badge ${p.countInStock > 0 ? 'in' : 'out'}`}>{p.countInStock > 0 ? 'Active' : 'Out'}</span></td>
                            <td>
                              <div className="manage-action-btns">
                                <button className="manage-btn save" onClick={() => saveEdit(p._id)}>Save</button>
                                <button className="manage-btn cancel" onClick={cancelEdit}>Cancel</button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td>
                              <div className="manage-product-cell">
                                <img src={p.images?.[0]} alt="" className="manage-product-thumb" />
                                <div>
                                  <div className="manage-product-name">{p.name}</div>
                                  <div className="manage-product-id">ID: {p._id.slice(-8)}</div>
                                </div>
                              </div>
                            </td>
                            <td className="manage-price">${p.price?.toFixed(2)}</td>
                            <td><span className={`manage-stock-num ${p.countInStock < 10 ? 'low' : ''}`}>{p.countInStock}</span></td>
                            <td className="manage-rating">{'\u2605'.repeat(Math.floor(p.rating || 0))}{'\u2606'.repeat(5 - Math.floor(p.rating || 0))}</td>
                            <td><span className={`manage-stock-badge ${p.countInStock > 0 ? 'in' : 'out'}`}>{p.countInStock > 0 ? 'Active' : 'Out of Stock'}</span></td>
                            <td>
                              <div className="manage-action-btns">
                                <button className="manage-btn edit" onClick={() => startEdit(p)}>{'\u270E'} Edit</button>
                                <button className="manage-btn delete" onClick={() => handleDelete(p._id)}>{'\u2717'}</button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="manage-orders animate-in">
            <div className="manage-page-header">
              <div>
                <h1>Orders</h1>
                <p>{orders.length} total orders</p>
              </div>
              <div className="manage-header-actions">
                <div className="manage-search">
                  <input type="text" placeholder="Search orders..." value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="manage-filter-tabs">
              {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((f) => (
                <button key={f}
                  className={`manage-filter-tab ${orderFilter === f ? 'active' : ''}`}
                  onClick={() => setOrderFilter(f)}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                  {f !== 'all' && (
                    <span className="manage-filter-count">{orders.filter((o) => o.status === f).length}</span>
                  )}
                </button>
              ))}
            </div>

            {filteredOrders.length === 0 ? (
              <div className="manage-empty-state">
                <div className="manage-empty-icon">{'\u{1F4ED}'}</div>
                <h3>{orderSearch ? 'No matching orders' : 'No orders found'}</h3>
                <p>{orderSearch ? 'Try a different search' : 'Orders appear here when customers make purchases'}</p>
              </div>
            ) : (
              <div className="manage-order-list">
                {filteredOrders.map((order) => (
                  <div key={order._id} className="manage-order-card">
                    <div className="manage-order-top">
                      <div className="manage-order-id">#{order._id.slice(-8).toUpperCase()}</div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {statusBadge(order.status)}
                        <span className="manage-order-total">${order.totalPrice.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="manage-order-info">
                      <div className="manage-order-detail">
                        <span className="manage-order-label">Customer</span>
                        <span>{order.user?.name || 'N/A'}</span>
                        <span className="manage-order-sub">{order.user?.email || ''}</span>
                      </div>
                      <div className="manage-order-detail">
                        <span className="manage-order-label">Ship To</span>
                        <span>{order.shippingAddress?.city}, {order.shippingAddress?.state}</span>
                        <span className="manage-order-sub">{order.shippingAddress?.street}</span>
                      </div>
                      <div className="manage-order-detail">
                        <span className="manage-order-label">Payment</span>
                        <span style={{ textTransform: 'capitalize' }}>{order.paymentMethod?.replace('_', ' ')}</span>
                        <span className="manage-order-sub">{order.isPaid ? 'Paid' : 'Unpaid'}</span>
                      </div>
                      <div className="manage-order-detail">
                        <span className="manage-order-label">Date</span>
                        <span>{new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </div>

                    <div className="manage-order-items">
                      {order.items?.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="manage-order-item-chip">
                          <img src={item.image} alt="" />
                          <span>{item.name.slice(0, 28)}</span>
                          <span className="manage-order-item-qty">x{item.quantity}</span>
                        </div>
                      ))}
                      {(order.items?.length || 0) > 3 && <div className="manage-order-more">+{order.items!.length - 3} more</div>}
                    </div>

                    <div className="manage-order-actions">
                      <button className="manage-btn view" onClick={() => navigate(`/orders/${order._id}`)}>View Details</button>
                      <select value={order.status}
                        onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                        disabled={updatingId === order._id}
                        className="manage-status-select">
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
          <div className="manage-analytics animate-in">
            <div className="manage-page-header">
              <h1>Analytics</h1>
              <p>Performance insights for your store</p>
            </div>

            <div className="manage-chart-grid">
              <div className="manage-chart-card wide">
                <h3>Order Status Breakdown</h3>
                <div className="manage-bar-chart">
                  {[
                    { label: 'Pending', value: stats.pendingOrders, color: 'var(--on-secondary-container)', pct: orders.length ? (stats.pendingOrders / orders.length * 100) : 0 },
                    { label: 'Processing', value: orders.filter(o => o.status === 'processing').length, color: 'var(--tertiary-dim)', pct: orders.length ? (orders.filter(o => o.status === 'processing').length / orders.length * 100) : 0 },
                    { label: 'Shipped', value: stats.shippedOrders, color: 'var(--success)', pct: orders.length ? (stats.shippedOrders / orders.length * 100) : 0 },
                    { label: 'Delivered', value: orders.filter(o => o.status === 'delivered').length, color: 'var(--success)', pct: orders.length ? (orders.filter(o => o.status === 'delivered').length / orders.length * 100) : 0 },
                    { label: 'Cancelled', value: orders.filter(o => o.status === 'cancelled').length, color: 'var(--error)', pct: orders.length ? (orders.filter(o => o.status === 'cancelled').length / orders.length * 100) : 0 },
                  ].map((bar) => (
                    <div key={bar.label} className="manage-bar-row">
                      <span className="manage-bar-label">{bar.label}</span>
                      <div className="manage-bar-track">
                        <div className="manage-bar-fill" style={{ width: `${bar.pct}%`, background: bar.color }} />
                      </div>
                      <span className="manage-bar-value">{bar.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="manage-chart-card">
                <h3>Product Stats</h3>
                <div className="manage-metric-list">
                  <div className="manage-metric">
                    <div className="manage-metric-icon">{'\u{1F4E6}'}</div>
                    <div>
                      <div className="manage-metric-value">{stats.totalProducts}</div>
                      <div className="manage-metric-label">Total Products</div>
                    </div>
                  </div>
                  <div className="manage-metric">
                    <div className="manage-metric-icon">{'\u2B50'}</div>
                    <div>
                      <div className="manage-metric-value">{stats.avgRating.toFixed(1)}</div>
                      <div className="manage-metric-label">Avg Rating</div>
                    </div>
                  </div>
                  <div className="manage-metric">
                    <div className="manage-metric-icon">{'\u{1F4AD}'}</div>
                    <div>
                      <div className="manage-metric-value">{products.reduce((s, p) => s + (p.numReviews || 0), 0)}</div>
                      <div className="manage-metric-label">Total Reviews</div>
                    </div>
                  </div>
                  <div className="manage-metric">
                    <div className="manage-metric-icon">{'\u26A0'}</div>
                    <div>
                      <div className="manage-metric-value" style={{ color: stats.lowStock > 0 ? 'var(--error)' : 'var(--success)' }}>{stats.lowStock}</div>
                      <div className="manage-metric-label">Low Stock</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="manage-chart-card">
                <h3>Revenue Summary</h3>
                <div className="manage-revenue-summary">
                  <div className="manage-revenue-main">
                    <span className="manage-revenue-label">Total Revenue</span>
                    <span className="manage-revenue-number">${stats.revenue.toFixed(2)}</span>
                  </div>
                  <div className="manage-revenue-main" style={{ borderTop: '1px solid var(--border-light)', paddingTop: 16 }}>
                    <span className="manage-revenue-label">Avg Order Value</span>
                    <span className="manage-revenue-number" style={{ fontSize: 22 }}>
                      ${orders.length ? (stats.revenue / orders.length).toFixed(2) : '0.00'}
                    </span>
                  </div>
                </div>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'users' && (
        <div className="manage-users animate-in">
          <AdminUsersPage />
        </div>
      )}
    </div>
  </div>
  );
};

export default ManagePage;
