import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:5000/api/courses';

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
      setError(err.message || 'Unable to connect to backend server');
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
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary">Course Catalog</h1>
          <p className="text-sm text-secondary mt-1">
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
                  ? 'bg-gradient-to-r from-meadow-green to-meadow-green/70 text-white shadow-lg'
                  : 'bg-white/5 text-secondary hover:text-meadow-green hover:bg-meadow-green/10 border border-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
          <button
            onClick={fetchCatalog}
            title="Refresh from API"
            className="p-1.5 rounded-lg bg-white/5 hover:bg-meadow-green/10 text-secondary transition btn-micro border border-white/10"
          >
            ↻
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 border-4 border-meadow-green border-t-transparent rounded-full animate-spin shadow-lg"></div>
          <p className="mt-4 text-sm font-medium text-secondary">Fetching courses from API...</p>
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
              className="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white text-xs font-bold rounded-lg shadow-lg btn-micro"
            >
              Retry Connection
            </button>
          </div>
        </div>
      )}

      {/* Course Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map(course => (
            <div
              key={course.id}
              className="course-card"
            >
              <div className="course-thumb">
                <div className="course-category">
                  <span className="badge badge-green">{course.category}</span>
                </div>
              </div>
              <div className="course-body">
                <h2 className="course-title">{course.title}</h2>
                {course.description && (
                  <p className="course-desc">{course.description}</p>
                )}
                {course.instructor && (
                  <p className="course-meta">Instructor: <span className="text-meadow-green">{course.instructor}</span></p>
                )}
                <div className="pt-6 mt-6 border-t border-white/10 flex items-center gap-2">
                  <button
                    onClick={() => onSelectCourse && onSelectCourse(course.id)}
                    className="flex-1 py-2 px-3 text-center rounded-lg bg-white/5 hover:bg-meadow-green/10 text-secondary text-xs font-semibold border border-white/10 transition btn-micro"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => onLaunchPlayer && onLaunchPlayer(course.id)}
                    className="flex-1 py-2 px-3 text-center rounded-lg bg-gradient-to-r from-meadow-green to-meadow-green/70 hover:from-meadow-green hover:to-meadow-green/60 text-white text-xs font-semibold shadow-lg transition btn-micro"
                  >
                    Start Learning ▶
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
