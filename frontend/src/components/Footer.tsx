import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer style={{
      background: 'var(--surface-container)',
      borderTop: '1px solid var(--border)',
      padding: '48px 24px 24px',
      marginTop: 48,
    }}>
      <div style={{
        maxWidth: 1440, margin: '0 auto',
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 40,
      }}>
        <div>
          <h4 style={{
            fontSize: 15, fontWeight: 700, marginBottom: 16,
            color: 'var(--text)', paddingBottom: 8,
            borderBottom: '2px solid var(--tertiary)',
            display: 'inline-block',
          }}>Get to Know Us</h4>
          <Link to="/" style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>About Us</Link>
          <Link to="/" style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>Careers</Link>
          <Link to="/" style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>Press Releases</Link>
          <Link to="/" style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>ShopSmart Cares</Link>
        </div>
        <div>
          <h4 style={{
            fontSize: 15, fontWeight: 700, marginBottom: 16,
            color: 'var(--text)', paddingBottom: 8,
            borderBottom: '2px solid var(--tertiary)',
            display: 'inline-block',
          }}>Make Money with Us</h4>
          <Link to="/" style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>Sell products</Link>
          <Link to="/" style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>Become an Affiliate</Link>
          <Link to="/" style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>Advertise Your Products</Link>
          <Link to="/" style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>Self-Publish with Us</Link>
        </div>
        <div>
          <h4 style={{
            fontSize: 15, fontWeight: 700, marginBottom: 16,
            color: 'var(--text)', paddingBottom: 8,
            borderBottom: '2px solid var(--tertiary)',
            display: 'inline-block',
          }}>Let Us Help You</h4>
          <Link to="/" style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>Your Account</Link>
          <Link to="/cart" style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>Your Cart</Link>
          <Link to="/" style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>Return Centre</Link>
          <Link to="/" style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>Help & Support</Link>
        </div>
        <div>
          <h4 style={{
            fontSize: 15, fontWeight: 700, marginBottom: 16,
            color: 'var(--text)', paddingBottom: 8,
            borderBottom: '2px solid var(--tertiary)',
            display: 'inline-block',
          }}>Connect</h4>
          <Link to="/" style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>Facebook</Link>
          <Link to="/" style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>Twitter</Link>
          <Link to="/" style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>Instagram</Link>
          <Link to="/" style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>YouTube</Link>
        </div>
      </div>
      <div style={{
        maxWidth: 1440, margin: '32px auto 0',
        paddingTop: 20, borderTop: '1px solid var(--border)',
        textAlign: 'center', fontSize: 12, color: 'var(--text-light)',
      }}>
        &copy; {new Date().getFullYear()} ShopSmart. All rights reserved. A modern e-commerce experience.
      </div>
    </footer>
  );
};

export default Footer;
