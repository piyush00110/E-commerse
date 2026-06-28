import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from '../types';
import { cartAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

interface Props {
  product: Product;
  badge?: 'bestseller' | 'amazons_choice' | null;
}

const ProductCard: React.FC<Props> = ({ product, badge }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const renderStars = (rating: number) => {
    const stars: string[] = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(rating)) stars.push('\u2605');
      else if (i - 0.5 <= rating) stars.push('\u2605');
      else stars.push('\u2606');
    }
    return stars.join(' ');
  };

  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const stored = localStorage.getItem('user');
      if (!stored) { navigate('/login'); return; }
      await cartAPI.add(product._id);
      showToast(`${product.name} added to cart!`, 'success');
    } catch {
      showToast('Failed to add to cart', 'error');
    }
  };

  const primeDelivery = new Date(Date.now() + (Math.floor(Math.random() * 5) + 2) * 86400000).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <div className="product-card" onClick={() => navigate(`/products/${product._id}`)}>
      {badge === 'bestseller' && (
        <div className="card-badge card-badge-bestseller">#1 Best Seller</div>
      )}
      {badge === 'amazons_choice' && (
        <div className="card-badge card-badge-choice">Amazon's Choice</div>
      )}
      <div className="product-card-image">
        <img src={product.images[0]} alt={product.name} />
      </div>
      <div className="product-card-body">
        <div className="product-card-title">{product.name}</div>
        <div className="product-card-rating">
          <span className="stars">{renderStars(product.rating)}</span>
          <span className="review-count">{product.numReviews.toLocaleString()}</span>
        </div>
        {product.comparePrice && discount >= 20 && (
          <div className="coupon-badge">{'\u2702'} Save {discount}% with coupon</div>
        )}
        <div className="product-card-price">
          <span className="current-price">${product.price.toFixed(2)}</span>
          {product.comparePrice && product.comparePrice > product.price && (
            <>
              <span className="compare-price">${product.comparePrice.toFixed(2)}</span>
              <span className="discount-badge">-{discount}%</span>
            </>
          )}
        </div>
        {product.price < 25 && (
          <span style={{ fontSize: 12, color: 'var(--success)', display: 'block', marginTop: 2 }}>
            {'\u{1F6CD}'} FREE delivery {primeDelivery}
          </span>
        )}
        {product.countInStock <= 5 && product.countInStock > 0 && (
          <span style={{ fontSize: 12, color: 'var(--tertiary)', display: 'block', marginTop: 2 }}>
            Only {product.countInStock} left in stock - order soon.
          </span>
        )}
        <button className="add-to-cart-btn" onClick={handleAddToCart}>
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
