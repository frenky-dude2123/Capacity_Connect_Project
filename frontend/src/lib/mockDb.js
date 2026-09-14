const STORAGE_KEY = 'capacity_users';

function getUsers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

function seedUsers() {
  const existing = getUsers();
  if (existing.length > 0) return existing;

  const seeds = [
    {
      id: 'demo-trainee-1',
      email: 'trainee@demo.com',
      password: 'password123',
      name: 'Jane Doe',
      role: 'trainee',
      status: 'approved',
      department: 'Enterprise Learning',
      qualification: null,
      skills: null,
      subjects: null,
      created_at: new Date().toISOString()
    },
    {
      id: 'demo-trainer-1',
      email: 'trainer@demo.com',
      password: 'password123',
      name: 'Elena Rostova',
      role: 'trainer',
      status: 'approved',
      department: 'Training',
      qualification: null,
      skills: null,
      subjects: 'Leadership,Communication',
      created_at: new Date().toISOString()
    },
    {
      id: 'demo-admin-1',
      email: 'admin@demo.com',
      password: 'password123',
      name: 'Admin User',
      role: 'admin',
      status: 'approved',
      department: 'Administration',
      qualification: null,
      skills: null,
      subjects: null,
      created_at: new Date().toISOString()
    }
  ];

  saveUsers(seeds);
  return seeds;
}

export function initMockDb() {
  return seedUsers();
}

export function findUserByEmail(email) {
  return getUsers().find(u => u.email === email) || null;
}

export function findUserById(id) {
  return getUsers().find(u => u.id === id) || null;
}

export function addUser(user) {
  const users = getUsers();
  users.push(user);
  saveUsers(users);
  return user;
}

export function updateUser(id, updates) {
  const users = getUsers();
  const index = users.findIndex(u => u.id === id);
  if (index >= 0) {
    users[index] = { ...users[index], ...updates };
    saveUsers(users);
    return users[index];
  }
  return null;
}

export function removeUser(id) {
  const users = getUsers().filter(u => u.id !== id);
  saveUsers(users);
}

export function getAllUsers() {
  return getUsers();
}
