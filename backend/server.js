require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const coursesRouter = require('./routes/courses');
const coreRouter = require('./routes/core');
const aiRouter = require('./routes/ai');

const app = express();
const PORT = process.env.PORT || 5000;

// Core Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// Root route: Serve HTML to browser, JSON to API clients
app.get('/', (req, res) => {
  if (req.accepts('html')) {
    return res.sendFile(path.join(frontendPath, 'index.html'));
  }
  res.json({
    status: 'online',
    service: 'Capacity Connect Platform API',
    endpoints: {
      auth: {
        login: 'POST /api/auth/login',
        signup: 'POST /api/auth/signup'
      },
      user: {
        dashboard: 'GET /api/user/dashboard/:userId'
      },
      certificate: {
        detail: 'GET /api/certificate/:userId/:courseId'
      },
      admin: {
        stats: 'GET /api/admin/stats'
      },
       courses: {
         catalog: 'GET /api/courses/catalog',
         detail: 'GET /api/courses/detail/:id',
         player: 'GET /api/courses/player/:id'
       },
       ai: {
         quizGenerator: 'POST /api/ai/generate-quiz',
         recommendations: 'POST /api/ai/recommendations',
         skillGapAnalysis: 'POST /api/ai/skill-gap-analysis',
         health: 'GET /api/ai/health'
       }
    }
  });
});

app.get('/app', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Mount Platform Topics 1, 2, 6, 7
app.use('/api/auth', coreRouter.authRouter);
app.use('/api/user', coreRouter.userRouter);
app.use('/api/certificate', coreRouter.certRouter);
app.use('/api/admin', coreRouter.adminRouter);
app.use('/api', coreRouter);

// Mount Courses router for Pages 3, 4, 5
app.use('/api/courses', coursesRouter);

// Mount AI routes for Topics 8, 9, 10
app.use('/api/ai', aiRouter);

// 404 handler for undefined API routes or SPA fallback
app.use((req, res) => {
  if (req.accepts('html')) {
    return res.sendFile(path.join(frontendPath, 'index.html'));
  }
  res.status(404).json({ error: 'Endpoint not found', path: req.originalUrl });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Start server on 0.0.0.0 so devices on Wi-Fi and tunnels can connect
app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🚀 Capacity Connect Server running on port ${PORT}`);
  console.log(`   - Local Web UI:    http://localhost:${PORT}`);
  console.log(`   - Local Wi-Fi UI:  http://10.17.93.15:${PORT}`);
  console.log(`   - API Health:      http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);
});

module.exports = app;
