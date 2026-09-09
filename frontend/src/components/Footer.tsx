'use client';

import React from 'react';
import Link from 'next/link';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-accent-bar" />
      <div className="footer-grid">
        <div className="footer-column">
          <h4 className="footer-col-title">Get to Know Us</h4>
          <Link href="/about" className="footer-link">About Us</Link>
          <Link href="/careers" className="footer-link">Careers</Link>
          <Link href="/press" className="footer-link">Press Releases</Link>
          <Link href="/cares" className="footer-link">ShopSmart Cares</Link>
        </div>
        <div className="footer-column">
          <h4 className="footer-col-title">Make Money with Us</h4>
          <Link href="/seller/products/add" className="footer-link">Sell products</Link>
          <Link href="/affiliate" className="footer-link">Become an Affiliate</Link>
          <Link href="/advertise" className="footer-link">Advertise Your Products</Link>
          <Link href="/publish" className="footer-link">Self-Publish with Us</Link>
        </div>
        <div className="footer-column">
          <h4 className="footer-col-title">Let Us Help You</h4>
          <Link href="/account" className="footer-link">Your Account</Link>
          <Link href="/cart" className="footer-link">Your Cart</Link>
          <Link href="/returns" className="footer-link">Return Centre</Link>
          <Link href="/help" className="footer-link">Help & Support</Link>
        </div>
        <div className="footer-column">
          <h4 className="footer-col-title">Connect</h4>
          <Link href="https://facebook.com" className="footer-link social">Facebook</Link>
          <Link href="https://twitter.com" className="footer-link social">Twitter</Link>
          <Link href="https://instagram.com" className="footer-link social">Instagram</Link>
          <Link href="https://youtube.com" className="footer-link social">YouTube</Link>
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
