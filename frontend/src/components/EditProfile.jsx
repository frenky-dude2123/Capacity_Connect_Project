import React, { useState } from 'react';

export default function EditProfile({ user, onBackToDashboard }) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    department: user?.department || '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-6 border-b border-white/10">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-gradient-to-r from-meadow-green/20 to-meadow-green/60 text-meadow-green border border-meadow-green/30">
            Edit Profile
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary mt-1">Edit Your Profile</h1>
        </div>
        <button onClick={onBackToDashboard} className="px-4 py-2 bg-white/5 border border-white/10 text-secondary rounded-xl text-xs font-black btn-micro hover:bg-meadow-green/10">
          ← Back
        </button>
      </div>

      <div className="glass-card rounded-2xl border border-white/10 p-6 space-y-4 shadow-lg max-w-2xl">
        {message && (
          <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Department</label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="form-input"
              placeholder="Enter your department"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button type="button" onClick={onBackToDashboard} className="btn btn-ghost">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
