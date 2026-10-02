'use client';

import React from 'react';
import Link from 'next/link';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-accent-bar" />
      <div className="glass" style={{ display: 'flex', justifyContent: 'center', gap: 40, flexWrap: 'wrap', padding: '20px 24px', margin: '0 auto 28px', maxWidth: 900, borderRadius: 'var(--radius-lg)' }}>
        {[
          { icon: '✅', title: '100% ORIGINAL', desc: 'guarantee on all products' },
          { icon: '🔄', title: 'EASY RETURNS', desc: 'within 14 days of delivery' },
          { icon: '🔒', title: 'SECURE PAYMENTS', desc: '256-bit SSL encryption' },
        ].map((item) => (
          <div key={item.title} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 26 }}>{item.icon}</span>
            <span>
              <span style={{ display: 'block', fontSize: 13, fontWeight: 800, letterSpacing: 0.4 }}>{item.title}</span>
              <span style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)' }}>{item.desc}</span>
            </span>
          </div>
        ))}
      </div>
      <div className="footer-grid">
        <div className="footer-column">
          <h4 className="footer-col-title">Get to Know Us</h4>
          <Link href="/help" className="footer-link">About Us</Link>
          <Link href="/sell" className="footer-link">Careers</Link>
          <Link href="/help" className="footer-link">Press Releases</Link>
          <Link href="/help" className="footer-link">ShopSmart Cares</Link>
        </div>
        <div className="footer-column">
          <h4 className="footer-col-title">Make Money with Us</h4>
          <Link href="/seller/products/add" className="footer-link">Sell products</Link>
          <Link href="/sell" className="footer-link">Become an Affiliate</Link>
          <Link href="/sell" className="footer-link">Advertise Your Products</Link>
          <Link href="/sell" className="footer-link">Self-Publish with Us</Link>
        </div>
        <div className="footer-column">
          <h4 className="footer-col-title">Let Us Help You</h4>
          <Link href="/account" className="footer-link">Your Account</Link>
          <Link href="/cart" className="footer-link">Your Cart</Link>
          <Link href="/orders" className="footer-link">Return Centre</Link>
          <Link href="/help" className="footer-link">Help & Support</Link>
        </div>
        <div className="footer-column">
          <h4 className="footer-col-title">Connect</h4>
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="footer-link social">Facebook</a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="footer-link social">Twitter</a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="footer-link social">Instagram</a>
          <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="footer-link social">YouTube</a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>&copy; {new Date().getFullYear()} ShopSmart. All rights reserved.</span>
        <span>A modern e-commerce experience.</span>
      </div>
    </footer>
  );
};

export default Footer;
