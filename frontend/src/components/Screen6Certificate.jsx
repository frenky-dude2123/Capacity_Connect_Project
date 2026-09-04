import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:5000/api/certificate';

/**
 * Screen 6: Certificate Viewer Stitch Component
 * Connects to: GET http://localhost:5000/api/certificate/:userId/:courseId
 */
export default function Screen6Certificate({ userId = 'u_learner1', courseId = 1, onBackToDashboard }) {
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCertificate = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/${userId}/${courseId}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}: Certificate could not be found`);
      const data = await response.json();
      setCert(data);
    } catch (err) {
      setError(err.message || 'Error communicating with certificate verification service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificate();
  }, [userId, courseId]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <button
          onClick={onBackToDashboard}
          className="text-xs font-semibold text-slate-600 hover:text-blue-900 bg-white border border-slate-200 px-3.5 py-1.5 rounded-lg transition"
        >
          ← Back to Dashboard (Screen 2)
        </button>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900">
          Topic 6 • Screen 6 (Certificate)
        </span>
      </div>

      {loading && (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-3 text-sm text-slate-600">Retrieving official digital certificate...</p>
        </div>
      )}

      {error && (
        <div className="p-6 bg-red-50 text-red-700 text-xs rounded-2xl text-center">
          <p className="font-bold text-sm">Certificate Retrieval Failed</p>
          <p className="mt-1">{error}</p>
          <button onClick={fetchCertificate} className="mt-3 px-4 py-1.5 bg-red-600 text-white rounded-lg font-semibold">
            Retry
          </button>
        </div>
      )}

      {!loading && !error && cert && (
        <div className="space-y-6">
          {/* Certificate Frame with decorative borders */}
          <div className="bg-white rounded-3xl border-8 border-slate-100 shadow-2xl p-8 sm:p-14 text-center relative overflow-hidden">
            {/* Watermark badge */}
            <div className="absolute -right-8 -bottom-8 w-48 h-48 rounded-full bg-blue-50/60 -z-0 pointer-events-none flex items-center justify-center text-7xl text-blue-900/10 font-serif font-black">
              CC
            </div>

            {/* Header Emblem */}
            <div className="w-16 h-16 rounded-2xl bg-blue-900 text-white mx-auto flex items-center justify-center text-2xl font-bold shadow-lg shadow-blue-900/20 mb-6">
              🎓
            </div>

            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Capacity Connect Enterprise Certification
            </p>

            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900 mt-2">
              Certificate of Completion
            </h1>

            <p className="text-xs sm:text-sm text-slate-500 mt-3">This officially certifies that</p>

            <h2 className="text-2xl sm:text-3xl font-bold text-blue-950 mt-2 underline decoration-blue-300 underline-offset-8">
              {cert.studentName}
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 mt-4 max-w-lg mx-auto leading-relaxed">
              has successfully fulfilled all curriculum requirements, continuous assessments, and practical capstone projects for
            </p>

            <div className="my-6 p-4 rounded-xl bg-slate-50 border border-slate-200 inline-block max-w-xl">
              <h3 className="text-lg font-extrabold text-slate-900">{cert.courseTitle}</h3>
              <p className="text-xs text-emerald-700 font-semibold mt-1">Grade: {cert.grade}</p>
            </div>

            {/* Validated Skills */}
            {cert.skillsValidated && (
              <div className="flex flex-wrap justify-center gap-1.5 mb-8 max-w-md mx-auto">
                {cert.skillsValidated.map((skill, idx) => (
                  <span key={idx} className="text-[11px] font-semibold bg-blue-50 text-blue-900 px-2.5 py-1 rounded-md">
                    ✓ {skill}
                  </span>
                ))}
              </div>
            )}

            {/* Footer Signatures */}
            <div className="pt-8 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Issue Authority</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{cert.issueAuthority}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Date Issued: {cert.completionDate}</p>
              </div>
              <div className="sm:text-right">
                <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Certificate ID</p>
                <p className="text-xs font-mono font-bold text-blue-900 mt-0.5">{cert.certificateId}</p>
                <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Cryptographically Verified</p>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex justify-center gap-3">
            <button
              onClick={() => window.print()}
              className="px-6 py-2.5 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold shadow transition flex items-center gap-2"
            >
              <span>🖨️ Print Certificate</span>
            </button>
            <a
              href={cert.verificationUrl}
              target="_blank"
              rel="noreferrer"
              className="px-6 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-2"
            >
              <span>🔗 Verify On Ledger</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
