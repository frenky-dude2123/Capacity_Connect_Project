const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

// Initialize Supabase client with service_role key for backend operations
// The service_role key bypasses RLS, allowing the Express server to
// read and write user credentials for authentication.
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let supabase = null;
let isSupabaseAvailable = false;

if (supabaseUrl && supabaseServiceKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    isSupabaseAvailable = true;
    console.log('[Supabase] Client initialized with service_role key');
  } catch (err) {
    console.error('[Supabase] Failed to initialize client:', err.message);
  }
} else {
  console.warn('[Supabase] Credentials not configured — using mock data fallback');
}

/**
 * Helper: verify a plaintext password against a bcrypt hash.
 */
async function verifyPassword(plaintext, hash) {
  if (!hash) return false;
  try {
    return await bcrypt.compare(plaintext, hash);
  } catch (err) {
    console.error('[Supabase] Password verification error:', err.message);
    return false;
  }
}

/**
 * Helper: hash a plaintext password with bcrypt.
 */
async function hashPassword(plaintext) {
  return await bcrypt.hash(plaintext, 10);
}

/**
 * Get a user by ID from Supabase.
 * Falls back to null if Supabase is unavailable.
 */
async function getUserById(userId) {
  if (!isSupabaseAvailable) return null;
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .limit(1);
    if (error) {
      console.error('[Supabase] getUserById error:', error.message);
      return null;
    }
    return data?.[0] || null;
  } catch (err) {
    console.error('[Supabase] getUserById exception:', err.message);
    return null;
  }
}

/**
 * Get a user by email from Supabase.
 */
async function getUserByEmail(email) {
  if (!isSupabaseAvailable) return null;
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .limit(1);
    if (error) {
      console.error('[Supabase] getUserByEmail error:', error.message);
      return null;
    }
    return data?.[0] || null;
  } catch (err) {
    console.error('[Supabase] getUserByEmail exception:', err.message);
    return null;
  }
}

/**
 * Insert a new user into Supabase.
 */
async function createUser(userData) {
  if (!isSupabaseAvailable) return null;
  try {
    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .limit(1);
    if (error) {
      console.error('[Supabase] createUser error:', error.message);
      return null;
    }
    return data?.[0] || null;
  } catch (err) {
    console.error('[Supabase] createUser exception:', err.message);
    return null;
  }
}

/**
 * Append a user to the in-memory fallback array and return it.
 */
function fallbackAppendUser(usersArray, user) {
  usersArray.push(user);
  return user;
}

/**
 * Auth middleware: reads the Authorization header, extracts the token,
 * looks up the user by ID, and sets req.user.
<<<<<<< HEAD
 * Token format: mock-jwt-token-{userId}-{timestamp}
 * When Supabase is unavailable, falls back to a synthetic user object
 * so auth-dependent routes still function in development.
=======
 * Token format: mock-jwt-token-{userId}-{role}-{timestamp}
>>>>>>> 677ae6c (Add new courses and fix light-mode text contrast)
 * Safe to call on every request — if no token is present, it just calls next().
 */
async function authenticateToken(token) {
  const match = token.match(/^mock-jwt-token-(.+)-(\d+)$/);
  if (!match) return null;
  const userId = match[1];
  if (isSupabaseAvailable) {
    try {
      const user = await getUserById(userId);
      if (user) return user;
    } catch (err) {
      console.error('[Auth] getUserById error:', err.message);
    }
  }
  // Fallback: synthesize a mock user based on userId prefix
  let role = 'trainee';
  if (userId.startsWith('u_admin')) role = 'admin';
  else if (userId.startsWith('u_trainer')) role = 'trainer';
  return {
    id: userId,
    name: userId.replace(/^u_/, 'Mock User ') || 'Demo User',
    email: `${userId}@demo.cosmic`,
    role,
    status: 'approved',
    department: 'Training',
    qualification: null,
    skills: null,
    subjects: null,
  };
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
<<<<<<< HEAD
    authenticateToken(token).then(user => {
      if (user) req.user = user;
      next();
    }).catch(() => next());
    return;
=======
    const match = token.match(/^mock-jwt-token-(.+)-(\w+)-(\d+)$/);
    if (match) {
      const userId = match[1];
      const role = match[2];
      req.user = { id: userId, role: role };
      getUserById(userId).then(user => {
        if (user) req.user = { ...req.user, ...user };
        next();
      }).catch(() => next());
      return;
    }
>>>>>>> 677ae6c (Add new courses and fix light-mode text contrast)
  }
  next();
}

/**
 * requireRole: returns an Express middleware that checks req.user (set by
 * authMiddleware) against one or more allowed roles.
 * Usage: router.get('/path', authMiddleware, requireRole('admin'), handler)
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role || !allowedRoles.includes(role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}.`
      });
    }
    next();
  };
}

module.exports = {
  supabase,
  isSupabaseAvailable,
  hashPassword,
  verifyPassword,
  getUserById,
  getUserByEmail,
  createUser,
  fallbackAppendUser,
  authenticateToken,
  authMiddleware,
  requireRole,
};
