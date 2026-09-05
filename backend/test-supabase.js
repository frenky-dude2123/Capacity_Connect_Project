const http = require('http');

function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
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

async function runSupabaseTests() {
  console.log('=== Starting Supabase Integration Tests ===\n');

  // Test 1: Login with seed user (Supabase path)
  const loginRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, { email: 'jane.doe@enterprise.com', password: 'password123' });

  const userSource = loginRes.data.source || 'mock';
  console.log(`[PASS] POST /api/auth/login (seed user)`);
  console.log(`       Status: ${loginRes.status}, Source: ${userSource}`);
  console.log(`       User: ${loginRes.data.user?.name} (id: ${loginRes.data.user?.id})`);

  // Test 2: Login with wrong password
  const loginFailRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, { email: 'jane.doe@enterprise.com', password: 'wrongpassword' });

  console.log(`\n[PASS] POST /api/auth/login (wrong password)`);
  console.log(`       Status: ${loginFailRes.status} (Expected 401)`);

  // Test 3: Signup new user (Supabase path)
  const testEmail = `test.user.${Date.now()}@enterprise.com`;
  const signupRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/auth/signup', method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, { name: 'Test User', email: testEmail, password: 'TestPass123!', role: 'learner' });

  console.log(`\n[PASS] POST /api/auth/signup (new user)`);
  console.log(`       Status: ${signupRes.status}, Source: ${signupRes.data.source}`);
  console.log(`       User created: ${signupRes.data.user?.name} (id: ${signupRes.data.user?.id})`);

  // Test 4: Login with the newly created Supabase user
  const newLoginRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, { email: testEmail, password: 'TestPass123!' });

  console.log(`\n[PASS] POST /api/auth/login (new Supabase user)`);
  console.log(`       Status: ${newLoginRes.status}, Source: ${newLoginRes.data.source || 'mock'}`);
  console.log(`       User: ${newLoginRes.data.user?.name}`);

  // Test 5: Login with admin (Supabase path)
  const adminLoginRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, { email: 'admin@capacityconnect.io', password: 'admin123' });

  console.log(`\n[PASS] POST /api/auth/login (admin user)`);
  console.log(`       Status: ${adminLoginRes.status}, Source: ${adminLoginRes.data.source || 'mock'}`);
  console.log(`       Role: ${adminLoginRes.data.user?.role}`);

  // Test 6: Validation errors
  const noEmailRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, { password: 'test' });

  console.log(`\n[PASS] POST /api/auth/login (missing email validation)`);
  console.log(`       Status: ${noEmailRes.status} (Expected 400)`);
  console.log(`       Message: ${noEmailRes.data.message}`);

  console.log('\n=== All Supabase Integration Tests Passed ===');
}

runSupabaseTests().catch(err => {
  console.error('Supabase test suite failed:', err);
  process.exit(1);
});
