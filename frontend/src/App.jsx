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

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans">
      {/* Platform Navigation Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-900 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              CC
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 leading-tight">Capacity Connect</div>
              <div className="text-[11px] text-slate-500">
                User: <span className="font-semibold text-slate-700">{currentUser.name}</span> ({currentUser.role})
              </div>
            </div>
          </div>

          {/* Screen Switcher Tabs */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setCurrentScreen('1')}
              className={`px-2.5 py-1.5 rounded-lg transition ${
                currentScreen === '1' ? 'bg-white text-blue-950 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1: Auth
            </button>
            <button
              onClick={() => setCurrentScreen('2')}
              className={`px-2.5 py-1.5 rounded-lg transition ${
                currentScreen === '2' ? 'bg-white text-blue-950 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              2: Dashboard
            </button>
            <button
              onClick={() => setCurrentScreen('3')}
              className={`px-2.5 py-1.5 rounded-lg transition ${
                currentScreen === '3' ? 'bg-white text-blue-950 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              3: Catalog
            </button>
            <button
              onClick={() => setCurrentScreen('4')}
              className={`px-2.5 py-1.5 rounded-lg transition ${
                currentScreen === '4' ? 'bg-white text-blue-950 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              4: Detail ({selectedCourseId})
            </button>
            <button
              onClick={() => setCurrentScreen('5')}
              className={`px-2.5 py-1.5 rounded-lg transition ${
                currentScreen === '5' ? 'bg-white text-blue-950 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              5: Player ({selectedCourseId})
            </button>
            <button
              onClick={() => setCurrentScreen('6')}
              className={`px-2.5 py-1.5 rounded-lg transition ${
                currentScreen === '6' ? 'bg-white text-blue-950 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              6: Certificate
            </button>
            <button
              onClick={() => setCurrentScreen('7')}
              className={`px-2.5 py-1.5 rounded-lg transition ${
                currentScreen === '7' ? 'bg-purple-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              7: Admin
            </button>
            <button
              onClick={() => setCurrentScreen('8')}
              className={`px-2.5 py-1.5 rounded-lg transition ${
                currentScreen === '8' ? 'bg-indigo-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              8: AI Skill Gap
            </button>
          </div>

          {/* Mobile switcher select */}
          <div className="lg:hidden">
            <select
              value={currentScreen}
              onChange={(e) => setCurrentScreen(e.target.value)}
              className="text-xs bg-slate-100 border border-slate-200 rounded-lg p-1.5 font-semibold"
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
      <main className="pb-16">
        {currentScreen === '1' && (
          <Screen1Auth
            onAuthSuccess={handleAuthSuccess}
            onNavigateToScreen={handleNavigate}
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
