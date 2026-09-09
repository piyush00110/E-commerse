'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { productAPI, categoryAPI } from '../services/api';
import { Category } from '../types';

const FALLBACK_CATEGORIES: Category[] = [
  { _id: 'electronics', name: 'Electronics', slug: 'electronics' },
  { _id: 'fashion', name: 'Fashion', slug: 'fashion' },
  { _id: 'home-kitchen', name: 'Home & Kitchen', slug: 'home-kitchen' },
  { _id: 'books', name: 'Books', slug: 'books' },
  { _id: 'beauty', name: 'Beauty', slug: 'beauty' },
  { _id: 'sports-outdoors', name: 'Sports & Outdoors', slug: 'sports-outdoors' },
];

const SellerAddProduct: React.FC = () => {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>(FALLBACK_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const successTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const [form, setForm] = useState({
    name: '', description: '', price: '', comparePrice: '',
    image: '', category: '', brand: '', countInStock: '1',
    features: [''],
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await categoryAPI.getAll();
        if (res.data?.data?.length) setCategories(res.data.data as Category[]);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    fetchCategories();
    return () => {
      if (successTimeout.current) clearTimeout(successTimeout.current);
    };
  }, []);

  const handleFeatureChange = (index: number, value: string) => {
    const f = [...form.features];
    f[index] = value;
    if (index === f.length - 1 && value.trim()) f.push('');
    setForm({ ...form, features: f });
  };

  const removeFeature = (i: number) => {
    const f = form.features.filter((_, idx) => idx !== i);
    setForm({ ...form, features: f.length ? f : [''] });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const price = parseFloat(form.price);
      const countInStock = parseInt(form.countInStock, 10);
      if (isNaN(price) || price <= 0) { setError('Please enter a valid price'); setSubmitting(false); return; }
      if (isNaN(countInStock) || countInStock < 0) { setError('Please enter a valid stock quantity'); setSubmitting(false); return; }
      const data: Record<string, unknown> = {
        name: form.name,
        description: form.description,
        price,
        category: form.category,
        brand: form.brand,
        countInStock,
        images: form.image ? [form.image] : [],
        features: form.features.filter((f) => f.trim()),
      };
      if (form.comparePrice) {
        const cp = parseFloat(form.comparePrice);
        if (!isNaN(cp) && cp > 0) data.comparePrice = cp;
      }

      await productAPI.create(data);
      setSuccess(true);
      successTimeout.current = setTimeout(() => router.push('/seller/products'), 2000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create product';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="spinner" />;

  if (success) {
    return (
      <div className="empty-state" style={{ maxWidth: 600, margin: '80px auto', padding: 60 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>{'\u2705'}</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Product Added!</h1>
        <p style={{ color: '#64748b' }}>Redirecting to your products...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-heading)', marginBottom: 4 }}>Add New Product</h1>
      <p style={{ color: '#64748b', fontSize: 14, marginBottom: 32 }}>List a new product in your store</p>

      <div className="card" style={{ padding: 32 }}>
        {error && (
          <div className="badge badge-error" style={{ display: 'block', padding: '12px 16px', marginBottom: 24, fontSize: 14 }}>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #e2e8f0' }}>Basic Information</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Product Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="form-input" placeholder="e.g. Wireless Bluetooth Headphones" required />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Description *</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="form-textarea" rows={4} placeholder="Describe your product features, condition, and benefits..." required />
              </div>
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="form-select" required>
                  <option value="">Select category...</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Brand</label>
                <input type="text" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  className="form-input" placeholder="Brand name" />
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #e2e8f0' }}>Pricing</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Selling Price *</label>
                <input type="number" step="0.01" min="0" value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="form-input" placeholder="29.99" required />
              </div>
              <div className="form-group">
                <label className="form-label">Original Price (was)</label>
                <input type="number" step="0.01" min="0" value={form.comparePrice}
                  onChange={(e) => setForm({ ...form, comparePrice: e.target.value })}
                  className="form-input" placeholder="49.99 (shows discount)" />
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #e2e8f0' }}>Inventory</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Stock Quantity *</label>
                <input type="number" min="0" value={form.countInStock}
                  onChange={(e) => setForm({ ...form, countInStock: e.target.value })}
                  className="form-input" required />
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #e2e8f0' }}>Images</h2>
            <div className="form-group">
              <label className="form-label">Image URL</label>
              <input type="url" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })}
                className="form-input" placeholder="https://images.unsplash.com/..." />
            </div>
          </div>

          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #e2e8f0' }}>Features</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {form.features.map((feat, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="text" value={feat} onChange={(e) => handleFeatureChange(idx, e.target.value)}
                    placeholder={`Feature ${idx + 1}`} className="form-input" style={{ flex: 1 }} />
                  {form.features.length > 1 && (
                    <button type="button" onClick={() => removeFeature(idx)} className="btn btn-ghost btn-sm">
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
            <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
              {submitting ? 'Adding Product...' : 'Add Product to Store'}
            </button>
            <button type="button" onClick={() => router.back()} className="btn btn-ghost btn-lg">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SellerAddProduct;
