/*
 * Test harness for the AI Resume / Skill-Gap Scanner.
 * Uses the REAL ai.js router + REAL express.json() parser to prove:
 *   - Omitting Content-Type (current broken apiRequest behavior) -> 400 "valid resume"
 *   - Including Content-Type:application/json (fixed apiRequest) -> 200 + detected skills
 *
 * Run:  node backend/test-skill-gap-resume.js
 */
// Force the offline/mock path so the test is fast and deterministic
// (no network call to the Kilo Gateway / Gemini). looksLikeGibberish +
// extractSkillsFromText run the same way regardless of this flag.
process.env.GEMINI_API_KEY = '';

const path = require('path');
const express = require('express');
const aiRouter = require(path.join(__dirname, 'routes', 'ai.js'));

const PROJECT_COORDINATOR_RESUME = `
Sarah Johnson
Project Coordinator | Seattle, WA | sarah.johnson@email.com | (206) 555-0198 | linkedin.com/in/sarahjohnson

PROFESSIONAL SUMMARY
Results-driven Project Coordinator with 4+ years of experience managing project schedules, coordinating cross-functional stakeholders, and supporting Agile/Scrum teams. Proficient in JIRA, Trello, and Google Analytics. Holds active PMP and CSM certifications.

CORE COMPETENCIES
Project Planning & Scheduling - Agile Methodology - Scrum Framework - Stakeholder Management - Risk Management - Budget Tracking - JIRA - Trello - Google Analytics - Microsoft Office Suite (Excel, PowerPoint, Teams)

PROFESSIONAL EXPERIENCE

PROJECT COORDINATOR
Vertex Technologies - Seattle, WA
March 2022 - Present
- Coordinate daily standups, sprint planning sessions, and sprint retrospectives for 4 Agile teams using JIRA and Confluence.
- Manage stakeholder communication and expectation-setting across engineering, product, and marketing departments.
- Track project timelines, risks, and dependencies; update project documentation in Trello and SharePoint.
- Support Scrum Masters in facilitating sprint ceremonies and removing impediments.
- Analyze project metrics and team engagement data using Google Analytics.

ASSISTANT PROJECT MANAGER
Horizon Consulting - Seattle, WA
June 2020 - February 2022
- Maintained project schedules and status reports for software development initiatives.
- Coordinated with stakeholders to gather requirements and update project trackers.
- Prepared budget tracking reports and risk assessment documents for senior leadership.

EDUCATION
Bachelor of Arts in Business Administration
University of Washington - Seattle, WA

CERTIFICATIONS
- PMP - Project Management Professional
- CSM - Certified Scrum Master
- SAFe 5 Agilist
`.trim();

const TECHNICAL_RESUME = `
Alex Chen
Senior Software Engineer | San Francisco, CA | alex.chen@email.com | (415) 555-0123

PROFESSIONAL SUMMARY
Full-stack software engineer with 6 years of experience building scalable web applications using React, Node.js, and cloud technologies. Expertise in microservices architecture, database design, and CI/CD pipelines.

SKILLS
Languages: Python, JavaScript, Java, TypeScript, SQL, C++
Frameworks: React, Vue, Angular, Node.js, Express, Django, Flask, Spring
Databases: PostgreSQL, MongoDB, Redis, Elasticsearch
Cloud: AWS, Azure, GCP, Docker, Kubernetes, Terraform, Serverless
Tools: Git, Jenkins, GitHub Actions, Jest, Cypress, Docker Compose
Concepts: Microservices, REST, GraphQL, CI/CD, Agile, Scrum, TDD
Certifications: AWS Certified Solutions Architect, Kubernetes Administrator

PROFESSIONAL EXPERIENCE

SENIOR SOFTWARE ENGINEER
TechCorp Inc. - San Francisco, CA
January 2020 - Present
- Led development of a microservices-based e-commerce platform using Node.js, React, and PostgreSQL.
- Implemented CI/CD pipelines with Jenkins and GitHub Actions, reducing deployment time by 60%.
- Deployed services on AWS using ECS, Lambda, and S3 with Terraform infrastructure as code.

SOFTWARE ENGINEER
DataStream LLC - San Francisco, CA
June 2018 - December 2019
- Built real-time data processing pipelines using Python, Kafka, and Redis.
- Developed RESTful APIs with Express and PostgreSQL for analytics dashboards.
- Containerized applications with Docker and orchestrated with Kubernetes.

EDUCATION
B.S. Computer Science
Stanford University - Stanford, CA
`.trim();

const app = express();
app.use(express.json());
// Bypass auth: set a trainee user so requireRole('trainee','trainer') passes,
// without needing a live Supabase connection. authMiddleware passes through
// when no Authorization header is present.
app.use((req, res, next) => {
  req.user = { id: 'test-user-1', role: 'trainee', name: 'Test User', department: 'Enterprise Engineering' };
  next();
});
app.use('/api/ai', aiRouter);

const PORT = 5099;
const server = app.listen(PORT, async () => {
  const base = `http://localhost:${PORT}/api/ai`;

  async function postResume(resumeText, withContentType) {
    const headers = {};
    if (withContentType) headers['Content-Type'] = 'application/json';
    const res = await fetch(`${base}/skill-gap-analysis`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ resumeText, userId: 'test-user-1' }),
    });
    const body = await res.json().catch(() => ({}));
    return { status: res.status, body };
  }

  try {
    console.log('========================================================');
    console.log(' TEST 1: Project Coordinator resume, NO Content-Type');
    console.log('        (mimics current broken apiRequest/fetchWithToken)');
    console.log('========================================================');
    const t1 = await postResume(PROJECT_COORDINATOR_RESUME, false);
    console.log('HTTP status:', t1.status);
    console.log('response.status:', t1.body.status);
    console.log('response.message:', t1.body.message);
    console.log('=> ' + (t1.status === 400 ? 'REJECTED (bug reproduced)' : 'unexpected'));

    console.log('\n========================================================');
    console.log(' TEST 2: Project Coordinator resume, WITH Content-Type');
    console.log('        (mimics FIXED apiRequest)');
    console.log('========================================================');
    const t2 = await postResume(PROJECT_COORDINATOR_RESUME, true);
    console.log('HTTP status:', t2.status);
    console.log('response.status:', t2.body.status);
    if (t2.body.status === 'success') {
      console.log('=> ACCEPTED (validation passed)');
      console.log('detectedSkills:', JSON.stringify(t2.body.detectedSkills || t2.body.detected_skills));
      console.log('detectedSkillsCategories:', JSON.stringify(t2.body.detected_skills_categories || t2.body.detectedSkillsCategories));
      console.log('missingSkills:', JSON.stringify(t2.body.missingSkills || t2.body.missing_skills));
      console.log('assignedCourses:', JSON.stringify((t2.body.assignedCourses || t2.body.assigned_courses || []).map(c => ({ title: c.title, category: c.category }))));
      console.log('summary:', t2.body.summary);
      console.log('source:', t2.body.source);
    } else {
      console.log('response.message:', t2.body.message);
    }

    console.log('\n========================================================');
    console.log(' TEST 3: Technical resume, WITH Content-Type');
    console.log('========================================================');
    const t3 = await postResume(TECHNICAL_RESUME, true);
    console.log('HTTP status:', t3.status);
    console.log('response.status:', t3.body.status);
    if (t3.body.status === 'success') {
      console.log('=> ACCEPTED (validation passed)');
      console.log('detectedSkills:', JSON.stringify(t3.body.detectedSkills || t3.body.detected_skills));
      console.log('assignedCourses:', JSON.stringify((t3.body.assignedCourses || t3.body.assigned_courses || []).map(c => ({ title: c.title, category: c.category }))));
      console.log('summary:', t3.body.summary);
    } else {
      console.log('response.message:', t3.body.message);
    }
  } catch (e) {
    console.error('Test harness error:', e);
  } finally {
    server.close(() => process.exit(0));
  }
});
