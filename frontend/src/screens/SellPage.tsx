import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { categoryAPI } from '../services/api';
import { Category } from '../types';

const FALLBACK_CATEGORIES: Category[] = [
  { _id: 'electronics', name: 'Electronics', slug: 'electronics' },
  { _id: 'fashion', name: 'Fashion', slug: 'fashion' },
  { _id: 'home-kitchen', name: 'Home & Kitchen', slug: 'home-kitchen' },
  { _id: 'books', name: 'Books', slug: 'books' },
  { _id: 'beauty', name: 'Beauty', slug: 'beauty' },
  { _id: 'sports-outdoors', name: 'Sports & Outdoors', slug: 'sports-outdoors' },
];

const STEPS = ['Personal Info', 'Store Details', 'Business Info', 'Review'];

const SellPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>(FALLBACK_CATEGORIES);
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', phone: '', storeName: '', storeDescription: '', category: '',
    businessType: '', taxId: '', address: '', city: '', state: '', zipCode: '',
    website: '', socialMedia: '', experience: '', monthlyVolume: '',
  });

  useEffect(() => {
    categoryAPI.getAll().then((res) => {
      if (res.data?.data?.length) setCategories(res.data.data as Category[]);
    }).catch(() => {});
  }, []);

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const stepValid = () => {
    if (step === 0) return form.name && form.email && form.phone;
    if (step === 1) return form.storeName && form.category;
    if (step === 2) return form.businessType;
    return true;
  };

  const next = () => { if (stepValid() && step < STEPS.length - 1) setStep(step + 1); };
  const prev = () => { if (step > 0) setStep(step - 1); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const existing = JSON.parse(localStorage.getItem('sellerApplications') || '[]');
      existing.push({ ...form, id: Date.now(), date: new Date().toISOString() });
      localStorage.setItem('sellerApplications', JSON.stringify(existing));
    } catch { /* ignore */ }
    setSubmitted(true);
    showToast('Application submitted successfully!', 'success');
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', border: '2px solid var(--border)',
    borderRadius: 10, fontSize: 14, background: 'var(--surface-container-low)',
    color: 'var(--text)', transition: 'border-color 0.2s', outline: 'none',
    boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)',
    marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5,
  };
  const halfRow: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 };

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
          <a href="#register-form" className="sell-hero-cta">Register as Seller</a>
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

              <div style={{ display: 'flex', gap: 4, marginBottom: 28 }}>
                {STEPS.map((s, i) => (
                  <React.Fragment key={s}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative' }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%', fontSize: 13, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: i <= step ? 'var(--tertiary)' : 'var(--surface-container)',
                        color: i <= step ? 'var(--text-white)' : 'var(--text-secondary)',
                        transition: 'all 0.3s ease', marginBottom: 6,
                      }}>{i < step ? '\u2713' : i + 1}</div>
                      <span style={{ fontSize: 10, fontWeight: 600, color: i <= step ? 'var(--text)' : 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.2 }}>{s}</span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div style={{
                        flex: 0, width: 40, height: 2, alignSelf: 'flex-start', marginTop: 15,
                        background: i < step ? 'var(--tertiary)' : 'var(--border)',
                        transition: 'background 0.3s',
                      }} />
                    )}
                  </React.Fragment>
                ))}
              </div>

              <form onSubmit={handleSubmit}>
                {step === 0 && (
                  <div style={{ animation: 'fadeSlideUp 0.3s ease', display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <div>
                      <label style={labelStyle}>Full Name *</label>
                      <input style={inputStyle} type="text" value={form.name} onChange={(e) => update('name', e.target.value)} required placeholder="John Doe"
                        onFocus={(e) => e.currentTarget.style.borderColor = 'var(--tertiary-dim)'}
                        onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'} />
                    </div>
                    <div style={halfRow}>
                      <div>
                        <label style={labelStyle}>Email Address *</label>
                        <input style={inputStyle} type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required placeholder="seller@example.com"
                          onFocus={(e) => e.currentTarget.style.borderColor = 'var(--tertiary-dim)'}
                          onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'} />
                      </div>
                      <div>
                        <label style={labelStyle}>Phone Number *</label>
                        <input style={inputStyle} type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} required placeholder="+1 (555) 000-0000"
                          onFocus={(e) => e.currentTarget.style.borderColor = 'var(--tertiary-dim)'}
                          onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'} />
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Website (optional)</label>
                      <input style={inputStyle} type="url" value={form.website} onChange={(e) => update('website', e.target.value)} placeholder="https://yourstore.com"
                        onFocus={(e) => e.currentTarget.style.borderColor = 'var(--tertiary-dim)'}
                        onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'} />
                    </div>
                  </div>
                )}

                {step === 1 && (
                  <div style={{ animation: 'fadeSlideUp 0.3s ease', display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <div>
                      <label style={labelStyle}>Store Name *</label>
                      <input style={inputStyle} type="text" value={form.storeName} onChange={(e) => update('storeName', e.target.value)} required placeholder="My Awesome Store"
                        onFocus={(e) => e.currentTarget.style.borderColor = 'var(--tertiary-dim)'}
                        onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'} />
                    </div>
                    <div>
                      <label style={labelStyle}>Primary Category *</label>
                      <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.category} onChange={(e) => update('category', e.target.value)} required
                        onFocus={(e) => e.currentTarget.style.borderColor = 'var(--tertiary-dim)'}
                        onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}>
                        <option value="">Select a category</option>
                        {categories.map((cat) => (
                          <option key={cat._id} value={cat.slug}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Store Description</label>
                      <textarea
                        style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }}
                        value={form.storeDescription}
                        onChange={(e) => update('storeDescription', e.target.value)}
                        rows={4}
                        placeholder="Tell us about your products and store..."
                        onFocus={(e) => e.currentTarget.style.borderColor = 'var(--tertiary-dim)'}
                        onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Social Media (optional)</label>
                      <input style={inputStyle} type="text" value={form.socialMedia} onChange={(e) => update('socialMedia', e.target.value)} placeholder="@yourstore"
                        onFocus={(e) => e.currentTarget.style.borderColor = 'var(--tertiary-dim)'}
                        onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'} />
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div style={{ animation: 'fadeSlideUp 0.3s ease', display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <div>
                      <label style={labelStyle}>Business Type *</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        {['Individual', 'LLC', 'Corporation', 'Partnership'].map((t) => (
                          <button key={t} type="button" onClick={() => update('businessType', t)} style={{
                            padding: '12px 16px', borderRadius: 10, border: '2px solid',
                            borderColor: form.businessType === t ? 'var(--tertiary-dim)' : 'var(--border)',
                            background: form.businessType === t ? 'var(--tertiary-container)' : 'var(--surface-container-low)',
                            color: form.businessType === t ? 'var(--tertiary-dim)' : 'var(--text)',
                            fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
                          }}>{t}</button>
                        ))}
                      </div>
                    </div>
                    <div style={halfRow}>
                      <div>
                        <label style={labelStyle}>Tax ID (optional)</label>
                        <input style={inputStyle} type="text" value={form.taxId} onChange={(e) => update('taxId', e.target.value)} placeholder="XX-XXXXXXX"
                          onFocus={(e) => e.currentTarget.style.borderColor = 'var(--tertiary-dim)'}
                          onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'} />
                      </div>
                      <div>
                        <label style={labelStyle}>Experience Level</label>
                        <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.experience} onChange={(e) => update('experience', e.target.value)}
                          onFocus={(e) => e.currentTarget.style.borderColor = 'var(--tertiary-dim)'}
                          onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}>
                          <option value="">Select...</option>
                          <option value="beginner">Beginner (0-1 years)</option>
                          <option value="intermediate">Intermediate (1-3 years)</option>
                          <option value="advanced">Advanced (3+ years)</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Business Address</label>
                      <input style={inputStyle} type="text" value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="123 Main St"
                        onFocus={(e) => e.currentTarget.style.borderColor = 'var(--tertiary-dim)'}
                        onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={labelStyle}>City</label>
                        <input style={inputStyle} type="text" value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="New York"
                          onFocus={(e) => e.currentTarget.style.borderColor = 'var(--tertiary-dim)'}
                          onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'} />
                      </div>
                      <div>
                        <label style={labelStyle}>State</label>
                        <input style={inputStyle} type="text" value={form.state} onChange={(e) => update('state', e.target.value)} placeholder="NY"
                          onFocus={(e) => e.currentTarget.style.borderColor = 'var(--tertiary-dim)'}
                          onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'} />
                      </div>
                      <div>
                        <label style={labelStyle}>Zip Code</label>
                        <input style={inputStyle} type="text" value={form.zipCode} onChange={(e) => update('zipCode', e.target.value)} placeholder="10001"
                          onFocus={(e) => e.currentTarget.style.borderColor = 'var(--tertiary-dim)'}
                          onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'} />
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Expected Monthly Volume</label>
                      <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.monthlyVolume} onChange={(e) => update('monthlyVolume', e.target.value)}
                        onFocus={(e) => e.currentTarget.style.borderColor = 'var(--tertiary-dim)'}
                        onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}>
                        <option value="">Select...</option>
                        <option value="0-50">0-50 orders/month</option>
                        <option value="50-200">50-200 orders/month</option>
                        <option value="200-1000">200-1,000 orders/month</option>
                        <option value="1000+">1,000+ orders/month</option>
                      </select>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div style={{ animation: 'fadeSlideUp 0.3s ease' }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>Review Your Application</h3>
                    {[
                      { label: 'Name', value: form.name },
                      { label: 'Email', value: form.email },
                      { label: 'Phone', value: form.phone },
                      { label: 'Store', value: form.storeName },
                      { label: 'Category', value: categories.find(c => c.slug === form.category)?.name || form.category },
                      { label: 'Business Type', value: form.businessType },
                      { label: 'Address', value: [form.address, form.city, form.state, form.zipCode].filter(Boolean).join(', ') || '—' },
                      { label: 'Experience', value: form.experience || '—' },
                      { label: 'Monthly Volume', value: form.monthlyVolume || '—' },
                      { label: 'Website', value: form.website || '—' },
                    ].filter(item => item.value).map((item) => (
                      <div key={item.label} style={{
                        display: 'flex', justifyContent: 'space-between', padding: '12px 0',
                        borderBottom: '1px solid var(--border-light)',
                      }}>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{item.label}</span>
                        <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{item.value}</span>
                      </div>
                    ))}
                    <div style={{ marginTop: 20, padding: 16, background: 'var(--tertiary-container)', borderRadius: 10, fontSize: 12, color: 'var(--tertiary-dim)' }}>
                      By submitting, you agree to ShopSmart&apos;s Seller Terms and Conditions. Our team will review your application within 24-48 hours.
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, gap: 12 }}>
                  {step > 0 && (
                    <button type="button" onClick={prev} style={{
                      padding: '12px 24px', background: 'var(--surface-container)', border: '1px solid var(--border)',
                      borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer', color: 'var(--text)',
                      transition: 'var(--transition)',
                    }}>← Back</button>
                  )}
                  <div style={{ flex: 1 }} />
                  {step < STEPS.length - 1 ? (
                    <button type="button" onClick={next} disabled={!stepValid()} style={{
                      padding: '12px 32px', background: stepValid() ? 'linear-gradient(135deg, var(--tertiary), var(--secondary-dark))' : 'var(--surface-container)',
                      color: stepValid() ? 'var(--text-white)' : 'var(--text-secondary)',
                      border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: stepValid() ? 'pointer' : 'not-allowed',
                      boxShadow: stepValid() ? '0 4px 14px rgba(255,153,0,0.3)' : 'none',
                      transition: 'var(--transition)',
                    }}>Continue →</button>
                  ) : (
                    <button type="submit" style={{
                      padding: '12px 32px', background: 'linear-gradient(135deg, var(--success), #059669)',
                      color: 'var(--text-white)', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14,
                      cursor: 'pointer', boxShadow: '0 4px 14px rgba(16,185,129,0.3)', transition: 'var(--transition)',
                    }}>Submit Application</button>
                  )}
                </div>
              </form>
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default SellPage;
