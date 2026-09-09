'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const { showToast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', email: '' });
  const [saved, setSaved] = useState(false);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [walletBalance, setWalletBalance] = useState(() => {
    try { return Number(localStorage.getItem('walletBalance')) || 0; } catch { return 0; }
  });
  const [walletInput, setWalletInput] = useState('');
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [editAddrId, setEditAddrId] = useState<string | null>(null);
  const [addrForm, setAddrForm] = useState({ street: '', city: '', state: '', zip: '', phone: '' });

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) { router.push('/login'); return; }
    fetchData();
    try { setAddresses(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')); } catch { /* ignore */ }
  }, []);

  const fetchData = async () => {
    try {
      const [profileRes, orderRes] = await Promise.all([
        authAPI.getProfile(),
        orderAPI.getMine(),
      ]);
      const u = profileRes.data.data as Record<string, unknown>;
      setUser(u);
      setForm({ name: u.name as string, email: u.email as string });
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

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '60vh',
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid #e2e8f0',
        borderTopColor: '#6366f1',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }} />
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
  if (!user) return null;

  return (
    <div style={{
      maxWidth: '1100px',
      margin: '0 auto',
      padding: '40px 24px',
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Page Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        marginBottom: '40px',
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          fontSize: '22px',
          fontWeight: 700,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          boxShadow: '0 4px 16px rgba(99, 102, 241, 0.3)',
        }}>
          {getInitials(user.name || 'U')}
        </div>
        <div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 800,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            color: '#0f172a',
            margin: 0,
          }}>
            My Account
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#64748b',
            margin: '4px 0 0',
          }}>
            Manage your profile and preferences
          </p>
        </div>
      </div>

      {/* Two Column Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
      }}>
        {/* Left Column - Profile Card */}
        <div className="card" style={{
          padding: '28px',
          borderRadius: '12px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          background: '#ffffff',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: 700,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              color: '#0f172a',
              margin: 0,
            }}>
              Profile
            </h2>
            <button
              onClick={() => setEditing(!editing)}
              className="btn btn-ghost"
              style={{
                padding: '8px 16px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                background: '#ffffff',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                color: '#64748b',
                transition: 'all 0.2s',
              }}
            >
              {editing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          {saved && (
            <div style={{
              padding: '12px 16px',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              color: '#16a34a',
              fontSize: '13px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/>
              </svg>
              Profile updated successfully!
            </div>
          )}

          {!editing ? (
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '20px',
                background: '#f8fafc',
                borderRadius: '12px',
                marginBottom: '20px',
              }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: '18px',
                  fontWeight: 700,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}>
                  {getInitials(user.name || 'U')}
                </div>
                <div>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#0f172a',
                    marginBottom: '2px',
                  }}>
                    {user.name}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: '#64748b',
                  }}>
                    {user.email}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { label: 'Role', value: user.role },
                  { label: 'Member since', value: new Date(user.created_at || user.createdAt).toLocaleDateString() },
                ].map((item) => (
                  <div key={item.label} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '12px 0',
                    borderBottom: '1px solid #f1f5f9',
                  }}>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>{item.label}</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '6px',
                }}>
                  Name
                </label>
                <input
                  className="form-input"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: '#ffffff',
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label" style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '6px',
                }}>
                  Email
                </label>
                <input
                  className="form-input"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: '#ffffff',
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  padding: '10px 24px',
                  background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 8px rgba(99, 102, 241, 0.2)',
                }}
              >
                Save Changes
              </button>
            </form>
          )}
        </div>

        {/* Right Column - Quick Links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card" style={{
            padding: '28px',
            borderRadius: '12px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            background: '#ffffff',
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: 700,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              color: '#0f172a',
              margin: '0 0 20px',
            }}>
              Quick Links
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { href: '/orders', icon: '📦', label: 'My Orders', count: orders.length, color: '#6366f1' },
                { href: '/wishlist', icon: '❤️', label: 'My Wishlist', count: null, color: '#ef4444' },
                { href: '/cart', icon: '🛒', label: 'Shopping Cart', count: null, color: '#06b6d4' },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    padding: '16px 20px',
                    background: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px solid #f1f5f9',
                    color: '#0f172a',
                    fontWeight: 600,
                    fontSize: '14px',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.2s',
                  }}
                >
                  <span style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: `${link.color}10`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                  }}>
                    {link.icon}
                  </span>
                  <span style={{ flex: 1 }}>{link.label}</span>
                  {link.count !== null && (
                    <span className="badge" style={{
                      background: `${link.color}15`,
                      color: link.color,
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}>
                      {link.count}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Gift Card Wallet - Full Width */}
      <div className="card" style={{
        padding: '28px',
        borderRadius: '12px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        background: '#ffffff',
        marginTop: '24px',
      }}>
        <h2 style={{
          fontSize: '18px',
          fontWeight: 700,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          color: '#0f172a',
          margin: '0 0 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <span style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #f59e0b, #f97316)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
          }}>
            🎁
          </span>
          Gift Card Balance
        </h2>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          flexWrap: 'wrap',
        }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{
              fontSize: '36px',
              fontWeight: 800,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              ${walletBalance.toFixed(2)}
            </div>
            <div style={{
              fontSize: '13px',
              color: '#64748b',
              marginTop: '4px',
            }}>
              Available balance
            </div>
          </div>
          <div style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
          }}>
            <input
              className="form-input"
              type="number"
              placeholder="Amount"
              min="1"
              max="1000"
              value={walletInput}
              onChange={(e) => setWalletInput(e.target.value)}
              style={{
                width: '120px',
                padding: '12px 16px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                background: '#ffffff',
                color: '#0f172a',
                outline: 'none',
              }}
            />
            <button
              onClick={() => {
                const amt = parseFloat(walletInput);
                if (isNaN(amt) || amt <= 0) { showToast('Enter a valid amount', 'warning'); return; }
                const newBalance = walletBalance + amt;
                localStorage.setItem('walletBalance', String(newBalance));
                setWalletBalance(newBalance);
                setWalletInput('');
                showToast(`$${amt.toFixed(2)} added to gift card balance!`, 'success');
              }}
              className="btn btn-primary"
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(99, 102, 241, 0.2)',
                whiteSpace: 'nowrap',
              }}
            >
              Add Funds
            </button>
          </div>
        </div>
      </div>

      {/* Addresses - Full Width */}
      <div className="card" style={{
        padding: '28px',
        borderRadius: '12px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        background: '#ffffff',
        marginTop: '24px',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: 700,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            color: '#0f172a',
            margin: 0,
          }}>
            My Addresses
          </h2>
          <button
            onClick={() => {
              setShowAddrForm(!showAddrForm);
              setEditAddrId(null);
              setAddrForm({ street: '', city: '', state: '', zip: '', phone: '' });
            }}
            className="btn btn-secondary"
            style={{
              padding: '8px 16px',
              background: showAddrForm ? '#f1f5f9' : 'linear-gradient(135deg, #06b6d4, #0891b2)',
              color: showAddrForm ? '#64748b' : '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: showAddrForm ? 'none' : '0 2px 8px rgba(6, 182, 212, 0.2)',
            }}
          >
            {showAddrForm ? 'Cancel' : '+ Add Address'}
          </button>
        </div>

        {showAddrForm && (
          <div style={{
            background: '#f8fafc',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '20px',
            border: '1px solid #f1f5f9',
          }}>
            <h3 style={{
              fontSize: '15px',
              fontWeight: 600,
              color: '#0f172a',
              margin: '0 0 16px',
            }}>
              {editAddrId ? 'Edit Address' : 'New Address'}
            </h3>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label" style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '6px',
              }}>
                Street Address
              </label>
              <input
                className="form-input"
                type="text"
                value={addrForm.street}
                onChange={(e) => setAddrForm({ ...addrForm, street: e.target.value })}
                placeholder="123 Main Street"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: '#ffffff',
                  color: '#0f172a',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div className="form-group">
                <label className="form-label" style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '6px',
                }}>
                  City
                </label>
                <input
                  className="form-input"
                  type="text"
                  value={addrForm.city}
                  onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })}
                  placeholder="New York"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: '#ffffff',
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '6px',
                }}>
                  State
                </label>
                <input
                  className="form-input"
                  type="text"
                  value={addrForm.state}
                  onChange={(e) => setAddrForm({ ...addrForm, state: e.target.value })}
                  placeholder="NY"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: '#ffffff',
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div className="form-group">
                <label className="form-label" style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '6px',
                }}>
                  ZIP Code
                </label>
                <input
                  className="form-input"
                  type="text"
                  value={addrForm.zip}
                  onChange={(e) => setAddrForm({ ...addrForm, zip: e.target.value })}
                  placeholder="10001"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: '#ffffff',
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '6px',
                }}>
                  Phone
                </label>
                <input
                  className="form-input"
                  type="tel"
                  value={addrForm.phone}
                  onChange={(e) => setAddrForm({ ...addrForm, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: '#ffffff',
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleSaveAddress}
                className="btn btn-primary"
                style={{
                  padding: '10px 24px',
                  background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 8px rgba(99, 102, 241, 0.2)',
                }}
              >
                {editAddrId ? 'Update Address' : 'Save Address'}
              </button>
              <button
                onClick={() => { setShowAddrForm(false); setEditAddrId(null); }}
                className="btn btn-ghost"
                style={{
                  padding: '10px 24px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  background: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  color: '#64748b',
                  transition: 'all 0.2s',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {addresses.length === 0 && !showAddrForm ? (
          <div className="empty-state" style={{
            textAlign: 'center',
            padding: '48px 24px',
            background: '#f8fafc',
            borderRadius: '12px',
            border: '1px dashed #e2e8f0',
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: '28px',
            }}>
              📍
            </div>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 8px' }}>
              No saved addresses yet
            </p>
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>
              Add an address for faster checkout!
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px',
          }}>
            {addresses.map((addr) => (
              <div key={addr.id} style={{
                border: '1px solid #f1f5f9',
                borderRadius: '12px',
                padding: '20px',
                background: '#f8fafc',
                position: 'relative',
                transition: 'all 0.2s',
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '12px',
                }}>
                  <div style={{
                    padding: '4px 12px',
                    background: '#6366f115',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#6366f1',
                  }}>
                    {addr.label}
                  </div>
                </div>
                <div style={{
                  fontSize: '13px',
                  color: '#475569',
                  lineHeight: 1.6,
                  marginBottom: '16px',
                }}>
                  <div>{addr.street}</div>
                  <div>{addr.city}, {addr.state} {addr.zip}</div>
                  <div>{addr.phone}</div>
                </div>
                <div style={{
                  display: 'flex',
                  gap: '16px',
                  paddingTop: '12px',
                  borderTop: '1px solid #e2e8f0',
                }}>
                  <button
                    onClick={() => startEditAddress(addr)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#6366f1',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteAddress(addr.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Orders - Full Width */}
      <div className="card" style={{
        padding: '28px',
        borderRadius: '12px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        background: '#ffffff',
        marginTop: '24px',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: 700,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            color: '#0f172a',
            margin: 0,
          }}>
            Recent Orders
          </h2>
          {orders.length > 0 && (
            <Link href="/orders" style={{
              color: '#6366f1',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
            }}>
              View all →
            </Link>
          )}
        </div>

        {orders.length === 0 ? (
          <div className="empty-state" style={{
            textAlign: 'center',
            padding: '48px 24px',
            background: '#f8fafc',
            borderRadius: '12px',
            border: '1px dashed #e2e8f0',
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: '28px',
            }}>
              📦
            </div>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 8px' }}>
              No orders yet
            </p>
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 16px' }}>
              Start shopping to see your orders here!
            </p>
            <Link
              href="/products"
              className="btn btn-primary"
              style={{
                display: 'inline-block',
                padding: '10px 24px',
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                color: '#ffffff',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'all 0.2s',
              }}
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {orders.slice(0, 3).map((order) => (
              <div key={order._id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                background: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #f1f5f9',
                transition: 'all 0.2s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    background: order.isDelivered ? '#10b98115' : order.isPaid ? '#6366f115' : '#f59e0b15',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                  }}>
                    {order.isDelivered ? '✓' : order.isPaid ? '💳' : '⏳'}
                  </div>
                  <div>
                    <div style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#0f172a',
                      marginBottom: '2px',
                    }}>
                      #{order._id?.slice(-8).toUpperCase() ?? 'N/A'}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#64748b',
                    }}>
                      {new Date(order.createdAt).toLocaleDateString()} · {order.items?.length} items
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontWeight: 700,
                    fontSize: '15px',
                    color: '#0f172a',
                    marginBottom: '4px',
                  }}>
                    ${order.totalPrice?.toFixed(2) ?? '0.00'}
                  </div>
                  <span
                    className={`badge ${order.isDelivered ? 'badge-success' : order.isPaid ? 'badge-warning' : 'badge-error'}`}
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: '20px',
                    }}
                  >
                    {order.isDelivered ? 'Delivered' : order.isPaid ? 'Processing' : 'Pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AccountPage;
