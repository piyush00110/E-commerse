'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { productAPI, orderAPI, categoryAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import AdminUsersPage from './AdminUsersPage';

type ManageTab = 'dashboard' | 'products' | 'orders' | 'analytics' | 'users' | 'categories';

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
  isFeatured?: boolean;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  image?: string;
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
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<ManageTab>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [orderFilter, setOrderFilter] = useState<string>('all');
  const [productSearch, setProductSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState({ name: '', slug: '', image: '' });
  const [categoryBusy, setCategoryBusy] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab') as ManageTab;
    if (tab && ['dashboard', 'products', 'orders', 'analytics', 'users', 'categories'].includes(tab)) {
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
        const [prodRes, orderRes, catRes] = await Promise.all([
          productAPI.getAll({ limit: 200 }),
          orderAPI.getAll(),
          categoryAPI.getAll(),
        ]);
        setProducts(prodRes.data.data || []);
        setOrders(orderRes.data.data || []);
        setCategories((catRes.data.data as unknown as Category[]) || []);
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
    const avgOrderValue = paidOrders.length > 0 ? revenue / paidOrders.length : 0;
    return { totalProducts, totalOrders, revenue, lowStock, pendingOrders, shippedOrders, deliveredOrders, cancelledOrders, processingOrders, avgRating, avgOrderValue };
  }, [products, orders]);

  const filteredProducts = useMemo(() => {
    if (!productSearch) return products;
    const q = productSearch.toLowerCase();
    return products.filter((p) =>
      p.name.toLowerCase().includes(q) || p._id.toLowerCase().includes(q)
    );
  }, [products, productSearch]);

  const revenueByDay = useMemo(() => {
    const days: { label: string; total: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const total = orders
        .filter((o) => o.isPaid && (o.createdAt || '').slice(0, 10) === key)
        .reduce((s, o) => s + (o.totalPrice || 0), 0);
      days.push({ label: d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }), total: Math.round(total * 100) / 100 });
    }
    return days;
  }, [orders]);

  const maxDayRevenue = useMemo(() => Math.max(1, ...revenueByDay.map((d) => d.total)), [revenueByDay]);

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

  const handleRestock = async (product: Product, qty: number) => {
    try {
      const next = (product.countInStock || 0) + qty;
      await productAPI.update(product._id, { countInStock: next });
      setProducts(products.map((p) => p._id === product._id ? { ...p, countInStock: next } : p));
      showToast(`Restocked +${qty} (now ${next})`, 'success');
    } catch { showToast('Restock failed', 'error'); }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllFiltered = () => {
    const ids = filteredProducts.map((p) => p._id);
    const allSelected = ids.length > 0 && ids.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  };

  const handleBulkFeature = async (featured: boolean) => {
    if (selectedIds.size === 0) return;
    setBulkBusy(true);
    try {
      await Promise.all([...selectedIds].map((id) => productAPI.update(id, { isFeatured: featured })));
      setProducts(products.map((p) => selectedIds.has(p._id) ? { ...p, isFeatured: featured } : p));
      showToast(`${selectedIds.size} product(s) ${featured ? 'featured' : 'unfeatured'}`, 'success');
      setSelectedIds(new Set());
    } catch { showToast('Bulk update partially failed — please refresh', 'error'); }
    finally { setBulkBusy(false); }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Permanently delete ${selectedIds.size} product(s)?`)) return;
    setBulkBusy(true);
    const ids = [...selectedIds];
    const failed: string[] = [];
    for (const id of ids) {
      try { await productAPI.delete(id); } catch { failed.push(id); }
    }
    const okIds = new Set(ids.filter((id) => !failed.includes(id)));
    setProducts(products.filter((p) => !okIds.has(p._id)));
    setSelectedIds(new Set());
    if (failed.length > 0) showToast(`${failed.length} delete(s) failed (may have orders attached)`, 'error');
    else showToast(`${okIds.size} product(s) deleted`, 'success');
    setBulkBusy(false);
  };

  const downloadCsv = (filename: string, rows: (string | number)[][]) => {
    const esc = (v: string | number) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = rows.map((r) => r.map(esc).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportProducts = () => {
    const rows: (string | number)[][] = [
      ['ID', 'Name', 'Price', 'Compare Price', 'Stock', 'Rating', 'Reviews', 'Featured'],
      ...products.map((p) => [p._id, p.name, p.price, p.comparePrice ?? '', p.countInStock, p.rating ?? '', p.numReviews ?? '', p.isFeatured ? 'yes' : 'no']),
    ];
    downloadCsv(`products-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    showToast('Products exported', 'success');
  };

  const handleExportOrders = () => {
    const rows: (string | number)[][] = [
      ['ID', 'Customer', 'Email', 'City', 'Total', 'Status', 'Paid', 'Date'],
      ...orders.map((o) => [o._id, o.user?.name || '', o.user?.email || '', o.shippingAddress?.city || '', o.totalPrice ?? '', o.status, o.isPaid ? 'yes' : 'no', o.createdAt]),
    ];
    downloadCsv(`orders-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    showToast('Orders exported', 'success');
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

  const handleMarkPaid = async (id: string) => {
    setUpdatingId(id);
    try {
      await orderAPI.pay(id, { method: 'manual', by: 'admin', at: new Date().toISOString() });
      setOrders(orders.map((o) => o._id === id ? { ...o, isPaid: true } : o));
      showToast('Order marked as paid', 'success');
    } catch { showToast('Failed to mark order as paid', 'error'); }
    finally { setUpdatingId(null); }
  };

  const handleToggleFeatured = async (product: Product) => {
    try {
      await productAPI.update(product._id, { isFeatured: !product.isFeatured });
      setProducts(products.map((p) => p._id === product._id ? { ...p, isFeatured: !p.isFeatured } : p));
      showToast(!product.isFeatured ? 'Added to featured' : 'Removed from featured', 'success');
    } catch { showToast('Failed to update featured status', 'error'); }
  };

  const slugify = (name: string) =>
    name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 60);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newCategory.name.trim();
    if (!name) { showToast('Category name is required', 'warning'); return; }
    const slug = newCategory.slug.trim() || slugify(name);
    if (!slug) { showToast('Could not derive a URL slug', 'warning'); return; }
    setCategoryBusy('new');
    try {
      const res = await categoryAPI.create({ name, slug, image: newCategory.image.trim() || undefined });
      const created = res.data.data as unknown as Category;
      setCategories([...categories, created]);
      setNewCategory({ name: '', slug: '', image: '' });
      showToast('Category added', 'success');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to add category';
      showToast(msg, 'error');
    } finally { setCategoryBusy(null); }
  };

  const handleDeleteCategory = async (cat: Category) => {
    const used = products.filter((p) => {
      const c = p.category as unknown;
      if (!c) return false;
      if (typeof c === 'string') return c === cat._id;
      return (c as { _id?: string })._id === cat._id;
    }).length;
    if (used > 0) { showToast(`Cannot delete: ${used} product(s) use this category`, 'warning'); return; }
    if (!window.confirm(`Delete category "${cat.name}"?`)) return;
    setCategoryBusy(cat._id);
    try {
      await categoryAPI.delete(cat._id);
      setCategories(categories.filter((c) => c._id !== cat._id));
      showToast('Category deleted', 'success');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to delete category';
      showToast(msg, 'error');
    } finally { setCategoryBusy(null); }
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
              { icon: '\u{1F4B5}', value: `$${(stats.revenue ?? 0).toFixed(2)}`, label: 'Revenue', color: 'var(--success)', bg: 'var(--success-light)' },
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
              <button className="mg-btn-sm" onClick={handleExportProducts} title="Download products CSV">⬇ Export</button>
              <a href="/seller/products/add" className="mg-btn-primary">+ Add Product</a>
            </div>
          </div>

          {selectedIds.size > 0 && (
            <div className="mg-card" style={{ marginBottom: 12, padding: '10px 16px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <strong style={{ fontSize: 13 }}>{selectedIds.size} selected</strong>
              <button className="mg-btn-sm mg-btn-save" disabled={bulkBusy} onClick={() => handleBulkFeature(true)}>⭐ Feature</button>
              <button className="mg-btn-sm" disabled={bulkBusy} onClick={() => handleBulkFeature(false)}>Unfeature</button>
              <button className="mg-btn-sm mg-btn-delete" disabled={bulkBusy} onClick={handleBulkDelete}>Delete</button>
              <button className="mg-btn-sm mg-btn-cancel" disabled={bulkBusy} onClick={() => setSelectedIds(new Set())}>Clear</button>
            </div>
          )}

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
                  <thead><tr>
                    <th><input type="checkbox" aria-label="Select all products"
                      checked={filteredProducts.length > 0 && filteredProducts.every((p) => selectedIds.has(p._id))}
                      onChange={toggleSelectAllFiltered} /></th>
                    <th>Product</th><th>Price</th><th>Stock</th><th>Rating</th><th>Featured</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {filteredProducts.map((p) => (
                      <tr key={p._id}>
                        {editingId === p._id ? (
                          <>
                            <td><input type="checkbox" aria-label={`Select ${p.name}`} checked={selectedIds.has(p._id)} onChange={() => toggleSelect(p._id)} /></td>
                            <td><input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="mg-inline-input" /></td>
                            <td><input type="number" step="0.01" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} className="mg-inline-input" style={{ width: 90 }} /></td>
                            <td><input type="number" value={editForm.countInStock} onChange={(e) => setEditForm({ ...editForm, countInStock: e.target.value })} className="mg-inline-input" style={{ width: 70 }} /></td>
                            <td className="mg-date">{p.rating?.toFixed(1)}</td>
                            <td style={{ textAlign: 'center' }}>{p.isFeatured ? '⭐' : '—'}</td>
                            <td><span className={`mg-badge ${p.countInStock > 0 ? 'mg-badge-success' : 'mg-badge-error'}`}>{p.countInStock > 0 ? 'Active' : 'Out'}</span></td>
                            <td><div className="mg-actions"><button className="mg-btn-sm mg-btn-save" onClick={() => saveEdit(p._id)}>Save</button><button className="mg-btn-sm mg-btn-cancel" onClick={() => { setEditingId(null); setEditForm({}); }}>Cancel</button></div></td>
                          </>
                        ) : (
                          <>
                            <td><input type="checkbox" aria-label={`Select ${p.name}`} checked={selectedIds.has(p._id)} onChange={() => toggleSelect(p._id)} /></td>
                            <td>
                              <div className="mg-product-cell">
                                <img src={p.images?.[0] || ''} alt="" className="mg-product-thumb" onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNmM2Y0ZjYiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI2E2YThiNCIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='; }} />
                                <div><div className="mg-product-name">{p.name}</div><div className="mg-product-id">ID: {p._id.slice(-8)}</div></div>
                              </div>
                            </td>
                            <td className="mg-price">${p.price?.toFixed(2)}</td>
                            <td>
                              <span className={`mg-stock ${p.countInStock < 10 ? 'low' : ''}`}>{p.countInStock}</span>{' '}
                              <button className="mg-btn-sm" title="Quick restock +10" onClick={() => handleRestock(p, 10)}
                                style={{ fontSize: 11, padding: '1px 7px', borderRadius: 6 }}>+10</button>
                            </td>
                            <td className="mg-date">{'\u2605'.repeat(Math.floor(p.rating || 0))}{'\u2606'.repeat(5 - Math.floor(p.rating || 0))}</td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                className="mg-btn-sm"
                                title={p.isFeatured ? 'Remove from featured' : 'Feature on homepage'}
                                onClick={() => handleToggleFeatured(p)}
                                style={{
                                  background: p.isFeatured ? 'var(--gold-light)' : 'transparent',
                                  border: `1px solid ${p.isFeatured ? 'var(--gold)' : 'var(--border)'}`,
                                  borderRadius: 8,
                                  cursor: 'pointer',
                                  fontSize: 15,
                                  padding: '2px 8px',
                                  filter: p.isFeatured ? 'none' : 'grayscale(1)',
                                  opacity: p.isFeatured ? 1 : 0.55,
                                }}
                              >
                                ⭐
                              </button>
                            </td>
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
              <button className="mg-btn-sm" onClick={handleExportOrders} title="Download orders CSV">⬇ Export</button>
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
                  <div className="mg-order-top" role="button" tabIndex={0}
                    title="Click to expand full details"
                    onClick={() => setExpandedOrderId(expandedOrderId === order._id ? null : order._id)}
                    onKeyDown={(e) => { if (e.key === 'Enter') setExpandedOrderId(expandedOrderId === order._id ? null : order._id); }}
                    style={{ cursor: 'pointer' }}>
                    <div className="mg-order-id">
                      <span style={{ marginRight: 6, fontSize: 11 }}>{expandedOrderId === order._id ? '▼' : '▶'}</span>
                      #{order._id.slice(-8).toUpperCase()}
                    </div>
                    <div className="mg-order-top-right">
                      <span className="mg-badge" style={{ background: statusBg(order.status), color: statusColor(order.status) }}>{order.status}</span>
                      <span className="mg-order-total">${(order.totalPrice || 0).toFixed(2)}</span>
                    </div>
                  </div>
                  {expandedOrderId === order._id && (
                    <div className="mg-order-detail" style={{ padding: '12px 4px 4px', borderTop: '1px dashed var(--border)', marginTop: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>All items ({order.items?.length || 0})</div>
                      {(order.items || []).map((item, idx) => (
                        <div key={idx} className="mg-item-chip" style={{ marginBottom: 6 }}>
                          <img src={item.image || ''} alt="" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          <span>{item.name}</span>
                          <span className="mg-item-qty">x{item.quantity}</span>
                          <span className="mg-price">${((item.price ?? 0) * (item.quantity ?? 0)).toFixed(2)}</span>
                        </div>
                      ))}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginTop: 10, fontSize: 13 }}>
                        <div><span className="mg-label">Full Address</span><div>{order.shippingAddress?.street}, {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zip}</div><div className="mg-sub">{order.shippingAddress?.phone}</div></div>
                        <div><span className="mg-label">Totals</span><div>Items: ${((order.totalPrice ?? 0) - (order.taxPrice ?? 0) - (order.shippingPrice ?? 0)).toFixed(2)}</div><div className="mg-sub">Ship: ${(order.shippingPrice ?? 0).toFixed(2)} · Tax: ${(order.taxPrice ?? 0).toFixed(2)}</div></div>
                        <div><span className="mg-label">Payment</span><div style={{ textTransform: 'capitalize' }}>{order.paymentMethod?.replace('_', ' ')}</div><div className="mg-sub">{order.isPaid ? '✅ Paid' : '❌ Unpaid'}</div></div>
                      </div>
                    </div>
                  )}
                  <div className="mg-order-info">
                    <div className="mg-order-detail"><span className="mg-label">Customer</span><span>{order.user?.name || 'N/A'}</span><span className="mg-sub">{order.user?.email || ''}</span></div>
                    <div className="mg-order-detail"><span className="mg-label">Ship To</span><span>{order.shippingAddress?.city}, {order.shippingAddress?.state}</span><span className="mg-sub">{order.shippingAddress?.street}</span></div>
                    <div className="mg-order-detail"><span className="mg-label">Payment</span><span style={{ textTransform: 'capitalize' }}>{order.paymentMethod?.replace('_', ' ')}</span><span className="mg-sub">{order.isPaid ? 'Paid' : 'Unpaid'}</span></div>
                    <div className="mg-order-detail"><span className="mg-label">Date</span><span>{new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span></div>
                  </div>
                  <div className="mg-order-items">
                    {order.items?.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="mg-item-chip"><img src={item.image || ''} alt="" onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNmM2Y0ZjYiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI2E2YThiNCIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='; }} /><span>{item.name.slice(0, 28)}</span><span className="mg-item-qty">x{item.quantity}</span></div>
                    ))}
                    {(order.items?.length || 0) > 3 && <div className="mg-more">+{(order.items?.length ?? 0) - 3} more</div>}
                  </div>
                  <div className="mg-order-actions" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <select value={order.status} onChange={(e) => handleStatusUpdate(order._id, e.target.value)} disabled={updatingId === order._id} className="mg-status-select">
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    {!order.isPaid && (
                      <button className="mg-btn-sm mg-btn-save" disabled={updatingId === order._id} onClick={() => handleMarkPaid(order._id)}>
                        Mark Paid
                      </button>
                    )}
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
                <div className="mg-revenue-item"><span className="mg-revenue-label">Total Revenue</span><span className="mg-revenue-num">${(stats.revenue ?? 0).toFixed(2)}</span></div>
                <div className="mg-revenue-divider" />
                <div className="mg-revenue-item"><span className="mg-revenue-label">Avg Order Value</span><span className="mg-revenue-num">${(stats.avgOrderValue ?? 0).toFixed(2)}</span></div>
                <div className="mg-revenue-divider" />
                <div className="mg-revenue-item"><span className="mg-revenue-label">Paid Orders</span><span className="mg-revenue-num">{orders.filter(o => o.isPaid).length}</span></div>
              </div>
            </div>

            <div className="mg-card mg-card-wide">
              <h3 className="mg-card-title">Revenue — Last 14 Days (paid orders)</h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 140, paddingTop: 8 }}>
                {revenueByDay.map((d) => (
                  <div key={d.label} title={`${d.label}: $${d.total.toFixed(2)}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 0 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)' }}>${d.total >= 1000 ? `${(d.total / 1000).toFixed(1)}k` : d.total.toFixed(0)}</span>
                    <div style={{
                      width: '100%', borderRadius: '6px 6px 0 0',
                      height: `${Math.max(4, (d.total / maxDayRevenue) * 100)}px`,
                      background: d.total > 0 ? 'var(--gradient-primary)' : 'var(--border-light)',
                      transition: 'height 0.4s var(--ease-out-expo)',
                    }} />
                    <span style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>{d.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="mg-section animate-in">
          <div className="mg-header">
            <div><h1 className="mg-title">Categories</h1><p className="mg-subtitle">{categories.length} categories in your store</p></div>
          </div>

          <div className="mg-card" style={{ marginBottom: 16 }}>
            <h3 className="mg-card-title">Add Category</h3>
            <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Name *</label>
                <input type="text" className="mg-inline-input" placeholder="e.g. Footwear" value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })} style={{ minWidth: 180 }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Slug (auto)</label>
                <input type="text" className="mg-inline-input" placeholder="footwear" value={newCategory.slug}
                  onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })} style={{ minWidth: 160 }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Image URL</label>
                <input type="url" className="mg-inline-input" placeholder="https://…" value={newCategory.image}
                  onChange={(e) => setNewCategory({ ...newCategory, image: e.target.value })} style={{ minWidth: 200 }} />
              </div>
              <button type="submit" className="mg-btn-primary" disabled={categoryBusy === 'new'}>
                {categoryBusy === 'new' ? 'Adding…' : '+ Add Category'}
              </button>
            </form>
          </div>

          <div className="mg-card">
            <div className="mg-table-wrap">
              <table className="mg-table">
                <thead><tr><th>Category</th><th>Slug</th><th>Products</th><th>Actions</th></tr></thead>
                <tbody>
                  {categories.map((cat) => {
                    const used = products.filter((p) => {
                      const c = p.category as unknown;
                      if (!c) return false;
                      if (typeof c === 'string') return c === cat._id;
                      return (c as { _id?: string })._id === cat._id;
                    }).length;
                    return (
                      <tr key={cat._id}>
                        <td><div className="mg-product-name">{cat.name}</div></td>
                        <td className="mg-mono">{cat.slug}</td>
                        <td><span className="mg-stock">{used}</span></td>
                        <td>
                          <div className="mg-actions">
                            <button className="mg-btn-sm mg-btn-delete" disabled={categoryBusy === cat._id || used > 0}
                              title={used > 0 ? `${used} product(s) use this category` : 'Delete category'}
                              onClick={() => handleDeleteCategory(cat)}>
                              {categoryBusy === cat._id ? '…' : '\u2717'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {categories.length === 0 && <div className="mg-empty">No categories yet</div>}
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
