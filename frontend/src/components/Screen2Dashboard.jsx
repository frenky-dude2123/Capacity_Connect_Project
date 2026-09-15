import React, { useState, useEffect } from 'react';
import { authFetch, API_BASE, AI_API_BASE } from '../lib/api';
import Layout from './Layout';
import Icon from './Icons';
import { useAuth } from '../contexts/AuthContext';

export default function Screen2Dashboard({ userId = 'u_learner1', onOpenCourse, onOpenCertificate, onOpenCatalog }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [aiRecs, setAiRecs] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authFetch(`${API_BASE}/user/dashboard/${userId}`);
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

  const fetchAIRecommendations = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const weakAreas = [
        { topic: 'Security & Compliance', score: 45, courseId: 2 },
        { topic: 'Distributed Systems', score: 60, courseId: 3 },
        { topic: 'Cloud Architecture', score: 68, courseId: 1 }
      ];
      const response = await authFetch(`${AI_API_BASE}/recommendations`, {
        method: 'POST',
        body: JSON.stringify({ userId, weakAreas, numRecommendations: 3 }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}: AI recommendations failed`);
      const json = await response.json();
      setAiRecs(json);
    } catch (err) {
      setAiError(err.message || 'Error connecting to AI recommendation service');
    } finally {
      setAiLoading(false);
    }
  };

  const enrolled = data?.enrolledCourses || [];
  const recommended = data?.recommendedCourses || [];

  return (
    <Layout>
      <div className="page-hero fade-in">
        <div>
          <span className="page-kicker">{user?.role || 'trainee'} portal</span>
          <h1>Welcome back, {data?.userName || user?.name || 'learner'}</h1>
          <p className="page-lede">Track your learning progress, resume courses, and grow with personalized recommendations.</p>
        </div>
        <div className="page-actions">
          <button type="button" onClick={fetchDashboard} className="btn btn-ghost btn-sm">
            <Icon name="refresh" size={16} /> Refresh
          </button>
          <button type="button" onClick={onOpenCatalog} className="btn btn-primary btn-sm">
            <Icon name="compass" size={16} /> Explore catalog
          </button>
        </div>
      </div>

      {loading && (
        <div className="stagger" aria-busy="true" aria-label="Loading dashboard">
          <div className="grid-stats">
            <div className="skeleton-card" />
            <div className="skeleton-card" />
            <div className="skeleton-card" />
            <div className="skeleton-card" />
          </div>
          <div className="grid-courses mt-lg">
            <div className="skeleton-card tall" />
            <div className="skeleton-card tall" />
            <div className="skeleton-card tall" />
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="glass-card no-hover alert-error slide-up">
          <p className="empty-title">Could not load dashboard data</p>
          <p className="empty-state">{error}</p>
          <button type="button" onClick={fetchDashboard} className="btn btn-primary btn-sm mt-md">
            Retry connection
          </button>
        </div>
      )}

      {!loading && !error && data && (
        <div className="slide-up">
          <div className="grid-stats">
            <div className="stat-card">
              <div className="stat-icon green"><Icon name="trend" size={22} /></div>
              <div className="stat-info">
                <div className="stat-label">Progress</div>
                <div className="stat-value">{data.metrics?.capacityScore || 0}%</div>
                <div className="stat-trend up">Capacity score</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon blue"><Icon name="catalog" size={22} /></div>
              <div className="stat-info">
                <div className="stat-label">Enrolled courses</div>
                <div className="stat-value">{data.metrics?.activeCourses || enrolled.length}</div>
                <div className="stat-trend">Curriculums underway</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon amber"><Icon name="clock" size={22} /></div>
              <div className="stat-info">
                <div className="stat-label">Hours learned</div>
                <div className="stat-value">{data.metrics?.trainingHours || 0}</div>
                <div className="stat-trend">Total learning time</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green"><Icon name="award" size={22} /></div>
              <div className="stat-info">
                <div className="stat-label">Certificates</div>
                <div className="stat-value">{data.metrics?.completedCertifications || 0}</div>
                <div className="stat-trend">Accredited skills</div>
              </div>
            </div>
          </div>

          <section className="section mt-xl">
            <div className="section-header">
              <h2 className="section-title">Enrolled courses</h2>
              <span className="badge badge-green">{enrolled.length} courses</span>
            </div>

            {enrolled.length === 0 ? (
              <div className="glass-card empty-state no-hover">
                <div className="empty-icon"><Icon name="inbox" size={40} /></div>
                <h3 className="empty-title">No courses enrolled yet</h3>
                <p>Explore the catalog to start a learning path that fits your role.</p>
                <button type="button" onClick={onOpenCatalog} className="btn btn-primary mt-md">
                  <Icon name="compass" size={16} /> Browse catalog
                </button>
              </div>
            ) : (
              <div className="grid-courses stagger">
                {enrolled.map((course, index) => (
                  <article key={course.id} className="course-card">
                    <div className={`course-thumb course-thumb-${(index % 3) + 1}`}>
                      <div className="course-category">
                        <span className="badge badge-green">{course.category}</span>
                      </div>
                    </div>
                    <div className="course-body">
                      <h3 className="course-title">{course.title}</h3>
                      <p className="course-desc">Instructor: {course.instructor}</p>
                      <div className="progress-bar mt-md" aria-label={`${course.progressPercent}% complete`}>
                        <div className="progress-fill" style={{ width: `${course.progressPercent || 0}%` }} />
                      </div>
                      <div className="course-meta">
                        <span>{course.progressPercent || 0}% complete</span>
                      </div>
                      <div className="page-actions mt-md">
                        <button
                          type="button"
                          onClick={() => onOpenCourse && onOpenCourse(course.id)}
                          className="btn btn-primary btn-sm"
                        >
                          <Icon name="play" size={14} /> Resume
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenCertificate && onOpenCertificate(userId, course.id)}
                          className="btn btn-ghost btn-sm"
                        >
                          <Icon name="award" size={14} /> Certificate
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="section">
            <div className="glass-card no-hover">
              <h3 className="section-title">Recommended for your growth path</h3>
              {recommended.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon"><Icon name="sparkles" size={32} /></div>
                  <p>Recommendations will appear here as your learning profile grows.</p>
                </div>
              ) : (
                <div className="grid-courses mt-md">
                  {recommended.map((rec) => (
                    <div key={rec.id} className="glass-card">
                      <span className="badge badge-green">{rec.category}</span>
                      <h4 className="course-title mt-sm">{rec.title}</h4>
                      <p className="course-desc">Est. duration: {rec.estimatedHours} hrs</p>
                      <button type="button" onClick={onOpenCatalog} className="btn btn-ghost btn-sm mt-md">
                        View in catalog
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="section">
            <div className="glass-card no-hover">
              <div className="section-header">
                <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Icon name="sparkles" size={18} /> AI recommendations
                </h3>
                <button
                  type="button"
                  onClick={fetchAIRecommendations}
                  disabled={aiLoading}
                  className="btn btn-primary btn-sm"
                >
                  {aiLoading ? 'Generating…' : aiRecs ? 'Refresh' : 'Generate with AI'}
                </button>
              </div>

              {aiLoading && (
                <div className="grid-courses" aria-busy="true" aria-label="Generating recommendations">
                  <div className="skeleton-card tall" />
                  <div className="skeleton-card tall" />
                  <div className="skeleton-card tall" />
                </div>
              )}

              {aiError && !aiLoading && (
                <p className="alert alert-warning">Using sample data: {aiError}</p>
              )}

              {!aiLoading && aiRecs && (
                <div>
                  <p className="page-lede">{aiRecs.source === 'ai' ? 'Powered by Gemini' : 'Using sample recommendations'}</p>
                  <p className="course-desc mt-sm">{aiRecs.summary}</p>
                  <div className="grid-courses mt-md">
                    {aiRecs.recommendations?.map((rec) => (
                      <div key={rec.courseId} className="glass-card">
                        <div className="page-actions">
                          <span className="badge badge-green">{rec.category}</span>
                          <span className="badge badge-gray">{rec.difficulty}</span>
                        </div>
                        <h4 className="course-title mt-sm">{rec.title}</h4>
                        <p className="course-desc">{rec.reason}</p>
                        <button type="button" onClick={onOpenCatalog} className="btn btn-ghost btn-sm mt-md">
                          View in catalog
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!aiLoading && !aiRecs && (
                <div className="empty-state">
                  <div className="empty-icon"><Icon name="sparkles" size={32} /></div>
                  <h3 className="empty-title">No AI recommendations yet</h3>
                  <p>Generate a set of courses based on your weaker topic areas.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </Layout>
  );
}
