'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { productAPI } from '../services/api';

const SellerProducts: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await productAPI.getAll({ limit: 50 });
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
        countInStock: parseInt(editForm.countInStock, 10) || 0,
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
    try {
      await productAPI.delete(id);
      setProducts(products.filter((p) => p._id !== id));
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Failed to delete product', err);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="spinner" />;

  return (
    <div style={{ maxWidth: 1440, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-heading)' }}>My Products</h1>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>{products.length} products in your store</p>
        </div>
        <Link href="/seller/products/add" className="btn btn-primary" style={{ textDecoration: 'none' }}>
          + Add Product
        </Link>
      </div>

      {products.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ maxWidth: 400 }}
          />
        </div>
      )}

      {products.length === 0 ? (
        <div className="empty-state" style={{ padding: 80 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>{'\u{1F4E6}'}</div>
          <h2 style={{ marginBottom: 8, color: '#0f172a' }}>No products yet</h2>
          <p style={{ marginBottom: 24, color: '#64748b' }}>Start adding products to your store.</p>
          <Link href="/seller/products/add" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            Add Your First Product
          </Link>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ padding: '14px 16px', textAlign: 'left' }}>Product</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left' }}>Price</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left' }}>Stock</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left' }}>Rating</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => (
                  <tr key={p._id}>
                    {editingId === p._id ? (
                      <>
                        <td style={{ padding: '12px 16px' }}>
                          <input type="text" value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="form-input" style={{ width: '100%' }}
                          />
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <input type="number" step="0.01" value={editForm.price}
                            onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                            className="form-input" style={{ width: 100 }}
                          />
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <input type="number" value={editForm.countInStock}
                            onChange={(e) => setEditForm({ ...editForm, countInStock: e.target.value })}
                            className="form-input" style={{ width: 70 }}
                          />
                        </td>
                        <td style={{ padding: '12px 16px', color: '#64748b' }}>{p.rating?.toFixed(1)}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span className={`badge ${p.countInStock > 0 ? 'badge-success' : 'badge-error'}`}>
                            {p.countInStock > 0 ? 'Active' : 'Out of Stock'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', display: 'flex', gap: 8 }}>
                          <button onClick={() => saveEdit(p._id)} className="btn btn-primary btn-sm">
                            Save
                          </button>
                          <button onClick={cancelEdit} className="btn btn-ghost btn-sm">
                            Cancel
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                          <img src={p.images?.[0] || ''} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'contain', background: '#f8fafc' }} onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNmM2Y0ZjYiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI2E2YThiNCIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='; }} />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{p.name}</div>
                            <div style={{ fontSize: 12, color: '#64748b' }}>ID: {p._id.slice(-8)}</div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a' }}>${p.price?.toFixed(2)}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span className={`badge ${p.countInStock < 10 ? 'badge-warning' : 'badge-success'}`}>
                            {p.countInStock}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#64748b' }}>
                          {'\u2605'.repeat(Math.floor(p.rating || 0))}{'\u2606'.repeat(5 - Math.floor(p.rating || 0))}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span className={`badge ${p.countInStock > 0 ? 'badge-success' : 'badge-error'}`}>
                            {p.countInStock > 0 ? 'In Stock' : 'Out'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', display: 'flex', gap: 8 }}>
                          <button onClick={() => startEdit(p)} className="btn btn-secondary btn-sm">
                            Edit
                          </button>
                          {deleteConfirmId === p._id ? (
                            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                              <button onClick={() => handleDelete(p._id)} className="btn btn-danger btn-sm">
                                Confirm
                              </button>
                              <button onClick={() => setDeleteConfirmId(null)} className="btn btn-ghost btn-sm">
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => setDeleteConfirmId(p._id)} className="btn btn-danger btn-sm">
                              Delete
                            </button>
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerProducts;
