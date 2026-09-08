import React, { useState, useMemo } from 'react';
import './index.css';

const API_BASE_URL = 'http://localhost:5000/api';

function Starfield({ count = 50 }) {
  return useMemo(() => {
    const stars = [];
    for (let i = 0; i < count; i++) {
      const size = Math.random() * 2 + 1;
      const left = Math.random() * 100;
      const top = Math.random() * 100;
      const delay = Math.random() * 3;
      const dur = 2.5 + Math.random() * 2.5;
      stars.push(
        <div
          key={i}
          className="star"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            left: `${left}%`,
            top: `${top}%`,
            opacity: Math.random() * 0.6 + 0.4,
            animationDelay: `${delay}s`,
            animationDuration: `${dur}s`,
          }}
        />
      );
    }
    return stars;
  }, [count]);
}

export default function Screen1Auth({ onLogin, switchMode = 'login' }) {
  const [mode, setMode] = useState(switchMode === 'register' ? 'register' : 'login');

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');

    if (!formData.email || !formData.password) {
      setLoginError('Email and password are required.');
      return;
    }

    setSubmitting(true);
    try {
      const endpoint = mode === 'register' ? 'register' : 'login';
      const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          role: formData.role,
          rememberMe,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.message || `HTTP ${response.status}: Authentication failed`);
      }

      const data = await response.json();
      const userSession = data.user || data.session || { email: formData.email, role: formData.role || 'trainee' };
      onLogin && onLogin(userSession);
    } catch (err) {
      setLoginError(err.message || 'Error connecting to auth service on port 5000');
      if (mode === 'login') {
        setTimeout(() => {
          onLogin && onLogin({ email: formData.email, role: 'trainee', name: formData.fullName || 'Astro Trainee' });
        }, 1500);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="theme-auth relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-orbital-bg">
        <Starfield count={60} />
        <div className="nebula-drift" style={{ width: '480px', height: '480px', background: 'radial-gradient(circle at 30% 30%, rgba(138,81,242,0.22) 0%, transparent 50%)', top: '10%', left: '5%', animationDelay: '-5s' }}></div>
        <div className="nebula-drift" style={{ width: '380px', height: '380px', background: 'radial-gradient(circle at 80% 20%, rgba(96,165,250,0.16) 0%, transparent 50%)', top: '5%', right: '5%', animationDelay: '-8s' }}></div>
        <div className="nebula-drift" style={{ width: '320px', height: '320px', background: 'radial-gradient(circle at 50% 80%, rgba(138,81,242,0.18) 0%, transparent 50%)', bottom: '15%', left: '20%', animationDelay: '-11s' }}></div>
        <div className="nebula-drift" style={{ width: '240px', height: '240px', background: 'radial-gradient(circle at 90% 70%, rgba(252,210,220,0.10) 0%, transparent 55%)', bottom: '10%', right: '15%', animationDelay: '-9s' }}></div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen py-12 fade-in">
        <div className="w-full max-w-md mx-4">
          <div className="glass-card border border-indigo-500/30 hud-panel cosmic-card rounded-2xl p-8">
            {/* Logo / Header */}
            <div className="text-center mb-8">
              <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-xl shadow-indigo-500/30 mb-3">
                <span className="text-2xl">✦</span>
              </div>
              <h1 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300">
                {mode === 'register' ? 'Create Your Account' : 'Welcome, Astro Explorer'}
              </h1>
              <p className="text-xs text-space-400 mt-1.5">
                {mode === 'register'
                  ? 'Join Cosmiverse Academy and begin your journey'
                  : 'Sign in to access your missions and training'}
              </p>
            </div>

            {/* Login Error */}
            {loginError && (
              <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-center">
                <p className="text-xs text-red-300 font-black">
                  {loginError}
                </p>
                {mode === 'login' && (
                  <p className="text-[10px] text-red-400 mt-1">
                    Using demo login (API unavailable) — proceeding in 2s
                  </p>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name (Register only) */}
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-black uppercase text-space-300 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Jane Astro"
                    required
                    className="w-full px-3 py-2.5 bg-slate-900/50 border border-indigo-500/20 rounded-lg text-sm text-white placeholder-space-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  />
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-xs font-black uppercase text-space-300 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="you@cosmic.edu"
                  required
                  className="w-full px-3 py-2.5 bg-slate-900/50 border border-indigo-500/20 rounded-lg text-sm text-white placeholder-space-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-black uppercase text-space-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    className="w-full px-3 py-2.5 pr-10 bg-slate-900/50 border border-indigo-500/20 rounded-lg text-sm text-white placeholder-space-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-space-400 hover:text-space-200"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* Role Selector (Register only) */}
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-black uppercase text-space-300 mb-1.5">
                    Role
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 bg-slate-900/50 border border-indigo-500/20 rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  >
                    <option value="trainee">Trainee</option>
                    <option value="trainer">Trainer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              )}

              {/* Remember Me + Submit */}
              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 text-xs text-space-300 hover:text-indigo-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-500 focus:ring-indigo-500"
                  />
                  Remember me
                </label>

                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-5 py-2.5 rounded-xl text-xs font-black transition btn-micro flex items-center justify-center gap-2 ${
                    submitting
                      ? 'bg-slate-800 text-slate-400 cursor-not-allowed animate-pulse'
                      : 'bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 hover:from-indigo-400 hover:via-purple-500 hover:to-pink-500 text-white shadow-lg shadow-indigo-500/30'
                  }`}
                >
                  {submitting ? (
                    <>
                      <span>Sending...</span>
                      <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                    </>
                  ) : mode === 'register' ? (
                    'Create Account'
                  ) : (
                    'Launch Mission →'
                  )}
                </button>
              </div>
            </form>

            {/* Switch Mode */}
            <div className="mt-6 text-center border-t border-indigo-500/20 pt-4">
              <button
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login');
                  setLoginError('');
                }}
                className="text-xs text-indigo-300 hover:text-indigo-200 font-black hover:underline transition"
              >
                {mode === 'login'
                  ? "Don't have an account? Register →"
                  : 'Already have an account? Sign in →'}
              </button>
            </div>

            {/* API Status */}
            <div className="mt-4 text-center">
              <span className="text-[10px] text-space-500 font-mono">
                Endpoint: {API_BASE_URL}/{mode === 'register' ? 'register' : 'login'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
