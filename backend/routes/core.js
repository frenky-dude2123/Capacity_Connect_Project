const express = require('express');
const {
  isSupabaseAvailable,
  hashPassword,
  verifyPassword,
  getUserById,
  getUserByEmail,
  createUser,
} = require('../lib/supabaseClient');

// Separate sub-routers
const authRouter = express.Router();
const userRouter = express.Router();
const certRouter = express.Router();
const adminRouter = express.Router();

// Master core router combining all four
const coreRouter = express.Router();

// In-memory mock users database
const users = [
  {
    id: 'u_learner1',
    name: 'Jane Doe',
    email: 'jane.doe@enterprise.com',
    password: 'password123',
    role: 'learner',
    department: 'Cloud Engineering'
  },
  {
    id: 'u_admin',
    name: 'Alex Rivera',
    email: 'admin@capacityconnect.io',
    password: 'admin123',
    role: 'admin',
    department: 'Technical Operations'
  }
];

// Course reference for certificates
const courseTitles = {
  '1': 'Cloud Infrastructure & High-Availability Scaling',
  '2': 'Enterprise Data Governance & ISO 27001 Security',
  '3': 'Distributed Systems Design & Microservices Engineering'
};

// ==========================================
// TOPIC 1: AUTHENTICATION (Login / Signup)
// ==========================================

/**
 * POST /api/auth/login
 * Accepts: { email, password }
 * Returns: user (id, name, email, role) + mock auth token.
 * Queries Supabase first with bcrypt verification; falls back to in-memory mock data.
 */
authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Both email and password are required.'
      });
    }

    // Try Supabase first (with bcrypt verification)
    if (isSupabaseAvailable) {
      const supabaseUser = await getUserByEmail(email);
      if (supabaseUser) {
        const isValid = await verifyPassword(password, supabaseUser.password_hash);
        if (isValid) {
          const token = `mock-jwt-token-${supabaseUser.id}-${Date.now()}`;
          return res.status(200).json({
            message: 'Login successful',
            token,
            source: 'supabase',
            user: {
              id: supabaseUser.id,
              name: supabaseUser.name,
              email: supabaseUser.email,
              role: supabaseUser.role,
              department: supabaseUser.department
            }
          });
        }
        return res.status(401).json({
          error: 'Invalid credentials',
          message: 'Email or password does not match.'
        });
      }
    }

    // Fallback: in-memory mock database (plaintext password check)
    let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      // Create user session dynamically for testing
      const isDomainAdmin = email.toLowerCase().includes('admin');
      user = {
        id: `u_${Date.now()}`,
        name: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, c => c.toUpperCase()),
        email: email,
        password: 'password123',
        role: isDomainAdmin ? 'admin' : 'learner',
        department: 'General Engineering'
      };
      users.push(user);
    }

    // Verify plaintext password for in-memory fallback
    if (user.password && user.password !== password) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password does not match.'
      });
    }

    const token = `mock-jwt-token-${user.id}-${Date.now()}`;

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Login error', details: err.message });
  }
});

/**
 * POST /api/auth/signup
 * Accepts: { name, email, password, role }
 * Returns: new mock user (id, name, email, role) + mock auth token
 */
authRouter.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Name, email, and password are all required.'
      });
    }

    const assignedRole = role === 'admin' ? 'admin' : 'learner';
    const userEmail = email.trim().toLowerCase();

    // Try Supabase first (with bcrypt hashing)
    if (isSupabaseAvailable) {
      // Check if email already exists
      const existingUser = await getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'A user with this email already exists.'
        });
      }

      const passwordHash = await hashPassword(password);
      const supabaseUser = await createUser({
        name: name.trim(),
        email: userEmail,
        password_hash: passwordHash,
        role: assignedRole,
        department: 'Enterprise Learning',
      });

      if (supabaseUser) {
        const token = `mock-jwt-token-${supabaseUser.id}-${Date.now()}`;
        return res.status(201).json({
          message: 'User registered successfully',
          token,
          source: 'supabase',
          user: {
            id: supabaseUser.id,
            name: supabaseUser.name,
            email: supabaseUser.email,
            role: supabaseUser.role,
            department: supabaseUser.department
          }
        });
      }
    }

    // Fallback: in-memory mock database
    const newUser = {
      id: `u_${Date.now()}`,
      name: name.trim(),
      email: userEmail,
      password,
      role: assignedRole,
      department: 'Enterprise Learning'
    };

    users.push(newUser);

    const token = `mock-jwt-token-${newUser.id}-${Date.now()}`;

    res.status(201).json({
      message: 'User registered successfully',
      token,
      source: 'mock',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Signup error', details: err.message });
  }
});

// ==========================================
// TOPIC 2: LEARNER DASHBOARD
// ==========================================

/**
 * GET /api/user/dashboard/:userId
 * Returns enrolled courses array, completion metrics, and recommended suggestions.
 * Attempts to fetch the user profile from Supabase; falls back to in-memory mock data.
 */
userRouter.get('/dashboard/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    let user = users.find(u => u.id === userId);

    // Try Supabase if user not found in-memory
    if (!user && isSupabaseAvailable) {
      const supabaseUser = await getUserById(userId);
      if (supabaseUser) {
        user = supabaseUser;
      }
    }

    if (!user) {
      user = {
        id: userId,
        name: 'Jane Doe',
        email: 'jane.doe@enterprise.com',
        role: 'learner'
      };
    }

    const enrolledCourses = [
      {
        id: 1,
        title: 'Cloud Infrastructure & High-Availability Scaling',
        category: 'Cloud Architecture',
        progressPercent: 68,
        status: 'In Progress',
        instructor: 'Dr. Aris Vance'
      },
      {
        id: 2,
        title: 'Enterprise Data Governance & ISO 27001 Security',
        category: 'Security & Compliance',
        progressPercent: 92,
        status: 'Quiz Ready',
        instructor: 'Elena Rostova'
      },
      {
        id: 3,
        title: 'Distributed Systems Design & Microservices Engineering',
        category: 'Software Engineering',
        progressPercent: 35,
        status: 'In Progress',
        instructor: 'Marcus Chen'
      }
    ];

    const metrics = {
      overallCompletionPercent: 65,
      capacityScore: 94,
      activeCourses: 3,
      trainingHours: 42.5,
      completedCertifications: 2
    };

    const recommendedCourses = [
      {
        id: 101,
        title: 'Zero Trust Architecture & Identity Federation',
        category: 'Cybersecurity',
        estimatedHours: 8,
        difficulty: 'Advanced'
      },
      {
        id: 102,
        title: 'Observability & Chaos Testing in Kubernetes',
        category: 'DevOps',
        estimatedHours: 12,
        difficulty: 'Intermediate'
      },
      {
        id: 103,
        title: 'Event-Driven Microservices with Apache Kafka',
        category: 'Software Engineering',
        estimatedHours: 10,
        difficulty: 'Advanced'
      }
    ];

    res.status(200).json({
      userId: user.id,
      userName: user.name,
      enrolledCourses,
      metrics,
      recommendedCourses
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dashboard data', details: err.message });
  }
});

// ==========================================
// TOPIC 6: CERTIFICATE
// ==========================================

/**
 * GET /api/certificate/:userId/:courseId
 * Returns certificate metadata including studentName, courseTitle, completionDate,
 * certificateId, and issueAuthority for rendering/downloading.
 */
certRouter.get('/:userId/:courseId', async (req, res) => {
  try {
    const { userId, courseId } = req.params;

    let user = users.find(u => u.id === userId);

    // Try Supabase if user not found in-memory
    if (!user && isSupabaseAvailable) {
      const supabaseUser = await getUserById(userId);
      if (supabaseUser) {
        user = supabaseUser;
      }
    }

    const studentName = user ? (user.name || 'Jane Doe') : 'Jane Doe';

    const courseTitle = courseTitles[courseId] || `Advanced Enterprise Certification (Course #${courseId})`;
    const certificateId = `CERT-2026-CC-${Math.abs((userId.hashCode ? userId.hashCode() : 8942) + Number(courseId) * 17)}`;

    res.status(200).json({
      certificateId,
      userId,
      studentName,
      courseId: isNaN(courseId) ? courseId : Number(courseId),
      courseTitle,
      completionDate: 'September 4, 2026',
      issueAuthority: 'Capacity Connect Enterprise Accreditation Board',
      grade: 'Passed with Distinction (96%)',
      verificationUrl: `https://verify.capacityconnect.io/cert/${certificateId}`,
      skillsValidated: [
        'High-Availability Architecture',
        'Multi-Region Cloud Resilience',
        'Enterprise Security Governance',
        'Distributed Consensus Protocols'
      ]
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate certificate', details: err.message });
  }
});

// ==========================================
// TOPIC 7: ADMIN DASHBOARD
// ==========================================

/**
 * GET /api/admin/stats
 * Returns top-level platform analytics (totalUsers, totalCourses, activeLearners, completionRatePercent)
 * and a list of registered users.
 */
adminRouter.get('/stats', (req, res) => {
  try {
    const registeredUsers = [
      {
        id: 'u_1',
        name: 'Jane Doe',
        email: 'jane.doe@enterprise.com',
        role: 'learner',
        department: 'Cloud Engineering',
        progress: '78%',
        status: 'Active'
      },
      {
        id: 'u_2',
        name: 'Alex Rivera',
        email: 'alex.rivera@enterprise.com',
        role: 'admin',
        department: 'Technical Operations',
        progress: '100%',
        status: 'Active'
      },
      {
        id: 'u_3',
        name: 'Elena Rostova',
        email: 'elena.r@enterprise.com',
        role: 'instructor',
        department: 'Cybersecurity',
        progress: '95%',
        status: 'Active'
      },
      {
        id: 'u_4',
        name: 'Marcus Chen',
        email: 'marcus.c@enterprise.com',
        role: 'learner',
        department: 'Backend Platform',
        progress: '64%',
        status: 'Active'
      },
      {
        id: 'u_5',
        name: 'Sarah Connor',
        email: 'sarah.c@enterprise.com',
        role: 'learner',
        department: 'DevOps & Reliability',
        progress: '42%',
        status: 'Behind Schedule'
      }
    ];

    res.status(200).json({
      totalUsers: 1480,
      totalCourses: 18,
      activeLearners: 1124,
      completionRatePercent: 92.4,
      capacityIndex: 88.4,
      overdueComplianceCount: 14,
      registeredUsers,
      departmentTelemetry: [
        { department: 'Engineering', completionRate: 94.2, activeCount: 520 },
        { department: 'Security', completionRate: 98.0, activeCount: 210 },
        { department: 'Product', completionRate: 91.5, activeCount: 340 },
        { department: 'Operations', completionRate: 76.8, activeCount: 410 }
      ]
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch admin stats', details: err.message });
  }
});

// Wire onto core router
coreRouter.use('/auth', authRouter);
coreRouter.use('/user', userRouter);
coreRouter.use('/certificate', certRouter);
coreRouter.use('/admin', adminRouter);

module.exports = coreRouter;
module.exports.authRouter = authRouter;
module.exports.userRouter = userRouter;
module.exports.certRouter = certRouter;
module.exports.adminRouter = adminRouter;
