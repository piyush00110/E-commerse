'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { productAPI, orderAPI } from '../services/api';

const SellerDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalProducts: 0, totalOrders: 0, revenue: 0, lowStock: 0, pendingOrders: 0, deliveredOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, orderRes] = await Promise.all([
          productAPI.getAll({ limit: 1000 }),
          orderAPI.getAll(),
        ]);
        const products = prodRes.data.data;
        const orders = orderRes.data.data;
        const paidOrders = orders.filter((o: any) => o.isPaid);
        const revenue = paidOrders.reduce((sum: number, o: any) => sum + o.totalPrice, 0);
        const lowStock = products.filter((p: any) => p.countInStock < 10).length;
        const pendingOrders = orders.filter((o: any) => !o.isDelivered).length;
        const deliveredOrders = orders.filter((o: any) => o.isDelivered).length;

        setStats({
          totalProducts: prodRes.data.pagination?.total || products.length,
          totalOrders: orders.length,
          revenue,
          lowStock,
          pendingOrders,
          deliveredOrders,
        });
        setRecentOrders(orders.slice(0, 5));
        setTopProducts(products.sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0)).slice(0, 5));
      } catch (err) {
        console.error('Failed to load seller data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="spinner" />;

  const statCards = [
    { label: 'Total Revenue', value: `$${(stats.revenue ?? 0).toFixed(2)}`, icon: '\u{1F4B5}', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    { label: 'Total Orders', value: stats.totalOrders, icon: '\u{1F4CB}', color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
    { label: 'Products', value: stats.totalProducts, icon: '\u{1F4E6}', color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
    { label: 'Pending Shipments', value: stats.pendingOrders, icon: '\u{1F4E8}', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  ];

  const statusColor = (order: any) => {
    if (order.isDelivered) return { className: 'badge badge-success', label: 'Delivered' };
    if (order.isPaid) return { className: 'badge badge-info', label: 'Paid' };
    return { className: 'badge badge-warning', label: 'Pending' };
  };

  return (
    <div style={{ maxWidth: 1440, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-heading)' }}>Seller Dashboard</h1>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>Welcome back! Here&apos;s your store overview.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', borderRadius: 10, padding: 4 }}>
            {(['week', 'month', 'year'] as const).map((p) => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                padding: '6px 14px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: period === p ? '#6366f1' : 'transparent',
                color: period === p ? '#fff' : '#64748b',
                transition: 'all 0.2s ease',
              }}>{p.charAt(0).toUpperCase() + p.slice(1)}</button>
            ))}
          </div>
          <Link href="/seller/products/add" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            + Add Product
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16, marginBottom: 32 }}>
        {statCards.map((s) => (
          <div key={s.label} className="card card-hover"
            style={{ padding: '20px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12, background: s.bg, display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0,
            }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2, fontWeight: 600 }}>{s.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: s.color, lineHeight: 1.1 }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Revenue Overview</h2>
            <span style={{ fontSize: 24, fontWeight: 800, color: '#10b981', fontFamily: "'Courier New', monospace" }}>${(stats.revenue ?? 0).toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Paid Orders', value: stats.totalOrders - stats.pendingOrders, total: stats.totalOrders, color: '#10b981' },
              { label: 'Pending', value: stats.pendingOrders, total: stats.totalOrders, color: '#f59e0b' },
              { label: 'Delivered', value: stats.deliveredOrders, total: stats.totalOrders, color: '#6366f1' },
            ].map((bar) => {
              const pct = bar.total > 0 ? (bar.value / bar.total) * 100 : 0;
              return (
                <div key={bar.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>{bar.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{bar.value}</span>
                  </div>
                  <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: bar.color, borderRadius: 4, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>Top Products</h2>
          {topProducts.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: 48, marginBottom: 12 }}>{'\u{1F4E6}'}</div>
              <p>No products yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {topProducts.map((p: any, i: number) => (
                <div key={p._id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                  background: '#f8fafc', borderRadius: 10,
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, background: '#6366f1', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0,
                  }}>{i + 1}</div>
                  {p.images?.[0] && <img src={p.images[0]} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNmM2Y0ZjYiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI2E2YThiNCIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='; }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>
                      {'⭐'} {p.rating?.toFixed(1) || 'N/A'} · ${(p.price ?? 0).toFixed(2)}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>{p.countInStock} in stock</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: 24, marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Recent Orders</h2>
          <Link href="/seller/orders" style={{ fontSize: 13, fontWeight: 600, color: '#6366f1', textDecoration: 'none' }}>View All →</Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: 48, marginBottom: 12 }}>{'\u{1F4ED}'}</div>
            <p>No orders yet.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ padding: '12px 16px', textAlign: 'left' }}>Order ID</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left' }}>Items</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Total</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => {
                  const s = statusColor(order);
                  return (
                    <tr key={order._id}>
                      <td style={{ padding: '14px 16px', fontWeight: 700, fontFamily: 'monospace', fontSize: 13 }}>#{order._id.slice(-8)}</td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: '#64748b' }}>{order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}</td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: '#64748b' }}>{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td style={{ padding: '14px 16px', fontWeight: 700, fontSize: 15, textAlign: 'right' }}>${order.totalPrice?.toFixed(2)}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}><span className={s.className}>{s.label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="section-header" style={{ marginBottom: 16 }}>
        <h2 className="section-title">Quick Actions</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {[
          { to: '/seller/products/add', icon: '\u{2795}', label: 'Add Product', desc: 'List a new product', className: 'btn btn-primary' },
          { to: '/seller/products', icon: '\u{1F4DD}', label: 'Manage Products', desc: 'Edit inventory & prices', className: 'btn btn-secondary' },
          { to: '/seller/orders', icon: '\u{1F4E8}', label: 'View Orders', desc: 'Track shipments', className: 'btn btn-ghost' },
        ].map((a) => (
          <Link key={a.to} href={a.to} style={{ textDecoration: 'none' }}>
            <div className="card card-hover"
              style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12, background: '#f1f5f9',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
              }}>{a.icon}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>{a.label}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{a.desc}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SellerDashboard;
