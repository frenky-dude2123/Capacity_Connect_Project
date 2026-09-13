import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:5000/api/courses';

export default function Screen10CourseMaterials({ userId, courseId, onBackToDashboard }) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMaterials = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/materials/${courseId || 1}`, {
          headers: { 'Accept': 'application/json' }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        setMaterials(Array.isArray(data) ? data : (data.materials || []));
      } catch (err) {
        console.error('Materials error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMaterials();
  }, [courseId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-6 border-b border-white/10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary">Course Materials</h1>
          <p className="text-sm text-secondary mt-1">Access learning materials and resources</p>
        </div>
        <button onClick={onBackToDashboard} className="px-4 py-2 bg-white/5 border border-white/10 text-secondary rounded-xl text-xs font-black btn-micro hover:bg-meadow-green/10">
          ← Back
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 border-4 border-meadow-green border-t-transparent rounded-full animate-spin shadow-lg"></div>
          <p className="mt-4 text-sm font-medium text-secondary">Loading materials...</p>
        </div>
      ) : materials.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📁</div>
          <div className="empty-title">No Materials Yet</div>
          <p className="text-secondary">Course materials will appear here when available.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {materials.map((material) => (
            <div key={material.id} className="glass-card p-4 rounded-xl border border-white/10 flex items-center justify-between gap-3 hover:bg-meadow-green/5 transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{material.type === 'video' ? '🎥' : material.type === 'notes' ? '📝' : '📄'}</span>
                <div>
                  <h3 className="text-sm font-bold text-primary">{material.title}</h3>
                  <p className="text-xs text-secondary">{material.description}</p>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-white/10 text-secondary text-[10px] font-black rounded">{material.type}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
