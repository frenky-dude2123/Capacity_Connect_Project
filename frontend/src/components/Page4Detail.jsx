import React, { useState, useEffect } from 'react';
import { authFetch, API_BASE } from '../lib/api';
import Layout from './Layout';
import Icon from './Icons';

export default function Page4Detail({ courseId = 1, onBackToCatalog, onLaunchPlayer }) {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCourseDetail = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authFetch(`${API_BASE}/courses/detail/${id}`);
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
    <Layout>
      <div className="page-hero fade-in">
        <div>
          <span className="page-kicker">Course detail</span>
          <h1>{course?.title || 'Curriculum'}</h1>
          <p className="page-lede">Review the syllabus, then launch the lesson player.</p>
        </div>
        <div className="page-actions">
          <button type="button" onClick={onBackToCatalog} className="btn btn-ghost btn-sm">
            Back to catalog
          </button>
        </div>
      </div>

      {loading && (
        <div className="stagger" aria-busy="true">
          <div className="skeleton-card tall" />
          <div className="skeleton-card tall mt-md" />
        </div>
      )}

      {error && !loading && (
        <div className="glass-card no-hover alert-error slide-up">
          <p className="empty-title">Course detail unavailable</p>
          <p>{error}</p>
          <div className="page-actions mt-md">
            <button type="button" onClick={() => fetchCourseDetail(courseId)} className="btn btn-primary btn-sm">Retry</button>
            <button type="button" onClick={onBackToCatalog} className="btn btn-ghost btn-sm">Return to catalog</button>
          </div>
        </div>
      )}

      {!loading && !error && course && (
        <div className="slide-up">
          <div className="glass-card no-hover">
            <div className="page-actions mb-md">
              {course.category && <span className="badge badge-green">{course.category}</span>}
              <span className="badge badge-gray">ID {course.id}</span>
            </div>
            <p className="page-lede">{course.description}</p>
            <div className="section-header mt-lg">
              <div>
                <p className="stat-label">Instructor</p>
                <p className="course-title">{course.instructor || 'Lead instructor'}</p>
              </div>
              <button type="button" onClick={() => onLaunchPlayer && onLaunchPlayer(course.id)} className="btn btn-primary">
                <Icon name="play" size={16} /> Start learning
              </button>
            </div>
          </div>

          <section className="section mt-lg">
            <div className="glass-card no-hover">
              <div className="section-header">
                <h2 className="section-title">Curriculum syllabus</h2>
                <span className="badge badge-green">{Array.isArray(course.syllabus) ? course.syllabus.length : 0} modules</span>
              </div>
              {Array.isArray(course.syllabus) && course.syllabus.length > 0 ? (
                <div className="panel-list">
                  {course.syllabus.map((item, index) => (
                    <div key={index} className="syllabus-item">
                      <div className="module-index">{index + 1}</div>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon"><Icon name="inbox" size={32} /></div>
                  <p>No syllabus modules provided.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </Layout>
  );
}
