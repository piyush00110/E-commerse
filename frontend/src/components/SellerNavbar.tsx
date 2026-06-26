import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface User { name: string; token: string; role?: string; }

const SellerNavbar: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  return (
    <nav style={{ background: '#1a472a', color: 'white', position: 'sticky', top: 0, zIndex: 1000 }}>
      <div className="seller-nav-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 1440, margin: '0 auto', padding: '12px 24px' }}>
        <div className="seller-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Link to="/" style={{ fontSize: 20, fontWeight: 700, color: '#ff9900', whiteSpace: 'nowrap', textDecoration: 'none' }}>
            Shop<span style={{ color: '#ccc', fontWeight: 300 }}>Smart</span>
            <span style={{ fontSize: 11, color: '#90ee90', marginLeft: 8, fontWeight: 400 }}>SELLER</span>
          </Link>
          <Link to="/seller" style={{ color: '#ddd', fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>Dashboard</Link>
          <Link to="/seller/products" style={{ color: '#ddd', fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>Products</Link>
          <Link to="/seller/orders" style={{ color: '#ddd', fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>Orders</Link>
          <Link to="/manage" style={{ color: '#ffd700', fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>{'\u2699'} Manage</Link>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => navigate('/')}
            style={{ padding: '6px 14px', background: 'white', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#1a472a', whiteSpace: 'nowrap' }}>
            {'\u2190'} Buyer Mode
          </button>
          <span style={{ fontSize: 13, color: '#ccc' }} className="seller-user-name">{user?.name || 'Seller'}</span>
        </div>
      </div>
    </nav>
  );
};

export default SellerNavbar;
