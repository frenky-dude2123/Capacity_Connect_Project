const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../lib/supabaseClient');

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
// Master Curriculum Map
// Maps skill keywords to courses that address those gaps.
// Used for dynamic course assignment based on missing skills.
// ============================================================

const CURRICULUM_MAP = [
  {
    courseId: 1,
    title: 'Cloud Infrastructure & High-Availability Scaling',
    category: 'Cloud Architecture',
    skills: [
      'cloud', 'aws', 'azure', 'gcp', 'kubernetes', 'docker', 'load balancing',
      'scaling', 'high availability', 'ha', 'multi-region', 'failover',
      'auto-scaling', 'resilience', 'circuit breaker', 'envoy', 'resilience4j',
      'terraform', 'ansible', 'jenkins', 'github actions', 'ci/cd'
    ],
    addressGap: (missing) =>
      `Missing cloud architecture, scaling, or high-availability skills needed for ${missing}`
  },
  {
    courseId: 2,
    title: 'Enterprise Data Governance & ISO 27001 Security',
    category: 'Security & Compliance',
    skills: [
      'security', 'iso 27001', 'compliance', 'rbac', 'encryption',
      'zero trust', 'audit', 'governance', 'data protection', 'cryptography',
      'kms', 'key management', 'incident response', 'penetration testing',
      'risk management', 'risk assessment', 'vulnerability', 'soc 2', 'hipaa', 'gdpr'
    ],
    addressGap: (missing) =>
      `Missing security/compliance or governance skills needed for ${missing}`
  },
  {
    courseId: 3,
    title: 'Distributed Systems Design & Microservices Engineering',
    category: 'Software Engineering',
    skills: [
      'microservices', 'saga', 'distributed systems', 'kafka', 'paxos',
      'raft', 'opentelemetry', 'event-driven', 'event sourcing',
      'domain-driven design', 'ddd', 'consensus', 'distributed transactions',
      'observability', 'tracing', 'api', 'rest api', 'graphql'
    ],
    addressGap: (missing) =>
      `Missing distributed systems or microservices skills needed for ${missing}`
  }
];

// ============================================================
// Expanded Skill Category Maps
// Covers non-technical and cross-functional skill domains.
// ============================================================

const SKILL_CATEGORIES = {
  'Project Management': {
    icon: '📋',
    skills: [
      'agile', 'scrum', 'kanban', 'waterfall', 'pmp', 'csp', 'csm', 'safe',
      'stakeholder management', 'stakeholder engagement', 'risk management',
      'risk mitigation', 'risk assessment', 'budget management', 'budget tracking',
      'cost management', 'resource planning', 'resource allocation', 'schedule management',
      'timeline management', 'gantt', 'project planning', 'project lifecycle',
      'work breakdown structure', 'wbs', 'critical path', 'scope management',
      'vendor management', 'contract management', 'portfolio management',
      'program management', 'project governance', 'change management',
      'issue tracking', 'jira', 'trello', 'asana', 'monday.com', 'basecamp',
      'ms project', 'microsoft project', 'prince2', 'scrum master',
      'product owner', 'sprint planning', 'sprint retrospective', 'sprint review'
    ],
    courseIds: []
  },
  'Business & Operations': {
    icon: '📊',
    skills: [
      'strategic planning', 'business strategy', 'operations management',
      'process improvement', 'process optimization', 'operational excellence',
      'lean', 'lean six sigma', 'six sigma', 'kaizen', 'continuous improvement',
      'quality management', 'quality assurance', 'qa', 'kpis', 'kpi',
      'okrs', 'okr', 'business analysis', 'requirements gathering',
      'gap analysis', 'business process', 'workflow design', 'workflow optimization',
      'supply chain', 'logistics', 'vendor relations', 'client relations',
      'account management', 'relationship management', 'cross-functional',
      'stakeholder analysis'
    ],
    courseIds: []
  },
  'Marketing & Analytics': {
    icon: '📈',
    skills: [
      'digital marketing', 'digital advertising', 'google analytics',
      'google ads', 'facebook ads', 'linkedin ads', 'seo', 'search engine optimization',
      'sem', 'paid search', 'organic search', 'content marketing',
      'email marketing', 'campaign management', 'campaign strategy',
      'brand management', 'social media marketing', 'influencer marketing',
      'conversion optimization', 'conversion rate optimization', 'cro',
      'marketing automation', 'hubspot', 'market research', 'data analysis',
      'analytics', 'tableau', 'power bi', 'looker', 'data visualization',
      'a/b testing', 'multivariate testing', 'user testing',
      'user research', 'customer journey', 'customer experience', 'cx',
      'net promoter score', 'nps'
    ],
    courseIds: []
  },
  'Finance & Administration': {
    icon: '💰',
    skills: [
      'financial reporting', 'financial analysis', 'budgeting', 'financial planning',
      'forecasting', 'variance analysis', 'cost accounting', 'managerial accounting',
      'excel', 'excel modeling', 'advanced excel', 'pivot tables',
      'vlookup', 'financial modeling', 'valuation', 'investment analysis',
      'risk assessment', 'compliance', 'regulatory reporting',
      'contract management', 'procurement', 'expense management',
      'invoice processing', 'accounts payable', 'accounts receivable',
      'general ledger', 'bookkeeping', 'quarterly reporting',
      'annual reporting', 'tax preparation', 'audit support'
    ],
    courseIds: []
  },
  'Soft Skills & Leadership': {
    icon: '🤝',
    skills: [
      'leadership', 'team leadership', 'leadership development',
      'conflict resolution', 'conflict management', 'negotiation',
      'communication', 'written communication', 'verbal communication',
      'presentation', 'public speaking', 'presentation skills',
      'interpersonal skills', 'emotional intelligence', 'eq',
      'influence', 'collaboration', 'collaborative leadership',
      'coaching', 'mentoring', 'delegation', 'decision making',
      'critical thinking', 'problem solving', 'analytical thinking',
      'adaptability', 'change management', 'resilience',
      'time management', 'priority management', 'stress management'
    ],
    courseIds: []
  },
  'Certifications': {
    icon: '🏆',
    skills: [
      'pmp', 'csp', 'csm', 'cspo', 'safe scrum master', 'safe agilist',
      'google analytics', 'google ads', 'google cloud', 'aws certified',
      'azure certified', 'itil', 'cisa', 'cissp', 'cisa', 'cism',
      'six sigma green belt', 'six sigma black belt', 'lean six sigma',
      'chartered financial analyst', 'cfa', 'cpa', 'accA', 'ACCA',
      'PRINCE2', 'PMI-ACP', 'PgMP', 'PfMP', 'CBAP', 'CCBA',
      'AWS Certified Solutions Architect', 'Google Cloud Professional',
      'Microsoft Certified', 'Cisco CCNA', 'CompTIA', 'CISSP'
    ],
    courseIds: []
  }
};

// ============================================================
// Input Validation
// ============================================================

function looksLikeGibberish(text) {
  if (!text || typeof text !== 'string') return true;
  const cleaned = text.trim();
  if (cleaned.length < 20) return true;

  const words = cleaned.split(/\s+/).filter(w => w.length > 0);
  if (words.length < 3) return true;

  const lower = cleaned.toLowerCase();

  // Check for long runs of keyboard-row characters (real gibberish pattern)
  // But use a more conservative threshold: 3+ consecutive identical-ish patterns
  const keyboardRows = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
  const rowHits = keyboardRows.reduce((count, row) => {
    let hits = 0;
    for (let i = 0; i < row.length - 2; i++) {
      if (lower.includes(row.substring(i, i + 3))) hits++;
    }
    return count + hits;
  }, 0);
  // Only flag as gibberish if there are MANY keyboard row sequences AND
  // the text is short (indicating random typing, not a real resume)
  if (rowHits >= 5 && cleaned.length < 200) return true;

  // Check for excessive repeated characters (e.g., "aaaaaa")
  const repeatedChars = (cleaned.match(/(.)\1{5,}/g) || []).length;
  if (repeatedChars > 3) return true;

  // Must have at least some alphabetic words
  const hasSomeAlpha = words.some(w => /[a-zA-Z]{2,}/.test(w));
  if (!hasSomeAlpha) return true;

  // Check for excessive random/special characters (not typical in resumes)
  const randomCharRatio = (cleaned.match(/[^a-zA-Z0-9\s.,!?'"\-():/]/g) || []).length / Math.max(cleaned.length, 1);
  if (randomCharRatio > 0.3 && cleaned.length < 200) return true;

  // Check for minimum word diversity — if 80%+ of words are duplicates, likely gibberish
  const wordFreq = {};
  words.forEach(w => { wordFreq[w.toLowerCase()] = (wordFreq[w.toLowerCase()] || 0) + 1; });
  const uniqueRatio = Object.keys(wordFreq).length / words.length;
  if (uniqueRatio < 0.3 && words.length > 10) return true;

  return false;
}

// ============================================================
// Skill Extraction Helpers
// ============================================================

// All tech skills from CURRICULUM_MAP plus a comprehensive generic tech list
const ALL_TECH_SKILLS = [];
CURRICULUM_MAP.forEach(c => { c.skills.forEach(s => ALL_TECH_SKILLS.push(s)); });
[
  'python', 'javascript', 'java', 'c++', 'c#', 'rust', 'typescript',
  'react', 'vue', 'angular', 'node.js', 'express', 'django', 'flask',
  'sql', 'nosql', 'mongodb', 'postgresql', 'mysql', 'redis',
  'git', 'ci/cd', 'agile', 'scrum', 'linux', 'bash', 'terraform',
  'ansible', 'jenkins', 'github actions', 'rest', 'graphql',
  'html', 'css', 'sass', 'webpack', 'docker', 'kubernetes',
  'aws', 'azure', 'gcp', 'cloud', 'serverless', 'lambda', 'firebase',
  'machine learning', 'tensorflow', 'pytorch',
  'data science', 'data analysis', 'pandas', 'numpy', 'matplotlib',
  'testing', 'junit', 'cypress', 'jest', 'vitest', 'selenium',
  'docker compose', 'elasticsearch', 'rabbitmq', 'redis',
  'spring', 'hibernate', 'maven', 'gradle', 'webpack',
  'aws lambda', 'cloud functions', 'aws ec2', 'amazon s3'
].forEach(t => ALL_TECH_SKILLS.push(t));

// Flatten all skill categories into a single lookup
const ALL_DETECTED_SKILLS = [...ALL_TECH_SKILLS];
Object.values(SKILL_CATEGORIES).forEach(cat => {
  cat.skills.forEach(s => ALL_DETECTED_SKILLS.push(s));
});

function extractSkillsFromText(text) {
  const lower = text.toLowerCase();
  const found = new Set();

  // Sort by length descending to match longer phrases first (e.g., "project management" before "project")
  const allSkills = [...ALL_DETECTED_SKILLS].sort((a, b) => b.length - a.length);

  allSkills.forEach(skill => {
    const skillLower = skill.toLowerCase();
    // For multi-word skills or abbreviations (2+ chars), use simple includes
    if (skillLower.length >= 2) {
      if (lower.includes(skillLower)) {
        // Additional check: for very short skills (2-3 chars), ensure word boundary
        if (skillLower.length <= 3) {
          const regex = new RegExp('\\b' + skillLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b');
          if (regex.test(lower)) {
            found.add(skill);
          }
        } else {
          found.add(skill);
        }
      }
    }
  });

  return Array.from(found);
}

function identifyMissingSkills(detectedSkills, targetRole) {
  const roleLower = (targetRole || '').toLowerCase();

  // Role-based skill requirements (expanded)
  const roleSkillMap = {
    'project manager': ['agile', 'scrum', 'pmp', 'stakeholder management', 'budget management', 'risk management', 'jira'],
    'project coordinator': ['agile', 'scrum', 'stakeholder management', 'jira', 'trello', 'risk management', 'budget tracking'],
    'scrum master': ['scrum', 'csm', 'agile', 'sprint planning', 'sprint retrospective', 'stakeholder management'],
    'cloud architect': ['cloud', 'aws', 'azure', 'gcp', 'kubernetes', 'docker', 'high availability', 'scaling', 'load balancing', 'terraform'],
    'cloud engineer': ['cloud', 'aws', 'azure', 'gcp', 'kubernetes', 'docker', 'terraform', 'ci/cd'],
    'security engineer': ['security', 'iso 27001', 'compliance', 'zero trust', 'encryption', 'rbac', 'audit', 'risk assessment'],
    'devops engineer': ['kubernetes', 'docker', 'ci/cd', 'terraform', 'ansible', 'jenkins', 'monitoring', 'git'],
    'software engineer': ['microservices', 'distributed systems', 'rest', 'graphql', 'git', 'agile', 'javascript'],
    'data engineer': ['sql', 'nosql', 'etl', 'kafka', 'data governance', 'python', 'aws'],
    'backend engineer': ['node.js', 'python', 'java', 'sql', 'microservices', 'rest', 'git'],
    'data analyst': ['excel', 'sql', 'python', 'tableau', 'power bi', 'data analysis', 'google analytics'],
    'marketing analyst': ['google analytics', 'excel', 'data analysis', 'seo', 'digital marketing', 'tableau'],
    'business analyst': ['business analysis', 'requirements gathering', 'excel', 'process improvement', 'data analysis'],
    'operations manager': ['operations management', 'process optimization', 'lean', 'supply chain', 'vendor relations'],
    'product manager': ['product management', 'agile', 'scrum', 'stakeholder management', 'roadmap', 'prioritization']
  };

  // Find the best matching role (check if roleLower contains or is contained in a key)
  let required = null;
  for (const [key, skills] of Object.entries(roleSkillMap)) {
    if (roleLower.includes(key)) {
      required = skills;
      break;
    }
  }

  if (!required) {
    // Default: require a broad set of enterprise skills across categories
    required = [
      'communication', 'problem solving', 'teamwork', 'leadership',
      'project management', 'data analysis', 'critical thinking'
    ];
  }

  const detectedLower = detectedSkills.map(s => s.toLowerCase());
  return required.filter(skill => !detectedLower.includes(skill.toLowerCase()));
}

function assignCoursesForMissingSkills(missingSkills, detectedSkills = []) {
  const assigned = [];
  const assignedCourseIds = new Set();

  missingSkills.forEach(skill => {
    const skillLower = skill.toLowerCase();
    CURRICULUM_MAP.forEach(course => {
      if (!assignedCourseIds.has(course.courseId)) {
        const matches = course.skills.some(s => skillLower.includes(s) || s.includes(skillLower));
        if (matches) {
          assignedCourseIds.add(course.courseId);
          assigned.push({
            course_id: 'COURSE-' + String(course.courseId).padStart(3, '0'),
            title: course.title,
            category: course.category,
            addresses_gap: course.addressGap(skill),
            quiz_required: true,
            passing_score: '80%',
            status: 'Locked until enrolled'
          });
        }
      }
    });
  });

  return assigned;
}

function findClosestCourseForSkill(skill) {
  const skillLower = skill.toLowerCase();
  for (const course of CURRICULUM_MAP) {
    if (course.skills.some(s => skillLower.includes(s) || s.includes(skillLower))) {
      return {
        courseId: course.courseId,
        title: course.title,
        category: course.category
      };
    }
  }
  return null;
}

function getCategoriesForSkills(skills) {
  const categories = new Set();
  const matched = [];

  skills.forEach(skill => {
    const skillLower = skill.toLowerCase();
    let categorized = false;
    
    Object.entries(SKILL_CATEGORIES).forEach(([catName, cat]) => {
      // Sort by length descending to match longer phrases first
      const sortedSkills = [...cat.skills].sort((a, b) => b.length - a.length);
      for (const s of sortedSkills) {
        const sLower = s.toLowerCase();
        if (skillLower.length <= 3) {
          const regex = new RegExp('\\b' + sLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b');
          if (regex.test(skillLower)) {
            categories.add(catName);
            matched.push({ skill, category: catName });
            categorized = true;
            break;
          }
        } else {
          if (skillLower.includes(sLower) || sLower.includes(skillLower)) {
            categories.add(catName);
            matched.push({ skill, category: catName });
            categorized = true;
            break;
          }
        }
      }
    });
    
    if (!categorized) {
      // Check if it's a tech skill
      const techMatch = ALL_TECH_SKILLS.some(t => t.toLowerCase() === skillLower);
      if (techMatch) {
        categories.add('Technical/CS');
        matched.push({ skill, category: 'Technical/CS' });
      }
    }
  });

  return { categories: Array.from(categories), matched };
}

function buildCertificationPath(assignedCourses, targetRole) {
  const trackName = targetRole
    ? `Capacity Connect Certified Specialist in ${targetRole}`
    : 'Capacity Connect Certified Specialist';

  return {
    track_name: trackName,
    unlocked: false,
    unlock_condition: 'Pass all assigned module quizzes with >= 80%'
  };
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
 * Protected: authenticated users (trainee, trainer, admin).
 */
router.post('/generate-quiz', authMiddleware, requireRole('trainee', 'trainer'), async (req, res) => {
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
 * Protected: authenticated users (trainee, trainer, admin).
 */
router.post('/recommendations', authMiddleware, requireRole('trainee', 'trainer'), async (req, res) => {
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
 * Protected: authenticated users (trainee, trainer, admin).
 */
router.post('/skill-gap-analysis', authMiddleware, requireRole('trainee', 'trainer'), async (req, res) => {
  try {
    const { resumeText, userId, targetRole, department } = req.body || {};

    // STEP 1: Input Validation
    if (!resumeText || typeof resumeText !== 'string') {
      return res.status(400).json({
        status: 'Invalid Input',
        message: 'Please upload a valid resume or paste readable professional experience.'
      });
    }

    if (looksLikeGibberish(resumeText)) {
      return res.status(400).json({
        status: 'Invalid Input',
        message: 'Please upload a valid resume or paste readable professional experience.'
      });
    }

    const roleContext = targetRole || department || 'enterprise engineering';

    // STEP 2: Extract skills and identify gaps
    let detectedSkills = [];
    let missingSkills = [];

    if (GEMINI_API_KEY) {
      const prompt = `
You are an AI resume and skill gap analyzer for an enterprise learning platform.

Analyze the following resume/profile text for a ${roleContext} role:

--- RESUME ---
${resumeText.substring(0, 4000)}
--- END RESUME ---

1. Extract all skills mentioned (technical skills, tools, frameworks, methodologies,
   soft skills, certifications, business/operations skills, marketing skills, etc.).
2. Identify skill gaps compared to the target role requirements.
3. Return ONLY valid JSON with these keys:
   - detectedSkills: array of strings (all skills found in resume)
   - missingSkills: array of strings (skills the target role needs that are missing)
   - detectedSkillsCategories: array of objects { skill, category } mapping each detected skill to its category (Project Management, Business & Operations, Marketing & Analytics, Finance & Administration, Soft Skills & Leadership, Certifications, or Technical/CS)`;

      const schema = {
        type: 'object',
        properties: {
          detectedSkills: { type: 'array', items: { type: 'string' } },
          missingSkills: { type: 'array', items: { type: 'string' } },
          detectedSkillsCategories: { type: 'array', items: { type: 'object' } }
        },
        required: ['detectedSkills', 'missingSkills']
      };

      const result = await callLLMAPI(prompt, '', schema);

      if (!result.usedMock && result.data) {
        detectedSkills = result.data.detectedSkills || [];
        missingSkills = result.data.missingSkills || [];
      } else {
        detectedSkills = extractSkillsFromText(resumeText);
        missingSkills = identifyMissingSkills(detectedSkills, roleContext);
      }
    } else {
      detectedSkills = extractSkillsFromText(resumeText);
      missingSkills = identifyMissingSkills(detectedSkills, roleContext);
    }

    // Categorize detected skills
    const skillCategories = getCategoriesForSkills(detectedSkills);

    // STEP 3: Assign courses that address missing skills
    const assignedCourses = assignCoursesForMissingSkills(missingSkills, detectedSkills);
    const certificationPath = buildCertificationPath(assignedCourses, targetRole);

    // Handle missing skills that don't have a matching course
    const unmatchedMissingSkills = [];
    missingSkills.forEach(skill => {
      const course = findClosestCourseForSkill(skill);
      if (!course) {
        unmatchedMissingSkills.push(skill);
      }
    });

    // If no specific courses matched but we have missing skills, assign general recommendations
    const finalAssigned = assignedCourses.length > 0
      ? assignedCourses
      : (missingSkills.length > 0
          ? CURRICULUM_MAP.slice(0, 2).map(course => ({
              course_id: 'COURSE-' + String(course.courseId).padStart(3, '0'),
              title: course.title,
              category: course.category,
              addresses_gap: 'General skill gap coverage for ' + course.category.toLowerCase(),
              quiz_required: true,
              passing_score: '80%',
              status: 'Locked until enrolled'
            }))
          : []);

    // Build unrecognized skills info (detected skills with no matching course or category)
    const unrecognizedSkills = detectedSkills.filter(s => {
      const course = findClosestCourseForSkill(s);
      if (course) return false;
      const sLower = s.toLowerCase();
      // Check ALL_TECH_SKILLS and SKILL_CATEGORIES
      const inTechSkills = ALL_TECH_SKILLS.some(t => t.toLowerCase() === sLower);
      const inCategories = Object.values(SKILL_CATEGORIES).some(cat =>
        cat.skills.some(skill => skill.toLowerCase() === sLower)
      );
      return !inTechSkills && !inCategories;
    });

    res.json({
      status: 'success',
      learner_id: userId || 'anonymous',
      target_role: roleContext,
      detected_skills: detectedSkills,
      missing_skills: missingSkills,
      detected_skills_categories: skillCategories.matched,
      skill_categories: skillCategories.categories,
      assigned_courses: finalAssigned,
      certification_path: certificationPath,
      unrecognized_skills: unrecognizedSkills,
      missing_skills_without_courses: unmatchedMissingSkills,
      detectedSkills,
      missingSkills,
      recommendedCourses: finalAssigned,
      suggestedEnrollments: finalAssigned.map(c => ({
        courseId: c.course_id,
        title: c.title,
        pathway: c.category
      })),
      summary: `Detected ${detectedSkills.length} skills across ${skillCategories.categories.length} discipline(s). ` +
        `Found ${missingSkills.length} skill gaps. ${assignedCourses.length > 0 ? assignedCourses.length + ' targeted course(s) assigned.' : missingSkills.length > 0 ? 'No direct course match found for gaps — general recommendations provided.' : 'No skill gaps detected.'}`,
      source: GEMINI_API_KEY ? 'ai' : 'mock',
      model: GEMINI_API_KEY ? GEMINI_MODEL : 'fallback'
    });
  } catch (err) {
    console.error('[AI] Skill gap analysis error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Skill gap analysis failed',
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
 * This endpoint is public (no auth required).
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

/**
 * GET /api/trainer/quiz-questions
 * Protected: trainer only.
 * Returns quiz questions from the course pool.
 * (The route is defined in core.js using LOCAL_QUIZ_POOL below.)
 */

// Export mock data so core.js can reuse it for the trainer quiz-questions route
module.exports = router;
module.exports.MOCK_QUIZ_QUESTIONS = MOCK_QUIZ_QUESTIONS;
module.exports.MOCK_RECOMMENDATIONS = MOCK_RECOMMENDATIONS;
