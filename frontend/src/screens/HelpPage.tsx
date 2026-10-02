'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import GlowCard from '../components/ui/spotlight-card';

interface FAQ {
  q: string;
  a: string;
  category: string;
}

const FAQS: FAQ[] = [
  {
    category: 'Orders',
    q: 'How do I track my order?',
    a: 'Go to "Returns & Orders" in your account. Click on any order to see detailed tracking information including carrier, tracking number, and real-time shipment status updates.',
  },
  {
    category: 'Orders',
    q: 'Can I cancel or change my order?',
    a: 'Orders can be cancelled within 1 hour of placing. Go to your orders page and click "Cancel" if available. Once an order enters processing, it cannot be changed.',
  },
  {
    category: 'Orders',
    q: 'What should I do if I received a damaged item?',
    a: 'Contact us within 48 hours of delivery. We offer free returns and replacements for damaged items. Go to your order detail page and select "Return or Replace Items".',
  },
  {
    category: 'Shipping',
    q: 'How long does shipping take?',
    a: 'Standard shipping takes 3-5 business days. Express shipping delivers in 1-2 business days. FREE shipping is available on orders over $50.',
  },
  {
    category: 'Shipping',
    q: 'Do you ship internationally?',
    a: 'Currently we ship within the United States and select international destinations. International shipping times and costs vary by location.',
  },
  {
    category: 'Shipping',
    q: 'How can I change my shipping address?',
    a: 'You can change or update your shipping address in your Account settings under "My Addresses". Saved addresses will be available at checkout for faster ordering.',
  },
  {
    category: 'Shipping',
    q: 'What is the delivery schedule?',
    a: 'Our delivery partners deliver Monday through Saturday, 8 AM to 8 PM. Sunday delivery is available in select areas for an additional fee.',
  },
  {
    category: 'Returns',
    q: 'What is your return policy?',
    a: 'We offer free 30-day returns on most items. Items must be unused and in original packaging. Refunds are processed within 5-7 business days after we receive the return.',
  },
  {
    category: 'Returns',
    q: 'How do I return an item?',
    a: 'Go to your Orders page, find the item, and select "Return or Replace". Print the return label, pack the item securely, and drop it off at any carrier location.',
  },
  {
    category: 'Returns',
    q: 'When will I get my refund?',
    a: 'Refunds are processed within 5-7 business days after we receive your return. The refund will be credited to your original payment method.',
  },
  {
    category: 'Payment',
    q: 'What payment methods do you accept?',
    a: 'We accept Visa, Mastercard, American Express, Discover, PayPal, UPI (Google Pay, PhonePe, Paytm), and Cash on Delivery.',
  },
  {
    category: 'Payment',
    q: 'Is my payment information secure?',
    a: 'Yes, all transactions are encrypted using SSL technology. We never store your full credit card details. Our payment systems are PCI-DSS compliant.',
  },
  {
    category: 'Account',
    q: 'How do I reset my password?',
    a: 'Click "Forgot Password" on the login page. Enter your registered email address and we will send you a password reset link within minutes.',
  },
  {
    category: 'Account',
    q: 'How do I delete my account?',
    a: 'Contact our support team to request account deletion. Please note that this action is irreversible and all order history will be permanently removed.',
  },
];

const CATEGORIES = FAQS.map((f) => f.category).filter((v, i, a) => a.indexOf(v) === i);

const HelpPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('Orders');
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = FAQS.filter((f) => {
    const matchesCategory = f.category === activeCategory;
    const matchesSearch = searchQuery === '' ||
      f.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.a.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>
      {/* Hero */}
      <div style={{
        textAlign: 'center', padding: '48px 24px', marginBottom: 40,
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: 16, color: 'var(--bg-card)',
      }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, fontFamily: 'var(--font-heading)', marginBottom: 8 }}>Help Center</h1>
        <p style={{ fontSize: 16, color: 'var(--text-tertiary)', marginBottom: 24 }}>How can we help you today?</p>
        <div style={{ maxWidth: 500, margin: '0 auto' }}>
          <input
            type="text"
            placeholder="Search for answers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ width: '100%', padding: '14px 20px', fontSize: 16, borderRadius: 12 }}
          />
        </div>
      </div>

      {/* Quick Links */}
      <div style={{ marginBottom: 40 }}>
        <div className="section-header" style={{ marginBottom: 16 }}>
          <h2 className="section-title">Quick Links</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
          <Link href="/orders" style={{ textDecoration: 'none' }}>
            <GlowCard className="card card-hover" style={{ padding: 24, textAlign: 'center', cursor: 'pointer' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{'\u{1F4E6}'}</div>
              <strong style={{ display: 'block', fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>Track Order</strong>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>See where your package is</span>
            </GlowCard>
          </Link>
          <Link href="/orders" style={{ textDecoration: 'none' }}>
            <GlowCard className="card card-hover" style={{ padding: 24, textAlign: 'center', cursor: 'pointer' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{'\u{1F504}'}</div>
              <strong style={{ display: 'block', fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>Return Items</strong>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Start a return or replacement</span>
            </GlowCard>
          </Link>
          <Link href="/account" style={{ textDecoration: 'none' }}>
            <GlowCard className="card card-hover" style={{ padding: 24, textAlign: 'center', cursor: 'pointer' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{'\u{1F4CB}'}</div>
              <strong style={{ display: 'block', fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>Manage Account</strong>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Update profile and addresses</span>
            </GlowCard>
          </Link>
          <a href="mailto:support@shopsmart.com" style={{ textDecoration: 'none' }}>
            <GlowCard className="card card-hover" style={{ padding: 24, textAlign: 'center', cursor: 'pointer' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{'\u{1F4E7}'}</div>
              <strong style={{ display: 'block', fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>Email Support</strong>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>support@shopsmart.com</span>
            </GlowCard>
          </a>
        </div>
      </div>

      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {CATEGORIES.map((cat) => (
          <button key={cat}
            className={`btn ${activeCategory === cat ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => { setActiveCategory(cat); setOpenIndex(null); }}>
            {cat}
          </button>
        ))}
      </div>

      {/* FAQ Accordion */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 48 }}>
        {filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: 40 }}>
            <p>No questions found matching your search.</p>
          </div>
        ) : (
          filtered.map((faq, idx) => {
            const realIdx = FAQS.indexOf(faq);
            return (
              <div key={realIdx} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <button
                  onClick={() => setOpenIndex(openIndex === realIdx ? null : realIdx)}
                  style={{
                    width: '100%', padding: '16px 20px', border: 'none', background: 'transparent',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    cursor: 'pointer', textAlign: 'left', fontSize: 14, fontWeight: 600, color: 'var(--text)',
                  }}>
                  <span>{faq.q}</span>
                  <span style={{
                    fontSize: 12, color: 'var(--primary)', transition: 'transform 0.2s ease',
                    transform: openIndex === realIdx ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}>{'\u25BC'}</span>
                </button>
                <div style={{
                  maxHeight: openIndex === realIdx ? '200px' : '0',
                  overflow: 'hidden',
                  transition: 'max-height 0.3s ease, padding 0.3s ease',
                  padding: openIndex === realIdx ? '0 20px 16px' : '0 20px',
                }}>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{faq.a}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Contact */}
      <div style={{ marginBottom: 32 }}>
        <div className="section-header" style={{ marginBottom: 16 }}>
          <h2 className="section-title">Still need help?</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Our support team is available 24/7 to assist you.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          <div className="card card-hover" style={{ padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>{'\u{1F4DE}'}</div>
            <strong style={{ display: 'block', fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>Call Us</strong>
            <span style={{ display: 'block', fontSize: 13, color: 'var(--primary)', fontWeight: 600, marginBottom: 4 }}>1-800-SHOP-SMART</span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Mon-Sat, 8AM-8PM EST</span>
          </div>
          <div className="card card-hover" style={{ padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>{'\u{1F4AC}'}</div>
            <strong style={{ display: 'block', fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>Live Chat</strong>
            <span style={{ display: 'block', fontSize: 13, color: 'var(--primary)', fontWeight: 600, marginBottom: 4 }}>Chat with our team</span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Average response: 2 min</span>
          </div>
          <div className="card card-hover" style={{ padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>{'\u{1F4E7}'}</div>
            <strong style={{ display: 'block', fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>Email</strong>
            <span style={{ display: 'block', fontSize: 13, color: 'var(--primary)', fontWeight: 600, marginBottom: 4 }}>support@shopsmart.com</span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Response within 24 hrs</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;
