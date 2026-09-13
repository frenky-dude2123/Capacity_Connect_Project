import React, { useState } from 'react';

export default function Screen9Trainer({ userId, onNavigate }) {
  const [activeTab, setActiveTab] = useState('roster');

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-gradient-to-r from-meadow-green/20 to-meadow-green/60 text-meadow-green border border-meadow-green/30">
            Trainer Portal • Dashboard
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary mt-1">Trainer Dashboard</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setActiveTab('roster')} className={`px-4 py-2 rounded-xl text-xs font-black transition btn-micro ${activeTab === 'roster' ? 'bg-gradient-to-r from-meadow-green to-meadow-green/70 text-white shadow-lg' : 'bg-white/5 text-secondary border border-white/10'}`}>
            Student Roster
          </button>
          <button onClick={() => setActiveTab('upload')} className={`px-4 py-2 rounded-xl text-xs font-black transition btn-micro ${activeTab === 'upload' ? 'bg-gradient-to-r from-meadow-green to-meadow-green/70 text-white shadow-lg' : 'bg-white/5 text-secondary border border-white/10'}`}>
            Upload Content
          </button>
          <button onClick={() => setActiveTab('questions')} className={`px-4 py-2 rounded-xl text-xs font-black transition btn-micro ${activeTab === 'questions' ? 'bg-gradient-to-r from-meadow-green to-meadow-green/70 text-white shadow-lg' : 'bg-white/5 text-secondary border border-white/10'}`}>
            Quiz Questions
          </button>
        </div>
      </div>

      {activeTab === 'roster' && (
        <div className="glass-card rounded-2xl border border-white/10 shadow-lg p-6">
          <h2 className="text-base font-black text-primary mb-5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-meadow-green animate-pulse"></span>
            Student Roster
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-meadow-green/30 text-secondary uppercase">
                  <th className="py-3 px-3">Student</th>
                  <th className="py-3 px-3">Email</th>
                  <th className="py-3 px-3">Department</th>
                  <th className="py-3 px-3">Progress</th>
                  <th className="py-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-meadow-green/10">
                <tr className="hover:bg-meadow-green/5 transition-colors">
                  <td className="py-3 px-3 font-bold text-primary">Jane Doe</td>
                  <td className="py-3 px-3 text-secondary">jane.doe@enterprise.com</td>
                  <td className="py-3 px-3 text-secondary">Engineering</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-meadow-green to-meadow-amber rounded-full" style={{width: '75%'}}></div>
                      </div>
                      <span className="font-black text-meadow-green text-xs">75%</span>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-meadow-green/20 text-meadow-green border border-meadow-green/30">ACTIVE</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'upload' && (
        <div className="glass-card rounded-2xl border border-white/10 shadow-lg p-6">
          <h2 className="text-base font-black text-primary mb-5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-meadow-green animate-pulse"></span>
            Upload Learning Content
          </h2>
          <div className="space-y-4">
            <div className="form-group">
              <label className="form-label">Course</label>
              <select className="form-select">
                <option value="">Select a course...</option>
                <option value="1">Cloud Infrastructure & High-Availability Scaling</option>
                <option value="2">Enterprise Data Governance & Security Compliance</option>
                <option value="3">Distributed Systems Design & Microservices Engineering</option>
                <option value="4">Product Design & User Experience Fundamentals</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Content Type</label>
              <div className="flex gap-3">
                {['video', 'notes', 'document'].map(t => (
                  <label key={t} className="flex items-center gap-2 text-xs cursor-pointer">
                    <input type="radio" name="type" value={t} className="w-4 h-4 text-meadow-green" />
                    <span className="text-secondary">{t === 'video' ? 'Video URL' : t === 'notes' ? 'Notes Text' : 'Document Link'}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Title</label>
              <input type="text" placeholder="Enter content title..." className="form-input" />
            </div>
            <button className="btn btn-primary">Upload Content</button>
          </div>
        </div>
      )}

      {activeTab === 'questions' && (
        <div className="glass-card rounded-2xl border border-white/10 shadow-lg p-6">
          <h2 className="text-base font-black text-primary mb-5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-meadow-green animate-pulse"></span>
            Quiz Question Bank
          </h2>
          <p className="text-sm text-secondary">Create and manage quiz questions for your courses.</p>
        </div>
      )}
    </div>
  );
}
