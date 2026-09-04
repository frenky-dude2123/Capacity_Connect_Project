import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:5000/api/user/dashboard';

/**
 * Screen 2: Learner Dashboard Stitch Component
 * Connects to: GET http://localhost:5000/api/user/dashboard/:userId
 */
export default function Screen2Dashboard({ userId = 'u_learner1', onOpenCourse, onOpenCertificate, onOpenCatalog }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/${userId}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}: Failed to fetch dashboard`);
      const json = await response.json();
      setData(json);
    } catch (err) {
      setError(err.message || 'Error connecting to user dashboard API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [userId]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-900">
              Topic 2 • Screen 2 (Learner Dashboard)
            </span>
            <span className="text-xs text-slate-500">Live API: http://localhost:5000/api/user/dashboard/{userId}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            Welcome back, {data?.userName || 'Jane Doe'}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Track your enterprise engineering pathways, capacity readiness, and certificates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboard}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition"
          >
            ↻ Refresh Data
          </button>
          <button
            onClick={onOpenCatalog}
            className="px-3.5 py-1.5 bg-blue-900 hover:bg-blue-950 text-white rounded-lg text-xs font-bold shadow-sm transition"
          >
            Explore Catalog (Page 3) →
          </button>
        </div>
      </div>

      {loading && (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-3 text-sm font-medium text-slate-600">Loading your learner capacity profile...</p>
        </div>
      )}

      {error && (
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center text-xs text-red-700">
          <p className="font-bold text-sm">Failed to load dashboard data</p>
          <p className="mt-1">{error}</p>
          <button onClick={fetchDashboard} className="mt-3 px-4 py-1.5 bg-red-600 text-white font-semibold rounded-lg">
            Retry Connection
          </button>
        </div>
      )}

      {!loading && !error && data && (
        <div className="space-y-8">
          {/* KPI Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold uppercase text-slate-400">Capacity Readiness</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-blue-900 mt-1">
                {data.metrics?.capacityScore || 94}%
              </p>
              <span className="text-[11px] text-emerald-600 font-semibold">↑ +4% vs last quarter</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold uppercase text-slate-400">Active Courses</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                {data.metrics?.activeCourses || data.enrolledCourses?.length}
              </p>
              <span className="text-[11px] text-slate-500">Curriculums underway</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold uppercase text-slate-400">Training Logged</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                {data.metrics?.trainingHours || 42.5} <span className="text-sm font-normal text-slate-500">hrs</span>
              </p>
              <span className="text-[11px] text-slate-500">Total learning time</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold uppercase text-slate-400">Certificates Earned</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1">
                {data.metrics?.completedCertifications || 2}
              </p>
              <span className="text-[11px] text-slate-500">Accredited skills</span>
            </div>
          </div>

          {/* Enrolled Courses Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Enrolled Engineering Pathways</h2>
              <span className="text-xs text-slate-500">{data.enrolledCourses?.length} Pathways</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {data.enrolledCourses?.map((course) => (
                <div key={course.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 uppercase">
                        {course.category}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                        {course.status}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {course.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-2">Instructor: {course.instructor}</p>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                        <span>Course Progress</span>
                        <span>{course.progressPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-900 h-2 rounded-full transition-all"
                          style={{ width: `${course.progressPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2">
                    <button
                      onClick={() => onOpenCourse && onOpenCourse(course.id)}
                      className="flex-1 py-2 text-center rounded-lg bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold transition shadow-sm"
                    >
                      Resume Lesson ▶
                    </button>
                    <button
                      onClick={() => onOpenCertificate && onOpenCertificate(userId, course.id)}
                      className="px-3 py-2 text-center rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition"
                      title="View Certificate"
                    >
                      🎓 Cert
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations Strip */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-base font-bold text-slate-900 mb-3">
              Recommended for Your Growth Path
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {data.recommendedCourses?.map((rec) => (
                <div key={rec.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-blue-800 uppercase bg-blue-100/60 px-2 py-0.5 rounded">
                      {rec.category}
                    </span>
                    <h4 className="text-sm font-bold text-slate-800 mt-2">{rec.title}</h4>
                    <p className="text-xs text-slate-400 mt-1">Est. Duration: {rec.estimatedHours} hrs</p>
                  </div>
                  <button
                    onClick={onOpenCatalog}
                    className="mt-4 text-xs font-semibold text-blue-900 hover:underline text-left"
                  >
                    View in Catalog →
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
