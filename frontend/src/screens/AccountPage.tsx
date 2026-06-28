import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI, orderAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

interface SavedAddress {
  id: string;
  label: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
}

const STORAGE_KEY = 'savedAddresses';

const AccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', email: '' });
  const [saved, setSaved] = useState(false);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [editAddrId, setEditAddrId] = useState<string | null>(null);
  const [addrForm, setAddrForm] = useState({ street: '', city: '', state: '', zip: '', phone: '' });

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) { navigate('/login'); return; }
    fetchData();
    try { setAddresses(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')); } catch { /* ignore */ }
  }, [navigate]);

  const fetchData = async () => {
    try {
      const [profileRes, orderRes] = await Promise.all([
        authAPI.getProfile(),
        orderAPI.getMine(),
      ]);
      const u = profileRes.data.data;
      setUser(u);
      setForm({ name: u.name, email: u.email });
      setOrders(orderRes.data.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authAPI.updateProfile(form);
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...stored, name: form.name }));
      setUser({ ...user, name: form.name });
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 3000);
      showToast('Profile updated!', 'success');
    } catch { showToast('Failed to update profile', 'error'); }
  };

  const saveAddresses = (addrs: SavedAddress[]) => {
    setAddresses(addrs);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(addrs));
  };

  const handleSaveAddress = () => {
    if (!addrForm.street || !addrForm.city || !addrForm.state || !addrForm.zip || !addrForm.phone) {
      showToast('Please fill in all address fields', 'warning');
      return;
    }
    let updated: SavedAddress[];
    if (editAddrId) {
      updated = addresses.map((a) => a.id === editAddrId ? { ...a, ...addrForm } : a);
      showToast('Address updated!', 'success');
    } else {
      const id = 'addr_' + Date.now();
      updated = [...addresses, { id, label: `${addrForm.city}, ${addrForm.state}`, country: 'US', ...addrForm }];
      showToast('Address added!', 'success');
    }
    saveAddresses(updated);
    setShowAddrForm(false);
    setEditAddrId(null);
    setAddrForm({ street: '', city: '', state: '', zip: '', phone: '' });
  };

  const handleDeleteAddress = (id: string) => {
    saveAddresses(addresses.filter((a) => a.id !== id));
    showToast('Address removed', 'info');
  };

  const startEditAddress = (addr: SavedAddress) => {
    setEditAddrId(addr.id);
    setAddrForm({ street: addr.street, city: addr.city, state: addr.state, zip: addr.zip, phone: addr.phone });
    setShowAddrForm(true);
  };

  if (loading) return <div className="spinner" />;
  if (!user) return null;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>My Account</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Profile */}
        <div style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18 }}>Profile</h2>
            <button onClick={() => setEditing(!editing)}
              style={{ padding: '6px 14px', border: '1px solid var(--border)', borderRadius: 6, background: 'white', fontSize: 13, cursor: 'pointer' }}>
              {editing ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {saved && <div style={{ color: 'var(--success)', marginBottom: 12, fontSize: 14 }}>{'\u2713'} Profile updated!</div>}

          {editing ? (
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <button type="submit" className="submit-btn" style={{ marginTop: 8 }}>Save Changes</button>
            </form>
          ) : (
            <div>
              <div style={{ marginBottom: 8 }}><strong>Name:</strong> {user.name}</div>
              <div style={{ marginBottom: 8 }}><strong>Email:</strong> {user.email}</div>
              <div style={{ marginBottom: 8 }}><strong>Role:</strong> {user.role}</div>
              <div style={{ marginBottom: 8 }}><strong>Member since:</strong> {new Date(user.createdAt).toLocaleDateString()}</div>
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <h2 style={{ fontSize: 18, marginBottom: 16 }}>Quick Links</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Link to="/orders" style={{
              padding: '14px 20px', background: 'var(--tertiary-container)', borderRadius: 8,
              border: '1px solid var(--border)', color: 'var(--text)', fontWeight: 600, fontSize: 14, textDecoration: 'none',
            }}>
              {'\u{1F4E6}'} My Orders ({orders.length})
            </Link>
            <Link to="/wishlist" style={{
              padding: '14px 20px', background: 'var(--secondary-container)', borderRadius: 8,
              border: '1px solid var(--border)', color: 'var(--error)', fontWeight: 600, fontSize: 14, textDecoration: 'none',
            }}>
              {'\u2764'} My Wishlist
            </Link>
            <Link to="/cart" style={{
              padding: '14px 20px', background: 'var(--tertiary-container)', borderRadius: 8,
              border: '1px solid var(--border)', color: 'var(--tertiary)', fontWeight: 600, fontSize: 14, textDecoration: 'none',
            }}>
              {'\u{1F6D2}'} Shopping Cart
            </Link>
          </div>
        </div>
      </div>

      {/* Gift Card Wallet */}
      <div style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginTop: 24 }}>
        <h2 style={{ fontSize: 18, marginBottom: 16 }}>{'\u{1F3B1}'} Gift Card Balance</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--error)' }}>
              ${(() => { try { return Number(localStorage.getItem('walletBalance')) || 0; } catch { return 0; } })().toFixed(2)}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Available balance</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="number" id="walletAmount" placeholder="Amount" min="1" max="1000"
              style={{ width: 100, padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 14 }} />
            <button onClick={() => {
              const input = document.getElementById('walletAmount') as HTMLInputElement;
              const amt = parseFloat(input.value);
              if (isNaN(amt) || amt <= 0) { showToast('Enter a valid amount', 'warning'); return; }
              const current = Number(localStorage.getItem('walletBalance')) || 0;
              localStorage.setItem('walletBalance', String(current + amt));
              input.value = '';
              showToast(`$${amt.toFixed(2)} added to gift card balance!`, 'success');
              window.location.reload();
            }} className="btn-primary" style={{ padding: '10px 20px', flex: 0, maxWidth: 120 }}>Add Funds</button>
          </div>
        </div>
      </div>

      {/* Addresses */}
      <div style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18 }}>My Addresses</h2>
          <button onClick={() => { setShowAddrForm(!showAddrForm); setEditAddrId(null); setAddrForm({ street: '', city: '', state: '', zip: '', phone: '' }); }}
            style={{ padding: '6px 14px', background: 'var(--tertiary-dim)', color: 'white', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            + Add Address
          </button>
        </div>

        {showAddrForm && (
          <div style={{ background: 'var(--surface-container)', borderRadius: 8, padding: 20, marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, marginBottom: 12 }}>{editAddrId ? 'Edit Address' : 'New Address'}</h3>
            <div className="form-group">
              <label>Street Address</label>
              <input type="text" value={addrForm.street} onChange={(e) => setAddrForm({ ...addrForm, street: e.target.value })} placeholder="123 Main Street" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>City</label>
                <input type="text" value={addrForm.city} onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })} placeholder="New York" />
              </div>
              <div className="form-group">
                <label>State</label>
                <input type="text" value={addrForm.state} onChange={(e) => setAddrForm({ ...addrForm, state: e.target.value })} placeholder="NY" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>ZIP Code</label>
                <input type="text" value={addrForm.zip} onChange={(e) => setAddrForm({ ...addrForm, zip: e.target.value })} placeholder="10001" />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input type="tel" value={addrForm.phone} onChange={(e) => setAddrForm({ ...addrForm, phone: e.target.value })} placeholder="+1 (555) 000-0000" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="submit-btn" onClick={handleSaveAddress} style={{ maxWidth: 160 }}>
                {editAddrId ? 'Update' : 'Save Address'}
              </button>
              <button onClick={() => { setShowAddrForm(false); setEditAddrId(null); }}
                style={{ padding: '10px 20px', border: '1px solid var(--border)', borderRadius: 8, background: 'white', fontSize: 14, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {addresses.length === 0 && !showAddrForm ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 24 }}>No saved addresses. Add one for faster checkout!</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {addresses.map((addr) => (
              <div key={addr.id} style={{
                border: '1px solid var(--border)', borderRadius: 8, padding: 16, position: 'relative',
              }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{addr.label}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <div>{addr.street}</div>
                  <div>{addr.city}, {addr.state} {addr.zip}</div>
                  <div>{addr.phone}</div>
                </div>
                <div style={{ marginTop: 8, display: 'flex', gap: 12 }}>
                  <button onClick={() => startEditAddress(addr)}
                    style={{ background: 'none', border: 'none', color: 'var(--tertiary)', fontSize: 13, cursor: 'pointer', padding: 0 }}>
                    Edit
                  </button>
                  <button onClick={() => handleDeleteAddress(addr.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--error)', fontSize: 13, cursor: 'pointer', padding: 0 }}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Orders */}
      <div style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18 }}>Recent Orders</h2>
          {orders.length > 0 && <Link to="/orders" style={{ color: 'var(--tertiary)', fontSize: 13 }}>View all {'\u2192'}</Link>}
        </div>
        {orders.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 24 }}>No orders yet. <Link to="/products" style={{ color: 'var(--tertiary)' }}>Start shopping!</Link></p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {orders.slice(0, 3).map((order) => (
              <div key={order._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600 }}>#{order._id.slice(-8).toUpperCase()}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{new Date(order.createdAt).toLocaleDateString()} - {order.items?.length} items</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700 }}>${order.totalPrice?.toFixed(2)}</div>
                  <span style={{
                    fontSize: 12, padding: '2px 8px', borderRadius: 4,
                    background: order.isDelivered ? 'var(--success-light)' : order.isPaid ? 'var(--secondary-container)' : 'var(--error-light)',
                    color: order.isDelivered ? 'var(--success)' : order.isPaid ? 'var(--on-secondary-container)' : 'var(--error)',
                  }}>
                    {order.isDelivered ? 'Delivered' : order.isPaid ? 'Processing' : 'Pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountPage;
