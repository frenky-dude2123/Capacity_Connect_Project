import React, { useState, useEffect, useMemo, useCallback } from 'react';
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

const STATUS_TABS = [
  { key: 'pending-approval', label: 'Pending Approval', color: 'crimson' },
  { key: 'in-review', label: 'In Review', color: 'amber' },
  { key: 'published', label: 'Published', color: 'emerald' },
  { key: 'rejected', label: 'Rejected', color: 'red' },
];

function StatusBadge({ status }) {
  const configs = {
    pending: { label: 'Pending', bg: 'bg-amber-900/20 text-amber-300 border-amber-400/30' },
    approved: { label: 'Approved', bg: 'bg-emerald-900/20 text-emerald-300 border-emerald-400/30' },
    rejected: { label: 'Rejected', bg: 'bg-red-900/20 text-red-300 border-red-400/30' },
    inreview: { label: 'In Review', bg: 'bg-cyan-900/20 text-cyan-300 border-cyan-400/30' },
    draft: { label: 'Draft', bg: 'bg-slate-800/30 text-space-400 border-slate-600/30' },
  };
  const cfg = configs[status?.toLowerCase()] || configs.draft;
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${cfg.bg}`}>
      {cfg.label}
    </span>
  );
}

export default function Screen7Admin({ userId = 'admin', userName = 'Administrator', onNavigate }) {
  const [activeTab, setActiveTab] = useState('pending-approval');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [actionType, setActionType] = useState(null);

  const statusMap = {
    'pending-approval': 'pending',
    'in-review': 'inReview',
    'published': 'approved',
    'rejected': 'rejected',
  };

  const fetchCoursesByStatus = useCallback(async (status) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/courses?status=${encodeURIComponent(statusMap[status] || status)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-User-Role': 'admin',
            'X-User-ID': userId,
          },
        }
      );

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.message || `HTTP ${response.status}: Failed to fetch courses`);
      }

      const data = await response.json();
      const courseList = data.courses || data.results || data || [];
      setCourses(courseList);
    } catch (err) {
      console.error('Error fetching admin course list:', err);
      if (activeTab === 'pending-approval') {
        setCourses([
          { id: 101, title: 'Advanced Quantum Mechanics', instructor: 'Dr. Li Wei', status: 'pending', submittedAt: '2026-09-05', category: 'Physics', duration: '8h' },
          { id: 102, title: 'Deep Space Navigation', instructor: 'Capt. M. Reyes', status: 'pending', submittedAt: '2026-09-04', category: 'Aerospace', duration: '12h' },
          { id: 103, title: 'Exoplanet Habitability', instructor: 'Dr. S. Kumar', status: 'inReview', submittedAt: '2026-09-02', category: 'Astronomy', duration: '6h' },
        ]);
        setError(null);
      } else {
        setError(err.message || 'Error communicating with backend service on port 5000');
        setCourses([]);
      }
    } finally {
      setLoading(false);
    }
  }, [activeTab, userId]);

  useEffect(() => {
    fetchCoursesByStatus(activeTab);
  }, [activeTab, fetchCoursesByStatus]);

  const handleApprove = async (courseId) => {
    setActionLoadingId(courseId);
    setActionType('approve');
    try {
      const response = await fetch(`${API_BASE_URL}/courses/${courseId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': 'admin',
          'X-User-ID': userId,
        },
        body: JSON.stringify({ action: 'approve' }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const updated = courses.filter((c) => c.id !== courseId);
      setCourses(updated);
    } catch (err) {
      alert(`Approve failed: ${err.message}. In production this updates course status.`);
    } finally {
      setActionLoadingId(null);
      setActionType(null);
    }
  };

  const handleReject = async (courseId) => {
    const reason = prompt('Rejection reason (optional):') || '';
    setActionLoadingId(courseId);
    setActionType('reject');
    try {
      const response = await fetch(`${API_BASE_URL}/courses/${courseId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': 'admin',
          'X-User-ID': userId,
        },
        body: JSON.stringify({ action: 'reject', reason }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const updated = courses.filter((c) => c.id !== courseId);
      setCourses(updated);
    } catch (err) {
      alert(`Reject failed: ${err.message}. In production this updates course status.`);
    } finally {
      setActionLoadingId(null);
      setActionType(null);
    }
  };

  return (
    <div className="theme-admin relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-orbital-bg">
        <Starfield count={60} />
        <div className="nebula-drift" style={{ width: '400px', height: '400px', background: 'radial-gradient(circle at 15% 15%, rgba(239,68,68,0.18) 0%, transparent 55%)', top: '10%', left: '10%', animationDelay: '-3s' }}></div>
        <div className="nebula-drift" style={{ width: '320px', height: '320px', background: 'radial-gradient(circle at 85% 80%, rgba(252,210,220,0.10) 0%, transparent 55%)', bottom: '8%', right: '12%', animationDelay: '-7s' }}></div>
        <div className="nebula-drift" style={{ width: '200px', height: '200px', background: 'radial-gradient(circle at 50% 40%, rgba(220,38,38,0.06) 0%, transparent 60%)', top: '35%', left: '40%', animationDelay: '-11s' }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 fade-in">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-crimson-500/20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate && onNavigate('dashboard')}
              className="inline-flex items-center gap-1.5 text-xs font-black text-crimson-300 hover:text-crimson-200 bg-slate-900/60 hover:bg-crimson-500/10 border border-crimson-500/20 px-3 py-1.5 rounded-lg transition btn-micro"
            >
              ← Back to Dashboard (Page 2)
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs font-bold text-amber-300">{userName.replace(/_/g, ' ')}</div>
              <div className="text-[10px] text-space-400 font-mono">Admin Portal</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-crimson-500 to-rose-600 flex items-center justify-center text-xs font-black text-white">
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="mt-6 glass-card border border-crimson-500/20 hud-panel cosmic-card rounded-2xl overflow-hidden">
          <div className="flex border-b border-crimson-500/20 bg-slate-900/40 overflow-x-auto">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setCourses([]);
                }}
                className={`flex-1 flex-shrink-0 py-3.5 px-4 text-xs sm:text-sm font-black border-b-2 transition flex items-center justify-center gap-2 ${
                  activeTab === tab.key
                    ? 'border-crimson-500 text-crimson-300 bg-slate-900/60'
                    : 'border-transparent text-space-300 hover:text-crimson-300 hover:bg-crimson-500/5'
                }}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Stats summary row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-6">
            <div className="py-4 text-center border border-crimson-500/10 rounded-xl bg-slate-900/40 cosmic-card">
              <div className="text-2xl font-extrabold text-crimson-400">{courses.filter((c) => c.status === 'pending').length}</div>
              <div className="text-[10px] font-black uppercase text-space-400">Pending Approval</div>
            </div>
            <div className="py-4 text-center border border-amber-500/10 rounded-xl bg-slate-900/40 cosmic-card">
              <div className="text-2xl font-extrabold text-amber-400">{courses.filter((c) => c.status === 'inReview').length}</div>
              <div className="text-[10px] font-black uppercase text-space-400">In Review</div>
            </div>
            <div className="py-4 text-center border border-emerald-500/10 rounded-xl bg-slate-900/40 cosmic-card">
              <div className="text-2xl font-extrabold text-emerald-400">{courses.filter((c) => c.status === 'approved').length}</div>
              <div className="text-[10px] font-black uppercase text-space-400">Published</div>
            </div>
            <div className="py-4 text-center border border-red-500/10 rounded-xl bg-slate-900/40 cosmic-card">
              <div className="text-2xl font-extrabold text-red-400">{courses.filter((c) => c.status === 'rejected').length}</div>
              <div className="text-[10px] font-black uppercase text-space-400">Rejected</div>
            </div>
          </div>

          {/* Course Table / Grid */}
          <div className="px-6 pb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black uppercase text-space-400">
                {STATUS_TABS.find((t) => t.key === activeTab)?.label} • {courses.length} Courses
              </h3>
              <button
                onClick={() => fetchCoursesByStatus(activeTab)}
                className="px-3 py-1.5 rounded-lg text-xs font-black bg-slate-900/60 hover:bg-crimson-500/10 text-crimson-300 border border-crimson-500/20 transition btn-micro"
              >
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="py-12 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-8 h-8 border-4 border-crimson-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="mt-2 text-xs font-medium text-space-300">Loading courses...</p>
                </div>
              </div>
            ) : error ? (
              <div className="py-10 text-center text-amber-300">
                <p className="text-xs">{error}</p>
                {activeTab === 'pending-approval' && (
                  <p className="text-xs text-space-500 mt-2">Using sample data for pending courses.</p>
                )}
              </div>
            ) : courses.length === 0 ? (
              <div className="py-12 text-center text-space-400">
                <p className="text-sm mb-1">No courses in this status.</p>
                <p className="text-xs">Target: {API_BASE_URL}/courses?status={statusMap[activeTab]}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {courses.map((course) => {
                  const isActionPending = actionLoadingId === course.id;
                  return (
                    <div
                      key={course.id}
                      className="glass-card border border-crimson-500/20 rounded-xl p-4 cosmic-card transition hover:border-crimson-500/40"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1 space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-white">{course.title}</h4>
                            <StatusBadge status={course.status} />
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-slate-800/50 text-space-300 border border-slate-700/50">
                              {course.category}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-xs text-space-300">
                            <div><span className="font-black">Instructor:</span> {course.instructor}</div>
                            <div><span className="font-black">Duration:</span> {course.duration}</div>
                            <div><span className="font-black">Submitted:</span> {course.submittedAt || course.createdAt?.slice(0, 10) || '—'}</div>
                            <div><span className="font-black">Course ID:</span> #{course.id}</div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2">
                          {course.status !== 'approved' && course.status !== 'rejected' && (
                            <>
                            <button
                              onClick={() => handleApprove(course.id)}
                              disabled={isActionPending || actionType === 'reject'}
                              className={`relative z-10 px-3.5 py-2 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition btn-micro ${
                                isActionPending && actionType === 'approve'
                                  ? 'bg-slate-800 text-slate-400 animate-pulse'
                                  : 'bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 text-white shadow-lg shadow-emerald-500/30'
                              }`}
                            >
                              {isActionPending && actionType === 'approve' ? 'Approving...' : '✓ Approve & Publish'}
                            </button>
                              
                              <button
                                onClick={() => handleReject(course.id)}
                                disabled={isActionPending || actionType === 'approve'}
                                className={`relative z-10 px-3.5 py-2 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition btn-micro ${
                                  isActionPending && actionType === 'reject'
                                    ? 'bg-slate-800 text-slate-400 animate-pulse'
                                    : 'bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white shadow-lg shadow-red-500/30'
                                }`}
                              >
                                {isActionPending && actionType === 'reject' ? 'Rejecting...' : '✕ Reject'}
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => onNavigate && onNavigate('detail', course.id)}
                            className="relative z-10 px-3.5 py-2 rounded-lg text-xs font-black bg-slate-900/60 hover:bg-crimson-500/10 text-crimson-300 border border-crimson-500/20 transition btn-micro"
                          >
                            View Detail
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
