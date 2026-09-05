import React, { useState } from 'react';

const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Screen 8: Resume / Skill Gap Scanner
 * Connects to: POST http://localhost:5000/api/ai/skill-gap-analysis
 * Expected Data: { detectedSkills, missingSkills, recommendedCourses, suggestedEnrollments, summary }
 */
export default function Screen8SkillGap({ userId = 'u_learner1', onBackToDashboard, onEnrollCourse }) {
  const [resumeText, setResumeText] = useState('');
  const [fileName, setFileName] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [enrolled, setEnrolled] = useState([]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setResumeText(ev.target.result);
    reader.readAsText(file);
  };

  const handleScan = async () => {
    if (!resumeText.trim()) {
      setError('Please paste your resume/profile text or upload a file.');
      return;
    }
    setScanning(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch(`${API_BASE_URL}/ai/skill-gap-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, userId }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}: Skill gap analysis failed`);
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message || 'Error connecting to AI skill gap service');
    } finally {
      setScanning(false);
    }
  };

  const handleEnroll = (courseId, title) => {
    if (enrolled.includes(courseId)) return;
    setEnrolled([...enrolled, courseId]);
    if (onEnrollCourse) onEnrollCourse(courseId, title);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex items-center justify-between pb-6 border-b border-slate-200">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-900">
            Topic 10 • Screen 8
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            Resume / Skill Gap Scanner
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Upload your profile or paste resume text. AI auto-enrolls you into required pathways.
          </p>
        </div>
        <button
          onClick={onBackToDashboard}
          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
        >
          ← Back to Dashboard
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-slate-700">Upload Resume:</label>
          <input
            type="file"
            accept=".txt,.pdf,.doc,.docx"
            onChange={handleFileChange}
            className="text-xs file:mr-3 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:bg-indigo-50 file:text-indigo-800 hover:file:bg-indigo-100"
          />
          {fileName && <span className="text-xs text-slate-500">{fileName}</span>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Or paste resume text:
          </label>
          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste your resume or profile text here..."
            className="w-full h-32 px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm resize-y focus:ring-2 focus:ring-indigo-300"
            disabled={scanning}
          />
        </div>

        {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}

        <button
          onClick={handleScan}
          disabled={scanning || !resumeText.trim()}
          className={`px-6 py-2.5 rounded-xl text-xs font-bold shadow transition ${
            scanning || !resumeText.trim()
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          }`}
        >
          {scanning ? 'Scanning with AI...' : 'Scan for Skills & Recommend Pathways'}
        </button>
      </div>

      {scanning && (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-3 text-sm font-medium text-slate-600">
            AI analyzing resume and identifying skill gaps...
          </p>
        </div>
      )}

      {!scanning && result && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Scan Results</h2>
              <span
                className={`text-xs px-2 py-1 rounded ${
                  result.source === 'ai'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {result.source === 'ai' ? 'AI Generated' : 'Sample Data'}
              </span>
            </div>
            <p className="text-sm text-slate-600 mb-4">{result.summary}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-2">
                  Detected Skills ({result.detectedSkills?.length || 0})
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {result.detectedSkills?.map((s, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 bg-emerald-50 text-emerald-800 text-xs rounded-lg"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-2">
                  Missing Skills ({result.missingSkills?.length || 0})
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {result.missingSkills?.map((s, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 bg-red-50 text-red-800 text-xs rounded-lg"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              Recommended Courses for Auto-Enrollment
            </h3>
            <div className="space-y-3">
              {result.recommendedCourses?.map((c) => {
                const isEnrolled = enrolled.includes(c.courseId);
                const priorityColor =
                  c.priority === 'high'
                    ? 'bg-red-100 text-red-800'
                    : c.priority === 'medium'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-blue-100 text-blue-800';
                return (
                  <div
                    key={c.courseId}
                    className="p-4 rounded-xl border border-slate-200 hover:bg-slate-50"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded">
                            {c.category}
                          </span>
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${priorityColor}`}>
                            {c.priority}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Match: {c.matchScore}%
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 mb-1">
                          {c.title}
                        </h4>
                        <p className="text-xs text-slate-600 mb-2">{c.reason}</p>
                      </div>
                      <button
                        onClick={() => handleEnroll(c.courseId, c.title)}
                        disabled={isEnrolled}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                          isEnrolled
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                      >
                        {isEnrolled ? 'Enrolled ✓' : 'Auto-Enroll'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {result.suggestedEnrollments?.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-base font-bold text-slate-900 mb-3">
                Suggested Learning Pathways
              </h3>
              <div className="space-y-2">
                {result.suggestedEnrollments.map((e, i) => (
                  <div
                    key={`${e.courseId}-${i}`}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100"
                  >
                    <span className="w-6 h-6 rounded-full bg-indigo-900 text-white flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </span>
                    <div>
                      <span className="text-xs uppercase font-bold text-slate-400">
                        {e.pathway}
                      </span>
                      <p className="text-sm font-semibold text-slate-900">
                        {e.title}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
