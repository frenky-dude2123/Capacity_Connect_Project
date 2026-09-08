import React, { useState } from 'react';
import Screen1Auth from './components/Screen1Auth';
import Screen2Dashboard from './components/Screen2Dashboard';
import Page3Catalog from './components/Page3Catalog';
import Page4Detail from './components/Page4Detail';
import Page5Player from './components/Page5Player';
import Screen6Certificate from './components/Screen6Certificate';
import Screen7Admin from './components/Screen7Admin';
import Screen8SkillGap from './components/Screen8SkillGap';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('2');
  const [selectedCourseId, setSelectedCourseId] = useState(1);
  const [currentUser, setCurrentUser] = useState({
    id: 'u_learner1',
    name: 'Jane Doe',
    role: 'learner'
  });

  const handleAuthSuccess = (authData) => {
    if (authData.user) {
      setCurrentUser(authData.user);
      if (authData.user.role === 'admin') {
        setCurrentScreen('7');
      } else {
        setCurrentScreen('2');
      }
    }
  };

  const handleNavigate = (screen, id = null) => {
    if (id) setSelectedCourseId(id);
    setCurrentScreen(screen.toString());
  };

  const roleThemeClass =
    currentUser.role === 'admin'
      ? 'theme-admin'
      : currentUser.role === 'trainer'
      ? 'theme-trainer'
      : 'theme-trainee';

  return (
    <div className={`min-h-screen font-sans ${roleThemeClass}`}>
      {/* Platform Navigation Header */}
      <header className="sticky top-0 z-50 border-b transition-all pointer-events-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 pointer-events-auto">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-lg shadow-indigo-500/30">
              CC
            </div>
            <div>
              <div className="text-sm font-bold text-white leading-tight">Capacity Connect</div>
              <div className="text-[11px] text-space-400">
                User: <span className="font-semibold text-indigo-300">{currentUser.name}</span> ({currentUser.role})
              </div>
            </div>
          </div>

          {/* Screen Switcher Tabs */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-900/40 p-1 rounded-xl border border-indigo-500/20 text-xs font-semibold pointer-events-auto">
            <button
              onClick={() => setCurrentScreen('1')}
              className={`relative z-10 px-2.5 py-1.5 rounded-lg transition ${
                currentScreen === '1'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                  : 'text-space-300 hover:text-indigo-300 hover:bg-indigo-500/10'
              }`}
            >
              1: Auth
            </button>
            <button
              onClick={() => setCurrentScreen('2')}
              className={`relative z-10 px-2.5 py-1.5 rounded-lg transition ${
                currentScreen === '2'
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg shadow-teal-500/30'
                  : 'text-space-300 hover:text-teal-300 hover:bg-teal-500/10'
              }`}
            >
              2: Dashboard
            </button>
            <button
              onClick={() => setCurrentScreen('3')}
              className={`relative z-10 px-2.5 py-1.5 rounded-lg transition ${
                currentScreen === '3'
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg shadow-teal-500/30'
                  : 'text-space-300 hover:text-teal-300 hover:bg-teal-500/10'
              }`}
            >
              3: Catalog
            </button>
            <button
              onClick={() => setCurrentScreen('4')}
              className={`relative z-10 px-2.5 py-1.5 rounded-lg transition ${
                currentScreen === '4'
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg shadow-teal-500/30'
                  : 'text-space-300 hover:text-teal-300 hover:bg-teal-500/10'
              }`}
            >
              4: Detail ({selectedCourseId})
            </button>
            <button
              onClick={() => setCurrentScreen('5')}
              className={`relative z-10 px-2.5 py-1.5 rounded-lg transition ${
                currentScreen === '5'
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg shadow-teal-500/30'
                  : 'text-space-300 hover:text-teal-300 hover:bg-teal-500/10'
              }`}
            >
              5: Player ({selectedCourseId})
            </button>
            <button
              onClick={() => setCurrentScreen('6')}
              className={`relative z-10 px-2.5 py-1.5 rounded-lg transition ${
                currentScreen === '6'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-lg shadow-amber-500/30'
                  : 'text-space-300 hover:text-amber-300 hover:bg-amber-500/10'
              }`}
            >
              6: Certificate
            </button>
            <button
              onClick={() => setCurrentScreen('7')}
              className={`relative z-10 px-2.5 py-1.5 rounded-lg transition ${
                currentScreen === '7'
                  ? 'bg-gradient-to-r from-crimson-500 to-rose-600 text-white shadow-lg shadow-crimson-500/30'
                  : 'text-space-300 hover:text-crimson-300 hover:bg-crimson-500/10'
              }`}
            >
              7: Admin
            </button>
            <button
              onClick={() => setCurrentScreen('8')}
              className={`relative z-10 px-2.5 py-1.5 rounded-lg transition ${
                currentScreen === '8'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                  : 'text-space-300 hover:text-indigo-300 hover:bg-indigo-500/10'
              }`}
            >
              8: AI Skill Gap
            </button>
          </div>

          {/* Mobile switcher select */}
          <div className="lg:hidden pointer-events-auto">
            <select
              value={currentScreen}
              onChange={(e) => setCurrentScreen(e.target.value)}
              className="text-xs bg-slate-900/40 border border-indigo-500/20 rounded-lg p-1.5 font-semibold text-space-200 focus:ring-indigo-500"
            >
              <option value="1">Screen 1: Auth</option>
              <option value="2">Screen 2: Learner Dashboard</option>
              <option value="3">Page 3: Catalog</option>
              <option value="4">Page 4: Detail ({selectedCourseId})</option>
              <option value="5">Page 5: Player ({selectedCourseId})</option>
              <option value="6">Screen 6: Certificate</option>
              <option value="7">Screen 7: Admin</option>
              <option value="8">Screen 8: AI Skill Gap</option>
            </select>
          </div>
        </div>
      </header>

      {/* Main Canvas */}
      <main>
        {currentScreen === '1' && (
          <Screen1Auth
            onLogin={handleAuthSuccess}
            switchMode={switchMode}
          />
        )}
        {currentScreen === '2' && (
          <Screen2Dashboard
            userId={currentUser.id}
            onOpenCourse={(id) => handleNavigate(5, id)}
            onOpenCertificate={(uId, cId) => handleNavigate(6, cId)}
            onOpenCatalog={() => handleNavigate(3)}
          />
        )}
        {currentScreen === '3' && (
          <Page3Catalog
            onSelectCourse={(id) => handleNavigate(4, id)}
            onLaunchPlayer={(id) => handleNavigate(5, id)}
          />
        )}
        {currentScreen === '4' && (
          <Page4Detail
            courseId={selectedCourseId}
            onBackToCatalog={() => handleNavigate(3)}
            onLaunchPlayer={(id) => handleNavigate(5, id)}
          />
        )}
        {currentScreen === '5' && (
          <Page5Player
            courseId={selectedCourseId}
            onBackToCatalog={() => handleNavigate(3)}
            onBackToDetail={() => handleNavigate(4)}
          />
        )}
        {currentScreen === '6' && (
          <Screen6Certificate
            userId={currentUser.id}
            courseId={selectedCourseId}
            onBackToDashboard={() => handleNavigate(2)}
          />
        )}
        {currentScreen === '7' && (
          <Screen7Admin
            onBackToDashboard={() => handleNavigate(2)}
          />
        )}
        {currentScreen === '8' && (
          <Screen8SkillGap
            userId={currentUser.id}
            onBackToDashboard={() => handleNavigate(2)}
            onEnrollCourse={(courseId) => setSelectedCourseId(courseId)}
          />
        )}
      </main>
    </div>
  );
}
