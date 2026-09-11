import React, { useState, useEffect, useMemo } from 'react';
import './index.css';

const API_BASE_URL = 'http://localhost:5000/api/user/dashboard';
const AI_API_URL = 'http://localhost:5000/api/ai';

function Starfield({ count = 60 }) {
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
    <div className="theme-trainee relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-orbital-bg">
        <Starfield count={60} />
        <div className="nebula-drift" style={{ width: '300px', height: '300px', background: 'radial-gradient(circle at 30% 30%, rgba(45,212,191,0.15) 0%, transparent 60%)', top: '10%', left: '20%', animationDelay: '0s' }}></div>
        <div className="nebula-drift" style={{ width: '250px', height: '250px', background: 'radial-gradient(circle at 70% 30%, rgba(45,212,191,0.12) 0%, transparent 60%)', bottom: '15%', right: '10%', animationDelay: '-5s' }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 fade-in">
        {/* Top Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-teal-500/20">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-400/30">
                Topic 2 • Trainee Dashboard
              </span>
              <span className="text-xs text-slate-900 dark:text-space-400">Live API: http://localhost:5000/api/user/dashboard/{userId}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
              Welcome back, {data?.userName || 'Jane Doe'}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-900 dark:text-space-300 mt-1">
              Track your enterprise engineering pathways, capacity readiness, and certificates.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchDashboard}
              className="px-3 py-1.5 bg-slate-900/60 hover:bg-teal-500/10 border border-teal-500/20 text-teal-300 rounded-lg text-xs font-bold transition btn-micro"
            >
              <span>↻</span> Refresh Data
            </button>
            <button
              onClick={onOpenCatalog}
              className="px-3.5 py-1.5 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-teal-500/30 transition btn-micro"
            >
              Explore Catalog →
            </button>
          </div>
        </div>

        {loading && (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto shadow-lg shadow-teal-500/50"></div>
            <p className="mt-3 text-sm font-medium text-slate-900 dark:text-space-300">Loading your learner capacity profile...</p>
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
            {/* KPI Metrics Strip with stat-card-glow */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="glass-card border border-teal-500/20 p-5 rounded-2xl hud-panel stat-card-glow">
                <span className="text-[11px] font-bold uppercase text-slate-900 dark:text-space-400">Capacity Readiness</span>
                <p className="text-2xl sm:text-3xl font-extrabold text-teal-400 mt-1">
                  {data.metrics?.capacityScore || 94}%
                </p>
                <span className="text-[11px] text-emerald-400 font-semibold">↑ +4% vs last quarter</span>
              </div>

              <div className="glass-card border border-teal-500/20 p-5 rounded-2xl hud-panel">
                <span className="text-[11px] font-bold uppercase text-slate-900 dark:text-space-400">Active Courses</span>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {data.metrics?.activeCourses || data.enrolledCourses?.length}
                </p>
                <span className="text-[11px] text-slate-900 dark:text-space-400">Curriculums underway</span>
              </div>

              <div className="glass-card border border-teal-500/20 p-5 rounded-2xl hud-panel">
                <span className="text-[11px] font-bold uppercase text-slate-900 dark:text-space-400">Training Logged</span>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {data.metrics?.trainingHours || 42.5} <span className="text-sm font-normal text-slate-900 dark:text-space-400">hrs</span>
                </p>
                <span className="text-[11px] text-slate-900 dark:text-space-400">Total learning time</span>
              </div>

              <div className="glass-card border border-amber-500/20 p-5 rounded-2xl hud-panel stat-card-glow">
                <span className="text-[11px] font-bold uppercase text-slate-900 dark:text-space-400">Certificates Earned</span>
                <p className="text-2xl sm:text-3xl font-extrabold text-amber-400 mt-1">
                  {data.metrics?.completedCertifications || 2}
                </p>
                <span className="text-[11px] text-slate-900 dark:text-space-400">Accredited skills</span>
              </div>
            </div>

            {/* Enrolled Courses Section - Course Catalog */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Enrolled Engineering Pathways</h2>
                <span className="text-xs text-slate-900 dark:text-space-400">{data.enrolledCourses?.length} Pathways</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {data.enrolledCourses?.map((course) => (
                  <div key={course.id} className="glass-card border border-teal-500/20 hud-panel p-6 flex flex-col justify-between cosmic-card">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-300 uppercase">
                          {course.category}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300">
                          {course.status}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                        {course.title}
                      </h3>
                      <p className="text-xs text-slate-900 dark:text-space-400 mt-2">Instructor: {course.instructor}</p>

                      {/* Progress Bar */}
                      <div className="mt-4">
                        <div className="flex justify-between text-xs font-semibold text-slate-900 dark:text-space-300 mb-1">
                          <span>Course Progress</span>
                          <span className="text-teal-400">{course.progressPercent}%</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-teal-500 to-cyan-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${course.progressPercent}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-teal-500/10 flex items-center gap-2">
                      <button
                        onClick={() => onOpenCourse && onOpenCourse(course.id)}
                        className="flex-1 py-2 text-center rounded-lg bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-teal-500/30 transition btn-micro"
                      >
                        Resume Lesson ▶
                      </button>
                      <button
                        onClick={() => onOpenCertificate && onOpenCertificate(userId, course.id)}
                        className="px-3 py-2 text-center rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-400/30 transition"
                        title="View Certificate"
                      >
                        🎓 Cert
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Courses Strip - Course Catalog */}
            <div className="glass-card border border-teal-500/20 hud-panel rounded-2xl p-6 cosmic-card">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">
                Recommended for Your Growth Path
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {data.recommendedCourses?.map((rec) => (
                  <div key={rec.id} className="p-4 rounded-xl border border-teal-500/10 bg-slate-900/50 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-teal-300 uppercase bg-teal-500/20 px-2 py-0.5 rounded">
                        {rec.category}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-2">{rec.title}</h4>
                      <p className="text-xs text-slate-900 dark:text-space-400 mt-1">Est. Duration: {rec.estimatedHours} hrs</p>
                    </div>
                    <button
                      onClick={onOpenCatalog}
                      className="mt-4 text-xs font-semibold text-teal-400 hover:underline text-left"
                    >
                      View in Catalog →
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Course Recommendations (Topic 9) */}
            <div className="glass-card border border-cyan-500/20 hud-panel rounded-2xl p-6 cosmic-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="text-cyan-400">🤖 AI Recommendations</span>
                </h3>
                <button
                  onClick={fetchAIRecommendations}
                  disabled={aiLoading}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition btn-micro ${
                    aiLoading
                      ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/30'
                  }`}
                >
                  {aiLoading ? 'Generating...' : aiRecs ? 'Refresh' : 'Generate with AI'}
                </button>
              </div>

              {aiLoading && (
                <div className="py-10 text-center">
                  <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3 shadow-lg shadow-cyan-500/50"></div>
                  <p className="text-sm text-slate-900 dark:text-space-300">AI analyzing weak areas and generating recommendations...</p>
                </div>
              )}

              {aiError && !aiLoading && (
                <p className="text-xs text-amber-400 font-semibold">Using sample data: {aiError}</p>
              )}

              {!aiLoading && aiRecs && (
                <div className="space-y-3">
                  <p className={`text-xs font-black font-mono ${aiRecs.source === 'ai' ? 'text-cyan-400' : 'text-amber-400'}`}>
                    {aiRecs.source === 'ai' ? '◆ Powered by Gemini LLM' : '◇ Using sample recommendations'}
                  </p>
                  <p className="text-xs text-slate-900 dark:text-space-400">{aiRecs.summary}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {aiRecs.recommendations?.map((rec) => (
                      <div key={rec.courseId} className="p-4 rounded-xl border border-cyan-500/20 bg-slate-900/50 hover:bg-slate-900/80 transition-all">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-0.5 bg-teal-500/20 text-teal-300 text-[10px] font-black rounded">
                            {rec.category}
                          </span>
                          <span className="px-2 py-0.5 bg-slate-800 text-slate-900 dark:text-space-300 text-[10px] font-black rounded">
                            {rec.difficulty}
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white mb-1">{rec.title}</h4>
                        <p className="text-xs text-slate-900 dark:text-space-400 mb-2 line-clamp-2">{rec.reason}</p>
                        <button
                          onClick={onOpenCatalog}
                          className="text-xs font-semibold text-cyan-400 hover:underline text-left"
                        >
                          View in Catalog →
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!aiLoading && !aiRecs && !aiError && (
                <p className="text-xs text-slate-900 dark:text-space-400">Click "Generate with AI" to get personalized recommendations based on your weak quiz areas.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
