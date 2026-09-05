import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:5000/api/courses';
const AI_API_URL = 'http://localhost:5000/api/ai';

/**
 * Page 5: Lesson Player Component (Google Stitch)
 * Connects to: GET http://localhost:5000/api/courses/player/:id
 * Expected Data: { title, videoUrl, readingContent, quiz: { question, options, correct } }
 */
export default function Page5Player({ courseId = 1, onBackToCatalog, onBackToDetail }) {
  const [playerData, setPlayerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active tab: 'reading' vs 'quiz'
  const [activeTab, setActiveTab] = useState('reading');

  // Quiz interactive state
  const [selectedOption, setSelectedOption] = useState(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);

  // AI Quiz Generator state (Topic 8)
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
      // Support direct object or enveloped { player: ... } / { data: ... }
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
    
    // Quiz structure supports both 'correct' and 'correctIndex'
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToCatalog}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-900 bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg transition"
          >
            ← Catalog (Page 3)
          </button>
          <button
            onClick={() => onBackToDetail && onBackToDetail(courseId)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-900 bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg transition"
          >
            Curriculum (Page 4)
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            Page 5 • Stitch Component
          </span>
          <span className="text-xs text-slate-500 font-mono hidden md:inline">
            Live API: http://localhost:5000/api/courses/player/{courseId}
          </span>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="py-24 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-sm font-medium text-slate-600">Loading lesson and interactive quiz...</p>
          <span className="text-xs text-slate-400 mt-1">Target: http://localhost:5000/api/courses/player/{courseId}</span>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="my-10 p-6 bg-red-50 border border-red-200 rounded-2xl text-center max-w-lg mx-auto">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-lg">
            ✕
          </div>
          <h3 className="text-base font-bold text-red-900">Player Data Unavailable</h3>
          <p className="text-xs text-red-700 mt-1">{error}</p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              onClick={() => fetchPlayerData(courseId)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow transition"
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
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Interactive Lesson Stage
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              {playerData.title}
            </h1>
          </div>

          {/* Video Player Box */}
          <div className="bg-black rounded-2xl overflow-hidden shadow-xl aspect-video max-h-[500px] w-full flex items-center justify-center relative">
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
              <div className="text-slate-400 text-sm">No video stream URL provided.</div>
            )}
          </div>

          {/* Content Tabs: Reading Content vs Interactive Quiz */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Tab navigation */}
            <div className="flex border-b border-slate-200 bg-slate-50/70">
              <button
                onClick={() => setActiveTab('reading')}
                className={`flex-1 py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition flex items-center justify-center gap-2 ${
                  activeTab === 'reading'
                    ? 'border-blue-900 text-blue-900 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>📖 Reading Content & Technical Notes</span>
              </button>
              <button
                onClick={() => setActiveTab('quiz')}
                className={`flex-1 py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition flex items-center justify-center gap-2 ${
                  activeTab === 'quiz'
                    ? 'border-blue-900 text-blue-900 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>📝 Knowledge Check Quiz</span>
                {playerData.quiz && (
                  <span className="px-1.5 py-0.5 text-[10px] rounded bg-blue-100 text-blue-800">
                    1 Question
                  </span>
                )}
              </button>
            </div>

            {/* Tab 1: Reading Content */}
            {activeTab === 'reading' && (
              <div className="p-6 sm:p-8 space-y-4">
                <h2 className="text-lg font-bold text-slate-900">Curriculum Study Materials</h2>
                <div className="text-sm leading-relaxed text-slate-700 bg-slate-50 p-6 rounded-xl border border-slate-100">
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
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Question 1 of 1
                      </span>
                      {quizSubmitted && (
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            isCorrect
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-red-100 text-red-800 border border-red-200'
                          }`}
                        >
                          {isCorrect ? '✓ Correct Answer!' : '✕ Incorrect'}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-6">
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

                          let borderStyle = 'border-slate-200 hover:border-blue-400 bg-white';
                          if (isSelected) borderStyle = 'border-blue-700 bg-blue-50/50';
                          if (quizSubmitted) {
                            if (isThisCorrect) {
                              borderStyle = 'border-emerald-500 bg-emerald-50/70 text-emerald-950 font-semibold';
                            } else if (isSelected && !isCorrect) {
                              borderStyle = 'border-red-500 bg-red-50/70 text-red-950';
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
                                className="mt-1 w-4 h-4 text-blue-900 focus:ring-blue-500"
                              />
                              <div className="flex-1 text-sm text-slate-800 leading-snug">
                                {option}
                              </div>
                            </label>
                          );
                        })}
                    </div>

                    {/* Submit / Reset Actions */}
                    <div className="mt-8 pt-6 border-t border-slate-100 flex items-center gap-3">
                      {!quizSubmitted ? (
                        <button
                          onClick={handleQuizSubmit}
                          disabled={selectedOption === null}
                          className={`px-6 py-2.5 rounded-xl text-xs font-bold transition shadow-sm ${
                            selectedOption === null
                              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                              : 'bg-blue-900 hover:bg-blue-950 text-white'
                          }`}
                        >
                          Submit Answer
                        </button>
                      ) : (
                        <button
                          onClick={handleQuizReset}
                          className="px-6 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-black text-white transition shadow-sm"
                        >
                          Try Again
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">No quiz attached to this lesson.</p>
                )}

                {/* AI Quiz Generator (Topic 8) */}
                <div className="mt-6 pt-6 border-t border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span>🤖 AI Quiz Generator</span>
                    </h3>
                    <button
                      onClick={generateAIQuiz}
                      disabled={aiLoading}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                        aiLoading
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      }`}
                    >
                      {aiLoading ? 'Generating...' : 'Generate AI Quiz'}
                    </button>
                  </div>

                  {aiError && (
                    <p className="text-xs text-amber-600 font-semibold">
                      Using sample questions: {aiError}
                    </p>
                  )}

                  {aiQuiz &&
                    aiQuiz.questions?.map((q, qIdx) => (
                      <div key={qIdx} className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-xs font-bold text-slate-400 uppercase">
                            Question {qIdx + 1} of {aiQuiz.count}
                          </span>
                          {aiSubmitted && (
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                aiCorrect(qIdx)
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {aiCorrect(qIdx) ? '✓ Correct' : '✕ Incorrect'}
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-semibold text-slate-800 mb-3">
                          {q.question}
                        </h4>

                        <div className="space-y-2">
                          {q.options?.map((opt, idx) => {
                            const checked = aiAnswers[qIdx] === idx;
                            const isCorrect = idx === q.correctIndex;
                            let borderStyle =
                              'border-slate-200 hover:border-indigo-400 bg-white';
                            if (aiSubmitted) {
                              if (isCorrect)
                                borderStyle =
                                  'border-emerald-500 bg-emerald-50/70 text-emerald-950 font-semibold';
                              else if (checked && !isCorrect)
                                borderStyle = 'border-red-500 bg-red-50/70 text-red-950';
                            } else if (checked) {
                              borderStyle = 'border-indigo-700 bg-indigo-50/50';
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
                                  className="mt-1 w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                                />
                                <div className="flex-1 text-sm text-slate-800 leading-snug">
                                  {opt}
                                </div>
                              </label>
                            );
                          })}
                        </div>

                        {aiSubmitted && q.explanation && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-xs text-blue-900">
                              <span className="font-bold">Explanation:</span> {q.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}

                  {aiQuiz && aiSubmitted && (
                    <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                      <p className="text-sm font-bold text-indigo-900">
                        AI Quiz Score:{' '}
                        {aiQuiz.questions.filter((_, i) => aiCorrect(i)).length} /{' '}
                        {aiQuiz.questions.length}
                      </p>
                      <p className="text-xs text-indigo-700 mt-1">
                        Source:{' '}
                        {aiQuiz.source === 'ai'
                          ? 'Generated by Gemini LLM'
                          : 'Sample questions (API unavailable)'}
                      </p>
                    </div>
                  )}

                  {!aiLoading && !aiQuiz && !aiError && (
                    <p className="text-xs text-slate-500">
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
  );
}
