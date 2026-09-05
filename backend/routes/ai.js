const express = require('express');
const router = express.Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_API_ENDPOINT = process.env.GEMINI_API_ENDPOINT || 'https://generativelanguage.googleapis.com/v1beta/models/';
const KILO_GATEWAY_URL = process.env.KILO_GATEWAY_URL || 'https://gateway.kilo.ai/v1/chat/completions';

// ============================================================
// Gemini / LLM API Helper
// ============================================================

/**
 * Calls the Gemini/LLM API with a prompt and returns parsed JSON.
 * Detects key format to choose between Google Gemini REST API
 * (key starts with "AIza") and Kilo Gateway OpenAI-compatible API
 * (key starts with "AQ.").
 *
 * For "AQ." keys, tries Kilo Gateway first, then falls back to
 * Google Gemini endpoint as a secondary attempt.
 *
 * Falls back to mock data when no API key is configured or all calls fail.
 */
async function callLLMAPI(prompt, systemPrompt = '', schema = null) {
  if (!GEMINI_API_KEY) {
    return { data: null, usedMock: true, error: 'No API key configured' };
  }

  const isKiloKey = GEMINI_API_KEY.startsWith('AQ.');
  let data = null;
  let apiError = null;

  // Build the JSON instruction suffix
  let userContent = prompt;
  if (schema) {
    userContent = `${prompt}\n\nRespond ONLY as valid JSON matching this schema: ${JSON.stringify(schema)}`;
  } else {
    userContent = `${prompt}\n\nRespond ONLY as valid JSON. Do not include any explanatory text, code fences, or markdown formatting.`;
  }

  const attemptEndpoints = [];
  if (isKiloKey) {
    // Try Kilo Gateway (OpenAI-compatible) first, then Google Gemini as fallback
    attemptEndpoints.push({
      type: 'openai',
      url: KILO_GATEWAY_URL,
      headers: {
        'Authorization': `Bearer ${GEMINI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      buildBody: (content) => ({
        model: GEMINI_MODEL,
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          { role: 'user', content },
        ],
        temperature: 0.7,
        max_tokens: 2048,
      }),
      extract: (json) => json.choices?.[0]?.message?.content || '',
    });
    attemptEndpoints.push({
      type: 'gemini',
      url: `${GEMINI_API_ENDPOINT}${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      headers: { 'Content-Type': 'application/json' },
      buildBody: (content) => {
        const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${content}` : content;
        return {
          contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
        };
      },
      extract: (json) => json.candidates?.[0]?.content?.parts?.[0]?.text || '',
    });
  } else {
    // Standard Google Gemini REST API
    attemptEndpoints.push({
      type: 'gemini',
      url: `${GEMINI_API_ENDPOINT}${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      headers: { 'Content-Type': 'application/json' },
      buildBody: (content) => {
        const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${content}` : content;
        return {
          contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
        };
      },
      extract: (json) => json.candidates?.[0]?.content?.parts?.[0]?.text || '',
    });
  }

  for (const ep of attemptEndpoints) {
    try {
      const response = await fetch(ep.url, {
        method: 'POST',
        headers: ep.headers,
        body: JSON.stringify(ep.buildBody(userContent)),
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        const errBody = await response.text().catch(() => '');
        apiError = `${ep.type === 'openai' ? 'Kilo Gateway' : 'Gemini'} HTTP ${response.status}: ${errBody}`;
        continue;
      }

      const json = await response.json();
      const responseText = ep.extract(json);

      if (!responseText) {
        apiError = `${ep.type === 'openai' ? 'Kilo Gateway' : 'Gemini'} returned empty response`;
        continue;
      }

      const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      data = JSON.parse(cleaned);
      if (data) break;
    } catch (err) {
      console.error(`[AI] ${ep.type} API call failed:`, err.message);
      apiError = err.message;
    }
  }

  if (!data) {
    return { data: null, usedMock: true, error: apiError };
  }

  return { data, usedMock: false, error: null };
}

// ============================================================
// Mock data for fallback mode
// ============================================================

const MOCK_QUIZ_QUESTIONS = [
  {
    question: 'What is the primary benefit of deploying the Circuit Breaker pattern in distributed microservices?',
    options: [
      'Preventing cascading service failures by failing fast during downstream outages',
      'Directly increasing database throughput by bypassing cache layers',
      'Encrypting inter-service payloads using asymmetric cryptography',
      'Automatically reducing the size of container images in production'
    ],
    correctIndex: 0,
    explanation: 'The Circuit Breaker pattern prevents cascading failures by temporarily stopping requests to a failing service, allowing it to recover.'
  },
  {
    question: 'Under the principle of Least Privilege (PoLP), how should user and service permissions be assigned?',
    options: [
      'Grant broad administrative access to ensure uninterrupted developer productivity',
      'Provide only the minimum necessary permissions required to perform specific job duties',
      'Delegate root credentials across all members of the incident response team',
      'Disable token expiration on internal microservice-to-microservice APIs'
    ],
    correctIndex: 1,
    explanation: 'Least Privilege ensures users and services have only the permissions they need to perform their duties.'
  },
  {
    question: 'Which consistency and recovery approach is commonly utilized in the Saga pattern when a step fails?',
    options: [
      'Immediate distributed database rollback via distributed locking',
      'Executing compensating transactions in reverse order to restore consistency',
      'Ignoring downstream service errors and logging a warning',
      'Restarting the entire application cluster from cold storage'
    ],
    correctIndex: 1,
    explanation: 'The Saga pattern uses compensating transactions to undo completed steps when a step fails.'
  }
];

const MOCK_RECOMMENDATIONS = [
  {
    courseId: 101,
    title: 'Zero Trust Architecture & Identity Federation',
    category: 'Cybersecurity',
    reason: 'Your quiz score in Security & Compliance topics was below 70%. This course will strengthen your identity and access management skills.',
    estimatedHours: 8,
    difficulty: 'Advanced'
  },
  {
    courseId: 102,
    title: 'Observability & Chaos Testing in Kubernetes',
    category: 'DevOps',
    reason: 'Weakness detected in distributed systems monitoring. This course builds hands-on skills with Prometheus, Grafana, and chaos engineering.',
    estimatedHours: 12,
    difficulty: 'Intermediate'
  },
  {
    courseId: 103,
    title: 'Event-Driven Microservices with Apache Kafka',
    category: 'Software Engineering',
    reason: 'Your understanding of event sourcing needs reinforcement. Kafka is essential for building reliable event-driven architectures.',
    estimatedHours: 10,
    difficulty: 'Advanced'
  }
];

const MOCK_SKILL_GAP = {
  detectedSkills: [
    'Python', 'Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Linux',
    'RESTful APIs', 'Git', 'PostgreSQL', 'React', 'Node.js'
  ],
  missingSkills: [
    'Zero Trust Architecture', 'ISO 27001 Compliance',
    'Distributed Tracing (OpenTelemetry)', 'Saga Pattern',
    'Apache Kafka', 'Chaos Engineering', 'Circuit Breaker Pattern'
  ],
  recommendedCourses: [
    {
      courseId: 2,
      title: 'Enterprise Data Governance & ISO 27001 Security',
      category: 'Security & Compliance',
      matchScore: 94,
      priority: 'high',
      reason: 'Missing ISO 27001 compliance skills critical for your role'
    },
    {
      courseId: 3,
      title: 'Distributed Systems Design & Microservices Engineering',
      category: 'Software Engineering',
      matchScore: 87,
      priority: 'high',
      reason: 'Missing distributed systems and microservices engineering skills'
    },
    {
      courseId: 101,
      title: 'Zero Trust Architecture & Identity Federation',
      category: 'Cybersecurity',
      matchScore: 78,
      priority: 'medium',
      reason: 'Security gap in zero-trust and identity federation'
    }
  ],
  suggestedEnrollments: [
    { courseId: 2, title: 'Enterprise Data Governance & ISO 27001 Security', pathway: 'Security & Compliance' },
    { courseId: 3, title: 'Distributed Systems Design & Microservices Engineering', pathway: 'Software Engineering' },
    { courseId: 101, title: 'Zero Trust Architecture & Identity Federation', pathway: 'Cybersecurity' }
  ],
  summary: 'Detected 11 existing skills. Found 7 critical skill gaps in security, distributed systems, and observability. Recommended 3 courses for auto-enrollment. Gap coverage: 86%.'
};

// ============================================================
// TOPIC 8: AI Quiz Generator
// ============================================================

/**
 * POST /api/ai/generate-quiz
 * Generates dynamic multiple-choice quiz questions on the fly using Gemini/LLM.
 *
 * Accepts: { courseId, numQuestions?, topic?, difficulty?, readingContent? }
 * Returns: { questions: [{ question, options, correctIndex, explanation }], source, model }
 *
 * Source field is "ai" when generated via LLM, "mock" when using fallback data.
 */
router.post('/generate-quiz', async (req, res) => {
  try {
    const { courseId, numQuestions = 3, topic, difficulty = 'intermediate', readingContent } = req.body || {};

    const topicStr = topic || (courseId ? `Course ${courseId}` : 'general');
    const count = Math.min(Math.max(parseInt(numQuestions) || 1, 1), 10);

    const prompt = `
Generate ${count} multiple-choice quiz questions for an enterprise engineering training course.

Topic: ${topicStr}
Difficulty: ${difficulty}
${readingContent ? `Course Context: ${readingContent}` : ''}

Each question must include:
- A clear question text
- Exactly 4 answer options
- A "correctIndex" field (0-3) indicating the correct answer
- A brief "explanation" of why the answer is correct

Return as a JSON array under the key "questions".`;

    const schema = {
      type: 'object',
      properties: {
        questions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              options: { type: 'array', items: { type: 'string' }, minItems: 4, maxItems: 4 },
              correctIndex: { type: 'integer', minimum: 0, maximum: 3 },
              explanation: { type: 'string' }
            },
            required: ['question', 'options', 'correctIndex']
          }
        }
      },
      required: ['questions']
    };

    const result = await callLLMAPI(prompt, '', schema);

    if (result.usedMock || !result.data) {
      // Use mock data as fallback
      const questions = MOCK_QUIZ_QUESTIONS.slice(0, count).map((q, i) => ({
        ...q,
        topic: topicStr,
        difficulty
      }));

      return res.json({
        questions,
        source: 'mock',
        model: 'fallback',
        count: questions.length,
        error: result.error || null
      });
    }

    const questions = result.data.questions.slice(0, count).map(q => ({
      ...q,
      topic: topicStr,
      difficulty
    }));

    res.json({
      questions,
      source: 'ai',
      model: GEMINI_MODEL,
      count: questions.length
    });
  } catch (err) {
    console.error('[AI] Quiz generation error:', err);

    // Ultimate fallback
    const count = Math.min(parseInt(req.body?.numQuestions) || 1, 3);
    const questions = MOCK_QUIZ_QUESTIONS.slice(0, count);
    res.status(200).json({
      questions,
      source: 'mock',
      model: 'error-fallback',
      count: questions.length,
      error: err.message
    });
  }
});

// ============================================================
// TOPIC 9: AI Course Recommendation Engine
// ============================================================

/**
 * POST /api/ai/recommendations
 * Analyzes quiz results and weak areas to suggest next courses.
 *
 * Accepts: { userId, weakAreas: [{ topic, score, courseId? }], enrolledCourses?, numRecommendations? }
 * Returns: { recommendations: [...], summary, source, model }
 */
router.post('/recommendations', async (req, res) => {
  try {
    const {
      userId,
      weakAreas = [],
      enrolledCourses = [],
      numRecommendations = 3,
      overallScore
    } = req.body || {};

    const count = Math.min(Math.max(parseInt(numRecommendations) || 3, 1), 10);

    // Build a readable summary of weak areas
    const weakAreasText = weakAreas.map(wa => {
      const scoreStr = wa.score !== undefined ? ` (score: ${wa.score}%)` : '';
      return `- ${wa.topic || 'Unknown topic'}${scoreStr}${wa.correct ? ` (correct answers: ${wa.correct}/${wa.total || '?'})` : ''}`;
    }).join('\n');

    const enrolledText = enrolledCourses.map(c => c.title || c).join(', ') || 'None';

    const prompt = `
You are an AI course recommendation engine for an enterprise learning platform.

Analyze the following learning data and recommend the most relevant next courses:

Learner ID: ${userId || 'unknown'}
${overallScore !== undefined ? `Overall Quiz Score: ${overallScore}%` : ''}
Enrolled Courses: ${enrolledText}

Weak Areas Identified:
${weakAreasText || 'No specific weak areas reported'}

Generate ${count} course recommendations that specifically target the weak areas identified. For each recommendation include:
- courseId (numeric, use values 101-110)
- title (a specific enterprise engineering course name)
- category (e.g., Cybersecurity, DevOps, Cloud Architecture, Software Engineering)
- reason (explain why this course is recommended based on the weak areas)
- estimatedHours (integer)
- difficulty (Beginner, Intermediate, or Advanced)

Return as a JSON object with a "recommendations" array.`;

    const schema = {
      type: 'object',
      properties: {
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              courseId: { type: 'integer' },
              title: { type: 'string' },
              category: { type: 'string' },
              reason: { type: 'string' },
              estimatedHours: { type: 'integer' },
              difficulty: { type: 'string' }
            },
            required: ['courseId', 'title', 'category', 'reason', 'estimatedHours', 'difficulty']
          },
          minItems: 1,
          maxItems: 10
        }
      },
      required: ['recommendations']
    };

    const result = await callLLMAPI(prompt, '', schema);

    if (result.usedMock || !result.data) {
      const recs = MOCK_RECOMMENDATIONS.slice(0, count).map((rec, i) => ({
        ...rec,
        courseId: 101 + i
      }));

      return res.json({
        recommendations: recs,
        summary: `Based on ${weakAreas.length} weak area(s) identified, ${recs.length} personalized course recommendations generated.`,
        source: 'mock',
        model: 'fallback',
        error: result.error || null
      });
    }

    const recommendations = result.data.recommendations.slice(0, count);

    res.json({
      recommendations,
      summary: `Based on ${weakAreas.length} weak area(s) identified, ${recommendations.length} AI-powered recommendations generated.`,
      source: 'ai',
      model: GEMINI_MODEL
    });
  } catch (err) {
    console.error('[AI] Recommendation error:', err);

    const count = Math.min(parseInt(req.body?.numRecommendations) || 3, 3);
    const recs = MOCK_RECOMMENDATIONS.slice(0, count);

    res.status(200).json({
      recommendations: recs,
      summary: `Fallback: ${recs.length} recommendations generated based on general enterprise skill gaps.`,
      source: 'mock',
      model: 'error-fallback',
      error: err.message
    });
  }
});

// ============================================================
// TOPIC 10: Resume / Skill Gap Scanner
// ============================================================

/**
 * POST /api/ai/skill-gap-analysis
 * Parses resume text/profile and identifies skill gaps, then suggests courses
 * for auto-enrollment.
 *
 * Accepts: { resumeText, userId?, targetRole?, department? }
 * Returns: { detectedSkills, missingSkills, recommendedCourses, suggestedEnrollments, summary, source, model }
 */
router.post('/skill-gap-analysis', async (req, res) => {
  try {
    const { resumeText, userId, targetRole, department } = req.body || {};

    if (!resumeText || resumeText.length < 20) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'resumeText is required (minimum 20 characters)'
      });
    }

    const roleContext = targetRole || department || 'enterprise engineering';

    const prompt = `
You are an AI resume and skill gap analyzer for an enterprise learning platform.

Analyze the following resume/profile text for a ${roleContext} role:

--- RESUME ---
${resumeText.substring(0, 4000)}
--- END RESUME ---

1. Extract all technical skills mentioned (languages, tools, frameworks, platforms, cloud services, methodologies).
2. Identify skill gaps compared to a comprehensive enterprise engineering competency framework.
3. Recommend specific courses from these categories: Cloud Architecture, Security & Compliance, DevOps, Distributed Systems, Software Engineering, Data Engineering, AI/ML, Infrastructure.
4. Suggest an auto-enrollment pathway (ordered list of courses).

For each recommended course include:
- courseId (numeric, use values 1-110 where 1-3 are core courses)
- title
- category
- matchScore (0-100, how well this addresses the gap)
- priority ('high', 'medium', 'low')
- reason (why this course is recommended)

Also include:
- detectedSkills (array of strings)
- missingSkills (array of strings)
- suggestedEnrollments (array of { courseId, title, pathway })

Return as a JSON object with keys: detectedSkills, missingSkills, recommendedCourses, suggestedEnrollments, summary.`;

    const schema = {
      type: 'object',
      properties: {
        detectedSkills: { type: 'array', items: { type: 'string' } },
        missingSkills: { type: 'array', items: { type: 'string' } },
        recommendedCourses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              courseId: { type: 'integer' },
              title: { type: 'string' },
              category: { type: 'string' },
              matchScore: { type: 'integer', minimum: 0, maximum: 100 },
              priority: { type: 'string' },
              reason: { type: 'string' }
            },
            required: ['courseId', 'title', 'category', 'matchScore', 'priority', 'reason']
          }
        },
        suggestedEnrollments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              courseId: { type: 'integer' },
              title: { type: 'string' },
              pathway: { type: 'string' }
            },
            required: ['courseId', 'title', 'pathway']
          }
        },
        summary: { type: 'string' }
      },
      required: ['detectedSkills', 'missingSkills', 'recommendedCourses', 'suggestedEnrollments', 'summary']
    };

    const result = await callLLMAPI(prompt, '', schema);

    if (result.usedMock || !result.data) {
      return res.json({
        ...MOCK_SKILL_GAP,
        detectedSkills: MOCK_SKILL_GAP.detectedSkills,
        missingSkills: MOCK_SKILL_GAP.missingSkills,
        recommendedCourses: MOCK_RECOMMENDATIONS,
        suggestedEnrollments: MOCK_SKILL_GAP.suggestedEnrollments,
        summary: MOCK_SKILL_GAP.summary,
        source: 'mock',
        model: 'fallback',
        userId: userId || null,
        error: result.error || null
      });
    }

    res.json({
      ...result.data,
      source: 'ai',
      model: GEMINI_MODEL,
      userId: userId || null
    });
  } catch (err) {
    console.error('[AI] Skill gap analysis error:', err);

    res.status(200).json({
      ...MOCK_SKILL_GAP,
      source: 'mock',
      model: 'error-fallback',
      error: err.message
    });
  }
});

// ============================================================
// Health Check
// ============================================================

/**
 * GET /api/ai/health
 * Returns the status of the AI service configuration.
 */
router.get('/health', (req, res) => {
  const keyConfigured = !!GEMINI_API_KEY;
  const keyType = keyConfigured ? (GEMINI_API_KEY.startsWith('AQ.') ? 'kilo-gateway' : 'gemini') : 'none';

  res.json({
    status: keyConfigured ? 'configured' : 'not_configured',
    apiKey: keyConfigured ? 'configured' : 'not_set',
    keyType,
    model: GEMINI_MODEL,
    endpoint: keyConfigured
      ? (keyType === 'kilo-gateway' ? KILO_GATEWAY_URL : `${GEMINI_API_ENDPOINT}${GEMINI_MODEL}:generateContent`)
      : null,
    fallbackMode: !keyConfigured ? 'enabled' : 'disabled',
    features: {
      quizGenerator: true,
      courseRecommendations: true,
      skillGapAnalysis: true
    }
  });
});

module.exports = router;
