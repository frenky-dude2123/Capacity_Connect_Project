import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'https://capacity-connect-project.onrender.com/api/admin';

export default function Screen7Admin({ onBackToDashboard }) {
  const [activeTab, setActiveTab] = useState('pending');
  const [stats, setStats] = useState(null);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [directory, setDirectory] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState({ stats: true, pending: true, all: true, directory: true, feedback: true });
  const [processingIds, setProcessingIds] = useState(new Set());

  const fetchStats = async () => {
    setLoading(prev => ({ ...prev, stats: true }));
    try {
      const res = await fetch(`${API_BASE_URL}/stats`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('capacity_connect_token')}` }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Stats error:', err);
    } finally {
      setLoading(prev => ({ ...prev, stats: false }));
    }
  };

  const fetchPending = async () => {
    setLoading(prev => ({ ...prev, pending: true }));
    try {
      const res = await fetch(`${API_BASE_URL}/pending`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('capacity_connect_token')}` }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPendingUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Pending error:', err);
    } finally {
      setLoading(prev => ({ ...prev, pending: false }));
    }
  };

  const fetchAllUsers = async () => {
    setLoading(prev => ({ ...prev, all: true }));
    try {
      const res = await fetch(`${API_BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('capacity_connect_token')}` }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAllUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Users error:', err);
    } finally {
      setLoading(prev => ({ ...prev, all: false }));
    }
  };

  const fetchDirectory = async () => {
    setLoading(prev => ({ ...prev, directory: true }));
    try {
      const res = await fetch(`${API_BASE_URL}/directory`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('capacity_connect_token')}` }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setDirectory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Directory error:', err);
    } finally {
      setLoading(prev => ({ ...prev, directory: false }));
    }
  };

  const fetchFeedback = async () => {
    setLoading(prev => ({ ...prev, feedback: true }));
    try {
      const res = await fetch(`${API_BASE_URL}/feedback`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('capacity_connect_token')}` }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setFeedback(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Feedback error:', err);
    } finally {
      setLoading(prev => ({ ...prev, feedback: false }));
    }
  };

  useEffect(() => {
    if (activeTab === 'pending') fetchPending();
    else if (activeTab === 'all') fetchAllUsers();
    else if (activeTab === 'directory') fetchDirectory();
    else if (activeTab === 'feedback') fetchFeedback();
    else if (activeTab === 'stats') fetchStats();
  }, [activeTab]);

  const handleApprove = async (userId) => {
    setProcessingIds(prev => new Set(prev).add(userId));
    try {
      await fetch(`${API_BASE_URL}/approve/${userId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('capacity_connect_token')}` }
      });
      fetchPending();
      fetchAllUsers();
      fetchStats();
    } catch (err) {
      console.error('Approve error:', err);
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const handleReject = async (userId) => {
    setProcessingIds(prev => new Set(prev).add(userId));
    try {
      await fetch(`${API_BASE_URL}/reject/${userId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('capacity_connect_token')}` }
      });
      fetchPending();
      fetchAllUsers();
      fetchStats();
    } catch (err) {
      console.error('Reject error:', err);
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-gradient-to-r from-meadow-green/20 to-meadow-green/60 text-meadow-green border border-meadow-green/30">
            Admin Portal • Dashboard
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary mt-1">Admin Dashboard</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setActiveTab('pending')} className={`px-4 py-2 rounded-xl text-xs font-black transition btn-micro ${activeTab === 'pending' ? 'bg-gradient-to-r from-meadow-green to-meadow-green/70 text-white shadow-lg' : 'bg-white/5 text-secondary border border-white/10'}`}>
            Pending Approvals
          </button>
          <button onClick={() => setActiveTab('all')} className={`px-4 py-2 rounded-xl text-xs font-black transition btn-micro ${activeTab === 'all' ? 'bg-gradient-to-r from-meadow-green to-meadow-green/70 text-white shadow-lg' : 'bg-white/5 text-secondary border border-white/10'}`}>
            All Users
          </button>
          <button onClick={() => setActiveTab('directory')} className={`px-4 py-2 rounded-xl text-xs font-black transition btn-micro ${activeTab === 'directory' ? 'bg-gradient-to-r from-meadow-green to-meadow-green/70 text-white shadow-lg' : 'bg-white/5 text-secondary border border-white/10'}`}>
            Directory
          </button>
          <button onClick={() => setActiveTab('feedback')} className={`px-4 py-2 rounded-xl text-xs font-black transition btn-micro ${activeTab === 'feedback' ? 'bg-gradient-to-r from-meadow-green to-meadow-green/70 text-white shadow-lg' : 'bg-white/5 text-secondary border border-white/10'}`}>
            Feedback
          </button>
          <button onClick={onBackToDashboard} className="px-4 py-2 bg-white/5 border border-white/10 text-meadow-green rounded-xl text-xs font-black btn-micro hover:bg-meadow-green/10">
            ← Back
          </button>
        </div>
      </div>

      {stats && !loading.stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="stat-card">
            <div className="stat-icon green">👥</div>
            <div className="stat-info">
              <div className="stat-label">Total Users</div>
              <div className="stat-value">{stats.totalUsers}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon blue">✅</div>
            <div className="stat-info">
              <div className="stat-label">Active Learners</div>
              <div className="stat-value">{stats.activeLearners}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon amber">📈</div>
            <div className="stat-info">
              <div className="stat-label">Completion Rate</div>
              <div className="stat-value">{stats.completionRatePercent}%</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">📚</div>
            <div className="stat-info">
              <div className="stat-label">Enrolled Courses</div>
              <div className="stat-value">{stats.totalCourses}</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'pending' && (
        <div className="glass-card rounded-2xl border border-red-500/20 p-6 shadow-lg">
          <h2 className="text-base font-black text-primary mb-5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
            Pending Approvals ({pendingUsers.length})
          </h2>
          {loading.pending ? (
            <div className="py-10 text-center text-sm text-secondary">Loading...</div>
          ) : pendingUsers.length === 0 ? (
            <div className="py-10 text-center text-sm text-secondary">No pending requests.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-red-500/30 text-secondary uppercase">
                    <th className="py-3 px-3">User</th>
                    <th className="py-3 px-3">Email</th>
                    <th className="py-3 px-3">Role</th>
                    <th className="py-3 px-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-red-500/10">
                  {pendingUsers.map(u => {
                    const isProcessing = processingIds.has(u.id);
                    return (
                      <tr key={u.id} className="hover:bg-red-500/5 transition-colors group">
                        <td className="py-3 px-3 font-bold text-primary group-hover:text-red-400 transition-colors">{u.name}</td>
                        <td className="py-3 px-3 text-secondary">{u.email}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${u.role === 'admin' ? 'bg-red-500/20 text-red-300' : u.role === 'trainer' ? 'bg-meadow-amber/20 text-meadow-amber' : 'bg-meadow-green/20 text-meadow-green'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-3 flex gap-2">
                          <button onClick={() => handleApprove(u.id)} disabled={isProcessing} className="px-3.5 py-1.5 rounded-lg text-xs font-black bg-gradient-to-r from-meadow-green to-meadow-green/70 text-white shadow-lg disabled:opacity-60 btn-micro transition-all">
                            {isProcessing ? 'Processing...' : '✓ Approve'}
                          </button>
                          <button onClick={() => handleReject(u.id)} disabled={isProcessing} className="px-3.5 py-1.5 rounded-lg text-xs font-black bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg disabled:opacity-60 btn-micro transition-all">
                            {isProcessing ? 'Processing...' : '✗ Reject'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'all' && (
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-base font-black text-primary mb-5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-meadow-green animate-pulse"></span>
            All Users ({allUsers.length})
          </h2>
          {loading.all ? (
            <div className="py-10 text-center text-sm text-secondary">Loading...</div>
          ) : allUsers.length === 0 ? (
            <div className="py-10 text-center text-sm text-secondary">No users found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-meadow-green/30 text-secondary uppercase font-mono">
                    <th className="py-3 px-3">User</th>
                    <th className="py-3 px-3">Email</th>
                    <th className="py-3 px-3">Role</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Department</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-meadow-green/10">
                  {allUsers.map(u => (
                    <tr key={u.id} className="hover:bg-meadow-green/5 transition-colors group">
                      <td className="py-3 px-3 font-bold text-primary group-hover:text-meadow-green transition-colors">{u.name}</td>
                      <td className="py-3 px-3 text-secondary">{u.email}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${u.role === 'admin' ? 'bg-red-500/20 text-red-300' : u.role === 'trainer' ? 'bg-meadow-amber/20 text-meadow-amber' : 'bg-meadow-green/20 text-meadow-green'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${u.status === 'approved' ? 'bg-meadow-green/20 text-meadow-green' : u.status === 'pending' ? 'bg-meadow-amber/20 text-meadow-amber' : 'bg-red-500/20 text-red-300'}`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-secondary">{u.department || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'directory' && (
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-base font-black text-primary mb-5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-meadow-green animate-pulse"></span>
            Enterprise Directory
          </h2>
          {loading.directory ? (
            <div className="py-10 text-center text-sm text-secondary">Loading...</div>
          ) : directory.length === 0 ? (
            <div className="py-10 text-center text-sm text-secondary">No directory entries.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-meadow-green/30 text-secondary uppercase font-mono">
                    <th className="py-3 px-3">User</th>
                    <th className="py-3 px-3">Department</th>
                    <th className="py-3 px-3">Role</th>
                    <th className="py-3 px-3">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-meadow-green/10">
                  {directory.map(u => (
                    <tr key={u.id} className="hover:bg-meadow-green/5 transition-colors group">
                      <td className="py-3 px-3 font-bold text-primary group-hover:text-meadow-green transition-colors">{u.name}</td>
                      <td className="py-3 px-3 text-secondary">{u.department}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-meadow-green/20 to-meadow-green/60 text-meadow-green text-[10px] font-black uppercase border border-meadow-green/30 font-mono">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-meadow-green to-meadow-amber rounded-full" style={{width: (u.progress || 0) + '%'}}></div>
                          </div>
                          <span className="font-black text-meadow-green text-xs font-mono">{u.progress}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'feedback' && (
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-base font-black text-primary mb-5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-meadow-amber animate-pulse"></span>
            Course Feedback Summary
          </h2>
          {loading.feedback ? (
            <div className="py-10 text-center text-sm text-secondary">Loading feedback...</div>
          ) : !feedback || feedback.length === 0 ? (
            <div className="py-10 text-center text-sm text-secondary">No feedback yet.</div>
          ) : (
            <div className="space-y-4">
              {feedback.map(s => (
                <div key={s.course_id} className="p-4 rounded-xl border border-white/10 bg-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-black text-primary">Course ID: {s.course_id}</h3>
                    <span className="text-xs font-black text-meadow-amber">{s.avgRating} ★</span>
                  </div>
                  <p className="text-xs text-secondary mb-2">{s.total} review{s.total !== 1 ? 's' : ''}</p>
                  <div className="space-y-2">
                    {s.feedbacks?.slice(0, 5).map(f => (
                      <div key={f.id} className="p-2 rounded-lg bg-white/5 border border-white/10">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-secondary">{f.users?.name || 'Unknown'}</span>
                          <span className="text-xs text-meadow-amber">{'★'.repeat(f.rating)}</span>
                        </div>
                        {f.comment && <p className="text-xs text-secondary mt-1">{f.comment}</p>}
                        <p className="text-[10px] text-secondary mt-1">{new Date(f.created_at).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
