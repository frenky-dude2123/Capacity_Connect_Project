import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function PublicHomepage() {
  const navigate = useNavigate();
  const handleAuth = () => {
  console.log('handleAuth called');
  navigate('/login');
};
  return (
    <div className="public-layout meadow-bg-login">
      <div className="bg-scrim"></div>
      <nav className="public-nav">
        <div className="flex items-center gap-2">
          <div className="brand-icon">CC</div>
          <span className="brand-text">Capacity Connect</span>
        </div>
        <div>
          <button onClick={handleAuth} className="btn btn-primary btn-sm">
            Sign In
          </button>
        </div>
      </nav>
      <div className="public-content">
        <div className="hero-section">
          <h1 className="hero-title">
            Learn Without <span className="highlight">Limits</span>
          </h1>
          <p className="hero-subtitle">
            A modern learning management platform for professional development, 
            structured learning pathways, and accredited certifications.
          </p>
          <div className="hero-actions">
            <button onClick={handleAuth} className="btn btn-primary btn-lg">
              Get Started
            </button>
            <button onClick={handleAuth} className="btn btn-secondary btn-lg">
              Sign In
            </button>
          </div>
          <div className="features-grid">
            <div className="glass-card feature-card">
              <div className="feature-icon">📚</div>
              <h3 className="feature-title">Expert-Led Courses</h3>
              <p className="feature-desc">Learn from industry experts with real-world experience and practical knowledge.</p>
            </div>
            <div className="glass-card feature-card">
              <div className="feature-icon">🏆</div>
              <h3 className="feature-title">Certifications</h3>
              <p className="feature-desc">Earn recognized certifications that validate your skills and advance your career.</p>
            </div>
            <div className="glass-card feature-card">
              <div className="feature-icon">🤖</div>
              <h3 className="feature-title">AI-Powered Learning</h3>
              <p className="feature-desc">Get personalized recommendations and skill gap analysis powered by AI.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
