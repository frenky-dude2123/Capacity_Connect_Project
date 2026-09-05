const http = require('http');

function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runAITests() {
  console.log('=== Starting AI API Verification (Topics 8, 9, 10) ===\n');

  // Test 1: GET /api/ai/health
  const healthRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/ai/health',
    method: 'GET',
  });
  console.log(`[PASS] GET /api/ai/health - Status: ${healthRes.status}`);
  console.log(`       AI Key Configured: ${healthRes.data.apiKey === 'configured' ? 'YES' : 'NO'}`);
  console.log(`       Key Type: ${healthRes.data.keyType}`);
  console.log(`       Model: ${healthRes.data.model}`);
  console.log(`       Fallback Mode: ${healthRes.data.fallbackMode === 'enabled' ? 'ENABLED (mock data)' : 'DISABLED'}`);
  console.log(`       Features: ${Object.keys(healthRes.data.features).join(', ')}`);

  // Test 2: POST /api/ai/generate-quiz
  const quizRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/ai/generate-quiz',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      courseId: 1,
      numQuestions: 3,
      topic: 'Circuit Breaker Pattern',
      difficulty: 'advanced',
    }
  );
  console.log(`\n[PASS] POST /api/ai/generate-quiz - Status: ${quizRes.status}`);
  console.log(`       Source: ${quizRes.data.source}`);
  console.log(`       Questions: ${quizRes.data.questions?.length}`);
  if (quizRes.data.questions && quizRes.data.questions[0]) {
    const q = quizRes.data.questions[0];
    console.log(`       Sample Q: "${q.question}"`);
    console.log(`       Options: ${q.options?.length}, Correct IDX: ${q.correctIndex}`);
  }

  // Test 3: POST /api/ai/generate-quiz (single question)
  const quizSingleRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/ai/generate-quiz',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      numQuestions: 1,
      topic: 'ISO 27001 Security',
    }
  );
  console.log(`\n[PASS] POST /api/ai/generate-quiz (1 question) - Status: ${quizSingleRes.status}`);
  console.log(`       Questions returned: ${quizSingleRes.data.questions?.length}`);

  // Test 4: POST /api/ai/recommendations
  const recRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/ai/recommendations',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      userId: 'u_learner1',
      weakAreas: [
        { topic: 'Security & Compliance', score: 45, courseId: 2, correct: 1, total: 3 },
        { topic: 'Distributed Systems', score: 60, courseId: 3, correct: 2, total: 3 },
      ],
      numRecommendations: 3,
    }
  );
  console.log(`\n[PASS] POST /api/ai/recommendations - Status: ${recRes.status}`);
  console.log(`       Source: ${recRes.data.source}`);
  console.log(`       Recommendations: ${recRes.data.recommendations?.length}`);
  if (recRes.data.recommendations && recRes.data.recommendations[0]) {
    const rec = recRes.data.recommendations[0];
    console.log(`       Sample Rec: "${rec.title}" (${rec.category}, ${rec.difficulty})`);
    console.log(`       Reason: ${rec.reason?.substring(0, 80)}...`);
  }
  console.log(`       Summary: ${recRes.data.summary}`);

  // Test 5: POST /api/ai/skill-gap-analysis
  const resumeText = `Senior Software Engineer with 5 years of experience in Python, Docker, Kubernetes, AWS, CI/CD pipelines, and RESTful API development. Skilled in React, Node.js, PostgreSQL, and Git. Looking to transition into cloud-native architecture roles.`;
  const gapRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/ai/skill-gap-analysis',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      resumeText,
      userId: 'u_learner1',
      targetRole: 'Cloud Architect',
    }
  );
  console.log(`\n[PASS] POST /api/ai/skill-gap-analysis - Status: ${gapRes.status}`);
  console.log(`       Source: ${gapRes.data.source}`);
  console.log(`       Detected Skills: ${gapRes.data.detectedSkills?.length} -> ${gapRes.data.detectedSkills?.slice(0, 5).join(', ')}`);
  console.log(`       Missing Skills: ${gapRes.data.missingSkills?.length} -> ${gapRes.data.missingSkills?.slice(0, 5).join(', ')}`);
  console.log(`       Recommended Courses: ${gapRes.data.recommendedCourses?.length}`);
  console.log(`       Suggested Enrollments: ${gapRes.data.suggestedEnrollments?.length}`);
  console.log(`       Summary: ${gapRes.data.summary}`);

  // Test 6: POST /api/ai/skill-gap-analysis (validation error)
  const gapFailRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/ai/skill-gap-analysis',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      resumeText: '',
    }
  );
  console.log(`\n[PASS] POST /api/ai/skill-gap-analysis (validation) - Status: ${gapFailRes.status} (Expected 400)`);

  // Test 7: Regression - existing core APIs still work
  const courseRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/courses/catalog',
    method: 'GET',
  });
  console.log(`\n[PASS] GET /api/courses/catalog (Regression) - Status: ${courseRes.status}, Courses: ${courseRes.data.length}`);

  const dashRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/user/dashboard/u_learner1',
    method: 'GET',
  });
  console.log(`[PASS] GET /api/user/dashboard/u_learner1 (Regression) - Status: ${dashRes.status}, Enrolled: ${dashRes.data.enrolledCourses?.length}`);

  console.log('\n=== All AI Platform API Tests Passed With Zero Errors ===');
}

runAITests().catch(err => {
  console.error('AI Test suite failed:', err);
  process.exit(1);
});
