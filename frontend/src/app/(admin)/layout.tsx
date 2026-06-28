'use client';
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  return (
    <>
      <nav style={{
        background: 'var(--surface-container)',
        borderBottom: '1px solid var(--border)',
        padding: '12px 24px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 1000,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Link to="/manage" style={{
            fontSize: 18, fontWeight: 700, color: 'var(--tertiary)', textDecoration: 'none',
          }}>
            ShopSmart <span style={{ fontWeight: 300, color: 'var(--text-secondary)' }}>Admin</span>
          </Link>
          <Link to="/manage" style={{ color: 'var(--text-secondary)', fontSize: 13, textDecoration: 'none' }}>Dashboard</Link>
          <Link to="/shipping" style={{ color: 'var(--text-secondary)', fontSize: 13, textDecoration: 'none' }}>Shipping</Link>
          <Link to="/shipping-dashboard" style={{ color: 'var(--text-secondary)', fontSize: 13, textDecoration: 'none' }}>Tracking</Link>
          <Link to="/delivery" style={{ color: 'var(--text-secondary)', fontSize: 13, textDecoration: 'none' }}>Delivery</Link>
        </div>
        <button onClick={() => navigate('/')}
          style={{
            padding: '6px 14px', background: 'var(--tertiary)', border: 'none',
            borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'white',
          }}>
          {'\u2190'} Main Store
        </button>
      </nav>
      <main>{children}</main>
    </>
  );
}
