import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productAPI, categoryAPI } from '../services/api';
import { Category } from '../types';

const SellerAddProduct: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    name: '', description: '', price: '', comparePrice: '',
    image: '', category: '', brand: '', countInStock: '1',
    features: [''],
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await categoryAPI.getAll();
        setCategories(res.data.data);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    fetchCategories();
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
      const data: Record<string, unknown> = {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        category: form.category,
        brand: form.brand,
        countInStock: parseInt(form.countInStock, 10),
        images: form.image ? [form.image] : [],
        features: form.features.filter((f) => f.trim()),
      };
      if (form.comparePrice) data.comparePrice = parseFloat(form.comparePrice);

      await productAPI.create(data);
      setSuccess(true);
      setTimeout(() => navigate('/seller/products'), 2000);
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
      <div className="seller-add-success">
        <div className="seller-add-success-icon">{'\u2705'}</div>
        <h1 className="seller-add-success-title">Product Added!</h1>
        <p className="seller-add-success-text">Redirecting to your products...</p>
      </div>
    );
  }

  return (
    <div className="seller-add-page">
      <h1 className="seller-add-heading">Add New Product</h1>
      <p className="seller-add-subtext">List a new product in your store</p>

      <div className="seller-add-card">
        {error && <div className="seller-add-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Product Name *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Wireless Bluetooth Headphones" required />
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea className="seller-add-textarea" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4} placeholder="Describe your product features, condition, and benefits..." required />
          </div>

          <div className="seller-add-grid-2">
            <div className="form-group">
              <label>Selling Price *</label>
              <input type="number" step="0.01" min="0" value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="29.99" required />
            </div>
            <div className="form-group">
              <label>Original Price (was)</label>
              <input type="number" step="0.01" min="0" value={form.comparePrice}
                onChange={(e) => setForm({ ...form, comparePrice: e.target.value })}
                placeholder="49.99 (shows discount)" />
            </div>
            <div className="form-group">
              <label>Category *</label>
              <select className="seller-add-select" value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })} required>
                <option value="">Select category...</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Stock Quantity *</label>
              <input type="number" min="0" value={form.countInStock}
                onChange={(e) => setForm({ ...form, countInStock: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Brand</label>
              <input type="text" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })}
                placeholder="Brand name" />
            </div>
            <div className="form-group">
              <label>Image URL</label>
              <input type="url" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })}
                placeholder="https://images.unsplash.com/..." />
            </div>
          </div>

          <div className="seller-add-features-section">
            <label className="seller-add-features-label">Key Features</label>
            {form.features.map((feat, idx) => (
              <div key={idx} className="seller-add-feature-row">
                <input type="text" value={feat} onChange={(e) => handleFeatureChange(idx, e.target.value)}
                  placeholder={`Feature ${idx + 1}`} className="seller-add-feature-input" />
                {form.features.length > 1 && (
                  <button type="button" onClick={() => removeFeature(idx)} className="seller-add-remove-feature">
                    X
                  </button>
                )}
              </div>
            ))}
          </div>

          <button type="submit" className="seller-add-submit" disabled={submitting}>
            {submitting ? 'Adding Product...' : 'Add Product to Store'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SellerAddProduct;
