import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productAPI, orderAPI } from '../services/api';

const SellerDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalProducts: 0, totalOrders: 0, revenue: 0, lowStock: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

        setStats({
          totalProducts: prodRes.data.pagination?.total || products.length,
          totalOrders: orders.length,
          revenue,
          lowStock,
        });
        setRecentOrders(orders.slice(0, 5));
      } catch (err) {
        console.error('Failed to load seller data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="spinner" />;

  return (
    <div style={{ maxWidth: 1440, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>Seller Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Manage your store and track performance</p>
        </div>
        <Link to="/seller/products/add">
          <button style={{ padding: '12px 24px', background: 'var(--tertiary)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
            + Add New Product
          </button>
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Total Products', value: stats.totalProducts, color: 'var(--tertiary)', icon: '\u{1F4E6}' },
          { label: 'Orders', value: stats.totalOrders, color: 'var(--tertiary-dim)', icon: '\u{1F4CB}' },
          { label: 'Revenue', value: `$${stats.revenue.toFixed(2)}`, color: 'var(--success)', icon: '\u{1F4B5}' },
          { label: 'Low Stock Items', value: stats.lowStock, color: stats.lowStock > 0 ? 'var(--error)' : 'var(--success)', icon: '\u{26A0}' },
        ].map((item) => (
          <div key={item.label} style={{
            background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>{item.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: item.color }}>{item.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <div style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <h2 style={{ fontSize: 18, marginBottom: 16 }}>Recent Orders</h2>
          {recentOrders.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 32 }}>No orders yet.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
                  <th style={{ padding: '10px 8px' }}>Order</th>
                  <th style={{ padding: '10px 8px' }}>Items</th>
                  <th style={{ padding: '10px 8px' }}>Total</th>
                  <th style={{ padding: '10px 8px' }}>Status</th>
                  <th style={{ padding: '10px 8px' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order._id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px 8px', fontFamily: 'monospace', fontSize: 12 }}>#{order._id.slice(-8)}</td>
                    <td style={{ padding: '12px 8px' }}>{order.items?.length || 0}</td>
                    <td style={{ padding: '12px 8px', fontWeight: 600 }}>${order.totalPrice?.toFixed(2)}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: 4, fontSize: 12, fontWeight: 600,
                        background: order.isDelivered ? 'var(--success-light)' : order.isPaid ? 'var(--secondary-container)' : 'var(--error-light)',
                        color: order.isDelivered ? 'var(--success)' : order.isPaid ? 'var(--on-secondary-container)' : 'var(--error)',
                      }}>
                        {order.isDelivered ? 'Delivered' : order.isPaid ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <h2 style={{ fontSize: 18, marginBottom: 16 }}>Quick Actions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Link to="/seller/products/add" style={{
              padding: '14px 20px', background: 'var(--surface-container)', borderRadius: 8,
              border: '1px solid var(--success-light)', color: 'var(--tertiary)', fontWeight: 600, fontSize: 14,
              textDecoration: 'none',
            }}>
              + Add New Product
            </Link>
            <Link to="/seller/products" style={{
              padding: '14px 20px', background: 'var(--surface-container)', borderRadius: 8,
              border: '1px solid var(--outline-variant)', color: 'var(--tertiary-dim)', fontWeight: 600, fontSize: 14,
              textDecoration: 'none',
            }}>
              &#9998; Manage Products
            </Link>
            <Link to="/seller/orders" style={{
              padding: '14px 20px', background: 'var(--surface-container)', borderRadius: 8,
              border: '1px solid var(--secondary-container)', color: 'var(--on-secondary-container)', fontWeight: 600, fontSize: 14,
              textDecoration: 'none',
            }}>
              &#128230; View Orders
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;
