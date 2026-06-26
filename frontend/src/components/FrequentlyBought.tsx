import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from '../types';
import { cartAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

interface Props {
  product: Product;
  relatedProducts: Product[];
}

const FrequentlyBought: React.FC<Props> = ({ product, relatedProducts }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [selected, setSelected] = React.useState<string[]>([product._id]);

  const available = relatedProducts.slice(0, 3);
  const allItems = [product, ...available];

  const toggleItem = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const totalPrice = allItems
    .filter((i) => selected.includes(i._id))
    .reduce((sum, i) => sum + i.price, 0);

  const originalPrice = allItems
    .filter((i) => selected.includes(i._id))
    .reduce((sum, i) => sum + (i.comparePrice || i.price), 0);

  const savings = originalPrice - totalPrice;

  const handleAddAll = async () => {
    const stored = localStorage.getItem('user');
    if (!stored) { navigate('/login'); return; }
    try {
      for (const id of selected) {
        await cartAPI.add(id, 1);
      }
      showToast('Items added to cart!', 'success');
    } catch {
      showToast('Failed to add items', 'error');
    }
  };

  if (!available.length) return null;

  return (
    <div className="fbt-section">
      <h2 className="fbt-title">Frequently bought together</h2>
      <div className="fbt-content">
        <div className="fbt-items">
          {allItems.map((item, idx) => (
            <React.Fragment key={item._id}>
              {idx > 0 && <div className="fbt-plus">+</div>}
              <div className={`fbt-item ${selected.includes(item._id) ? 'selected' : ''}`}
                onClick={() => toggleItem(item._id)}>
                <div className="fbt-check">
                  <div className={`fbt-checkbox ${selected.includes(item._id) ? 'checked' : ''}`}>
                    {selected.includes(item._id) ? '\u2713' : ''}
                  </div>
                </div>
                <img src={item.images[0]} alt={item.name} onClick={(e) => { e.stopPropagation(); navigate(`/products/${item._id}`); }} />
                <div className="fbt-item-info">
                  <div className="fbt-item-name">{item.name}</div>
                  <div className="fbt-item-price">${item.price.toFixed(2)}</div>
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
        <div className="fbt-total">
          <div className="fbt-total-price">${totalPrice.toFixed(2)}</div>
          {savings > 0 && (
            <div className="fbt-savings">Save ${savings.toFixed(2)}</div>
          )}
          <button className="fbt-add-btn" onClick={handleAddAll}
            disabled={selected.length <= 1}>
            Add {selected.length > 1 ? `all ${selected.length}` : ''} to cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default FrequentlyBought;
