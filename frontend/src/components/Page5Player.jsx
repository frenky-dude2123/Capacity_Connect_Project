import React, { useState, useEffect, useMemo } from 'react';
import './index.css';

const API_BASE_URL = 'http://localhost:5000/api/courses';
const AI_API_URL = 'http://localhost:5000/api/ai';

function Starfield({ count = 50 }) {
  return useMemo(() => {
    const stars = [];
    for (let i = 0; i < count; i++) {
      const size = Math.random() * 2 + 1;
      const left = Math.random() * 100;
      const top = Math.random() * 100;
      const delay = Math.random() * 3;
      stars.push(
        <div
          key={i}
          className="star"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            left: `${left}%`,
            top: `${top}%`,
            opacity: Math.random() * 0.5 + 0.3,
            animationDelay: `${delay}s`,
            animationDuration: `${2 + Math.random() * 3}s`,
          }}
        />
      );
    }
    return stars;
  }, [count]);
}

export default function Page5Player({ courseId = 1, onBackToCatalog, onBackToDetail }) {
  const [playerData, setPlayerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState('reading');

  const [selectedOption, setSelectedOption] = useState(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);

  const [aiQuiz, setAiQuiz] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [aiAnswers, setAiAnswers] = useState([]);

  const fetchPlayerData = async (id) => {
    setLoading(true);
    setError(null);
    setSelectedOption(null);
    setQuizSubmitted(false);
    setIsCorrect(null);

    try {
      const response = await fetch(`${API_BASE_URL}/player/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.message || `HTTP ${response.status}: Failed to fetch lesson player data`);
      }

      const data = await response.json();
      const lessonData = data.player || data.data || data;
      setPlayerData(lessonData);
    } catch (err) {
      console.error('Error fetching player data:', err);
      setError(err.message || 'Error communicating with backend service on port 5000');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayerData(courseId);
  }, [courseId]);

  const handleQuizSubmit = () => {
    if (selectedOption === null || !playerData?.quiz) return;

    const correctIdx = playerData.quiz.correct !== undefined
      ? playerData.quiz.correct
      : playerData.quiz.correctIndex;

    const correct = Number(selectedOption) === Number(correctIdx);
    setIsCorrect(correct);
    setQuizSubmitted(true);
  };

  const handleQuizReset = () => {
    setSelectedOption(null);
    setQuizSubmitted(false);
    setIsCorrect(null);
  };

  const generateAIQuiz = async () => {
    setAiLoading(true);
    setAiError(null);
    setAiQuiz(null);
    setAiAnswers([]);
    try {
      const topic = playerData?.title || `Course ${courseId}`;
      const response = await fetch(`${AI_API_URL}/generate-quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          numQuestions: 3,
          topic,
          difficulty: 'intermediate',
          readingContent: playerData?.readingContent,
        }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}: AI quiz generation failed`);
      const data = await response.json();
      setAiQuiz(data);
    } catch (err) {
      setAiError(err.message || 'Error connecting to AI quiz service');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAISelect = (qIdx, ansIdx) => {
    const newAnswers = [...aiAnswers];
    newAnswers[qIdx] = ansIdx;
    setAiAnswers(newAnswers);
  };

  const aiSubmitted = aiAnswers.length === (aiQuiz?.questions?.length || 0);

  const aiCorrect = (qIdx) => {
    const q = aiQuiz?.questions?.[qIdx];
    return aiAnswers[qIdx] !== undefined && aiAnswers[qIdx] === q?.correctIndex;
  };

  return (
    <div className="theme-trainee relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-orbital-bg">
        <Starfield count={55} />
        <div className="nebula-drift" style={{ width: '340px', height: '340px', background: 'radial-gradient(circle at 30% 20%, rgba(45,212,191,0.15) 0%, transparent 60%)', top: '5%', right: '15%', animationDelay: '-2s' }}></div>
        <div className="nebula-drift" style={{ width: '260px', height: '260px', background: 'radial-gradient(circle at 80% 85%, rgba(239,68,68,0.08) 0%, transparent 60%)', bottom: '15%', left: '10%', animationDelay: '-8s' }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 fade-in">
        {/* Top Header Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-teal-500/20">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToCatalog}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-300 hover:text-teal-200 bg-slate-900/60 hover:bg-teal-500/10 border border-teal-500/20 px-3 py-1.5 rounded-lg transition btn-micro"
            >
              ← Catalog (Page 3)
            </button>
            <button
              onClick={() => onBackToDetail && onBackToDetail(courseId)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-300 hover:text-teal-200 bg-slate-900/60 hover:bg-teal-500/10 border border-teal-500/20 px-3 py-1.5 rounded-lg transition btn-micro"
            >
              Curriculum (Page 4)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
              Page 5 • Lesson Player
            </span>
            <span className="text-xs text-space-400 font-mono hidden md:inline">
              Live API: http://localhost:5000/api/courses/player/{courseId}
            </span>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="py-24 flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin shadow-lg shadow-cyan-500/50"></div>
            <p className="mt-4 text-sm font-medium text-slate-900 dark:text-space-300">Loading lesson and interactive quiz...</p>
            <span className="text-xs text-slate-900 dark:text-space-500 mt-1">Target: http://localhost:5000/api/courses/player/{courseId}</span>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="my-10 p-6 bg-red-900/20 border border-red-800/50 rounded-2xl text-center max-w-lg mx-auto">
            <div className="w-12 h-12 bg-red-900/30 text-red-300 rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-lg">
              ✕
            </div>
            <h3 className="text-base font-bold text-red-300">Player Data Unavailable</h3>
            <p className="text-xs text-red-400 mt-1">{error}</p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                onClick={() => fetchPlayerData(courseId)}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white text-xs font-bold rounded-lg shadow-lg shadow-red-500/30 btn-micro"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Main Player Stage */}
        {!loading && !error && playerData && (
          <div className="mt-6 space-y-6">
            {/* Lesson Title Header */}
            <div className="glass-card border border-cyan-500/20 hud-panel rounded-2xl p-6 cosmic-card">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
                <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-space-400">
                  Interactive Lesson Stage
                </span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {playerData.title}
              </h1>
            </div>

            {/* Video Player Box */}
            <div className="bg-slate-950 rounded-2xl overflow-hidden shadow-xl aspect-video max-h-[500px] w-full flex items-center justify-center relative border border-cyan-500/20">
              {playerData.videoUrl ? (
                <video
                  controls
                  className="w-full h-full object-contain"
                  src={playerData.videoUrl}
                  poster="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80"
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="text-space-400 text-sm">No video stream URL provided.</div>
              )}
            </div>

            {/* Content Tabs: Reading Content vs Interactive Quiz */}
            <div className="glass-card border border-cyan-500/20 hud-panel rounded-2xl overflow-hidden cosmic-card">
              {/* Tab navigation */}
              <div className="flex border-b border-cyan-500/20 bg-slate-900/40">
                <button
                  onClick={() => setActiveTab('reading')}
                  className={`flex-1 py-3.5 px-4 text-xs sm:text-sm font-black border-b-2 transition flex items-center justify-center gap-2 ${
                    activeTab === 'reading'
                      ? 'border-cyan-500 text-cyan-300 bg-slate-900/60'
                      : 'border-transparent text-space-300 hover:text-cyan-300 hover:bg-teal-500/5'
                  }`}
                >
                  <span>📖 Reading Content & Technical Notes</span>
                </button>
                <button
                  onClick={() => setActiveTab('quiz')}
                  className={`flex-1 py-3.5 px-4 text-xs sm:text-sm font-black border-b-2 transition flex items-center justify-center gap-2 ${
                    activeTab === 'quiz'
                      ? 'border-cyan-500 text-cyan-300 bg-slate-900/60'
                      : 'border-transparent text-space-300 hover:text-cyan-300 hover:bg-teal-500/5'
                  }`}
                >
                  <span>📝 Knowledge Check Quiz</span>
                  {playerData.quiz && (
                    <span className="px-1.5 py-0.5 text-[10px] rounded bg-teal-500/20 text-teal-300">
                      1 Question
                    </span>
                  )}
                </button>
              </div>

              {/* Tab 1: Reading Content */}
              {activeTab === 'reading' && (
                <div className="p-6 sm:p-8 space-y-4">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Curriculum Study Materials</h2>
                  <div className="text-sm leading-relaxed text-slate-900 dark:text-space-300 bg-slate-900/40 p-6 rounded-xl border border-cyan-500/10">
                    {playerData.readingContent || 'No reading notes available for this lesson.'}
                  </div>
                </div>
              )}

              {/* Tab 2: Interactive Quiz */}
              {activeTab === 'quiz' && (
                <div className="p-6 sm:p-8 space-y-6">
                  {playerData.quiz ? (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-black uppercase text-slate-900 dark:text-space-400">
                          Question 1 of 1
                        </span>
                        {quizSubmitted && (
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-black ${
                              isCorrect
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                                : 'bg-red-500/20 text-red-300 border border-red-400/30'
                            }`}
                          >
                            {isCorrect ? '✓ Correct Answer!' : '✕ Incorrect'}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-6">
                        {playerData.quiz.question}
                      </h3>

                      {/* Options List */}
                      <div className="space-y-3">
                        {playerData.quiz.options &&
                          playerData.quiz.options.map((option, idx) => {
                            const isSelected = selectedOption === idx;
                            const correctIdx = playerData.quiz.correct !== undefined
                              ? playerData.quiz.correct
                              : playerData.quiz.correctIndex;
                            const isThisCorrect = idx === Number(correctIdx);

                            let borderStyle = 'border-teal-500/20 hover:border-cyan-400 bg-slate-900/40';
                            if (isSelected) borderStyle = 'border-cyan-500 bg-slate-900/60 text-cyan-100 font-semibold';
                            if (quizSubmitted) {
                              if (isThisCorrect) {
                                borderStyle = 'border-emerald-500 bg-emerald-900/20 text-emerald-100 font-semibold';
                              } else if (isSelected && !isCorrect) {
                                borderStyle = 'border-red-500 bg-red-900/20 text-red-100';
                              }
                            }

                            return (
                              <label
                                key={idx}
                                className={`flex items-start gap-3 p-4 rounded-xl border-2 transition cursor-pointer ${borderStyle}`}
                              >
                                <input
                                  type="radio"
                                  name="quiz-option"
                                  disabled={quizSubmitted}
                                  checked={isSelected}
                                  onChange={() => setSelectedOption(idx)}
                                  className="mt-1 w-4 h-4 text-cyan-500 focus:ring-cyan-500"
                                />
                                <div className="flex-1 text-sm text-slate-900 dark:text-space-200 leading-snug">
                                  {option}
                                </div>
                              </label>
                            );
                          })}
                      </div>

                      {/* Submit / Reset Actions */}
                      <div className="mt-8 pt-6 border-t border-teal-500/20 flex items-center gap-3">
                        {!quizSubmitted ? (
                          <button
                            onClick={handleQuizSubmit}
                            disabled={selectedOption === null}
                            className={`px-6 py-2.5 rounded-xl text-xs font-black transition btn-micro ${
                              selectedOption === null
                                ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white shadow-lg shadow-teal-500/30'
                            }`}
                          >
                            Submit Answer
                          </button>
                        ) : (
                          <button
                            onClick={handleQuizReset}
                            className="px-6 py-2.5 rounded-xl text-xs font-black bg-slate-900/60 hover:bg-teal-500/10 text-slate-900 dark:text-space-300 border border-teal-500/20 transition btn-micro"
                          >
                            Try Again
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-900 dark:text-space-400">No quiz attached to this lesson.</p>
                  )}

                  {/* AI Quiz Generator (Topic 8) */}
                  <div className="mt-6 pt-6 border-t border-teal-500/20 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <span>🤖 AI Quiz Generator</span>
                      </h3>
                      <button
                        onClick={generateAIQuiz}
                        disabled={aiLoading}
                        className={`px-4 py-2 rounded-lg text-xs font-black transition btn-micro ${
                          aiLoading
                            ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/30'
                        }`}
                      >
                        {aiLoading ? 'Generating...' : 'Generate AI Quiz'}
                      </button>
                    </div>

                    {aiError && (
                      <p className="text-xs text-amber-400 font-black">
                        Using sample questions: {aiError}
                      </p>
                    )}

                    {aiQuiz &&
                      aiQuiz.questions?.map((q, qIdx) => (
                        <div key={qIdx} className="p-4 rounded-xl border border-cyan-500/20 bg-slate-900/40">
                          <div className="flex justify-between items-start mb-3">
                            <span className="text-xs font-black uppercase text-slate-900 dark:text-space-400">
                              Question {qIdx + 1} of {aiQuiz.count}
                            </span>
                            {aiSubmitted && (
                              <span
                                className={`px-2.5 py-1 rounded-full text-xs font-black ${
                                  aiCorrect(qIdx)
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                                    : 'bg-red-500/20 text-red-300 border border-red-400/30'
                                }`}
                              >
                                {aiCorrect(qIdx) ? '✓ Correct' : '✕ Incorrect'}
                              </span>
                            )}
                          </div>

                          <h4 className="text-sm font-black text-slate-900 dark:text-white mb-3">
                            {q.question}
                          </h4>

                          <div className="space-y-2">
                            {q.options?.map((opt, idx) => {
                              const checked = aiAnswers[qIdx] === idx;
                              const isCorrect = idx === q.correctIndex;
                              let borderStyle =
                                'border-teal-500/20 hover:border-cyan-400 bg-slate-900/40';
                              if (aiSubmitted) {
                                if (isCorrect)
                                  borderStyle =
                                    'border-emerald-500 bg-emerald-900/20 text-emerald-100 font-semibold';
                                else if (checked && !isCorrect)
                                  borderStyle = 'border-red-500 bg-red-900/20 text-red-100';
                              } else if (checked) {
                                borderStyle = 'border-cyan-500 bg-slate-900/60 text-cyan-100';
                              }
                              return (
                                <label
                                  key={idx}
                                  className={`flex items-start gap-3 p-3 rounded-xl border-2 transition cursor-pointer ${borderStyle}`}
                                >
                                  <input
                                    type="radio"
                                    name={`ai-q${qIdx}`}
                                    disabled={aiSubmitted}
                                    checked={checked}
                                    onChange={() => handleAISelect(qIdx, idx)}
                                    className="mt-1 w-4 h-4 text-cyan-500 focus:ring-cyan-500"
                                  />
                                  <div className="flex-1 text-sm text-slate-900 dark:text-space-200 leading-snug">
                                    {opt}
                                  </div>
                                </label>
                              );
                            })}
                          </div>

                          {aiSubmitted && q.explanation && (
                            <div className="mt-3 p-3 bg-cyan-900/20 rounded-lg border border-cyan-500/20">
                              <p className="text-xs text-cyan-300">
                                <span className="font-black">Explanation:</span> {q.explanation}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}

                    {aiQuiz && aiSubmitted && (
                      <div className="mt-4 p-4 bg-cyan-900/20 rounded-xl border border-cyan-500/20">
                        <p className="text-sm font-black text-slate-900 dark:text-white">
                          AI Quiz Score:{' '}
                          {aiQuiz.questions.filter((_, i) => aiCorrect(i)).length} /{' '}
                          {aiQuiz.questions.length}
                        </p>
                        <p className="text-xs text-slate-900 dark:text-space-400 mt-1">
                          Source:{' '}
                          {aiQuiz.source === 'ai'
                            ? 'Generated by Gemini LLM'
                            : 'Sample questions (API unavailable)'}
                        </p>
                      </div>
                    )}

                    {!aiLoading && !aiQuiz && !aiError && (
                      <p className="text-xs text-slate-900 dark:text-space-400">
                        Click "Generate AI Quiz" to create dynamic questions on this topic.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
