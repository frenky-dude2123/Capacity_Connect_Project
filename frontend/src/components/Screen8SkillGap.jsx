import React, { useState, useEffect, useMemo } from 'react';
import './index.css';

const API_BASE_URL = 'http://localhost:5000/api';

function Starfield({ count = 50 }) {
  return useMemo(() => {
    const stars = [];
    for (let i = 0; i < count; i++) {
      const size = Math.random() * 2 + 1;
      const left = Math.random() * 100;
      const top = Math.random() * 100;
      const delay = Math.random() * 3;
      const dur = 2.5 + Math.random() * 2.5;
      stars.push(
        <div
          key={i}
          className="star"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            left: `${left}%`,
            top: `${top}%`,
            opacity: Math.random() * 0.6 + 0.4,
            animationDelay: `${delay}s`,
            animationDuration: `${dur}s`,
          }}
        />
      );
    }
    return stars;
  }, [count]);
}

const DEFAULT_SKILLS = [
  { name: 'Orbital Mechanics', level: 3, target: 5, category: 'Physics' },
  { name: 'Deep Space Comms', level: 2, target: 4, category: 'Engineering' },
  { name: 'Astrodynamics', level: 4, target: 5, category: 'Physics' },
  { name: 'Propulsion Systems', level: 2, target: 4, category: 'Engineering' },
  { name: 'Exoplanet Detection', level: 5, target: 5, category: 'Astronomy' },
  { name: 'Stellar Navigation', level: 3, target: 4, category: 'Operations' },
];

export default function Screen8SkillGap({ courseId = 1, userId = 'astronaut', onBack }) {
  const [skillData, setSkillData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inputSkill, setInputSkill] = useState('');
  const [inputGoalLevel, setInputGoalLevel] = useState(5);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    const fetchGapAnalysis = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/skill-gap/${userId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          const errJson = await response.json().catch(() => ({}));
          throw new Error(errJson.message || `HTTP ${response.status}: Failed to fetch skill gap analysis`);
        }

        const data = await response.json();
        setSkillData(data.skillGap || data);
        setError(null);
      } catch (err) {
        setSkillData({ skills: DEFAULT_SKILLS, userId, analyzedAt: new Date().toISOString() });
        console.error('Skill gap fetch error (using defaults):', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGapAnalysis();
  }, [userId, courseId]);

  const skills = skillData?.skills || DEFAULT_SKILLS;
  const overallGap = useMemo(() => {
    if (!skills || skills.length === 0) return 0;
    const total = skills.reduce((sum, s) => {
      const gap = Math.max(0, (s.target || 5) - (s.level || 0));
      return sum + gap;
    }, 0);
    const maxGap = skills.reduce((sum, s) => sum + (s.target || 5), 0);
    return Math.round(((maxGap - total) / maxGap) * 100);
  }, [skills]);

  const gapCount = skills.filter((s) => (s.target || 5) - (s.level || 0) > 0).length;

  return (
    <div className="theme-trainee relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-orbital-bg">
        <Starfield count={55} />
        <div className="nebula-drift" style={{ width: '380px', height: '380px', background: 'radial-gradient(circle at 10% 20%, rgba(132,94,246,0.16) 0%, transparent 55%)', top: '5%', left: '15%', animationDelay: '-4s' }}></div>
        <div className="nebula-drift" style={{ width: '300px', height: '300px', background: 'radial-gradient(circle at 90% 85%, rgba(96,165,250,0.12) 0%, transparent 55%)', bottom: '10%', right: '12%', animationDelay: '-8s' }}></div>
        <div className="nebula-drift" style={{ width: '220px', height: '220px', background: 'radial-gradient(circle at 45% 55%, rgba(132,94,246,0.10) 0%, transparent 60%)', top: '35%', left: '40%', animationDelay: '-10s' }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 fade-in">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-indigo-500/20">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="inline-flex items-center gap-1.5 text-xs font-black text-indigo-300 hover:text-indigo-200 bg-slate-900/60 hover:bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-lg transition btn-micro"
              >
                ← Back to Dashboard (Page 2)
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              Page 8 • Skill Gap Scanner
            </span>
          </div>
        </div>

        {/* Summary / Overview */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="glass-card border border-indigo-500/20 hud-panel cosmic-card rounded-2xl p-5 text-center">
            <div className="text-3xl font-extrabold text-indigo-400">{overallGap}%</div>
            <div className="text-[10px] font-black uppercase text-space-400 mt-1">Proficiency Score</div>
          </div>
          <div className="glass-card border border-indigo-500/20 hud-panel cosmic-card rounded-2xl p-5 text-center">
            <div className="text-3xl font-extrabold text-amber-400">{gapCount}</div>
            <div className="text-[10px] font-black uppercase text-space-400 mt-1">Skills Needing Work</div>
          </div>
          <div className="glass-card border border-indigo-500/20 hud-panel cosmic-card rounded-2xl p-5 text-center">
            <div className="text-3xl font-extrabold text-emerald-400">{skills.filter((s) => s.level >= s.target).length}</div>
            <div className="text-[10px] font-black uppercase text-space-400 mt-1">Mastered</div>
          </div>
          <div className="glass-card border border-indigo-500/20 hud-panel cosmic-card rounded-2xl p-5 text-center">
            <div className="text-3xl font-extrabold text-teal-400">{skills.length}</div>
            <div className="text-[10px] font-black uppercase text-space-400 mt-1">Total Skills Tracked</div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="mt-6 py-20 flex items-center justify-center">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-4 text-sm font-medium text-space-300">Analyzing skill proficiency...</p>
              <span className="text-xs text-space-500">Target: http://localhost:5000/api/skill-gap/{userId}</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="mt-6 p-6 bg-gradient-to-b from-yellow-900/20 to-indigo-950/30 border border-yellow-800/50 rounded-2xl text-center max-w-md mx-auto">
            <div className="w-12 h-12 bg-indigo-900/30 text-amber-300 rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-lg">
              ⚠
            </div>
            <h3 className="text-base font-bold text-amber-200">Analysis Unavailable</h3>
            <p className="text-xs text-amber-400 mt-1">{error}</p>
            <p className="text-xs text-amber-400/60 mt-2">Using default skill data sample.</p>
          </div>
        )}

        {/* Skill Gap Matrix */}
        {!loading && (
          <div className="mt-8 glass-card border border-indigo-500/20 hud-panel cosmic-card rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-indigo-500/20 flex items-center justify-between">
              <h3 className="text-sm font-black uppercase text-space-300">
                Skill Proficiency Matrix
              </h3>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-black bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/30 transition btn-micro"
              >
                + Add Skill
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-900/40 border-b border-indigo-500/10">
                    <th className="text-left py-3 px-4 text-xs font-black uppercase text-space-400">Skill Name</th>
                    <th className="text-left py-3 px-4 text-xs font-black uppercase text-space-400">Category</th>
                    <th className="py-3 px-4 text-xs font-black uppercase text-space-400">Current Level</th>
                    <th className="py-3 px-4 text-xs font-black uppercase text-space-400">Target Level</th>
                    <th className="py-3 px-4 text-xs font-black uppercase text-space-400">Gap</th>
                    <th className="py-3 px-4 text-xs font-black uppercase text-space-400">Recommended Courses</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-indigo-500/10">
                  {skills.map((skill, idx) => {
                    const level = skill.level || 0;
                    const target = skill.target || 5;
                    const gap = Math.max(0, target - level);
                    const progress = Math.round((level / target) * 100);
                    return (
                      <tr key={idx} className="hover:bg-slate-900/30 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                            <span className="text-sm font-bold text-white">{skill.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs text-space-300">{skill.category}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-indigo-400">{level}/5</span>
                            <div className="w-16 h-1.5 rounded-full bg-slate-800/50 overflow-hidden">
                              <div
                                className="h-full bg-indigo-400 rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm font-black text-cyan-400">{target}/5</span>
                        </td>
                        <td className={`py-3 px-4 text-sm font-black ${
                          gap === 0
                            ? 'text-emerald-400'
                            : gap <= 1
                            ? 'text-amber-400'
                            : 'text-red-400'
                        }`}>
                          {gap === 0 ? '✓ Mastered' : `-${gap} gap`}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                const recs = skill.recommendedCourses || [
                                  `Advanced ${skill.name} Mastery Program`,
                                  `${skill.name} Deep Dive Workshop`,
                                ];
                                alert(recs.join('\n'));
                              }}
                              className="px-3 py-1.5 rounded-lg text-xs font-black bg-slate-900/60 hover:bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 transition btn-micro"
                            >
                              📋 View
                            </button>
                          </div>
                        </td>
                    </tr>
                    );
                  })}
                  </tbody>
                </table>
              </div>
            </div>
        )}

        {/* Add Skill Modal (Simple inline form) */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="glass-card border border-indigo-500/30 hud-panel cosmic-card rounded-2xl w-full max-w-md p-6">
              <h3 className="text-lg font-bold text-white mb-4">Add New Skill</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase text-space-300 mb-1">
                    Skill Name
                  </label>
                  <input
                    type="text"
                    value={inputSkill}
                    onChange={(e) => setInputSkill(e.target.value)}
                    placeholder="e.g. Gravitational Wave Analysis"
                    className="w-full px-3 py-2 bg-slate-900/50 border border-indigo-500/20 rounded-lg text-sm text-white placeholder-space-500 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-space-300 mb-1">
                    Current Level
                  </label>
                  <select
                    value={inputGoalLevel}
                    onChange={(e) => setInputGoalLevel(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900/50 border border-indigo-500/20 rounded-lg text-sm text-white focus:ring-indigo-500"
                  >
                    <option value={1}>1 - Novice</option>
                    <option value={2}>2 - Basic</option>
                    <option value={3}>3 - Competent</option>
                    <option value={4}>4 - Proficient</option>
                    <option value={5}>5 - Expert</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-indigo-500/20">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 rounded-lg text-xs font-black bg-slate-800 text-space-300 border border-slate-700 btn-micro"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!inputSkill.trim()) return;
                    try {
                      await fetch(`${API_BASE_URL}/skill-gap/${userId}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          skillName: inputSkill,
                          level: inputGoalLevel,
                          category: 'Custom',
                          target: 5,
                        }),
                      });
                      const newSkill = {
                        name: inputSkill,
                        level: inputGoalLevel,
                        target: 5,
                        category: 'Custom',
                      };
                      setSkillData({
                        ...skillData,
                        skills: [...skills, newSkill],
                      });
                      setShowAddForm(false);
                      setInputSkill('');
                      setInputGoalLevel(5);
                    } catch (err) {
                      alert(`Could not add skill: ${err.message}. Using sample data.`);
                      const newSkill = {
                        name: inputSkill,
                        level: inputGoalLevel,
                        target: 5,
                        category: 'Custom',
                      };
                      setSkillData({
                        ...skillData,
                        skills: [...skills, newSkill],
                      });
                      setShowAddForm(false);
                      setInputSkill('');
                      setInputGoalLevel(5);
                    }
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-black bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/30 btn-micro"
                >
                  Add Skill
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
