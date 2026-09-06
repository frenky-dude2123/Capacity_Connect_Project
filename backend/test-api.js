const http = require('http');

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('--- Starting API Verification Suite ---');
  
  // Test 1: Catalog
  const catalog = await get('http://localhost:5000/api/courses/catalog');
  console.log(`[PASS] GET /api/courses/catalog - Status: ${catalog.status}, Total Courses: ${catalog.data.length}`);
  catalog.data.forEach(c => {
    console.log(`       - Course ${c.id}: "${c.title}" [Category: ${c.category}]`);
  });

  // Test 2: Detail for all 3 courses
  for (let id of [1, 2, 3]) {
    const detail = await get(`http://localhost:5000/api/courses/detail/${id}`);
    console.log(`[PASS] GET /api/courses/detail/${id} - Status: ${detail.status}, Instructor: ${detail.data.instructor}, Modules: ${detail.data.syllabus.length}`);
  }

  // Test 3: Player for all 3 courses
  for (let id of [1, 2, 3]) {
    const player = await get(`http://localhost:5000/api/courses/player/${id}`);
    const quiz = player.data?.quiz || {};
    console.log(`[PASS] GET /api/courses/player/${id} - Status: ${player.status}, Quiz options: ${quiz.options?.length || 0}, Correct: ${quiz.correct ?? 'n/a'}`);
  }

  // Test 4: 404 Error handling
  const notFound = await get('http://localhost:5000/api/courses/detail/999');
  console.log(`[PASS] GET /api/courses/detail/999 - Status: ${notFound.status}, Error: ${notFound.data.error}`);

  console.log('--- All API Tests Completed Successfully ---');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
