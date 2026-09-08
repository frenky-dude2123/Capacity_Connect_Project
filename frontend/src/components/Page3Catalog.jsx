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

export default function Page3Catalog({ onSelectCourse, onLaunchPlayer }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const fetchCatalog = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/catalog`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch catalog`);
      }

      const data = await response.json();
      const courseList = Array.isArray(data) ? data : (data.courses || data.data || []);
      setCourses(courseList);
    } catch (err) {
      console.error('Error fetching course catalog:', err);
      setError(err.message || 'Unable to connect to backend server on port 5000');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const categories = ['All', ...new Set(courses.map(c => c.category).filter(Boolean))];

  const filteredCourses = selectedCategory === 'All'
    ? courses
    : courses.filter(c => c.category === selectedCategory);

  return (
    <div className="theme-trainee relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-orbital-bg">
        <Starfield count={50} />
        <div className="nebula-drift" style={{ width: '320px', height: '320px', background: 'radial-gradient(circle at 30% 30%, rgba(45,212,191,0.15) 0%, transparent 60%)', top: '10%', left: '15%', animationDelay: '0s' }}></div>
        <div className="nebula-drift" style={{ width: '280px', height: '280px', background: 'radial-gradient(circle at 70% 80%, rgba(45,212,191,0.12) 0%, transparent 60%)', bottom: '10%', right: '10%', animationDelay: '-6s' }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 fade-in">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-teal-500/20">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-400/30">
                Page 3 • Course Catalog
              </span>
              <span className="text-xs text-space-400">Live API: http://localhost:5000/api/courses/catalog</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
              Course Catalog
            </h1>
            <p className="text-sm text-space-300 mt-1">
              Browse available technical and compliance curriculums.
            </p>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition btn-micro ${
                  selectedCategory === cat
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg shadow-teal-500/30'
                    : 'bg-slate-900/60 text-space-300 hover:text-teal-300 hover:bg-teal-500/10 border border-teal-500/20'
                }`}
              >
                {cat}
              </button>
            ))}
            <button
              onClick={fetchCatalog}
              title="Refresh from API"
              className="p-1.5 rounded-lg bg-slate-900/60 hover:bg-teal-500/10 text-teal-300 transition btn-micro border border-teal-500/20"
            >
              ↻
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin shadow-lg shadow-teal-500/50"></div>
            <p className="mt-4 text-sm font-medium text-space-300">Fetching courses from API...</p>
            <span className="text-xs text-space-500 mt-1">Target: http://localhost:5000/api/courses/catalog</span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="my-8 p-6 bg-red-900/20 border border-red-800/50 rounded-2xl text-center max-w-lg mx-auto">
            <div className="w-12 h-12 bg-red-900/30 text-red-300 rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-lg">
              ✕
            </div>
            <h3 className="text-base font-bold text-red-300">Failed to Load Catalog</h3>
            <p className="text-xs text-red-400 mt-1">{error}</p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                onClick={fetchCatalog}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white text-xs font-bold rounded-lg shadow-lg shadow-red-500/30 btn-micro"
              >
                Retry Connection
              </button>
            </div>
          </div>
        )}

        {/* Course Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {filteredCourses.map(course => (
              <div
                key={course.id}
                className="glass-card border border-teal-500/20 hud-panel p-6 flex flex-col justify-between cosmic-card"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-teal-500/20 text-teal-300 uppercase tracking-wider">
                      {course.category}
                    </span>
                    <span className="text-xs text-space-400 font-mono">ID: {course.id}</span>
                  </div>

                  <h2 className="text-lg font-bold text-white leading-snug">
                    {course.title}
                  </h2>

                  {course.description && (
                    <p className="text-xs text-space-300 mt-2.5 leading-relaxed line-clamp-3">
                      {course.description}
                    </p>
                  )}

                  {course.instructor && (
                    <p className="text-xs text-space-400 mt-3 font-medium flex items-center gap-1.5">
                      <span>Instructor:</span>
                      <span className="text-teal-300">{course.instructor}</span>
                    </p>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-6 mt-6 border-t border-teal-500/10 flex items-center gap-2">
                  <button
                    onClick={() => onSelectCourse && onSelectCourse(course.id)}
                    className="flex-1 py-2 px-3 text-center rounded-lg bg-slate-900/60 hover:bg-teal-500/10 text-teal-300 text-xs font-semibold border border-teal-500/20 transition btn-micro"
                  >
                    Page 4: Detail
                  </button>
                  <button
                    onClick={() => onLaunchPlayer && onLaunchPlayer(course.id)}
                    className="flex-1 py-2 px-3 text-center rounded-lg bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white text-xs font-semibold shadow-lg shadow-teal-500/30 transition btn-micro"
                  >
                    Page 5: Player ▶
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
