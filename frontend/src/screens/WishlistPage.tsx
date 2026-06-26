import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { wishlistAPI, cartAPI } from '../services/api';
import { Product } from '../types';
import { useToast } from '../context/ToastContext';
import { GridSkeleton } from '../components/Skeleton';

const WishlistPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) { navigate('/login'); return; }
    fetchWishlist();
  }, [navigate]);

  const fetchWishlist = async () => {
    try {
      const res = await wishlistAPI.get();
      setProducts(res.data.data.products || []);
    } catch { showToast('Failed to load wishlist', 'error'); }
    finally { setLoading(false); }
  };

  const handleRemove = async (productId: string) => {
    try {
      await wishlistAPI.remove(productId);
      setProducts(products.filter((p) => p._id !== productId));
      showToast('Removed from wishlist', 'info');
    } catch { showToast('Failed to remove', 'error'); }
  };

  const handleAddToCart = async (productId: string) => {
    try {
      await cartAPI.add(productId);
      showToast('Added to cart!', 'success');
    } catch { showToast('Failed to add to cart', 'error'); }
  };

  if (loading) return <GridSkeleton count={4} />;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>My Wishlist</h1>
        <p style={{ color: '#565959', fontSize: 14 }}>{products.length} {products.length === 1 ? 'item' : 'items'} saved</p>
      </div>

      {products.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 72, marginBottom: 16 }}>{'\u{1F497}'}</div>
          <h2>Your wishlist is empty</h2>
          <p>Save items you love to your wishlist. Browse products and click the heart icon to add them.</p>
          <Link to="/products" className="hero-cta" style={{ textDecoration: 'none', display: 'inline-block' }}>
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="product-grid">
          {products.map((product) => {
            const discount = product.comparePrice
              ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100) : 0;
            return (
              <div key={product._id} className="product-card" style={{ position: 'relative' }}>
                <button onClick={() => handleRemove(product._id)}
                  style={{ position: 'absolute', top: 8, right: 8, background: 'white', border: 'none', borderRadius: '50%', width: 32, height: 32, fontSize: 16, cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.15)', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cc0c39' }}>
                  {'\u2764'}
                </button>
                <Link to={`/products/${product._id}`} style={{ display: 'block' }}>
                  <div className="product-card-image">
                    <img src={product.images?.[0]} alt={product.name} />
                  </div>
                </Link>
                <div className="product-card-body">
                  <Link to={`/products/${product._id}`} className="product-card-title">
                    {product.name}
                  </Link>
                  <div className="product-card-price">
                    <span className="current-price">${product.price.toFixed(2)}</span>
                    {product.comparePrice && (
                      <>
                        <span className="compare-price">${product.comparePrice.toFixed(2)}</span>
                        <span className="discount-badge">-{discount}%</span>
                      </>
                    )}
                  </div>
                  <button className="add-to-cart-btn" onClick={() => handleAddToCart(product._id)}>
                    Add to Cart
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WishlistPage;
