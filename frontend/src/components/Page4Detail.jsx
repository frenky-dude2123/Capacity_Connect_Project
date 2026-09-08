import React, { useState, useEffect, useMemo } from 'react';
import './index.css';

const API_BASE_URL = 'http://localhost:5000/api/courses';

function Starfield({ count = 50 }) {
  return useMemo(() => {
    const stars = [];
    for (let i = 0; i < count; i++) {
      const size = Math.random() * 2 + 1;
      const left = Math.random() * 100;
      const top = Math.random() * 100;
      const delay = Math.random() * 3;
      stars.push(
        <div
          key={i}
          className="star"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            left: `${left}%`,
            top: `${top}%`,
            opacity: Math.random() * 0.5 + 0.3,
            animationDelay: `${delay}s`,
            animationDuration: `${2 + Math.random() * 3}s`,
          }}
        />
      );
    }
    return stars;
  }, [count]);
}

export default function Page4Detail({ courseId = 1, onBackToCatalog, onLaunchPlayer }) {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCourseDetail = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/detail/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to fetch course detail`);
      }

      const data = await response.json();
      const detailData = data.course || data.data || data;
      setCourse(detailData);
    } catch (err) {
      console.error('Error fetching course detail:', err);
      setError(err.message || 'Error communicating with backend service on port 5000');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseDetail(courseId);
  }, [courseId]);

  return (
    <div className="theme-trainee relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-orbital-bg">
        <Starfield count={40} />
        <div className="nebula-drift" style={{ width: '280px', height: '280px', background: 'radial-gradient(circle at 30% 20%, rgba(45,212,191,0.12) 0%, transparent 60%)', top: '15%', right: '10%', animationDelay: '-3s' }}></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 fade-in">
        {/* Navigation bar */}
        <div className="flex items-center justify-between pb-6 border-b border-teal-500/20">
          <button
            onClick={onBackToCatalog}
            className="inline-flex items-center gap-2 text-xs font-bold text-teal-300 hover:text-teal-200 bg-slate-900/60 hover:bg-teal-500/10 border border-teal-500/20 px-3.5 py-2 rounded-lg transition btn-micro"
          >
            ← Back to Catalog (Page 3)
          </button>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
              Page 4 • Course Detail
            </span>
            <span className="text-xs text-space-400 hidden sm:inline">
              Live API: http://localhost:5000/api/courses/detail/{courseId}
            </span>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin shadow-lg shadow-cyan-500/50"></div>
            <p className="mt-4 text-sm font-medium text-space-300">Loading course curriculum...</p>
            <span className="text-xs text-space-500 mt-1">Target: http://localhost:5000/api/courses/detail/{courseId}</span>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="my-8 p-6 bg-red-900/20 border border-red-800/50 rounded-2xl text-center max-w-lg mx-auto">
            <div className="w-12 h-12 bg-red-900/30 text-red-300 rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-lg">
              ✕
            </div>
            <h3 className="text-base font-bold text-red-300">Course Detail Unavailable</h3>
            <p className="text-xs text-red-400 mt-1">{error}</p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                onClick={() => fetchCourseDetail(courseId)}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white text-xs font-bold rounded-lg shadow-lg shadow-red-500/30 btn-micro"
              >
                Retry
              </button>
              <button
                onClick={onBackToCatalog}
                className="px-4 py-1.5 bg-slate-900/60 border border-teal-500/20 text-space-300 rounded-lg text-xs font-semibold hover:bg-teal-500/10 btn-micro"
              >
                Return to Catalog
              </button>
            </div>
          </div>
        )}

        {/* Course Detail Card */}
        {!loading && !error && course && (
          <div className="space-y-8 mt-6">
            {/* Header Card */}
            <div className="glass-card border border-cyan-500/20 hud-panel rounded-2xl p-8 cosmic-card">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {course.category && (
                  <span className="px-3 py-1 rounded-md text-xs font-bold bg-teal-500/20 text-teal-300 uppercase tracking-wider">
                    {course.category}
                  </span>
                )}
                <span className="text-xs text-space-400 font-mono">Course ID: {course.id}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                {course.title}
              </h1>

              <p className="text-sm sm:text-base text-space-300 mt-4 leading-relaxed">
                {course.description}
              </p>

              <div className="mt-6 pt-6 border-t border-teal-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 text-white font-bold flex items-center justify-center text-sm shadow-lg shadow-teal-500/30">
                    {course.instructor ? course.instructor.charAt(0) : 'I'}
                  </div>
                  <div>
                    <p className="text-xs text-space-400 uppercase tracking-wider font-black">Instructor</p>
                    <p className="text-sm font-bold text-white">{course.instructor || 'Lead Enterprise Instructor'}</p>
                  </div>
                </div>

                <button
                  onClick={() => onLaunchPlayer && onLaunchPlayer(course.id)}
                  className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-teal-500/30 transition btn-micro"
                >
                  Launch Lesson Player (Page 5) ▶
                </button>
              </div>
            </div>

            {/* Syllabus Section */}
            <div className="glass-card border border-teal-500/20 hud-panel rounded-2xl p-8 cosmic-card">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white">Curriculum Syllabus</h2>
                  <p className="text-xs text-space-400 mt-0.5">Complete learning breakdown for this course</p>
                </div>
                <span className="px-2.5 py-1 rounded-md text-xs font-black bg-slate-900/60 text-space-300">
                  {Array.isArray(course.syllabus) ? course.syllabus.length : 0} Modules
                </span>
              </div>

              <div className="space-y-3">
                {Array.isArray(course.syllabus) && course.syllabus.length > 0 ? (
                  course.syllabus.map((item, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-xl border border-teal-500/10 bg-slate-900/40 hover:bg-teal-500/10 hover:border-teal-500/30 transition flex items-center gap-4"
                    >
                      <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 font-black text-xs flex items-center justify-center flex-shrink-0">
                        {index + 1}
                      </div>
                      <span className="text-sm font-medium text-space-200">{item}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-space-400">No syllabus modules provided.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
