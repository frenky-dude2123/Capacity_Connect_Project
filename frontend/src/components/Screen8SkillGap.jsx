import React, { useState } from 'react';

const API_BASE_URL = 'http://localhost:5000/api/ai';

export default function Screen8SkillGap({ userId, onBackToDashboard }) {
  const [resumeText, setResumeText] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    if (!resumeText.trim()) {
      setError('Please enter resume text or upload a profile.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/skill-gap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, resumeText }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}: Skill gap analysis failed`);
      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      setError(err.message || 'Error connecting to AI skill gap service');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <span className="px-3 py-1.5 rounded-full text-xs font-black bg-gradient-to-r from-meadow-green/20 to-meadow-green/60 text-meadow-green border border-meadow-green/30">
            AI Skill Gap Scanner
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary mt-2">Resume / Skill Gap Analysis</h1>
          <p className="text-xs sm:text-sm text-secondary mt-1">
            Upload your profile or paste resume text for AI-powered skill gap analysis and personalized pathway recommendations.
          </p>
        </div>
        <button onClick={onBackToDashboard} className="px-4 py-2 bg-white/5 border border-white/10 text-secondary rounded-xl hover:bg-meadow-green/10 text-xs font-black btn-micro">
          ← Back
        </button>
      </div>

      <div className="glass-card p-6 space-y-4 border border-white/10 shadow-lg">
        <div className="form-group">
          <label className="form-label">Resume Text / Profile Description</label>
          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste your resume text or describe your skills and experience here..."
            className="form-textarea"
            rows={8}
          />
        </div>

        {error && (
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        )}

        <button
          onClick={handleAnalyze}
          disabled={loading}
          className={`btn btn-primary ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? 'Analyzing...' : 'Analyze Skill Gap'}
        </button>

        {analysis && (
          <div className="mt-6 space-y-4">
            <div className="p-4 rounded-xl border border-meadow-green/20 bg-meadow-green/5">
              <h3 className="text-sm font-black text-primary mb-2">Analysis Results</h3>
              <p className="text-xs text-secondary whitespace-pre-wrap">{analysis.summary || analysis}</p>
            </div>
            {analysis.recommendations && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.recommendations.map((rec, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-white/10 bg-white/5">
                    <h4 className="text-sm font-black text-primary mb-1">{rec.title}</h4>
                    <p className="text-xs text-secondary">{rec.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
