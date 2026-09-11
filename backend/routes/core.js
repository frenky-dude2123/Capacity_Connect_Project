const express = require('express');
const {
  isSupabaseAvailable,
  hashPassword,
  verifyPassword,
  getUserById,
  getUserByEmail,
  createUser,
  supabase,
  authMiddleware,
  requireRole
} = require('../lib/supabaseClient');

// Separate sub-routers
const authRouter = express.Router();
const userRouter = express.Router();
const certRouter = express.Router();
const adminRouter = express.Router();
const trainerRouter = express.Router();

// Master core router combining all four
const coreRouter = express.Router();

// Course reference for certificates
const courseTitles = {};

function guardApproval(res, user) {
  if (!user) return false;
  if (user.status === 'pending') {
    res.status(403).json({
      error: 'Account pending',
      message: 'Your account is awaiting admin approval.',
      status: user.status
    });
    return true;
  }
  if (user.status === 'rejected') {
    res.status(403).json({
      error: 'Account rejected',
      message: 'Your account registration was not approved.',
      status: user.status
    });
    return true;
  }
  return false;
}

// ==========================================
// TOPIC 1: AUTHENTICATION (Login / Signup)
// ==========================================

/**
 * POST /api/auth/login
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

    if (!isSupabaseAvailable) {
      const emailLower = email.toLowerCase();
      let role = 'trainee';
      if (emailLower.startsWith('admin') || emailLower.startsWith('trainer')) {
        role = emailLower.startsWith('admin') ? 'admin' : 'trainer';
      }
      const rolePrefix = role === 'admin' ? 'u_admin' : role === 'trainer' ? 'u_trainer' : 'u_demo';
      const mockUser = {
        id: `${rolePrefix}-${Date.now()}`,
        name: email.split('@')[0] || role.charAt(0).toUpperCase() + role.slice(1) + ' User',
        email: emailLower,
        role: role,
        status: 'approved',
        department: role === 'admin' ? 'Administration' : 'Training',
        qualification: null,
        skills: null,
        subjects: null
      };
      const token = `mock-jwt-token-${mockUser.id}-${role}-${Date.now()}`;
      const redirectMap = {
        trainee: '/trainee/dashboard',
        trainer: '/trainer/dashboard',
        admin: '/admin/dashboard'
      };
      return res.status(200).json({
        message: 'Login successful (demo mode)',
        token,
        source: 'demo-fallback',
        redirect: redirectMap[mockUser.role] || '/trainee/dashboard',
        user: mockUser
      });
    }

    const supabaseUser = await getUserByEmail(email);
    if (!supabaseUser) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password does not match.'
      });
    }

    const isValid = await verifyPassword(password, supabaseUser.password_hash);
    if (!isValid) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password does not match.'
      });
    }

    if (guardApproval(res, supabaseUser)) return;

    const token = `mock-jwt-token-${supabaseUser.id}-${supabaseUser.role}-${Date.now()}`;
    const redirectMap = {
      trainee: '/trainee/dashboard',
      trainer: '/trainer/dashboard',
      admin: '/admin/dashboard'
    };

    res.status(200).json({
      message: 'Login successful',
      token,
      source: 'supabase',
      redirect: redirectMap[supabaseUser.role] || '/trainee/dashboard',
      user: {
        id: supabaseUser.id,
        name: supabaseUser.name,
        email: supabaseUser.email,
        role: supabaseUser.role,
        status: supabaseUser.status,
        department: supabaseUser.department,
        qualification: supabaseUser.qualification || null,
        skills: supabaseUser.skills || null,
        subjects: supabaseUser.subjects || null
      }
    });
  }

  catch (err) {
    console.error('[Auth] Login error:', err.message);
    res.status(500).json({ error: 'Login error', details: err.message });
  }
});

/**
 * POST /api/auth/signup
 */
authRouter.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role, qualification, skills, subjects } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Name, email, and password are all required.'
      });
    }

    if (!isSupabaseAvailable) {
      const normalizedRole = role === 'trainer' ? 'trainer' : 'trainee';
      const mockUser = {
        id: `u_${email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        name: name.trim(),
        email: email.toLowerCase(),
        role: normalizedRole,
        status: 'pending',
        department: 'Training',
        qualification: normalizedRole === 'trainee' ? qualification || null : null,
        skills: normalizedRole === 'trainee' ? skills || null : null,
        subjects: normalizedRole === 'trainer' ? subjects || null : null
      };
      const token = `mock-jwt-token-${mockUser.id}-${mockUser.role}-${Date.now()}`;
      if (guardApproval(res, mockUser)) return;
      res.status(201).json({
        message: 'User registered successfully (demo mode).',
        token,
        source: 'demo-fallback',
        user: mockUser
      });
      return;
    }

    const normalizedRole = role === 'trainer' ? 'trainer' : 'trainee';
    const userEmail = email.trim().toLowerCase();

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
      role: normalizedRole,
      status: 'pending',
      department: 'Enterprise Learning',
      qualification: normalizedRole === 'trainee' ? qualification || null : null,
      skills: normalizedRole === 'trainee' ? skills || null : null,
      subjects: normalizedRole === 'trainer' ? subjects || null : null
    });

    if (!supabaseUser) {
      return res.status(500).json({
        error: 'Signup error',
        message: 'Failed to create user in database'
      });
    }

    const token = `mock-jwt-token-${supabaseUser.id}-${supabaseUser.role}-${Date.now()}`;

    if (guardApproval(res, supabaseUser)) return;

    res.status(201).json({
      message: 'User registered successfully.',
      token,
      source: 'supabase',
      user: {
        id: supabaseUser.id,
        name: supabaseUser.name,
        email: supabaseUser.email,
        role: supabaseUser.role,
        status: supabaseUser.status,
        department: supabaseUser.department
      }
    });
  } catch (err) {
    console.error('[Auth] Signup error:', err.message);
    res.status(500).json({ error: 'Signup error', details: err.message });
  }
});

// ==========================================
// ROLE-BASED ACCESS MIDDLEWARE
// ==========================================
// authMiddleware and requireRole are imported from ../lib/supabaseClient
// (see top of file). authMiddleware populates req.user from the Bearer
// token; requireRole enforces role-based access on a per-route basis.

// ==========================================
// TOPIC 2: LEARNER DASHBOARD
// ==========================================

/**
 * GET /api/user/quiz-results/:userId
 * Returns the user's recent quiz scores mapped to topics/courses
 * so the AI recommendation engine can derive real weak areas.
 */
userRouter.get('/quiz-results/:userId', authMiddleware, requireRole('trainee', 'trainer'), async (req, res) => {
  try {
    const { userId } = req.params;
    if (!isSupabaseAvailable) {
      return res.status(200).json({ weakAreas: [], source: 'fallback' });
    }

    // Try the quiz_attempts table if it exists
    let weakAreas = [];
    try {
      const { data: attempts, error: attemptsError } = await supabase
        .from('quiz_attempts')
        .select('topic, score, course_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!attemptsError && attempts && attempts.length) {
        // Group by topic and compute average score
        const topicMap = {};
        attempts.forEach(a => {
          const key = a.topic || 'General';
          if (!topicMap[key]) topicMap[key] = { total: 0, count: 0, courseId: a.course_id };
          topicMap[key].total += (a.score || 0);
          topicMap[key].count += 1;
        });
        weakAreas = Object.entries(topicMap).map(([topic, v]) => ({
          topic,
          score: Math.round(v.total / v.count),
          courseId: v.courseId
        })).filter(w => w.score < 75).sort((a, b) => a.score - b.score);
      }
    } catch {}

    // Fallback: derive from enrolled course progress
    if (!weakAreas.length) {
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('course_id, progress_percent')
        .eq('user_id', userId);
      if (enrollments && enrollments.length) {
        const { data: courses } = await supabase
          .from('courses')
          .select('id, title')
          .in('id', enrollments.map(e => e.course_id));
        const courseMap = new Map((courses || []).map(c => [c.id, c.title]));
        weakAreas = enrollments
          .filter(e => (e.progress_percent || 0) < 70)
          .map(e => ({ topic: courseMap.get(e.course_id) || 'General', score: e.progress_percent || 0, courseId: e.course_id }))
          .sort((a, b) => a.score - b.score);
      }
    }

    res.status(200).json({ weakAreas, source: weakAreas.length ? 'computed' : 'fallback' });
  } catch (err) {
    console.error('[QuizResults]', err.message);
    res.status(200).json({ weakAreas: [], source: 'fallback' });
  }
});

/**
 * POST /api/user/quiz-attempts
 * Saves a quiz attempt to the quiz_attempts table
 */
userRouter.post('/quiz-attempts', authMiddleware, requireRole('trainee', 'trainer'), async (req, res) => {
  try {
    const { user_id, topic, score, total, correct } = req.body || {};

    if (!user_id || !topic || score === undefined || total === undefined) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'user_id, topic, score, and total are required.'
      });
    }

    if (!isSupabaseAvailable) {
      return res.status(200).json({ success: true, source: 'fallback' });
    }

    const { data, error } = await supabase
      .from('quiz_attempts')
      .insert([{
        user_id: user_id,
        topic: topic,
        score: score,
        total: total,
        correct: correct || 0,
        created_at: new Date().toISOString()
      }]);

    if (error) {
      console.error('[QuizAttempts] Insert error:', error.message);
      return res.status(200).json({ success: false, source: 'fallback' });
    }

    res.status(201).json({ success: true, source: 'computed' });
  } catch (err) {
    console.error('[QuizAttempts]', err.message);
    res.status(200).json({ success: false, source: 'fallback' });
  }
});

/**
 * GET /api/user/dashboard/:userId
 * Protected: authenticated users only (trainee, trainer, admin).
 */
userRouter.get('/dashboard/:userId', authMiddleware, requireRole('trainee', 'trainer'), async (req, res) => {
  try {
    const { userId } = req.params;

    if (!isSupabaseAvailable) {
      const mockDashboard = {
        userId: userId,
        userName: 'Demo User',
        role: 'trainee',
        status: 'approved',
        enrolledCourses: [
          { id: 1, title: 'Advanced Astrophysics', category: 'Physics', progressPercent: 85, status: 'Completed', instructor: 'Dr. Elena Vasquez' },
          { id: 2, title: 'Deep Space Navigation', category: 'Aerospace', progressPercent: 45, status: 'In Progress', instructor: 'Capt. M. Reyes' }
        ],
        metrics: {
          overallCompletionPercent: 42,
          capacityScore: 52,
          activeCourses: 2,
          trainingHours: 28,
          completedCertifications: 1
        },
        recommendedCourses: [
          { id: 3, title: 'Exoplanet Habitability', category: 'Astronomy', estimatedHours: 6, difficulty: 'Intermediate' },
          { id: 4, title: 'Stellar Engineering', category: 'Engineering', estimatedHours: 12, difficulty: 'Advanced' }
        ],
        source: 'in-memory-fallback'
      };
      return res.status(200).json(mockDashboard);
    }

    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: `No user found with ID: ${userId}`
      });
    }

    if (user.status !== 'approved') {
      return res.status(403).json({
        error: 'Account not approved',
        message: 'Your account is awaiting admin approval.'
      });
    }

    const { data: enrollments, error: enrollError } = await supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', userId);

    if (enrollError) {
      console.error('[Dashboard] Enrollments error:', enrollError.message);
    }

    const courseIds = (enrollments || []).map(e => e.course_id);
    const { data: coursesData, error: coursesError } = await supabase
      .from('courses')
      .select('id, title, category, instructor')
      .in('id', courseIds.length ? courseIds : [0]);

    if (coursesError) {
      console.error('[Dashboard] Courses error:', coursesError.message);
    }

    const courseMap = new Map((coursesData || []).map(c => [c.id, c]));
    const enrolledCourses = (enrollments || []).map(e => {
      const course = courseMap.get(e.course_id);
      return {
        id: e.course_id,
        title: course?.title || `Course ${e.course_id}`,
        category: course?.category || '',
        progressPercent: e.progress_percent || 0,
        status: e.status || 'Not Started',
        instructor: course?.instructor || ''
      };
    });

    const totalEnrollments = enrolledCourses.length;
    const completedCourses = enrolledCourses.filter(c => c.status === 'Completed').length;
    const overallCompletionPercent = totalEnrollments ? Math.round((completedCourses / totalEnrollments) * 100) : 0;

    const metrics = {
      overallCompletionPercent,
      capacityScore: overallCompletionPercent > 0 ? overallCompletionPercent + 10 : 0,
      activeCourses: totalEnrollments,
      trainingHours: totalEnrollments * 14,
      completedCertifications: completedCourses
    };

    const { data: allCourses, error: allCoursesError } = await supabase
      .from('courses')
      .select('id, title, category')
      .limit(10);

    if (allCoursesError) {
      console.error('[Dashboard] All courses error:', allCoursesError.message);
    }

    const recommendedCourses = (allCourses || [])
      .filter(c => !courseIds.includes(c.id))
      .slice(0, 3)
      .map(c => ({
        id: c.id,
        title: c.title,
        category: c.category,
        estimatedHours: 8,
        difficulty: 'Intermediate'
      }));

    res.status(200).json({
      userId: user.id,
      userName: user.name,
      role: user.role,
      status: user.status,
      enrolledCourses,
      metrics,
      recommendedCourses
    });
  } catch (err) {
    console.error('[Dashboard] Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch dashboard data', details: err.message });
  }
});

// ==========================================
// EDITABLE USER PROFILE
// ==========================================
userRouter.put('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const body = req.body || {};

    if (!isSupabaseAvailable) {
      const updatedUser = { ...req.user, ...body };
      return res.status(200).json({
        message: 'Profile updated successfully (demo mode)',
        user: updatedUser,
        source: 'in-memory-fallback'
      });
    }

    const existingColumns = ['qualification', 'skills', 'subjects', 'interests', 'work_experience', 'bio', 'certificates'];
    const updatePayload = {};
    existingColumns.forEach(col => {
      if (body[col] !== undefined) {
        updatePayload[col] = body[col] || null;
      }
    });

    if (Object.keys(updatePayload).length === 0) {
      return res.status(400).json({ error: 'Validation failed', message: 'No fields to update.' });
    }

    const { data, error } = await supabase
      .from('users')
      .update(updatePayload)
      .eq('id', userId)
      .select('id, name, email, role, department, qualification, skills, subjects')
      .single();

    if (error) {
      console.error('[Profile] Update error:', error.message);
      return res.status(500).json({ error: 'Failed to update profile', details: error.message });
    }

    res.status(200).json({ message: 'Profile updated successfully', user: data });
  } catch (err) {
    console.error('[Profile] Error:', err.message);
    res.status(500).json({ error: 'Profile update error', details: err.message });
  }
});

// ==========================================
// TOPIC 6: CERTIFICATE
// ==========================================

/**
 * GET /api/certificate/:userId/:courseId
 * Protected: authenticated users only (trainee, trainer, admin).
 */
certRouter.get('/:userId/:courseId', authMiddleware, requireRole('trainee', 'trainer'), async (req, res) => {
  try {
    const { userId, courseId } = req.params;

    if (!isSupabaseAvailable) {
      return res.status(500).json({ error: 'Database not configured', details: 'Supabase is not available' });
    }

    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: `No user found with ID: ${userId}`
      });
    }

    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('title')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      return res.status(404).json({
        error: 'Course not found',
        message: `No course exists with ID: ${courseId}`
      });
    }

    const certificateId = `CERT-2026-CC-${Math.abs((userId.hashCode ? userId.hashCode() : 8942) + Number(courseId) * 17)}`;

    res.status(200).json({
      certificateId,
      userId,
      studentName: user.name,
      courseId: isNaN(courseId) ? courseId : Number(courseId),
      courseTitle: course.title,
      completionDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
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
    console.error('[Certificate] Error:', err.message);
    res.status(500).json({ error: 'Failed to generate certificate', details: err.message });
  }
});

// ==========================================
// TOPIC 7: ADMIN DASHBOARD
// ==========================================

// In-memory mock data for admin routes when Supabase is unavailable
const mockUsers = [
  {
    id: 'u_admin1',
    name: 'Alice Administrator',
    email: 'alice.admin@cosmic.edu',
    role: 'admin',
    status: 'approved',
    department: 'Command',
    qualification: null,
    skills: null,
    subjects: null,
    created_at: '2026-08-01T08:00:00Z'
  },
  {
    id: 'u_trainee1',
    name: 'Jane Doe',
    email: 'jane.doe@cosmic.edu',
    role: 'trainee',
    status: 'approved',
    department: 'Astrophysics',
    qualification: 'PhD',
    skills: 'Python,Matplotlib',
    subjects: null,
    created_at: '2026-08-15T10:00:00Z'
  },
  {
    id: 'u_trainee2',
    name: 'John Smith',
    email: 'john.smith@cosmic.edu',
    role: 'trainee',
    status: 'pending',
    department: 'Engineering',
    qualification: 'MSc',
    skills: 'CAD,Fusion',
    subjects: null,
    created_at: '2026-09-01T09:00:00Z'
  },
  {
    id: 'u_trainee3',
    name: 'Maria Garcia',
    email: 'maria.garcia@cosmic.edu',
    role: 'trainee',
    status: 'pending',
    department: 'Astronomy',
    qualification: 'BSc',
    skills: 'Python,Data Analysis',
    subjects: null,
    created_at: '2026-09-03T14:00:00Z'
  },
  {
    id: 'u_trainer1',
    name: 'Dr. Elena Vasquez',
    email: 'elena.vasquez@cosmic.edu',
    role: 'trainer',
    status: 'approved',
    department: 'Physics',
    qualification: 'PhD',
    skills: null,
    subjects: 'Astrophysics,Stellar Dynamics',
    created_at: '2026-07-20T12:00:00Z'
  }
];

/**
 * GET /api/admin/stats
 * Protected: admin only.
 */
adminRouter.get('/stats', requireRole('admin'), async (req, res) => {
  try {
    if (!isSupabaseAvailable) {
      const mockStats = {
        totalUsers: mockUsers.length,
        totalCourses: 5,
        activeLearners: mockUsers.filter(u => u.role === 'trainee' && u.status === 'approved').length,
        completionRatePercent: 78.3,
        capacityIndex: 88.4,
        overdueComplianceCount: 0,
        registeredUsers: mockUsers.slice(0, 5).map(u => ({
          id: u.id, name: u.name, email: u.email, role: u.role,
          department: u.department || 'General', progress: '0%', status: 'Active'
        })),
        departmentTelemetry: [],
        monthlyEnrollments: [
          { month: 'Jan', enrollments: 12 }, { month: 'Feb', enrollments: 18 },
          { month: 'Mar', enrollments: 25 }, { month: 'Apr', enrollments: 15 },
          { month: 'May', enrollments: 22 }, { month: 'Jun', enrollments: 30 }
        ],
        activeUsersTimeline: [
          { month: 'Jan', users: 820 }, { month: 'Feb', users: 932 },
          { month: 'Mar', users: 901 }, { month: 'Apr', users: 1034 },
          { month: 'May', users: 1290 }, { month: 'Jun', users: 1124 }
        ],
        source: 'in-memory-fallback'
      };
      return res.status(200).json(mockStats);
    }

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, role, department, created_at')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('[Admin] Users error:', usersError.message);
    }

    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id');

    if (coursesError) {
      console.error('[Admin] Courses error:', coursesError.message);
    }

    const { data: enrollments, error: enrollError } = await supabase
      .from('enrollments')
      .select('status, created_at');

    if (enrollError) {
      console.error('[Admin] Enrollments error:', enrollError.message);
    }

    const totalUsers = users?.length || 0;
    const totalCourses = courses?.length || 0;
    const activeLearners = new Set((enrollments || []).map(e => e.user_id)).size;
    const completedEnrollments = (enrollments || []).filter(e => e.status === 'Completed').length;
    const completionRatePercent = activeLearners > 0 ? parseFloat(((completedEnrollments / activeLearners) * 100).toFixed(1)) : 0;

    const now = new Date();
    const monthlyEnrollments = [];
    const activeUsersTimeline = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = d.toLocaleString('default', { month: 'short' });
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const count = (enrollments || []).filter(e => {
        const created = new Date(e.created_at);
        return created >= start && created <= end;
      }).length;
      monthlyEnrollments.push({ month: monthName, enrollments: count });
      // For activeUsersTimeline, count unique user_ids created in that month
      const uniqueUsers = new Set((enrollments || []).filter(e => {
        const created = new Date(e.created_at);
        return created >= start && created <= end && e.user_id;
      }).map(e => e.user_id)).size;
      activeUsersTimeline.push({ month: monthName, users: uniqueUsers });
    }

    const registeredUsers = (users || []).slice(0, 5).map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      department: u.department || 'General',
      progress: '0%',
      status: 'Active'
    }));

    res.status(200).json({
      totalUsers,
      totalCourses,
      activeLearners,
      completionRatePercent,
      capacityIndex: 88.4,
      overdueComplianceCount: 0,
      registeredUsers,
      departmentTelemetry: [],
      monthlyEnrollments,
      activeUsersTimeline
    });
  } catch (err) {
    console.error('[Admin] Stats error:', err.message);
    res.status(500).json({ error: 'Failed to fetch admin stats', details: err.message });
  }
});

// ==========================================
// TOPIC 7: ADMIN DASHBOARD (continued)
// ==========================================

/**
 * GET /api/admin/pending-users
 * Protected: admin only.
 * Returns all users with status = 'pending', including
 * department/qualification/subjects and created_at.
 */
adminRouter.get('/pending-users', requireRole('admin'), async (req, res) => {
  try {
    if (!isSupabaseAvailable) {
      const pending = mockUsers.filter(u => u.status === 'pending').map(u => ({
        id: u.id, name: u.name, email: u.email, role: u.role, status: u.status,
        department: u.department || null, qualification: u.qualification || null,
        skills: u.skills || null, subjects: u.subjects || null, created_at: u.created_at
      }));
      return res.status(200).json({ count: pending.length, pendingUsers: pending, source: 'in-memory-fallback' });
    }

    const { data: pendingUsers, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, role, status, department, qualification, skills, subjects, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (usersError) {
      console.error('[Admin] Pending users error:', usersError.message);
      return res.status(500).json({ error: 'Failed to fetch pending users', details: usersError.message });
    }

    res.status(200).json({
      count: pendingUsers?.length || 0,
      pendingUsers: (pendingUsers || []).map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        department: u.department || null,
        qualification: u.qualification || null,
        skills: u.skills || null,
        subjects: u.subjects || null,
        created_at: u.created_at
      }))
    });
  } catch (err) {
    console.error('[Admin] Pending users error:', err.message);
    res.status(500).json({ error: 'Failed to fetch pending users', details: err.message });
  }
});

/**
 * POST /api/admin/users/:userId/approve
 * Protected: admin only.
 * Sets a user's status to 'approved'.
 */
adminRouter.post('/users/:userId/approve', requireRole('admin'), async (req, res) => {
  try {
    const { userId } = req.params;

    if (!isSupabaseAvailable) {
      const user = mockUsers.find(u => u.id === userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found', message: `No user found with ID: ${userId}` });
      }
      user.status = 'approved';
      return res.status(200).json({
        message: 'User approved successfully',
        user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status, created_at: user.created_at },
        source: 'in-memory-fallback'
      });
    }

    const { data, error } = await supabase
      .from('users')
      .update({ status: 'approved' })
      .eq('id', userId)
      .select('id, name, email, role, status, created_at')
      .single();

    if (error) {
      console.error('[Admin] Approve user error:', error.message);
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'User not found', message: `No user found with ID: ${userId}` });
      }
      return res.status(500).json({ error: 'Failed to approve user', details: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'User not found', message: `No user found with ID: ${userId}` });
    }

    res.status(200).json({
      message: 'User approved successfully',
      user: {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        status: data.status,
        created_at: data.created_at
      }
    });
  } catch (err) {
    console.error('[Admin] Approve user error:', err.message);
    res.status(500).json({ error: 'Failed to approve user', details: err.message });
  }
});

/**
 * POST /api/admin/users/:userId/reject
 * Protected: admin only.
 * Sets a user's status to 'rejected' (does not delete the row).
 */
adminRouter.post('/users/:userId/reject', requireRole('admin'), async (req, res) => {
  try {
    const { userId } = req.params;

    if (!isSupabaseAvailable) {
      const user = mockUsers.find(u => u.id === userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found', message: `No user found with ID: ${userId}` });
      }
      user.status = 'rejected';
      return res.status(200).json({
        message: 'User rejected successfully',
        user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status, created_at: user.created_at },
        source: 'in-memory-fallback'
      });
    }

    const { data, error } = await supabase
      .from('users')
      .update({ status: 'rejected' })
      .eq('id', userId)
      .select('id, name, email, role, status, created_at')
      .single();

    if (error) {
      console.error('[Admin] Reject user error:', error.message);
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'User not found', message: `No user found with ID: ${userId}` });
      }
      return res.status(500).json({ error: 'Failed to reject user', details: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'User not found', message: `No user found with ID: ${userId}` });
    }

    res.status(200).json({
      message: 'User rejected successfully',
      user: {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        status: data.status,
        created_at: data.created_at
      }
    });
  } catch (err) {
    console.error('[Admin] Reject user error:', err.message);
    res.status(500).json({ error: 'Failed to reject user', details: err.message });
  }
});

/**
 * GET /api/admin/users
 * Protected: admin only.
 * Returns ALL users with role and status for role-management view.
 */
adminRouter.get('/users', requireRole('admin'), async (req, res) => {
  try {
    if (!isSupabaseAvailable) {
      const usersList = mockUsers.map(u => ({
        id: u.id, name: u.name, email: u.email, role: u.role,
        status: u.status, department: u.department || null, created_at: u.created_at
      }));
      return res.status(200).json({ count: usersList.length, users: usersList, source: 'in-memory-fallback' });
    }

    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, role, status, department, created_at')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('[Admin] All users error:', usersError.message);
      return res.status(500).json({ error: 'Failed to fetch users', details: usersError.message });
    }

    res.status(200).json({
      count: allUsers?.length || 0,
      users: (allUsers || []).map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        department: u.department || null,
        created_at: u.created_at
      }))
    });
  } catch (err) {
    console.error('[Admin] All users error:', err.message);
    res.status(500).json({ error: 'Failed to fetch users', details: err.message });
  }
});

/**
 * GET /api/trainer/students
 * Protected: trainer only.
 * Returns all approved trainee users (students the trainer may oversee).
 */
trainerRouter.get('/students', authMiddleware, requireRole('trainer'), async (req, res) => {
  try {
    if (!isSupabaseAvailable) {
      return res.status(500).json({ error: 'Database not configured', details: 'Supabase is not available' });
    }
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, department, created_at')
      .eq('role', 'trainee')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('[Trainer] Students error:', error.message);
      return res.status(500).json({ error: 'Failed to fetch students', details: error.message });
    }
    res.status(200).json((data || []).map(u => ({
      id: u.id, name: u.name, email: u.email, role: u.role,
      department: u.department || null, created_at: u.created_at, progress: '0%'
    })));
  } catch (err) {
    console.error('[Trainer] Students error:', err.message);
    res.status(500).json({ error: 'Failed to fetch students', details: err.message });
  }
});

/**
 * GET /api/trainer/quiz-questions
 * Protected: trainer only.
 * Returns quiz questions from the course pool (local questions as fallback).
 */
trainerRouter.get('/quiz-questions', authMiddleware, requireRole('trainer'), async (req, res) => {
  try {
    const { MOCK_QUIZ_QUESTIONS } = require('./ai');
    const questions = MOCK_QUIZ_QUESTIONS.map(q => ({
      id: q.question.substring(0, 50),
      topic: 'General',
      question: q.question,
      options: q.options,
      correct: q.correctIndex
    }));
    res.status(200).json(questions);
  } catch (err) {
    console.error('[Trainer] Quiz questions error:', err.message);
    res.status(500).json({ error: 'Failed to fetch quiz questions', details: err.message });
  }
});

// ==========================================
// PUBLIC NOTIFICATIONS (no auth required)
// ==========================================
const publicRouter = express.Router();

publicRouter.get('/notifications', async (req, res) => {
  try {
    if (!isSupabaseAvailable) {
      return res.status(200).json([
        { id: 'mock-1', type: 'announcement', title: 'Welcome to Capacity Connect', message: 'The Ministry of Education & Skills Development is rolling out a new digital capacity building platform for all civil servants.', created_at: new Date().toISOString(), is_active: true },
        { id: 'mock-2', type: 'course', title: 'New Course: ISO 27001 Lead Auditor', message: 'A comprehensive 6-week pathway on information security management systems is now available in the catalog.', created_at: new Date(Date.now() - 86400000).toISOString(), is_active: true },
        { id: 'mock-3', type: 'achievement', title: '1,000 Learners Enrolled', message: 'Our community has crossed 1,000 registered learners across all departments and agencies.', created_at: new Date(Date.now() - 172800000).toISOString(), is_active: true }
      ]);
    }

    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('[Public] Notifications error:', error.message);
      return res.status(500).json({ error: 'Failed to fetch notifications', details: error.message });
    }

    const enriched = (notifications || []).map(n => {
      const title = (n.title || '').toLowerCase();
      const message = (n.message || '').toLowerCase();
      let type = 'announcement';
      if (title.includes('course') || title.includes('new') || message.includes('course') || message.includes('pathway') || message.includes('learning')) {
        type = 'course';
      } else if (title.includes('achieve') || title.includes('enrolled') || title.includes('milestone') || title.includes('certificate')) {
        type = 'achievement';
      }
      return { ...n, type };
    });

    res.status(200).json(enriched);
  } catch (err) {
    console.error('[Public] Notifications error:', err.message);
    res.status(500).json({ error: 'Failed to fetch notifications', details: err.message });
  }
});

// Wire onto core router
coreRouter.use('/auth', authRouter);
coreRouter.use('/user', userRouter);
coreRouter.use('/certificate', certRouter);
coreRouter.use('/admin', authMiddleware, adminRouter);
coreRouter.use('/trainer', trainerRouter);
coreRouter.use('/public', publicRouter);

// ==========================================
// FEEDBACK (trainee submits, admin views all)
// ==========================================
const feedbackRouter = express.Router();

const inMemoryFeedback = [];

feedbackRouter.post('/', authMiddleware, requireRole('trainee'), async (req, res) => {
  try {
    const { course_id, rating, comment } = req.body || {};
    const userId = req.user.id;

    if (!course_id || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Validation failed', message: 'course_id and rating (1-5) are required.' });
    }

    // In-memory fallback when Supabase is unavailable
    if (!isSupabaseAvailable) {
      const existingIdx = inMemoryFeedback.findIndex(f => f.user_id === userId && f.course_id === Number(course_id));
      if (existingIdx >= 0) {
        const existing = inMemoryFeedback[existingIdx];
        existing.rating = Number(rating);
        existing.comment = comment || null;
        existing.updated_at = new Date().toISOString();
        return res.status(200).json({
          message: 'Feedback updated successfully',
          feedback: existing,
          source: 'in-memory-fallback'
        });
      }

      const newFeedback = {
        id: `fb_${inMemoryFeedback.length + 1}`,
        user_id: userId,
        course_id: Number(course_id),
        rating: Number(rating),
        comment: comment || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      inMemoryFeedback.push(newFeedback);
      return res.status(201).json({
        message: 'Feedback submitted successfully',
        feedback: newFeedback,
        source: 'in-memory-fallback'
      });
    }

    const { data: existing, error: existingError } = await supabase
      .from('feedback')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', course_id)
      .single();

    if (existing && !existingError) {
      const { data, error } = await supabase
        .from('feedback')
        .update({ rating, comment: comment || null })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('[Feedback] Update error:', error.message);
        return res.status(500).json({ error: 'Failed to update feedback', details: error.message });
      }

      return res.status(200).json({ message: 'Feedback updated successfully', feedback: data });
    }

    const { data, error } = await supabase
      .from('feedback')
      .insert({
        user_id: userId,
        course_id: Number(course_id),
        rating: Number(rating),
        comment: comment || null
      })
      .select()
      .single();

    if (error) {
      console.error('[Feedback] Insert error:', error.message);
      return res.status(500).json({ error: 'Failed to submit feedback', details: error.message });
    }

    res.status(201).json({ message: 'Feedback submitted successfully', feedback: data });
  } catch (err) {
    console.error('[Feedback] Error:', err.message);
    res.status(500).json({ error: 'Feedback error', details: err.message });
  }
});

feedbackRouter.get('/course/:courseId', authMiddleware, requireRole('trainee', 'trainer', 'admin'), async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user?.id;

    if (!isSupabaseAvailable) {
      const courseFeedbacks = inMemoryFeedback.filter(f => f.course_id === Number(courseId));
      const total = courseFeedbacks.length || 0;
      const avgRating = total > 0 ? Math.round((courseFeedbacks.reduce((sum, f) => sum + f.rating, 0) / total) * 10) / 10 : 0;
      return res.status(200).json({
        courseId: Number(courseId),
        total,
        avgRating,
        feedbacks: courseFeedbacks.map(f => ({
          ...f,
          isOwn: f.user_id === userId
        })),
        source: 'in-memory-fallback'
      });
    }

    const { data: feedbacks, error } = await supabase
      .from('feedback')
      .select('id, user_id, course_id, rating, comment, created_at, updated_at')
      .eq('course_id', Number(courseId))
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Feedback] Course fetch error:', error.message);
      return res.status(500).json({ error: 'Failed to fetch feedback', details: error.message });
    }

    const total = (feedbacks || []).length;
    const avgRating = total > 0 ? Math.round((feedbacks.reduce((sum, f) => sum + f.rating, 0) / total) * 10) / 10 : 0;

    res.status(200).json({
      courseId: Number(courseId),
      total,
      avgRating,
      feedbacks: (feedbacks || []).map(f => ({
        ...f,
        isOwn: req.user ? f.user_id === req.user.id : false
      }))
    });
  } catch (err) {
    console.error('[Feedback] Course fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch feedback', details: err.message });
  }
});

feedbackRouter.get('/admin/summary', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    if (!isSupabaseAvailable) {
      const summaryMap = new Map();
      inMemoryFeedback.forEach(f => {
        const key = f.course_id;
        if (!summaryMap.has(key)) {
          summaryMap.set(key, { course_id: key, total: 0, sumRating: 0, feedbacks: [] });
        }
        const entry = summaryMap.get(key);
        entry.total += 1;
        entry.sumRating += f.rating;
        entry.feedbacks.push(f);
      });

      const summary = Array.from(summaryMap.entries()).map(([course_id, data]) => ({
        course_id,
        total: data.total,
        avgRating: Math.round((data.sumRating / data.total) * 10) / 10,
        feedbacks: data.feedbacks
      }));

      return res.status(200).json({ summary, source: 'in-memory-fallback' });
    }

    const { data: feedbacks, error } = await supabase
      .from('feedback')
      .select('id, user_id, course_id, rating, comment, created_at, updated_at, users(name, email)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('[Feedback] Admin summary error:', error.message);
      return res.status(500).json({ error: 'Failed to fetch feedback summary', details: error.message });
    }

    const courseMap = new Map();
    (feedbacks || []).forEach(f => {
      const cid = f.course_id;
      if (!courseMap.has(cid)) {
        courseMap.set(cid, {
          course_id: cid,
          total: 0,
          sumRating: 0,
          feedbacks: []
        });
      }
      const entry = courseMap.get(cid);
      entry.total += 1;
      entry.sumRating += f.rating;
      entry.feedbacks.push(f);
    });

    const summary = Array.from(courseMap.entries()).map(([course_id, data]) => ({
      course_id,
      total: data.total,
      avgRating: Math.round((data.sumRating / data.total) * 10) / 10,
      feedbacks: data.feedbacks
    }));

    res.status(200).json({ summary });
  } catch (err) {
    console.error('[Feedback] Admin summary error:', err.message);
    res.status(500).json({ error: 'Failed to fetch feedback summary', details: err.message });
  }
});

coreRouter.use('/feedback', feedbackRouter);

// ==========================================
// IN-APP USER NOTIFICATIONS
// ==========================================
const notificationRouter = express.Router();

// In-memory notification store (mock when Supabase unavailable)
const mockNotifications = {};
function ensureMockNotifications(userId) {
  if (!mockNotifications[userId]) {
    mockNotifications[userId] = [
      { id: 'notif_1', user_id: userId, title: 'Course Enrollment', message: 'You are enrolled in Advanced Astrophysics', read: false, created_at: new Date().toISOString() },
      { id: 'notif_2', user_id: userId, title: 'Quiz Available', message: 'New quiz: Module Assessment is ready to take', read: false, created_at: new Date().toISOString() },
      { id: 'notif_3', user_id: userId, title: 'Profile Update', message: 'Your profile was saved successfully', read: true, created_at: new Date().toISOString() }
    ];
  }
  return mockNotifications[userId];
}

notificationRouter.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    let notifs = [];
    if (!isSupabaseAvailable) {
      notifs = ensureMockNotifications(userId);
    } else {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) { console.error('[Notifications] Error:', error.message); notifs = []; }
      else notifs = data || [];
    }
    res.status(200).json(notifs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications', details: err.message });
  }
});

notificationRouter.post('/:id/read', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!isSupabaseAvailable) {
      const userNotifs = mockNotifications[userId] || [];
      const idx = userNotifs.findIndex(n => n.id === id);
      if (idx >= 0) userNotifs[idx].read = true;
      return res.json({ message: 'Marked as read', source: 'in-memory-fallback' });
    }
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .eq('user_id', userId);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark notification', details: err.message });
  }
});

coreRouter.use('/notifications', notificationRouter);

module.exports = coreRouter;
module.exports.authRouter = authRouter;
module.exports.userRouter = userRouter;
module.exports.certRouter = certRouter;
module.exports.adminRouter = adminRouter;
module.exports.trainerRouter = trainerRouter;
module.exports.authMiddleware = authMiddleware;
