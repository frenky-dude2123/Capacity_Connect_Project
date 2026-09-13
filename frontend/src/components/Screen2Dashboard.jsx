import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:5000/api/user/dashboard';
const AI_API_URL = 'http://localhost:5000/api/ai';

export default function Screen2Dashboard({ userId = 'u_learner1', onOpenCourse, onOpenCertificate, onOpenCatalog }) {
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

  const fetchAIRecommendations = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const weakAreas = [
        { topic: 'Security & Compliance', score: 45, courseId: 2 },
        { topic: 'Distributed Systems', score: 60, courseId: 3 },
        { topic: 'Cloud Architecture', score: 68, courseId: 1 }
      ];
      const response = await fetch(`${AI_API_URL}/recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-meadow-green/20 to-meadow-green/60 text-meadow-green border border-meadow-green/30">
              Trainee Portal • Dashboard
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary mt-2">
            Welcome back, {data?.userName || 'Jane Doe'}!
          </h1>
          <p className="text-xs sm:text-sm text-secondary mt-1">
            Track your learning progress and certificates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboard}
            className="px-3 py-1.5 bg-white/5 hover:bg-meadow-green/10 border border-white/10 text-secondary rounded-lg text-xs font-bold transition btn-micro"
          >
            <span>↻</span> Refresh Data
          </button>
          <button
            onClick={onOpenCatalog}
            className="px-3.5 py-1.5 bg-gradient-to-r from-meadow-green to-meadow-green/70 hover:from-meadow-green hover:to-meadow-green/60 text-white rounded-lg text-xs font-bold shadow-lg transition btn-micro"
          >
            Explore Catalog →
          </button>
        </div>
      </div>

      {loading && (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-meadow-green border-t-transparent rounded-full animate-spin mx-auto shadow-lg"></div>
          <p className="mt-3 text-sm font-medium text-secondary">Loading your learner profile...</p>
        </div>
      )}

      {error && (
        <div className="p-6 bg-red-900/20 border border-red-800/50 rounded-2xl text-center text-xs text-red-300">
          <p className="font-bold text-sm">Failed to load dashboard data</p>
          <p className="mt-1">{error}</p>
          <button onClick={fetchDashboard} className="mt-3 px-4 py-1.5 bg-red-600 text-white rounded-lg font-semibold">
            Retry Connection
          </button>
        </div>
      )}

      {!loading && !error && data && (
        <div className="space-y-8">
          {/* KPI Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="stat-card">
              <div className="stat-icon green">📈</div>
              <div className="stat-info">
                <div className="stat-label">Progress</div>
                <div className="stat-value">{data.metrics?.capacityScore || 94}%</div>
                <div className="stat-trend up">↑ +4% vs last quarter</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon blue">📚</div>
              <div className="stat-info">
                <div className="stat-label">Enrolled Courses</div>
                <div className="stat-value">{data.metrics?.activeCourses || data.enrolledCourses?.length}</div>
                <div className="stat-trend">Curriculums underway</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon amber">⏱️</div>
              <div className="stat-info">
                <div className="stat-label">Hours Learned</div>
                <div className="stat-value">{data.metrics?.trainingHours || 42.5} <span className="text-sm font-normal text-secondary">hrs</span></div>
                <div className="stat-trend">Total learning time</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon green">🏆</div>
              <div className="stat-info">
                <div className="stat-label">Certificates</div>
                <div className="stat-value">{data.metrics?.completedCertifications || 2}</div>
                <div className="stat-trend">Accredited skills</div>
              </div>
            </div>
          </div>

          {/* Enrolled Courses Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-primary">Enrolled Courses</h2>
              <span className="text-xs text-secondary">{data.enrolledCourses?.length} Courses</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {data.enrolledCourses?.map((course) => (
                <div key={course.id} className="course-card">
                  <div className="course-thumb">
                    <div className="course-category">
                      <span className="badge badge-green">{course.category}</span>
                    </div>
                  </div>
                  <div className="course-body">
                    <h3 className="course-title">{course.title}</h3>
                    <p className="course-desc">Instructor: {course.instructor}</p>
                    <div className="course-meta">
                      <span>{course.progressPercent}% complete</span>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => onOpenCourse && onOpenCourse(course.id)}
                        className="btn btn-primary btn-sm flex-1"
                      >
                        Resume Lesson
                      </button>
                      <button
                        onClick={() => onOpenCertificate && onOpenCertificate(userId, course.id)}
                        className="btn btn-secondary btn-sm"
                        title="View Certificate"
                      >
                        🎓 Cert
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Courses */}
          <div className="glass-card p-6">
            <h3 className="text-base font-bold text-primary mb-3">Recommended for Your Growth Path</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {data.recommendedCourses?.map((rec) => (
                <div key={rec.id} className="p-4 rounded-xl border border-white/10 bg-white/5 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-meadow-green uppercase bg-meadow-green/20 px-2 py-0.5 rounded">
                      {rec.category}
                    </span>
                    <h4 className="text-sm font-bold text-primary mt-2">{rec.title}</h4>
                    <p className="text-xs text-secondary mt-1">Est. Duration: {rec.estimatedHours} hrs</p>
                  </div>
                  <button
                    onClick={onOpenCatalog}
                    className="mt-4 text-xs font-semibold text-meadow-green hover:underline text-left"
                  >
                    View in Catalog →
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* AI Recommendations */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                <span>🤖 AI Recommendations</span>
              </h3>
              <button
                onClick={fetchAIRecommendations}
                disabled={aiLoading}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition btn-micro ${
                  aiLoading
                    ? 'bg-white/5 text-secondary cursor-not-allowed'
                    : 'bg-gradient-to-r from-meadow-green to-meadow-green/70 text-white shadow-lg'
                }`}
              >
                {aiLoading ? 'Generating...' : aiRecs ? 'Refresh' : 'Generate with AI'}
              </button>
            </div>

            {aiLoading && (
              <div className="py-10 text-center">
                <div className="w-8 h-8 border-4 border-meadow-green border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-sm text-secondary">AI analyzing weak areas and generating recommendations...</p>
              </div>
            )}

            {aiError && !aiLoading && (
              <p className="text-xs text-meadow-amber font-semibold">Using sample data: {aiError}</p>
            )}

            {!aiLoading && aiRecs && (
              <div className="space-y-3">
                <p className={`text-xs font-black font-mono ${aiRecs.source === 'ai' ? 'text-meadow-green' : 'text-meadow-amber'}`}>
                  {aiRecs.source === 'ai' ? '◆ Powered by Gemini LLM' : '◇ Using sample recommendations'}
                </p>
                <p className="text-xs text-secondary">{aiRecs.summary}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {aiRecs.recommendations?.map((rec) => (
                    <div key={rec.courseId} className="p-4 rounded-xl border border-white/10 bg-white/5">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-meadow-green/20 text-meadow-green text-[10px] font-black rounded">
                          {rec.category}
                        </span>
                        <span className="px-2 py-0.5 bg-white/10 text-secondary text-[10px] font-black rounded">
                          {rec.difficulty}
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-primary mb-1">{rec.title}</h4>
                      <p className="text-xs text-secondary mb-2">{rec.reason}</p>
                      <button
                        onClick={onOpenCatalog}
                        className="text-xs font-semibold text-meadow-green hover:underline text-left"
                      >
                        View in Catalog →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
