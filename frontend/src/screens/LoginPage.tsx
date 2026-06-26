import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../services/api';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authAPI.login({ email, password });
      localStorage.setItem('user', JSON.stringify(res.data.data));
      navigate(redirect);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Login failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-box">
        <h1>Sign In</h1>
        {error && (
          <div style={{ color: '#b12704', marginBottom: 16, fontSize: 14, textAlign: 'center' }}>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          <button type="button" className="guest-btn" onClick={() => navigate('/')} style={{ width: '100%', padding: '10px 0', marginTop: 8, background: 'transparent', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, cursor: 'pointer', color: '#555' }}>
            Continue as Guest
          </button>
        </form>
        <div className="auth-link">
          New here? <Link to="/register">Create your account</Link>
        </div>
        <div style={{ marginTop: 16, padding: 12, background: '#f8f8f8', borderRadius: 8, fontSize: 13, color: '#565959' }}>
          <strong>Demo accounts:</strong><br />
          Admin: admin@shop.com / admin123<br />
          User: user@shop.com / user123
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
