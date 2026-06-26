import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-column">
          <h4>Get to Know Us</h4>
          <Link to="/">About Us</Link>
          <Link to="/">Careers</Link>
          <Link to="/">Press Releases</Link>
          <Link to="/">ShopSmart Cares</Link>
        </div>
        <div className="footer-column">
          <h4>Make Money with Us</h4>
          <Link to="/">Sell products</Link>
          <Link to="/">Become an Affiliate</Link>
          <Link to="/">Advertise Your Products</Link>
          <Link to="/">Self-Publish with Us</Link>
        </div>
        <div className="footer-column">
          <h4>Let Us Help You</h4>
          <Link to="/">Your Account</Link>
          <Link to="/cart">Your Cart</Link>
          <Link to="/">Return Centre</Link>
          <Link to="/">Help & Support</Link>
        </div>
        <div className="footer-column">
          <h4>Connect</h4>
          <Link to="/">Facebook</Link>
          <Link to="/">Twitter</Link>
          <Link to="/">Instagram</Link>
          <Link to="/">YouTube</Link>
        </div>
      </div>
      <div className="footer-bottom">
        &copy; {new Date().getFullYear()} ShopSmart. All rights reserved. A modern e-commerce experience.
      </div>
    </footer>
  );
};

export default Footer;
