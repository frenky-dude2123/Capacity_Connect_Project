import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:5000/api/admin/stats';

/**
 * Screen 7: Admin Dashboard Stitch Component
 * Connects to: GET http://localhost:5000/api/admin/stats
 */
export default function Screen7Admin({ onBackToDashboard }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) throw new Error(`HTTP ${response.status}: Failed to fetch admin stats`);
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err.message || 'Error communicating with admin telemetry API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const filteredUsers = stats?.registeredUsers?.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.department.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-900">
              Topic 7 • Screen 7 (Admin Dashboard)
            </span>
            <span className="text-xs text-slate-500">Live API: http://localhost:5000/api/admin/stats</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            Enterprise Capacity & Workforce Telemetry
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Global compliance, department benchmarks, and learner audit roster.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchStats}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition"
          >
            ↻ Refresh Stats
          </button>
          <button
            onClick={onBackToDashboard}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-bold shadow-sm transition"
          >
            ← Learner Portal
          </button>
        </div>
      </div>

      {loading && (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-3 text-sm text-slate-600">Gathering organization capacity telemetry...</p>
        </div>
      )}

      {error && (
        <div className="p-6 bg-red-50 text-red-700 text-xs rounded-2xl text-center">
          <p className="font-bold text-sm">Failed to load admin stats</p>
          <p className="mt-1">{error}</p>
          <button onClick={fetchStats} className="mt-3 px-4 py-1.5 bg-red-600 text-white rounded-lg font-semibold">
            Retry
          </button>
        </div>
      )}

      {!loading && !error && stats && (
        <div className="space-y-8">
          {/* 4 Executive KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold uppercase text-slate-400">Total Workforce</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-purple-900 mt-1">
                {stats.totalUsers.toLocaleString()}
              </p>
              <span className="text-[11px] text-slate-500">Across all enterprise units</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold uppercase text-slate-400">Active Learners</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-blue-900 mt-1">
                {stats.activeLearners.toLocaleString()}
              </p>
              <span className="text-[11px] text-emerald-600 font-semibold">76% of total workforce</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold uppercase text-slate-400">Completion Rate</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1">
                {stats.completionRatePercent}%
              </p>
              <span className="text-[11px] text-emerald-600 font-semibold">↑ +2.1% this month</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold uppercase text-slate-400">Total Curriculums</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                {stats.totalCourses}
              </p>
              <span className="text-[11px] text-slate-500">Accredited programs</span>
            </div>
          </div>

          {/* Department Breakdown */}
          {stats.departmentTelemetry && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900">Department Capacity Velocity</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.departmentTelemetry.map((dept, i) => (
                  <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                      <span>{dept.department}</span>
                      <span>{dept.completionRate}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 mt-2 overflow-hidden">
                      <div
                        className="bg-purple-900 h-2 rounded-full"
                        style={{ width: `${dept.completionRate}%` }}
                      ></div>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2">{dept.activeCount} active personnel</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Registered Users Roster */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Registered Users Directory</h2>
                <p className="text-xs text-slate-500">Live employee audit roster and training progression</p>
              </div>
              <input
                type="text"
                placeholder="Search employee or dept..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-900 w-full sm:w-64"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Course Progress</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">{user.name}</p>
                        <p className="text-[11px] text-slate-400">{user.email}</p>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">{user.department}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          user.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : user.role === 'instructor'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">{user.progress}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          user.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
