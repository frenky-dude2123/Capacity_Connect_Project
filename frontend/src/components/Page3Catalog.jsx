import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:5000/api/courses';

/**
 * Page 3: Course Catalog Component (Google Stitch)
 * Connects to: GET http://localhost:5000/api/courses/catalog
 * Expected Data: Array of { id, title, category, description?, instructor? }
 */
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
      // Handle both raw array and enveloped { courses: [...] } or { data: [...] }
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
              Page 3 • Stitch Component
            </span>
            <span className="text-xs text-slate-500">Live API: http://localhost:5000/api/courses/catalog</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2 tracking-tight">
            Course Catalog
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Browse available technical and compliance curriculums.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedCategory === cat
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
          <button
            onClick={fetchCatalog}
            title="Refresh from API"
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
          >
            ↻
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-sm font-medium text-slate-600">Fetching courses from API...</p>
          <span className="text-xs text-slate-400 mt-1">Target: http://localhost:5000/api/courses/catalog</span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="my-8 p-6 bg-red-50 border border-red-200 rounded-2xl text-center max-w-lg mx-auto">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-lg">
            ✕
          </div>
          <h3 className="text-base font-bold text-red-900">Failed to Load Catalog</h3>
          <p className="text-xs text-red-700 mt-1">{error}</p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              onClick={fetchCatalog}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow transition"
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
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-50 text-blue-800 uppercase tracking-wider">
                    {course.category}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">ID: {course.id}</span>
                </div>

                <h2 className="text-lg font-bold text-slate-900 leading-snug">
                  {course.title}
                </h2>

                {course.description && (
                  <p className="text-xs text-slate-500 mt-2.5 leading-relaxed line-clamp-3">
                    {course.description}
                  </p>
                )}

                {course.instructor && (
                  <p className="text-xs text-slate-400 mt-3 font-medium flex items-center gap-1.5">
                    <span>Instructor:</span>
                    <span className="text-slate-700">{course.instructor}</span>
                  </p>
                )}
              </div>

              {/* Card Actions */}
              <div className="pt-6 mt-6 border-t border-slate-100 flex items-center gap-2">
                <button
                  onClick={() => onSelectCourse && onSelectCourse(course.id)}
                  className="flex-1 py-2 px-3 text-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition"
                >
                  Page 4: Detail
                </button>
                <button
                  onClick={() => onLaunchPlayer && onLaunchPlayer(course.id)}
                  className="flex-1 py-2 px-3 text-center rounded-lg bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold shadow-sm transition"
                >
                  Page 5: Player ▶
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
