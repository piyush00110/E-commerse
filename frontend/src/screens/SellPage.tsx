import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

const SellPage: React.FC = () => {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', storeName: '', category: '', description: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const existing = JSON.parse(localStorage.getItem('sellerApplications') || '[]');
    existing.push({ ...form, id: Date.now(), date: new Date().toISOString() });
    localStorage.setItem('sellerApplications', JSON.stringify(existing));
    setSubmitted(true);
    showToast('Application submitted successfully!', 'success');
  };

  const benefits = [
    { icon: '\u{1F4B0}', title: 'Earn More', desc: 'Reach millions of customers and grow your business exponentially.' },
    { icon: '\u{1F310}', title: 'Global Reach', desc: 'Sell across the country with our logistics and shipping support.' },
    { icon: '\u{1F4C8}', title: 'Grow Fast', desc: 'Use our analytics and tools to optimize your listings and sales.' },
    { icon: '\u{1F6CD}', title: 'Easy Management', desc: 'Simple dashboard to manage inventory, orders, and payments.' },
    { icon: '\u{1F3ED}', title: 'Build Brand', desc: 'Create your brand store and showcase your products.' },
    { icon: '\u{1F4D6}', title: '24/7 Support', desc: 'Dedicated seller support team to help you every step of the way.' },
  ];

  return (
    <div>
      <section className="sell-hero">
        <div className="sell-hero-bg-shapes">
          <div className="sell-hero-shape sell-hero-shape-1" />
          <div className="sell-hero-shape sell-hero-shape-2" />
        </div>
        <div className="sell-hero-content">
          <h1>Start Selling on ShopSmart</h1>
          <p>Join millions of sellers and reach millions of customers worldwide. Start your e-commerce journey today.</p>
          <a href="#register-form" className="sell-hero-cta">
            Register as Seller
          </a>
        </div>
      </section>

      <section className="section">
        <h2 className="sell-section-title">Why Sell on ShopSmart?</h2>
        <div className="sell-benefits-grid">
          {benefits.map((b, i) => (
            <div key={i} className="sell-benefit-card">
              <div className="sell-benefit-icon">{b.icon}</div>
              <h3>{b.title}</h3>
              <p>{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="register-form" className="sell-register-section">
        <div className="sell-register-info">
          <h2>Ready to Start?</h2>
          <p>Fill out the form and our team will get back to you within 24 hours. Start your seller journey with ShopSmart and tap into our vast customer base.</p>
          <div className="sell-requirements">
            <h3>What you need:</h3>
            <ul>
              <li>Valid business or individual tax information</li>
              <li>Product listings with images and descriptions</li>
              <li>Bank account for payouts</li>
              <li>Commitment to customer satisfaction</li>
            </ul>
          </div>
        </div>

        <div className="sell-form-card">
          {submitted ? (
            <div className="sell-form-success">
              <div className="sell-success-icon">{'\u2705'}</div>
              <h2>Application Submitted!</h2>
              <p>Thank you for your interest! Our team will review your application and get back to you within 24-48 hours.</p>
              <Link to="/" className="sell-return-link">Return to Home</Link>
            </div>
          ) : (
            <>
              <h2 className="sell-form-title">Seller Registration</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="John Doe" />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required placeholder="seller@example.com" />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required placeholder="+1 (555) 000-0000" />
                </div>
                <div className="form-group">
                  <label>Store Name</label>
                  <input type="text" value={form.storeName} onChange={(e) => setForm({ ...form, storeName: e.target.value })} required placeholder="My Awesome Store" />
                </div>
                <div className="form-group">
                  <label>Primary Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required>
                    <option value="">Select a category</option>
                    <option value="electronics">Electronics</option>
                    <option value="fashion">Fashion</option>
                    <option value="home-kitchen">Home & Kitchen</option>
                    <option value="books">Books</option>
                    <option value="beauty">Beauty</option>
                    <option value="sports">Sports & Outdoors</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>About Your Store</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} placeholder="Tell us about your products and store..." />
                </div>
                <button type="submit" className="submit-btn">
                  Submit Application
                </button>
              </form>
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default SellPage;
