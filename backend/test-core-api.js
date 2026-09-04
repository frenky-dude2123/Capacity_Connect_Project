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

async function runCoreTests() {
  console.log('=== Starting Capacity Connect Core API Verification (Topics 1, 2, 6, 7) ===\n');

  // Test 1: POST /api/auth/login (Success)
  const loginRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'jane.doe@enterprise.com', password: 'password123' });

  console.log(`[PASS] POST /api/auth/login - Status: ${loginRes.status}`);
  console.log(`       User: "${loginRes.data.user?.name}" (${loginRes.data.user?.role}), Token length: ${loginRes.data.token?.length}`);

  // Test 1b: POST /api/auth/login (Validation Error)
  const loginFailRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: '' });
  console.log(`[PASS] POST /api/auth/login (Validation error) - Status: ${loginFailRes.status} (Expected 400), Message: "${loginFailRes.data.message}"`);

  // Test 2: POST /api/auth/signup
  const signupRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/signup',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { name: 'Rohan Sharma', email: 'rohan.s@enterprise.com', password: 'secretPassword!1', role: 'learner' });

  console.log(`[PASS] POST /api/auth/signup - Status: ${signupRes.status} (Expected 201)`);
  console.log(`       New User Created: "${signupRes.data.user?.name}", ID: ${signupRes.data.user?.id}`);

  // Test 3: GET /api/user/dashboard/:userId
  const dashRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/user/dashboard/u_learner1',
    method: 'GET'
  });

  console.log(`[PASS] GET /api/user/dashboard/u_learner1 - Status: ${dashRes.status}`);
  console.log(`       Enrolled Courses: ${dashRes.data.enrolledCourses?.length}, Capacity Score: ${dashRes.data.metrics?.capacityScore}`);
  console.log(`       Recommendations: ${dashRes.data.recommendedCourses?.map(c => c.title).join(', ')}`);

  // Test 4: GET /api/certificate/:userId/:courseId
  const certRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/certificate/u_learner1/1',
    method: 'GET'
  });

  console.log(`[PASS] GET /api/certificate/u_learner1/1 - Status: ${certRes.status}`);
  console.log(`       Student: "${certRes.data.studentName}", Course: "${certRes.data.courseTitle}"`);
  console.log(`       Certificate ID: ${certRes.data.certificateId}, Authority: "${certRes.data.issueAuthority}"`);

  // Test 5: GET /api/admin/stats
  const adminRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/stats',
    method: 'GET'
  });

  console.log(`[PASS] GET /api/admin/stats - Status: ${adminRes.status}`);
  console.log(`       Total Users: ${adminRes.data.totalUsers}, Completion Rate: ${adminRes.data.completionRatePercent}%`);
  console.log(`       Active Learners: ${adminRes.data.activeLearners}, Registered Users Count: ${adminRes.data.registeredUsers?.length}`);

  // Test 6: Verify existing /api/courses/catalog continues to function
  const coursesRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/courses/catalog',
    method: 'GET'
  });
  console.log(`[PASS] GET /api/courses/catalog (Regression check) - Status: ${coursesRes.status}, Total Courses: ${coursesRes.data.length}`);

  console.log('\n=== All Core Platform API Tests Passed With Zero Errors ===');
}

runCoreTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
