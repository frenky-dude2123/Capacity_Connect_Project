import React, { useState, useEffect, useMemo } from 'react';
import './index.css';

const API_BASE_URL = 'http://localhost:5000/api/courses';

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

export default function Screen6Certificate({ courseId = 1, courseTitle = 'Advanced Astrophysics', userName = 'Alex Morgan', userEmail = 'alex.morgan@cosmic.edu', issueDate = 'September 2026', onBack, onDownload }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchDetail = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/${courseId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        });
        if (!cancelled) {
          if (!response.ok) {
            const errJson = await response.json().catch(() => ({}));
            throw new Error(errJson.message || `HTTP ${response.status}: Failed to fetch course detail for certificate`);
          }
          const data = await response.json();
          setDetail(data.course || data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Error communicating with backend service on port 5000');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchDetail();

    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const certificateTitle = detail?.title || courseTitle;
  const instructor = detail?.instructor || 'Dr. Elena Vasquez';

  return (
    <div className="theme-trainee relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-orbital-bg">
        <Starfield count={55} />
        <div className="nebula-drift" style={{ width: '420px', height: '420px', background: 'radial-gradient(circle at 20% 80%, rgba(250,211,134,0.16) 0%, transparent 55%)', bottom: '15%', right: '10%', animationDelay: '-3s' }}></div>
        <div className="nebula-drift" style={{ width: '300px', height: '300px', background: 'radial-gradient(circle at 85% 15%, rgba(52,211,153,0.12) 0%, transparent 50%)', top: '8%', left: '12%', animationDelay: '-6s' }}></div>
        <div className="nebula-drift" style={{ width: '220px', height: '220px', background: 'radial-gradient(circle at 50% 50%, rgba(245,158,11,0.14) 0%, transparent 55%)', top: '40%', left: '35%', animationDelay: '-9s' }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 fade-in">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-amber-500/20">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 hover:text-amber-200 bg-slate-900/60 hover:bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg transition btn-micro"
              >
                ← Back to Dashboard (Page 2)
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
              Page 6 • Certificate
            </span>
            {detail === null && !loading && (
              <span className="text-xs text-space-400 font-mono hidden sm:inline">
                Using default course data (id={courseId})
              </span>
            )}
          </div>
        </div>

        {/* Loading shim */}
        {loading && (
          <div className="py-16 flex items-center justify-center">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-3 text-sm font-medium text-space-300">Loading course metadata...</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="my-10 p-6 bg-gradient-to-b from-yellow-900/20 to-amber-950/30 border border-amber-800/50 rounded-2xl text-center max-w-md mx-auto">
            <div className="w-12 h-12 bg-amber-900/30 text-amber-300 rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-lg">
              ⚠
            </div>
            <h3 className="text-base font-bold text-amber-200">Course Metadata Unavailable</h3>
            <p className="text-xs text-amber-400 mt-1">{error}</p>
            <p className="text-xs text-amber-400/60 mt-2">
              Displaying certificate with default course title.
            </p>
          </div>
        )}

        {/* Certificate Stage */}
        {!loading && (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Certificate Window — gold/emerald theme */}
            <div
              className="relative cosmic-card rounded-2xl overflow-hidden p-8 sm:p-12 md:p-16 text-center"
              style={{
                background:
                  'linear-gradient(135deg, #1a1206 0%, #142a2a 45%, #1a1206 100%)',
                border: '1px solid rgba(250,211,134,0.25)',
              }}
            >
              {/* Corner accent: gold filigree */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                  className="nebula-drift"
                  style={{
                    width: '280px',
                    height: '280px',
                    top: '-140px',
                    left: '-140px',
                    background: 'radial-gradient(circle, rgba(250,211,134,0.08) 0%, transparent 60%)',
                  }}
                />
                <div
                  className="nebula-drift"
                  style={{
                    width: '220px',
                    height: '220px',
                    bottom: '-110px',
                    right: '-110px',
                    background: 'radial-gradient(circle, rgba(52,211,153,0.06) 0%, transparent 60%)',
                  }}
                />
                {/* Animated star glints */}
                <div className="star" style={{ width: '3px', height: '3px', top: '8%', left: '12%', animationDuration: '4s' }} />
                <div className="star" style={{ width: '2px', height: '2px', top: '14%', right: '18%', animationDuration: '6s', animationDelay: '1s' }} />
                <div className="star" style={{ width: '2px', height: '2px', bottom: '12%', left: '22%', animationDuration: '5s', animationDelay: '2s' }} />
              </div>

              {/* Seal / Logo */}
              <div className="relative z-10 mb-6">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 flex items-center justify-center shadow-xl shadow-amber-500/40">
                  <span className="text-3xl">✦</span>
                </div>
                <div className="mt-2 text-xs font-black uppercase tracking-widest text-amber-400/80">
                  Certificate of Completion
                </div>
              </div>

              {/* University / Organization name */}
              <div className="relative z-10 mb-4">
                <span className="text-xs font-black tracking-[0.3em] uppercase text-space-400/60">
                  Cosmic Academy
                </span>
              </div>

              {/* Main title */}
              <div className="relative z-10 mb-8">
                <p className="text-sm text-amber-300 font-mono mb-2">
                  This is to certify that
                </p>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-200 mb-2">
                  {userName}
                </h2>
                <p className="text-sm text-amber-300 font-mono">
                  has successfully completed the course
                </p>
              </div>

              {/* Course title box — gold band */}
              <div className="relative z-10 mb-8">
                <div className="inline-block bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-400/30 px-6 py-3 rounded-2xl">
                  <span className="text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-300">
                    {certificateTitle}
                  </span>
                </div>
              </div>

              {/* Details row */}
              <div className="relative z-10 mb-10 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-space-300">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-black uppercase text-amber-400/70">Instructor</span>
                  <span className="font-mono text-amber-200">{instructor}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-black uppercase text-amber-400/70">Date Issued</span>
                  <span className="font-mono text-amber-200">{issueDate}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-black uppercase text-amber-400/70">Verification</span>
                  <span className="font-mono text-amber-200">CERT-{courseId}-{userName.replace(/\s+/g, '').substring(0, 8).toUpperCase()}</span>
                </div>
              </div>

              {/* Signature area */}
              <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-8 mb-8">
                <div className="flex items-end gap-2">
                  <div className="w-24 h-px bg-amber-400/30"></div>
                  <div>
                    <span className="block text-xs text-amber-400/60">Dr. Elena Vasquez</span>
                    <span className="block text-[10px] text-space-500">Lead Astrophysics Instructor</span>
                  </div>
                </div>
                <div className="w-1 h-10 bg-amber-400/10"></div>
                <div className="flex items-end gap-2">
                  <div className="w-24 h-px bg-amber-400/30"></div>
                  <div>
                    <span className="block text-xs text-amber-400/60">Cosmic Academy Board</span>
                    <span className="block text-[10px] text-space-500">Academic Director</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => {
                  if (onDownload) {
                    onDownload();
                  } else {
                    alert('In production this would download a PDF certificate.');
                  }
                }}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 shadow-lg shadow-amber-500/30 transition btn-micro flex items-center justify-center gap-2"
              >
                <span>📥 Download PDF Certificate</span>
              </button>
              <button
                onClick={() => {
                  const url = `http://localhost:5000/api/courses/${courseId}/certificate/verify?user=${encodeURIComponent(userName)}`;
                  alert(`Certificate Verification URL:\n${url}`);
                }}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-black bg-slate-900/60 hover:bg-amber-500/10 text-amber-300 border border-amber-500/20 transition btn-micro flex items-center justify-center gap-2"
              >
                <span>🔗 Verify Certificate</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
