import React, { useState } from 'react';
import { Link } from 'react-router-dom';

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
    a: 'Click "Forgot Password" on the login page. Enter your registered email address and we\'ll send you a password reset link within minutes.',
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

  const filtered = FAQS.filter((f) => f.category === activeCategory);

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>
      {/* Hero */}
      <div className="help-hero">
        <h1>Help Center</h1>
        <p>How can we help you today?</p>
      </div>

      {/* Quick Links */}
      <div className="help-quick-grid">
        <Link to="/orders" className="help-quick-card">
          <div className="help-quick-icon">{'\u{1F4E6}'}</div>
          <strong>Track Order</strong>
          <span>See where your package is</span>
        </Link>
        <Link to="/orders" className="help-quick-card">
          <div className="help-quick-icon">{'\u{1F504}'}</div>
          <strong>Return Items</strong>
          <span>Start a return or replacement</span>
        </Link>
        <Link to="/account" className="help-quick-card">
          <div className="help-quick-icon">{'\u{1F4CB}'}</div>
          <strong>Manage Account</strong>
          <span>Update profile and addresses</span>
        </Link>
        <a href="mailto:support@shopsmart.com" className="help-quick-card">
          <div className="help-quick-icon">{'\u{1F4E7}'}</div>
          <strong>Email Support</strong>
          <span>support@shopsmart.com</span>
        </a>
      </div>

      {/* Category Tabs */}
      <div className="help-category-tabs">
        {CATEGORIES.map((cat) => (
          <button key={cat} className={`help-category-tab ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => { setActiveCategory(cat); setOpenIndex(null); }}>
            {cat}
          </button>
        ))}
      </div>

      {/* FAQ Accordion */}
      <div className="help-faq-list">
        {filtered.map((faq, idx) => {
          const realIdx = FAQS.indexOf(faq);
          return (
            <div key={realIdx} className={`help-faq-item ${openIndex === realIdx ? 'open' : ''}`}>
              <button className="help-faq-question" onClick={() => setOpenIndex(openIndex === realIdx ? null : realIdx)}>
                <span>{faq.q}</span>
                <span className="help-faq-arrow">{openIndex === realIdx ? '\u25B2' : '\u25BC'}</span>
              </button>
              {openIndex === realIdx && (
                <div className="help-faq-answer">
                  <p>{faq.a}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Contact */}
      <div className="help-contact">
        <h2>Still need help?</h2>
        <p>Our support team is available 24/7 to assist you.</p>
        <div className="help-contact-options">
          <div className="help-contact-card">
            <div className="help-contact-icon">{'\u{1F4DE}'}</div>
            <strong>Call Us</strong>
            <span>1-800-SHOP-SMART</span>
            <span style={{ fontSize: 12, color: '#565959' }}>Mon-Sat, 8AM-8PM EST</span>
          </div>
          <div className="help-contact-card">
            <div className="help-contact-icon">{'\u{1F4AC}'}</div>
            <strong>Live Chat</strong>
            <span>Chat with our team</span>
            <span style={{ fontSize: 12, color: '#565959' }}>Average response: 2 min</span>
          </div>
          <div className="help-contact-card">
            <div className="help-contact-icon">{'\u{1F4E7}'}</div>
            <strong>Email</strong>
            <span>support@shopsmart.com</span>
            <span style={{ fontSize: 12, color: '#565959' }}>Response within 24 hrs</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;
