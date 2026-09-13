import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:5000/api';

export default function Screen6Certificate({ userId, courseId, onBackToDashboard }) {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCertificates = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/certificates/${userId}`, {
          headers: { 'Accept': 'application/json' }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}: Failed to fetch certificates`);
        const data = await response.json();
        setCertificates(Array.isArray(data) ? data : (data.certificates || []));
      } catch (err) {
        setError(err.message || 'Error fetching certificates');
      } finally {
        setLoading(false);
      }
    };
    fetchCertificates();
  }, [userId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-6 border-b border-white/10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary">My Certifications</h1>
          <p className="text-sm text-secondary mt-1">View and download your earned certificates</p>
        </div>
        <button onClick={onBackToDashboard} className="px-4 py-2 bg-white/5 border border-white/10 text-secondary rounded-xl text-xs font-black btn-micro hover:bg-meadow-green/10">
          ← Back to Dashboard
        </button>
      </div>

      {loading && (
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 border-4 border-meadow-green border-t-transparent rounded-full animate-spin shadow-lg"></div>
          <p className="mt-4 text-sm font-medium text-secondary">Loading certificates...</p>
        </div>
      )}

      {error && !loading && (
        <div className="my-8 p-6 bg-red-900/20 border border-red-800/50 rounded-2xl text-center max-w-lg mx-auto">
          <h3 className="text-base font-bold text-red-300">Failed to Load Certificates</h3>
          <p className="text-xs text-red-400 mt-1">{error}</p>
        </div>
      )}

      {!loading && !error && certificates.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🏆</div>
          <div className="empty-title">No Certificates Yet</div>
          <p className="text-secondary">Complete courses to earn your first certification.</p>
        </div>
      )}

      {!loading && !error && certificates.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((cert) => (
            <div key={cert.id} className="cert-card">
              <div className="cert-icon">🏆</div>
              <h3 className="cert-title">{cert.title || 'Certificate of Completion'}</h3>
              <p className="cert-text">Issued to: {cert.userName || userId}</p>
              <p className="cert-text">Date: {cert.issueDate || new Date().toLocaleDateString()}</p>
              <p className="cert-text">Course ID: {cert.courseId}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
