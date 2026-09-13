import React, { useState } from 'react';

const API_BASE_URL = 'http://localhost:5000/api';

export default function Screen1Auth({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'trainee',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [authData, setAuthData] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setAuthData(null);

    if (!formData.email || !formData.password) {
      setLoginError('Email and password are required.');
      return;
    }

    setSubmitting(true);
    try {
      const endpoint = mode === 'register' ? 'signup' : 'login';
      const response = await fetch(`${API_BASE_URL}/auth/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.fullName,
          role: formData.role,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        if (mode === 'register' && response.status === 403) {
          setAuthData({ status: 'pending', message: errJson.message || 'Your account is awaiting admin approval.' });
          setSubmitting(false);
          return;
        }
        throw new Error(errJson.message || `HTTP ${response.status}: Authentication failed`);
      }

      const data = await response.json();
      const userSession = data.user || data.session || { email: formData.email, role: formData.role || 'trainee', name: formData.fullName };
      onLogin && onLogin(userSession);
    } catch (err) {
      setLoginError(err.message || 'Error connecting to auth service');
      if (mode === 'login') {
        setAuthData({
          status: 'demo',
          message: 'API unavailable — demo mode',
          user: { email: formData.email, role: formData.role || 'trainee', name: formData.fullName || 'Demo User' }
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoLogin = (email, password, role) => {
    setFormData({ email, password, fullName: role === 'trainee' ? 'Jane Doe' : role === 'trainer' ? 'Elena Rostova' : 'Admin User', role });
    setMode('login');
    setAuthData(null);
  };

  return (
    <div className="public-layout meadow-bg-login">
      <div className="bg-scrim"></div>
      <nav className="public-nav">
        <div className="flex items-center gap-2">
          <div className="brand-icon">CC</div>
          <span className="brand-text">Capacity Connect</span>
        </div>
        <div>
          <button onClick={onLogin} className="btn btn-ghost btn-sm">← Back to Home</button>
        </div>
      </nav>
      <div className="public-content">
        <div className="auth-card">
          <div className="auth-logo">🌿</div>
          <h1 className="auth-title">
            {mode === 'register' ? 'Create Your Account' : 'Welcome Back'}
          </h1>
          <p className="auth-subtitle">
            {mode === 'register'
              ? 'Join Capacity Connect and start your learning journey'
              : 'Sign in to access your dashboard and courses'}
          </p>

          {loginError && (
            <div className="alert alert-error mb-4">
              <span>{loginError}</span>
            </div>
          )}

          {authData?.status === 'pending' && (
            <div className="alert alert-warning mb-4">
              <span>⏳ {authData.message || 'Your account is awaiting admin approval.'}</span>
            </div>
          )}

          {authData?.status === 'demo' && (
            <div className="alert alert-warning mb-4">
              <span>🎮 {authData.message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Jane Doe"
                  required
                  className="form-input"
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="you@example.com"
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="form-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="btn-icon absolute right-2 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label">Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="trainee">Trainee</option>
                  <option value="trainer">Trainer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            )}

            <div className="form-row">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="form-checkbox"
                />
                <span className="text-secondary">Remember me</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary w-full"
            >
              {submitting ? 'Submitting...' : mode === 'register' ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="auth-divider">
            <span>or try a demo</span>
          </div>

          <div className="demo-buttons">
            <button
              type="button"
              onClick={() => handleDemoLogin('jane.doe@enterprise.com', 'password123', 'trainee')}
              className="demo-btn"
            >
              🎓 Trainee Demo
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('elena.rostova@enterprise.com', 'trainer123', 'trainer')}
              className="demo-btn"
            >
              👩‍🏫 Trainer Demo
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('admin@capacityconnect.io', 'admin123', 'admin')}
              className="demo-btn"
            >
              🛡️ Admin Demo
            </button>
          </div>

          <div className="auth-footer">
            <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setLoginError(''); setAuthData(null); }}>
              {mode === 'login' ? "Don't have an account? Create Account →" : 'Already have an account? Sign In →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
