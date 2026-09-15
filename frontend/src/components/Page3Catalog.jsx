import React, { useState, useEffect } from 'react';
import { authFetch, API_BASE } from '../lib/api';
import Layout from './Layout';
import Icon from './Icons';

export default function Page3Catalog({ onSelectCourse, onLaunchPlayer }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const fetchCatalog = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authFetch(`${API_BASE}/courses/catalog`);
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
    <Layout>
      <div className="page-hero fade-in">
        <div>
          <span className="page-kicker">Catalog</span>
          <h1>Course catalog</h1>
          <p className="page-lede">Browse technical and compliance curriculums, then open a course or start learning.</p>
        </div>
        <div className="page-actions">
          <button type="button" onClick={fetchCatalog} className="btn btn-ghost btn-sm" aria-label="Refresh catalog">
            <Icon name="refresh" size={16} /> Refresh
          </button>
        </div>
      </div>

      <div className="page-actions mb-lg">
        {categories.map(cat => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`filter-chip ${selectedCategory === cat ? 'active' : ''}`}
            aria-pressed={selectedCategory === cat}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading && (
        <div className="grid-courses stagger" aria-busy="true" aria-label="Loading catalog">
          <div className="skeleton-card tall" />
          <div className="skeleton-card tall" />
          <div className="skeleton-card tall" />
        </div>
      )}

      {error && !loading && (
        <div className="glass-card no-hover alert-error slide-up">
          <p className="empty-title">Failed to load catalog</p>
          <p>{error}</p>
          <button type="button" onClick={fetchCatalog} className="btn btn-primary btn-sm mt-md">Retry connection</button>
        </div>
      )}

      {!loading && !error && filteredCourses.length === 0 && (
        <div className="glass-card empty-state no-hover">
          <div className="empty-icon"><Icon name="inbox" size={40} /></div>
          <h3 className="empty-title">No courses in this category</h3>
          <p>Try another filter or refresh the catalog.</p>
        </div>
      )}

      {!loading && !error && filteredCourses.length > 0 && (
        <div className="grid-courses stagger">
          {filteredCourses.map((course, index) => (
            <article key={course.id} className="course-card">
              <div className={`course-thumb course-thumb-${(index % 3) + 1}`}>
                <div className="course-category">
                  <span className="badge badge-green">{course.category}</span>
                </div>
              </div>
              <div className="course-body">
                <h2 className="course-title">{course.title}</h2>
                {course.description && <p className="course-desc">{course.description}</p>}
                {course.instructor && <p className="course-meta">Instructor: {course.instructor}</p>}
                <div className="page-actions mt-md">
                  <button type="button" onClick={() => onSelectCourse && onSelectCourse(course.id)} className="btn btn-ghost btn-sm">
                    View details
                  </button>
                  <button type="button" onClick={() => onLaunchPlayer && onLaunchPlayer(course.id)} className="btn btn-primary btn-sm">
                    <Icon name="play" size={14} /> Start learning
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </Layout>
  );
}
