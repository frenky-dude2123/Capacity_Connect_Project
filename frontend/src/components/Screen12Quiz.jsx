import React, { useState } from 'react';

export default function Screen12Quiz({ user, onBackToDashboard }) {
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [numQuestions, setNumQuestions] = useState(5);
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);

  const subjects = [
    { id: 'cloud', name: 'Cloud Infrastructure', icon: '☁️' },
    { id: 'security', name: 'Security & Compliance', icon: '🔒' },
    { id: 'distributed', name: 'Distributed Systems', icon: '🌐' },
    { id: 'design', name: 'Product Design & UX', icon: '🎨' },
  ];

  const sampleQuestions = {
    cloud: [
      { question: 'Which pattern improves system availability across regions?', options: ['Vertical scaling', 'Multi-region active-active deployment', 'Single AZ deployment', 'Manual failover'], correct: 1 },
      { question: 'What is auto-scaling primarily used for?', options: ['Reducing code complexity', 'Automatically adjusting compute resources', 'Encrypting data', 'Managing DNS records'], correct: 1 },
    ],
    security: [
      { question: 'Which is a primary goal of data governance?', options: ['Faster hardware', 'Data quality, trust, and compliance', 'More dashboards', 'Larger datasets'], correct: 1 },
      { question: 'What does SOC 2 stand for?', options: ['System Operations Certificate', 'Service Organization Control 2', 'Security Operations Compliance', 'Standard Operating Control'], correct: 1 },
    ],
    distributed: [
      { question: 'Which pattern helps microservices discover each other dynamically?', options: ['Load balancer', 'Service discovery', 'Firewall rules', 'VPN tunnel'], correct: 1 },
      { question: 'What is a bounded context?', options: ['A network firewall', 'A microservice architectural pattern', 'A database constraint', 'An API endpoint'], correct: 1 },
    ],
    design: [
      { question: 'Which UX activity focuses on understanding user needs before designing solutions?', options: ['Graphic design', 'User research', 'Code review', 'Performance testing'], correct: 1 },
      { question: 'What is a design system?', options: ['A coding framework', 'A collection of reusable components and standards', 'A database schema', 'A network protocol'], correct: 1 },
    ],
  };

  const startQuiz = () => {
    if (!selectedSubject) return;
    setQuizStarted(true);
    setCurrentQuestion(0);
    setScore(0);
    setQuizComplete(false);
  };

  const handleAnswer = (answerIndex) => {
    setSelectedAnswer(answerIndex);
    const questions = sampleQuestions[selectedSubject] || [];
    if (answerIndex === questions[currentQuestion]?.correct) {
      setScore(prev => prev + 1);
    }

    setTimeout(() => {
      if (currentQuestion + 1 < numQuestions && currentQuestion + 1 < questions.length) {
        setCurrentQuestion(prev => prev + 1);
        setSelectedAnswer(null);
      } else {
        setQuizComplete(true);
      }
    }, 500);
  };

  const resetQuiz = () => {
    setQuizStarted(false);
    setSelectedSubject(null);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setScore(0);
    setQuizComplete(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-6 border-b border-white/10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary">Knowledge Quiz</h1>
          <p className="text-sm text-secondary mt-1">Select a topic and number of questions to begin</p>
        </div>
        <button onClick={onBackToDashboard} className="px-4 py-2 bg-white/5 border border-white/10 text-secondary rounded-xl text-xs font-black btn-micro hover:bg-meadow-green/10">
          ← Back
        </button>
      </div>

      {!quizStarted ? (
        <div className="glass-card p-8 rounded-2xl border border-white/10 shadow-lg max-w-2xl">
          <h2 className="text-lg font-bold text-primary mb-4">Select a Topic</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {subjects.map(subject => (
              <button
                key={subject.id}
                onClick={() => setSelectedSubject(subject.id)}
                className={`p-4 rounded-xl border-2 text-left transition ${
                  selectedSubject === subject.id
                    ? 'border-meadow-green bg-meadow-green/10'
                    : 'border-white/10 hover:border-meadow-green hover:bg-meadow-green/5'
                }`}
              >
                <span className="text-2xl block mb-2">{subject.icon}</span>
                <span className="text-sm font-bold text-primary">{subject.name}</span>
              </button>
            ))}
          </div>

          <div className="form-group mb-6">
            <label className="form-label">Number of Questions</label>
            <select
              value={numQuestions}
              onChange={(e) => setNumQuestions(Number(e.target.value))}
              className="form-select"
            >
              <option value={5}>5 Questions</option>
              <option value={10}>10 Questions</option>
              <option value={15}>15 Questions</option>
            </select>
          </div>

          <button
            onClick={startQuiz}
            disabled={!selectedSubject}
            className="btn btn-primary w-full"
          >
            Start Quiz
          </button>
        </div>
      ) : quizComplete ? (
        <div className="glass-card p-8 rounded-2xl border border-white/10 shadow-lg max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-primary mb-2">Quiz Complete!</h2>
          <p className="text-5xl font-extrabold text-meadow-green my-6">{score} / {numQuestions}</p>
          <p className="text-secondary mb-6">
            {score === numQuestions ? 'Perfect score! Excellent work!' : score > numQuestions / 2 ? 'Good job! Keep learning.' : 'Keep practicing to improve your score.'}
          </p>
          <button onClick={resetQuiz} className="btn btn-primary">
            Try Again
          </button>
        </div>
      ) : (
        <div className="glass-card p-8 rounded-2xl border border-white/10 shadow-lg max-w-2xl">
          <div className="flex items-center justify-between mb-6">
            <span className="text-xs font-black uppercase text-secondary">
              Question {currentQuestion + 1} of {numQuestions}
            </span>
            <span className="text-xs font-black text-meadow-green">Score: {score}</span>
          </div>

          {sampleQuestions[selectedSubject]?.[currentQuestion] && (
            <>
              <h3 className="text-base sm:text-lg font-bold text-primary mb-6">
                {sampleQuestions[selectedSubject][currentQuestion].question}
              </h3>

              <div className="space-y-3">
                {sampleQuestions[selectedSubject][currentQuestion].options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    disabled={selectedAnswer !== null}
                    className={`w-full p-4 rounded-xl border-2 text-left transition ${
                      selectedAnswer === idx
                        ? 'border-meadow-green bg-meadow-green/10 text-meadow-green font-semibold'
                        : 'border-white/10 hover:border-meadow-green hover:bg-meadow-green/5'
                    }`}
                  >
                    <span className="text-sm text-primary">{option}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
