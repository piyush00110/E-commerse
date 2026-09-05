import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
    { label: 'Total Revenue', value: `$${(stats.revenue ?? 0).toFixed(2)}`, icon: '\u{1F4B5}', color: 'var(--success)', bg: 'rgba(16,185,129,0.1)' },
    { label: 'Total Orders', value: stats.totalOrders, icon: '\u{1F4CB}', color: 'var(--tertiary)', bg: 'rgba(255,153,0,0.1)' },
    { label: 'Products', value: stats.totalProducts, icon: '\u{1F4E6}', color: 'var(--primary-color)', bg: 'rgba(83,144,217,0.1)' },
    { label: 'Pending Shipments', value: stats.pendingOrders, icon: '\u{1F4E8}', color: 'var(--tertiary-dim)', bg: 'rgba(255,153,0,0.08)' },
    { label: 'Delivered', value: stats.deliveredOrders, icon: '\u{2705}', color: 'var(--success)', bg: 'rgba(16,185,129,0.08)' },
    { label: 'Low Stock', value: stats.lowStock, icon: '\u26A0\uFE0F', color: stats.lowStock > 0 ? 'var(--error)' : 'var(--success)', bg: stats.lowStock > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)' },
  ];

  const statusColor = (order: any) => {
    if (order.isDelivered) return { bg: 'var(--success-light)', color: 'var(--success)', label: 'Delivered' };
    if (order.isPaid) return { bg: 'var(--secondary-container)', color: 'var(--on-secondary-container)', label: 'Paid' };
    return { bg: 'var(--error-light)', color: 'var(--error)', label: 'Pending' };
  };

  return (
    <div style={{ maxWidth: 1440, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)' }}>Seller Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Welcome back! Here&apos;s your store overview.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 4, background: 'var(--surface-container)', borderRadius: 10, padding: 4 }}>
            {(['week', 'month', 'year'] as const).map((p) => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                padding: '6px 14px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: period === p ? 'var(--tertiary)' : 'transparent',
                color: period === p ? 'var(--text-white)' : 'var(--text-secondary)',
                transition: 'var(--transition)',
              }}>{p.charAt(0).toUpperCase() + p.slice(1)}</button>
            ))}
          </div>
          <Link to="/seller/products/add" style={{ textDecoration: 'none' }}>
            <button style={{
              padding: '10px 22px', background: 'linear-gradient(135deg, var(--tertiary), var(--secondary-dark))',
              color: 'var(--text-white)', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(255,153,0,0.3)', transition: 'var(--transition)',
            }}>+ Add Product</button>
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        {statCards.map((s) => (
          <div key={s.label} style={{
            background: 'var(--bg-card)', borderRadius: 14, padding: '20px 16px', border: '1px solid var(--border-light)',
            display: 'flex', alignItems: 'center', gap: 14, transition: 'var(--transition)', cursor: 'default',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: 12, background: s.bg, display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0,
            }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2, fontWeight: 600 }}>{s.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: s.color, lineHeight: 1.1 }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
        <div style={{
          background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border-light)',
          padding: 24,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Revenue Overview</h2>
            <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--success)', fontFamily: "'Courier New', monospace" }}>${stats.revenue.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Paid Orders', value: stats.totalOrders - stats.pendingOrders, total: stats.totalOrders, color: 'var(--success)' },
              { label: 'Pending', value: stats.pendingOrders, total: stats.totalOrders, color: 'var(--tertiary)' },
              { label: 'Delivered', value: stats.deliveredOrders, total: stats.totalOrders, color: 'var(--primary-color)' },
            ].map((bar) => {
              const pct = bar.total > 0 ? (bar.value / bar.total) * 100 : 0;
              return (
                <div key={bar.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{bar.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{bar.value}</span>
                  </div>
                  <div style={{ height: 8, background: 'var(--surface-container-low)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: bar.color, borderRadius: 4, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{
          background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border-light)',
          padding: 24,
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 20 }}>Top Products</h2>
          {topProducts.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 32, fontSize: 14 }}>No products yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {topProducts.map((p: any, i: number) => (
                <div key={p._id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                  background: 'var(--surface-container-low)', borderRadius: 10,
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, background: 'var(--tertiary)', color: 'var(--text-white)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0,
                  }}>{i + 1}</div>
                  {p.images?.[0] && <img src={p.images[0]} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover' }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                      {'⭐'} {p.rating?.toFixed(1) || 'N/A'} · ${p.price?.toFixed(2)}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>{p.countInStock} in stock</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{
        background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border-light)',
        padding: 24,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Recent Orders</h2>
          <Link to="/seller/orders" style={{ fontSize: 13, fontWeight: 600, color: 'var(--tertiary-dim)', textDecoration: 'none' }}>View All →</Link>
        </div>
        {recentOrders.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 32, fontSize: 14 }}>No orders yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recentOrders.map((order) => {
              const s = statusColor(order);
              return (
                <div key={order._id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 16px', background: 'var(--surface-container-low)', borderRadius: 10,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>#{order._id.slice(-8)}</span>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}</span>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>${order.totalPrice?.toFixed(2)}</span>
                    <span style={{
                      padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                      background: s.bg, color: s.color, textTransform: 'capitalize',
                    }}>{s.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 32,
      }}>
        {[
          { to: '/seller/products/add', icon: '\u{2795}', label: 'Add Product', desc: 'List a new product', bg: 'var(--tertiary-container)' },
          { to: '/seller/products', icon: '\u{1F4DD}', label: 'Manage Products', desc: 'Edit inventory & prices', bg: 'var(--primary-container)' },
          { to: '/seller/orders', icon: '\u{1F4E8}', label: 'View Orders', desc: 'Track shipments', bg: 'var(--secondary-container)' },
        ].map((a) => (
          <Link key={a.to} to={a.to} style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'var(--bg-card)', borderRadius: 14, padding: 24, border: '1px solid var(--border-light)',
              display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', transition: 'var(--transition)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 12, background: a.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
              }}>{a.icon}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{a.label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{a.desc}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SellerDashboard;
