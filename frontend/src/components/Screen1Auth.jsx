import React, { useState } from 'react';

const API_BASE_URL = 'http://localhost:5000/api/auth';

export default function Screen1Auth({ onAuthSuccess, onNavigateToScreen }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('jane.doe@enterprise.com');
  const [password, setPassword] = useState('password123');
  const [name, setName] = useState('Jane Doe');
  const [signupRole, setSignupRole] = useState('trainee');
  const [qualification, setQualification] = useState('');
  const [skills, setSkills] = useState('');
  const [subjects, setSubjects] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [authData, setAuthData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setAuthData(null);

    try {
      const endpoint = isLogin ? `${API_BASE_URL}/login` : `${API_BASE_URL}/signup`;
      const payload = isLogin
        ? { email, password }
        : { name, email, password, role: signupRole, qualification, skills, subjects };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || `HTTP ${response.status}: Request failed`);
      }

      setAuthData(data);
      if (onAuthSuccess) {
        onAuthSuccess(data);
      }
    } catch (err) {
      setError(err.message || 'Failed to communicate with authentication API');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (userEmail, userRole) => {
    setEmail(userEmail);
    setPassword(userRole === 'admin' ? 'admin123' : userRole === 'trainer' ? 'trainer123' : 'password123');
    setIsLogin(true);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      {/* Header Badge */}
      <div className="text-center mb-6">
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-900">
          Topic 1 • Screen 1 (Auth)
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
          {isLogin ? 'Sign In to Capacity Connect' : 'Create Enterprise Account'}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Connected to Express: <code className="bg-slate-200 px-1 py-0.5 rounded">POST /api/auth/{isLogin ? 'login' : 'signup'}</code>
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        {/* Tab switch */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-6 text-xs font-bold">
          <button
            type="button"
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 rounded-lg transition ${
              isLogin ? 'bg-white text-blue-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 rounded-lg transition ${
              !isLogin ? 'bg-white text-blue-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Quick Credentials Pills */}
        <div className="mb-6 p-3 bg-slate-50 rounded-xl border border-slate-100">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Quick Fill Test Accounts:
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('jane.doe@enterprise.com', 'trainee')}
              className="px-2.5 py-1 text-xs font-semibold bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 transition"
            >
              👤 Jane Doe (Trainee)
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('elena.rostova@enterprise.com', 'trainer')}
              className="px-2.5 py-1 text-xs font-semibold bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 transition"
            >
              🎓 Elena Rostova (Trainer)
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@capacityconnect.io', 'admin')}
              className="px-2.5 py-1 text-xs font-semibold bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-purple-800 transition"
            >
              🛡️ Alex Rivera (Admin)
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jane Doe"
                className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. jane.doe@enterprise.com"
              className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          {!isLogin && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sign up as</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSignupRole('trainee')}
                    className={`flex-1 py-2 rounded-lg border-2 text-xs font-bold transition ${
                      signupRole === 'trainee' ? 'border-blue-900 bg-blue-50 text-blue-900' : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Trainee
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignupRole('trainer')}
                    className={`flex-1 py-2 rounded-lg border-2 text-xs font-bold transition ${
                      signupRole === 'trainer' ? 'border-blue-900 bg-blue-50 text-blue-900' : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Trainer
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Admin accounts cannot be self-registered.</p>
              </div>

              {signupRole === 'trainee' && (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Qualification (optional)"
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                  <input
                    type="text"
                    placeholder="Skills (comma separated)"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>
              )}

              {signupRole === 'trainer' && (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Subjects / Skills you can teach"
                    value={subjects}
                    onChange={(e) => setSubjects(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              ✕ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-blue-900 hover:bg-blue-950 text-white text-sm font-bold shadow-md transition disabled:bg-slate-300"
          >
            {loading ? 'Submitting...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Success Output */}
        {authData && (
          <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
            {authData.status === 'pending' ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                <p className="font-bold flex items-center gap-1.5 text-sm">
                  <span>⏳</span>
                  <span>{authData.message || 'Your account is awaiting admin approval.'}</span>
                </p>
                <p className="mt-2 text-[11px] text-slate-600">
                  You will be able to log in once an admin approves your account.
                </p>
              </div>
            ) : (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
                <p className="font-bold flex items-center gap-1.5 text-sm">
                  <span>✓</span>
                  <span>{authData.message || 'Authentication Successful!'}</span>
                </p>
                <div className="mt-2 space-y-1 font-mono text-[11px]">
                  <p><strong>User:</strong> {authData.user?.name} ({authData.user?.role})</p>
                  <p><strong>Email:</strong> {authData.user?.email}</p>
                  <p className="truncate"><strong>Token:</strong> {authData.token}</p>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onNavigateToScreen && onNavigateToScreen(2)}
                className="flex-1 py-2 text-center rounded-lg bg-blue-900 text-white text-xs font-bold shadow-sm"
              >
                Go to Dashboard →
              </button>
              {authData.user?.role === 'admin' && (
                <button
                  type="button"
                  onClick={() => onNavigateToScreen && onNavigateToScreen(7)}
                  className="flex-1 py-2 text-center rounded-lg bg-purple-900 text-white text-xs font-bold shadow-sm"
                >
                  Admin Suite →
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
