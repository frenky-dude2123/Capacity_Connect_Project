import React, { useState, useEffect } from 'react';
import { authFetch, API_BASE, AI_API_BASE } from '../lib/api';

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
      const response = await authFetch(`${API_BASE}/courses/player/${id}`);
      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.message || `HTTP ${response.status}: Failed to fetch lesson player data`);
      }

      const data = await response.json();
      const lessonData = data.player || data.data || data;
      setPlayerData(lessonData);
    } catch (err) {
      console.error('Error fetching player data:', err);
      setError(err.message || 'Error communicating with backend service');
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
      const response = await authFetch(`${AI_API_BASE}/generate-quiz`, {
        method: 'POST',
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
    <div className="space-y-6">
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToCatalog}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-meadow-green hover:text-meadow-green/80 bg-white/5 hover:bg-meadow-green/10 border border-white/10 px-3 py-1.5 rounded-lg transition btn-micro"
          >
            ← Catalog
          </button>
          <button
            onClick={() => onBackToDetail && onBackToDetail(courseId)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-meadow-green hover:text-meadow-green/80 bg-white/5 hover:bg-meadow-green/10 border border-white/10 px-3 py-1.5 rounded-lg transition btn-micro"
          >
            Curriculum
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-meadow-green/20 text-meadow-green border border-meadow-green/30">
            Lesson Player
          </span>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="py-24 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 border-4 border-meadow-green border-t-transparent rounded-full animate-spin shadow-lg"></div>
          <p className="mt-4 text-sm font-medium text-secondary">Loading lesson and interactive quiz...</p>
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
              className="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white text-xs font-bold rounded-lg shadow-lg btn-micro"
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
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-meadow-green animate-pulse"></span>
              <span className="text-xs font-black uppercase tracking-wider text-secondary">
                Interactive Lesson Stage
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-primary">
              {playerData.title}
            </h1>
          </div>

          {/* Video Player Box */}
          <div className="bg-white/5 rounded-2xl overflow-hidden shadow-xl aspect-video max-h-[500px] w-full flex items-center justify-center relative border border-white/10">
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
              <div className="text-secondary text-sm">No video stream URL provided.</div>
            )}
          </div>

          {/* Content Tabs: Reading Content vs Interactive Quiz */}
          <div className="glass-card rounded-2xl overflow-hidden">
            {/* Tab navigation */}
            <div className="flex border-b border-white/10 bg-white/5">
              <button
                onClick={() => setActiveTab('reading')}
                className={`flex-1 py-3.5 px-4 text-xs sm:text-sm font-black border-b-2 transition flex items-center justify-center gap-2 ${
                  activeTab === 'reading'
                    ? 'border-meadow-green text-meadow-green bg-white/5'
                    : 'border-transparent text-secondary hover:text-meadow-green hover:bg-meadow-green/5'
                }`}
              >
                <span>📖 Reading Content & Technical Notes</span>
              </button>
              <button
                onClick={() => setActiveTab('quiz')}
                className={`flex-1 py-3.5 px-4 text-xs sm:text-sm font-black border-b-2 transition flex items-center justify-center gap-2 ${
                  activeTab === 'quiz'
                    ? 'border-meadow-green text-meadow-green bg-white/5'
                    : 'border-transparent text-secondary hover:text-meadow-green hover:bg-meadow-green/5'
                }`}
              >
                <span>📝 Knowledge Check Quiz</span>
                {playerData.quiz && (
                  <span className="px-1.5 py-0.5 text-[10px] rounded bg-meadow-green/20 text-meadow-green">
                    1 Question
                  </span>
                )}
              </button>
            </div>

            {/* Tab 1: Reading Content */}
            {activeTab === 'reading' && (
              <div className="p-6 sm:p-8 space-y-4">
                <h2 className="text-lg font-bold text-primary">Curriculum Study Materials</h2>
                <div className="text-sm leading-relaxed text-secondary bg-white/5 p-6 rounded-xl border border-white/10">
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
                      <span className="text-xs font-black uppercase text-secondary">
                        Question 1 of 1
                      </span>
                      {quizSubmitted && (
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-black ${
                            isCorrect
                              ? 'bg-meadow-green/20 text-meadow-green border border-meadow-green/30'
                              : 'bg-red-500/20 text-red-300 border border-red-400/30'
                          }`}
                        >
                          {isCorrect ? '✓ Correct Answer!' : '✕ Incorrect'}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-primary mb-6">
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

                          let borderStyle = 'border-white/10 hover:border-meadow-green bg-white/5';
                          if (isSelected) borderStyle = 'border-meadow-green bg-meadow-green/10 text-meadow-green font-semibold';
                          if (quizSubmitted) {
                            if (isThisCorrect) {
                              borderStyle = 'border-meadow-green bg-meadow-green/20 text-meadow-green font-semibold';
                            } else if (isSelected && !isCorrect) {
                              borderStyle = 'border-red-500 bg-red-500/10 text-red-300';
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
                                className="mt-1 w-4 h-4 text-meadow-green focus:ring-meadow-green"
                              />
                              <div className="flex-1 text-sm text-primary leading-snug">
                                {option}
                              </div>
                            </label>
                          );
                        })}
                    </div>

                    {/* Submit / Reset Actions */}
                    <div className="mt-8 pt-6 border-t border-white/10 flex items-center gap-3">
                      {!quizSubmitted ? (
                        <button
                          onClick={handleQuizSubmit}
                          disabled={selectedOption === null}
                          className={`px-6 py-2.5 rounded-xl text-xs font-black transition btn-micro ${
                            selectedOption === null
                              ? 'bg-white/5 text-secondary cursor-not-allowed'
                              : 'bg-gradient-to-r from-meadow-green to-meadow-green/70 hover:from-meadow-green hover:to-meadow-green/60 text-white shadow-lg'
                          }`}
                        >
                          Submit Answer
                        </button>
                      ) : (
                        <button
                          onClick={handleQuizReset}
                          className="px-6 py-2.5 rounded-xl text-xs font-black bg-white/5 hover:bg-meadow-green/10 text-secondary border border-white/10 transition btn-micro"
                        >
                          Try Again
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-secondary">No quiz attached to this lesson.</p>
                )}

                {/* AI Quiz Generator */}
                <div className="mt-6 pt-6 border-t border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-primary flex items-center gap-2">
                      <span>🤖 AI Quiz Generator</span>
                    </h3>
                    <button
                      onClick={generateAIQuiz}
                      disabled={aiLoading}
                      className={`px-4 py-2 rounded-lg text-xs font-black transition btn-micro ${
                        aiLoading
                          ? 'bg-white/5 text-secondary cursor-not-allowed'
                          : 'bg-gradient-to-r from-meadow-green to-meadow-green/70 hover:from-meadow-green hover:to-meadow-green/60 text-white shadow-lg'
                      }`}
                    >
                      {aiLoading ? 'Generating...' : 'Generate AI Quiz'}
                    </button>
                  </div>

                  {aiError && (
                    <p className="text-xs text-meadow-amber font-black">
                      Using sample questions: {aiError}
                    </p>
                  )}

                  {aiQuiz && aiQuiz.questions?.map((q, qIdx) => (
                    <div key={qIdx} className="p-4 rounded-xl border border-white/10 bg-white/5">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-xs font-black uppercase text-secondary">
                          Question {qIdx + 1} of {aiQuiz.count}
                        </span>
                        {aiSubmitted && (
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-black ${
                              aiCorrect(qIdx)
                                ? 'bg-meadow-green/20 text-meadow-green border border-meadow-green/30'
                                : 'bg-red-500/20 text-red-300 border border-red-400/30'
                            }`}
                          >
                            {aiCorrect(qIdx) ? '✓ Correct' : '✕ Incorrect'}
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-black text-primary mb-3">
                        {q.question}
                      </h4>

                      <div className="space-y-2">
                        {q.options?.map((opt, idx) => {
                          const checked = aiAnswers[qIdx] === idx;
                          const isCorrect = idx === q.correctIndex;
                          let borderStyle = 'border-white/10 hover:border-meadow-green bg-white/5';
                          if (aiSubmitted) {
                            if (isCorrect) borderStyle = 'border-meadow-green bg-meadow-green/20 text-meadow-green font-semibold';
                            else if (checked && !isCorrect) borderStyle = 'border-red-500 bg-red-500/10 text-red-300';
                          } else if (checked) {
                            borderStyle = 'border-meadow-green bg-meadow-green/10 text-meadow-green';
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
                                className="mt-1 w-4 h-4 text-meadow-green focus:ring-meadow-green"
                              />
                              <div className="flex-1 text-sm text-primary leading-snug">
                                {opt}
                              </div>
                            </label>
                          );
                        })}
                      </div>

                      {aiSubmitted && q.explanation && (
                        <div className="mt-3 p-3 bg-meadow-green/10 rounded-lg border border-meadow-green/20">
                          <p className="text-xs text-meadow-green">
                            <span className="font-black">Explanation:</span> {q.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}

                  {aiQuiz && aiSubmitted && (
                    <div className="mt-4 p-4 bg-meadow-green/10 rounded-xl border border-meadow-green/20">
                      <p className="text-sm font-black text-primary">
                        AI Quiz Score:{' '}
                        {aiQuiz.questions.filter((_, i) => aiCorrect(i)).length} /{' '}
                        {aiQuiz.questions.length}
                      </p>
                      <p className="text-xs text-secondary mt-1">
                        Source:{' '}
                        {aiQuiz.source === 'ai'
                          ? 'Generated by Gemini LLM'
                          : 'Sample questions (API unavailable)'}
                      </p>
                    </div>
                  )}

                  {!aiLoading && !aiQuiz && !aiError && (
                    <p className="text-xs text-secondary">
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
