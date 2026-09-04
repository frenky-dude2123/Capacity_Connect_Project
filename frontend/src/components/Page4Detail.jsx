import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:5000/api/courses';

/**
 * Page 4: Course Detail Component (Google Stitch)
 * Connects to: GET http://localhost:5000/api/courses/detail/:id
 * Expected Data: { id, title, description, syllabus, instructor }
 */
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
      // Handle direct object or enveloped { course: ... } / { data: ... }
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Navigation bar */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-200">
        <button
          onClick={onBackToCatalog}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-900 bg-white hover:bg-slate-100 border border-slate-200 px-3.5 py-2 rounded-lg transition"
        >
          <span>← Back to Catalog (Page 3)</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
            Page 4 • Stitch Component
          </span>
          <span className="text-xs text-slate-500 hidden sm:inline">
            Live API: http://localhost:5000/api/courses/detail/{courseId}
          </span>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-sm font-medium text-slate-600">Loading course curriculum...</p>
          <span className="text-xs text-slate-400 mt-1">Target: http://localhost:5000/api/courses/detail/{courseId}</span>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="my-8 p-6 bg-red-50 border border-red-200 rounded-2xl text-center max-w-lg mx-auto">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-lg">
            ✕
          </div>
          <h3 className="text-base font-bold text-red-900">Course Detail Unavailable</h3>
          <p className="text-xs text-red-700 mt-1">{error}</p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              onClick={() => fetchCourseDetail(courseId)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow transition"
            >
              Retry
            </button>
            <button
              onClick={onBackToCatalog}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition"
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
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {course.category && (
                <span className="px-3 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-800 uppercase tracking-wider">
                  {course.category}
                </span>
              )}
              <span className="text-xs text-slate-400 font-mono">Course ID: {course.id}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
              {course.title}
            </h1>

            <p className="text-sm sm:text-base text-slate-600 mt-4 leading-relaxed">
              {course.description}
            </p>

            <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-900 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                  {course.instructor ? course.instructor.charAt(0) : 'I'}
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Instructor</p>
                  <p className="text-sm font-bold text-slate-800">{course.instructor || 'Lead Enterprise Instructor'}</p>
                </div>
              </div>

              <button
                onClick={() => onLaunchPlayer && onLaunchPlayer(course.id)}
                className="px-6 py-3 bg-blue-900 hover:bg-blue-950 text-white text-sm font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                <span>Launch Lesson Player (Page 5)</span>
                <span>▶</span>
              </button>
            </div>
          </div>

          {/* Syllabus Section */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Curriculum Syllabus</h2>
                <p className="text-xs text-slate-500 mt-0.5">Complete learning breakdown for this course</p>
              </div>
              <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
                {Array.isArray(course.syllabus) ? course.syllabus.length : 0} Modules
              </span>
            </div>

            <div className="space-y-3">
              {Array.isArray(course.syllabus) && course.syllabus.length > 0 ? (
                course.syllabus.map((item, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-blue-50/40 hover:border-blue-200 transition flex items-center gap-4"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-900 font-bold text-xs flex items-center justify-center flex-shrink-0">
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium text-slate-800">{item}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">No syllabus modules provided.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
