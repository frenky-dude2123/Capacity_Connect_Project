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
 * Token format: mock-jwt-token-{userId}-{timestamp}
 * Safe to call on every request — if no token is present, it just calls next().
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const match = token.match(/^mock-jwt-token-(.+)-(\d+)$/);
    if (match) {
      const userId = match[1];
      getUserById(userId).then(user => {
        if (user) req.user = user;
        next();
      }).catch(() => next());
      return;
    }
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
  authMiddleware,
  requireRole,
};
