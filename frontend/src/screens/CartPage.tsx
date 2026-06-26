import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cartAPI } from '../services/api';
import { Cart } from '../types';
import { useToast } from '../context/ToastContext';
import { CartSkeleton } from '../components/Skeleton';

const CartPage: React.FC = () => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const fetchCart = async () => {
    try {
      const res = await cartAPI.get();
      setCart(res.data.data);
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [navigate]);

  const handleQuantityChange = async (itemId: string, newQty: number) => {
    if (newQty < 1) return;
    try {
      const res = await cartAPI.update(itemId, newQty);
      setCart(res.data.data);
    } catch {
      showToast('Failed to update quantity', 'error');
    }
  };

  const handleRemove = async (itemId: string) => {
    try {
      const res = await cartAPI.remove(itemId);
      setCart(res.data.data);
      showToast('Item removed from cart', 'info');
    } catch {
      showToast('Failed to remove item', 'error');
    }
  };

  if (loading) return <CartSkeleton />;

  if (!cart || cart.items.length === 0) {
    return (
      <div className="empty-state">
        <div style={{ fontSize: 72, marginBottom: 16 }}>{'\u{1F6D2}'}</div>
        <h2>Your Cart is Empty</h2>
        <p>Looks like you haven't added any items yet.</p>
        <Link to="/products" className="hero-cta" style={{ textDecoration: 'none', display: 'inline-block' }}>
          Continue Shopping
        </Link>
      </div>
    );
  }

  const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 50 ? 0 : 9.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  return (
    <div className="cart-page">
      <div className="cart-items">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 22 }}>
            Shopping Cart ({cart.totalItems} {cart.totalItems === 1 ? 'item' : 'items'})
          </h2>
          <span style={{ fontSize: 13, color: '#565959' }}>Price</span>
        </div>

        {cart.items.map((item) => (
          <div key={item._id} className="cart-item">
            <Link to={`/products/${typeof item.product === 'string' ? item.product : item.product._id}`}>
              <img src={item.image} alt={item.name} />
            </Link>
            <div className="cart-item-info">
              <Link to={`/products/${typeof item.product === 'string' ? item.product : item.product._id}`}
                style={{ color: '#007185', fontWeight: 500 }}>
                {item.name}
              </Link>
              <div style={{ fontSize: 13, color: '#565959', margin: '4px 0' }}>
                In Stock
              </div>
              <div className="cart-item-qty-row">
                <div className="cart-item-qty">
                  <button onClick={() => handleQuantityChange(item._id!, item.quantity - 1)} disabled={item.quantity <= 1}>
                    {'\u2212'}
                  </button>
                  <span>{item.quantity}</span>
                  <button onClick={() => handleQuantityChange(item._id!, item.quantity + 1)}>
                    +
                  </button>
                </div>
                <button className="cart-item-delete" onClick={() => handleRemove(item._id!)}>
                  {'\u2717'} Delete
                </button>
              </div>
            </div>
            <div className="cart-item-subtotal">
              ${(item.price * item.quantity).toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      <div className="order-summary">
        <h2>Order Summary</h2>
        <div className="summary-row">
          <span>Items ({cart.totalItems})</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="summary-row">
          <span>Shipping</span>
          <span style={{ color: shipping === 0 ? '#067d62' : 'inherit', fontWeight: shipping === 0 ? 600 : 400 }}>
            {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
          </span>
        </div>
        <div className="summary-row">
          <span>Estimated Tax</span>
          <span>${tax.toFixed(2)}</span>
        </div>
        {subtotal < 50 && subtotal > 0 && (
          <div style={{ fontSize: 12, color: '#b12704', marginTop: -8, marginBottom: 8 }}>
            Add ${(50 - subtotal).toFixed(2)} more for FREE shipping!
          </div>
        )}
        <div className="summary-row total">
          <span>Order Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
        <button className="checkout-btn" onClick={() => {
          const stored = localStorage.getItem('user');
          if (!stored) { navigate('/login?redirect=%2Fcheckout'); return; }
          navigate('/checkout');
        }}>
          Proceed to Checkout
        </button>
        <Link to="/products" style={{ display: 'block', textAlign: 'center', marginTop: 12, fontSize: 13, color: '#007185' }}>
          Continue Shopping
        </Link>
      </div>
    </div>
  );
};

export default CartPage;
