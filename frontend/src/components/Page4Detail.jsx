import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:5000/api/courses';

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
        throw new Error(`HTTP ${response.status}: Failed to fetch course detail`);
      }

      const data = await response.json();
      setCourse(data);
    } catch (err) {
      setError(err.message || 'Error communicating with backend service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseDetail(courseId);
  }, [courseId]);

  return (
    <div className="space-y-6">
      {/* Navigation bar */}
      <div className="flex items-center justify-between pb-6 border-b border-white/10">
        <button
          onClick={onBackToCatalog}
          className="inline-flex items-center gap-2 text-xs font-bold text-meadow-green hover:text-meadow-green/80 bg-white/5 hover:bg-meadow-green/10 border border-white/10 px-3.5 py-2 rounded-lg transition btn-micro"
        >
          ← Back to Catalog
        </button>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-meadow-green/20 text-meadow-green border border-meadow-green/30">
            Course Detail
          </span>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 border-4 border-meadow-green border-t-transparent rounded-full animate-spin shadow-lg"></div>
          <p className="mt-4 text-sm font-medium text-secondary">Loading course curriculum...</p>
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
              className="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white text-xs font-bold rounded-lg shadow-lg btn-micro"
            >
              Retry
            </button>
            <button
              onClick={onBackToCatalog}
              className="px-4 py-1.5 bg-white/5 border border-white/10 text-secondary rounded-lg text-xs font-semibold hover:bg-meadow-green/10 btn-micro"
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
          <div className="glass-card rounded-2xl p-8">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {course.category && (
                <span className="px-3 py-1 rounded-md text-xs font-bold bg-meadow-green/20 text-meadow-green uppercase tracking-wider">
                  {course.category}
                </span>
              )}
              <span className="text-xs text-secondary font-mono">Course ID: {course.id}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-primary leading-tight">
              {course.title}
            </h1>

            <p className="text-sm sm:text-base text-secondary mt-4 leading-relaxed">
              {course.description}
            </p>

            <div className="mt-6 pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-meadow-green to-meadow-green/70 text-white font-bold flex items-center justify-center text-sm shadow-lg">
                  {course.instructor ? course.instructor.charAt(0) : 'I'}
                </div>
                <div>
                  <p className="text-xs text-secondary uppercase tracking-wider font-black">Instructor</p>
                  <p className="text-sm font-bold text-primary">{course.instructor || 'Lead Instructor'}</p>
                </div>
              </div>

              <button
                onClick={() => onLaunchPlayer && onLaunchPlayer(course.id)}
                className="px-6 py-3 bg-gradient-to-r from-meadow-green to-meadow-green/70 hover:from-meadow-green hover:to-meadow-green/60 text-white text-sm font-bold rounded-xl shadow-lg transition btn-micro"
              >
                Start Learning (Page 5) ▶
              </button>
            </div>
          </div>

          {/* Syllabus Section */}
          <div className="glass-card rounded-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-primary">Curriculum Syllabus</h2>
                <p className="text-xs text-secondary mt-0.5">Complete learning breakdown for this course</p>
              </div>
              <span className="px-2.5 py-1 rounded-md text-xs font-black bg-white/10 text-secondary">
                {Array.isArray(course.syllabus) ? course.syllabus.length : 0} Modules
              </span>
            </div>

            <div className="space-y-3">
              {Array.isArray(course.syllabus) && course.syllabus.length > 0 ? (
                course.syllabus.map((item, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-meadow-green/5 transition flex items-center gap-4"
                  >
                    <div className="w-8 h-8 rounded-lg bg-meadow-green/20 text-meadow-green font-black text-xs flex items-center justify-center flex-shrink-0">
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium text-primary">{item}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-secondary">No syllabus modules provided.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
