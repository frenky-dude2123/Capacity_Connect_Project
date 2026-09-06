const express = require('express');
const {
  isSupabaseAvailable,
  hashPassword,
  verifyPassword,
  getUserById,
  getUserByEmail,
  createUser,
  supabase
} = require('../lib/supabaseClient');

// Separate sub-routers
const authRouter = express.Router();
const userRouter = express.Router();
const certRouter = express.Router();
const adminRouter = express.Router();

// Master core router combining all four
const coreRouter = express.Router();

// Course reference for certificates
const courseTitles = {};

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
      return res.status(500).json({
        error: 'Database not configured',
        message: 'Supabase is not available'
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

    if (supabaseUser.status === 'pending') {
      return res.status(403).json({
        error: 'Account pending',
        message: 'Your account is awaiting admin approval.',
        status: supabaseUser.status
      });
    }

    if (supabaseUser.status === 'rejected') {
      return res.status(403).json({
        error: 'Account rejected',
        message: 'Your account registration was not approved.',
        status: supabaseUser.status
      });
    }

    const token = `mock-jwt-token-${supabaseUser.id}-${Date.now()}`;
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
  } catch (err) {
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
      return res.status(500).json({
        error: 'Database not configured',
        message: 'Supabase is not available'
      });
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

    const token = `mock-jwt-token-${supabaseUser.id}-${Date.now()}`;

    res.status(201).json({
      message: 'User registered successfully. Awaiting admin approval.',
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

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const user = req.user || req.body || {};
    const role = user.role;
    if (!role || !allowedRoles.includes(role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}.`
      });
    }
    next();
  };
}

// ==========================================
// TOPIC 2: LEARNER DASHBOARD
// ==========================================

/**
 * GET /api/user/dashboard/:userId
 */
userRouter.get('/dashboard/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

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
// TOPIC 6: CERTIFICATE
// ==========================================

/**
 * GET /api/certificate/:userId/:courseId
 */
certRouter.get('/:userId/:courseId', async (req, res) => {
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

/**
 * GET /api/admin/stats
 * Protected: admin only.
 */
adminRouter.get('/stats', requireRole('admin'), async (req, res) => {
  try {
    if (!isSupabaseAvailable) {
      return res.status(500).json({ error: 'Database not configured', details: 'Supabase is not available' });
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
      .select('status');

    if (enrollError) {
      console.error('[Admin] Enrollments error:', enrollError.message);
    }

    const totalUsers = users?.length || 0;
    const totalCourses = courses?.length || 0;
    const activeLearners = new Set((enrollments || []).map(e => e.user_id)).size;
    const completedEnrollments = (enrollments || []).filter(e => e.status === 'Completed').length;
    const completionRatePercent = activeLearners > 0 ? parseFloat(((completedEnrollments / activeLearners) * 100).toFixed(1)) : 0;

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
      departmentTelemetry: []
    });
  } catch (err) {
    console.error('[Admin] Stats error:', err.message);
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
