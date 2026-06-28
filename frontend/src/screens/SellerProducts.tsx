import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productAPI } from '../services/api';

const SellerProducts: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await productAPI.getAll({ limit: 1000 });
        setProducts(res.data.data);
      } catch (err) {
        console.error('Failed to load products', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const startEdit = (product: any) => {
    setEditingId(product._id);
    setEditForm({
      name: product.name,
      price: product.price,
      comparePrice: product.comparePrice || '',
      countInStock: product.countInStock,
      description: product.description,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async (id: string) => {
    try {
      const data: Record<string, unknown> = {
        name: editForm.name,
        price: parseFloat(editForm.price),
        countInStock: parseInt(editForm.countInStock, 10),
        description: editForm.description,
      };
      if (editForm.comparePrice) data.comparePrice = parseFloat(editForm.comparePrice);
      await productAPI.update(id, data);
      setProducts(products.map((p) => p._id === id ? { ...p, ...data } : p));
      setEditingId(null);
    } catch (err) {
      console.error('Failed to update product', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this product permanently?')) return;
    try {
      await productAPI.delete(id);
      setProducts(products.filter((p) => p._id !== id));
    } catch (err) {
      console.error('Failed to delete product', err);
    }
  };

  if (loading) return <div className="spinner" />;

  return (
    <div style={{ maxWidth: 1440, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>My Products</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{products.length} products in your store</p>
        </div>
        <Link to="/seller/products/add">
          <button style={{ padding: '12px 24px', background: 'var(--success)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
            + Add Product
          </button>
        </Link>
      </div>

      {products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>{'\u{1F4E6}'}</div>
          <h2 style={{ marginBottom: 8 }}>No products yet</h2>
          <p style={{ marginBottom: 24 }}>Start adding products to your store.</p>
          <Link to="/seller/products/add">
            <button style={{ padding: '12px 32px', background: 'var(--success)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
              Add Your First Product
            </button>
          </Link>
        </div>
      ) : (
        <div style={{ background: 'var(--bg-card)', borderRadius: 12, boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: 'var(--surface-container-low)', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px' }}>Product</th>
                <th style={{ padding: '12px 16px' }}>Price</th>
                <th style={{ padding: '12px 16px' }}>Stock</th>
                <th style={{ padding: '12px 16px' }}>Rating</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id} style={{ borderTop: '1px solid var(--border-light)' }}>
                  {editingId === p._id ? (
                    <>
                      <td style={{ padding: '12px 16px' }}>
                        <input type="text" value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13 }}
                        />
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <input type="number" step="0.01" value={editForm.price}
                          onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                          style={{ width: 100, padding: '8px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13 }}
                        />
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <input type="number" value={editForm.countInStock}
                          onChange={(e) => setEditForm({ ...editForm, countInStock: e.target.value })}
                          style={{ width: 70, padding: '8px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13 }}
                        />
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{p.rating?.toFixed(1)}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ color: p.countInStock > 0 ? 'var(--success)' : 'var(--error)', fontWeight: 600 }}>
                          {p.countInStock > 0 ? 'Active' : 'Out of Stock'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', display: 'flex', gap: 8 }}>
                        <button onClick={() => saveEdit(p._id)}
                          style={{ padding: '6px 14px', background: 'var(--success)', color: 'white', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>
                          Save
                        </button>
                        <button onClick={cancelEdit}
                          style={{ padding: '6px 14px', background: 'var(--text-light)', color: 'white', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>
                          Cancel
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <img src={p.images?.[0]} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'contain', background: 'var(--surface-container-low)' }} />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>ID: {p._id.slice(-8)}</div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>${p.price?.toFixed(2)}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ color: p.countInStock < 10 ? 'var(--error)' : 'var(--success)', fontWeight: 600 }}>
                          {p.countInStock}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                        {'\u2605'.repeat(Math.floor(p.rating || 0))}{'\u2606'.repeat(5 - Math.floor(p.rating || 0))}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '4px 10px', borderRadius: 4, fontSize: 12, fontWeight: 600,
                          background: p.countInStock > 0 ? 'var(--success-light)' : 'var(--error-light)',
                          color: p.countInStock > 0 ? 'var(--success)' : 'var(--error)',
                        }}>
                          {p.countInStock > 0 ? 'In Stock' : 'Out'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', display: 'flex', gap: 8 }}>
                        <button onClick={() => startEdit(p)}
                          style={{ padding: '6px 14px', background: 'var(--tertiary-dim)', color: 'white', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>
                          Edit
                        </button>
                        <button onClick={() => handleDelete(p._id)}
                          style={{ padding: '6px 14px', background: 'var(--error)', color: 'white', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>
                          Delete
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SellerProducts;
