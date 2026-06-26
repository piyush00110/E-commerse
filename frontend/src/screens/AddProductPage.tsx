import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productAPI, categoryAPI } from '../services/api';
import { Category } from '../types';

const AddProductPage: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    comparePrice: '',
    images: ['', '', ''],
    category: '',
    brand: '',
    countInStock: '0',
    features: [''],
    isFeatured: false,
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await categoryAPI.getAll();
        setCategories(res.data.data);
      } catch {
        console.error('Failed to load categories');
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...form.features];
    newFeatures[index] = value;
    if (index === newFeatures.length - 1 && value.trim()) {
      newFeatures.push('');
    }
    setForm({ ...form, features: newFeatures });
  };

  const removeFeature = (index: number) => {
    const newFeatures = form.features.filter((_, i) => i !== index);
    setForm({ ...form, features: newFeatures.length ? newFeatures : [''] });
  };

  const handleImageChange = (index: number, value: string) => {
    const newImages = [...form.images];
    newImages[index] = value;
    setForm({ ...form, images: newImages });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const validFeatures = form.features.filter((f) => f.trim());

    const productData: Record<string, unknown> = {
      name: form.name,
      description: form.description,
      price: parseFloat(form.price),
      category: form.category,
      brand: form.brand,
      countInStock: parseInt(form.countInStock, 10),
      images: form.images.filter((img) => img.trim()),
      features: validFeatures,
      isFeatured: form.isFeatured,
    };

    if (form.comparePrice) {
      productData.comparePrice = parseFloat(form.comparePrice);
    }

    try {
      const res = await productAPI.create(productData);
      alert('Product created successfully!');
      navigate(`/products/${res.data.data._id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create product';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="spinner" />;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>Add New Product</h1>

      <div style={{ background: 'white', borderRadius: 12, padding: 32, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        {error && (
          <div style={{ color: '#b12704', marginBottom: 16, fontSize: 14, padding: '8px 12px', background: '#fff0f0', borderRadius: 8 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Product Name *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter product name" required />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Description *</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={5} placeholder="Describe your product in detail..." required style={{ width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, resize: 'vertical', fontFamily: 'inherit' }} />
            </div>

            <div className="form-group">
              <label>Price *</label>
              <input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="29.99" required />
            </div>

            <div className="form-group">
              <label>Compare Price (was)</label>
              <input type="number" step="0.01" min="0" value={form.comparePrice} onChange={(e) => setForm({ ...form, comparePrice: e.target.value })} placeholder="39.99" />
            </div>

            <div className="form-group">
              <label>Category *</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required style={{ width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14 }}>
                <option value="">Select category...</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Brand</label>
              <input type="text" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="Brand name" />
            </div>

            <div className="form-group">
              <label>Stock Quantity *</label>
              <input type="number" min="0" value={form.countInStock} onChange={(e) => setForm({ ...form, countInStock: e.target.value })} required />
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 10 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} />
                <span>Featured Product</span>
              </label>
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, fontSize: 14 }}>Product Images (URLs)</label>
            {form.images.map((img, idx) => (
              <div key={idx} style={{ marginBottom: 8 }}>
                <input
                  type="url"
                  value={img}
                  onChange={(e) => handleImageChange(idx, e.target.value)}
                  placeholder={`Image URL ${idx + 1}`}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14 }}
                />
              </div>
            ))}
          </div>

          <div style={{ marginTop: 20 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, fontSize: 14 }}>Key Features</label>
            {form.features.map((feat, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input
                  type="text"
                  value={feat}
                  onChange={(e) => handleFeatureChange(idx, e.target.value)}
                  placeholder={`Feature ${idx + 1}`}
                  style={{ flex: 1, padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14 }}
                />
                {form.features.length > 1 && (
                  <button type="button" onClick={() => removeFeature(idx)} style={{
                    padding: '8px 12px', border: '1px solid #b12704', borderRadius: 8,
                    background: 'white', color: '#b12704', cursor: 'pointer',
                  }}>
                    X
                  </button>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
            <button type="submit" className="submit-btn" disabled={submitting}
              style={{ opacity: submitting ? 0.6 : 1, flex: 1 }}>
              {submitting ? 'Creating...' : 'Create Product'}
            </button>
            <button type="button" onClick={() => navigate(-1)} style={{
              padding: '12px 24px', border: '1px solid #ddd', borderRadius: 8,
              background: 'white', fontSize: 16, fontWeight: 600, cursor: 'pointer',
            }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductPage;
