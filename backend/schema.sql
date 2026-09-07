-- =============================================================
-- Capacity Connect - Supabase Database Schema
-- Table: users (user credentials & profile)
-- =============================================================
-- This script is idempotent — safe to run multiple times in the
-- Supabase SQL Editor without causing "already exists" errors.
-- =============================================================

-- 1. Users table — stores login credentials and profile data
--    This replaces the in-memory mock database in backend/routes/core.js
create table if not exists public.users (
  id             uuid        primary key default gen_random_uuid(),
  name           text        not null,
  email          text        unique not null,
  password_hash  text        not null,          -- bcrypt hash
  role           text        check (role in ('trainee', 'trainer', 'admin'))
                   not null default 'trainee',
  status         text        check (status in ('pending', 'approved', 'rejected'))
                   not null default 'pending',
  department     text,
  qualification  text,
  skills         text,
  subjects       text,
  created_at     timestamp   with time zone default timezone('utc'::text, now()),
  updated_at     timestamp   with time zone default timezone('utc'::text, now())
);

-- 2. Index for fast email lookups (login queries)
create index if not exists users_email_idx on public.users (email);

-- 3. Auto-update updated_at on row modification
create or replace function public.handle_updated_at()
returns trigger
language 'plpgsql' as
$$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Drop existing trigger before recreating (idempotent)
drop trigger if exists users_updated_at on public.users;
create trigger users_updated_at
  before update on public.users
  for each row
  execute function public.handle_updated_at();

-- 4. Row Level Security (RLS)
--    When using Supabase Auth (GoTrue): users can read/update their own profile.
--    When using the backend service_role key: the "Service role" policies below
--    grant full access, allowing the Express server to query credentials for
--    login/signup without auth.uid().
alter table public.users enable row level security;

-- Drop existing policies before recreating (idempotent)
drop policy if exists "Users can view own profile" on public.users;
create policy "Users can view own profile" on public.users
  for select using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);

drop policy if exists "Service role can insert users" on public.users;
create policy "Service role can insert users" on public.users
  for insert with check (true);

drop policy if exists "Service role can view all users" on public.users;
create policy "Service role can view all users" on public.users
  for select using (auth.role() = 'service_role');

drop policy if exists "Service role can update any user" on public.users;
create policy "Service role can update any user" on public.users
  for update using (auth.role() = 'service_role');

-- 5. Password verification helper function (SQL-side)
--    Usage in SQL:
--      SELECT verify_password('plaintext', password_hash) FROM users WHERE email = '...';
--    Usage in Node.js backend (recommended):
--      const bcrypt = require('bcryptjs');
--      const isValid = await bcrypt.compare(suppliedPassword, userRecord.password_hash);
create or replace function public.verify_password(
  plaintext_password text,
  stored_hash      text
) returns boolean
language 'plpgsql'
as $$
begin
  if stored_hash is null or stored_hash = '' then
    return false;
  end if;
  return stored_hash = crypt(plaintext_password, stored_hash);
end;
$$;

-- =============================================================
-- 6. Seed Data — pre-populated credentials
--    Uses INSERT ... ON CONFLICT (email) DO UPDATE to be idempotent.
--    Both password hashes are bcrypt-verified.
-- =============================================================

-- ADMIN USER (the one admin database credential)
-- Email: admin@capacityconnect.io | Password: admin123
insert into public.users (id, name, email, password_hash, role, status, department)
values (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Alex Rivera',
  'admin@capacityconnect.io',
  '$2b$10$VFbL1tc.J6xUlzQ5HuM7pu957LNcjI9kdVM9nZaAOzQ6TJxZcmpCa',
  'admin',
  'approved',
  'Technical Operations'
)
on conflict (email) do update set
  name = 'Alex Rivera',
  password_hash = '$2b$10$VFbL1tc.J6xUlzQ5HuM7pu957LNcjI9kdVM9nZaAOzQ6TJxZcmpCa',
  role = 'admin',
  status = 'approved',
  department = 'Technical Operations';

-- TRAINEE USER
-- Email: jane.doe@enterprise.com | Password: password123
insert into public.users (id, name, email, password_hash, role, status, department, qualification, skills)
values (
  'b1febd00-ad1c-50f9-bce9-7cc0e4e4f9b9',
  'Jane Doe',
  'jane.doe@enterprise.com',
  '$2b$10$qy1wem6GFjIsult5F3fP0.9ECi9PG9UKyiMKf2CVaauYlFQBZVlBq',
  'trainee',
  'approved',
  'Cloud Engineering',
  'B.Tech Computer Science',
  'Python, React, Node.js'
)
on conflict (email) do update set
  name = 'Jane Doe',
  password_hash = '$2b$10$qy1wem6GFjIsult5F3fP0.9ECi9PG9UKyiMKf2CVaauYlFQBZVlBq',
  role = 'trainee',
  status = 'approved',
  department = 'Cloud Engineering',
  qualification = 'B.Tech Computer Science',
  skills = 'Python, React, Node.js';

-- TRAINER USER
-- Email: elena.rostova@enterprise.com | Password: trainer123
insert into public.users (id, name, email, password_hash, role, status, department, subjects)
values (
  'c2afcd01-be2d-60f0-ac0f-8dd1f5f5a0c0',
  'Elena Rostova',
  'elena.rostova@enterprise.com',
  '$2b$10$WJcM2u.dK7yVmA6RfVN8qva068MOdkJl0WONaaBPARU7UKYaampDb',
  'trainer',
  'approved',
  'Cybersecurity',
  'ISO 27001, Zero Trust, Security Architecture'
)
on conflict (email) do update set
  name = 'Elena Rostova',
  password_hash = '$2b$10$WJcM2u.dK7yVmA6RfVN8qva068MOdkJl0WONaaBPARU7UKYaampDb',
  role = 'trainer',
  status = 'approved',
  department = 'Cybersecurity',
  subjects = 'ISO 27001, Zero Trust, Security Architecture';

-- =============================================================
-- 7. Materials table — Trainer-uploaded content (videos, notes, documents)
--    Tied to a course and the trainer who uploaded it.
-- =============================================================

create table if not exists public.materials (
  id              uuid    primary key default gen_random_uuid(),
  course_id       bigint  not null,
  trainer_id      uuid    references public.users(id) on delete cascade,
  type            text    check (type in ('video', 'notes', 'document'))
                      not null default 'notes',
  title           text    not null,
  description     text,
  url             text,             -- URL/link for video or document
  content         text,             -- Text content for notes
  file_name       text,             -- Original file name if uploaded
  file_size       integer,
  mime_type       text,
  is_active       boolean not null default true,
  created_at      timestamp with time zone default timezone('utc'::text, now()),
  updated_at      timestamp with time zone default timezone('utc'::text, now())
);

create index if not exists materials_course_idx on public.materials (course_id);
create index if not exists materials_trainer_idx on public.materials (trainer_id);
create index if not exists materials_type_idx on public.materials (type);

drop trigger if exists materials_updated_at on public.materials;
create trigger materials_updated_at
  before update on public.materials
  for each row
  execute function public.handle_updated_at();

alter table public.materials enable row level security;

drop policy if exists "Service role can manage all materials" on public.materials;
create policy "Service role can manage all materials" on public.materials
  for all using (auth.role() = 'service_role');

-- =============================================================
-- 8. Related tables (optional — uncomment to extend the schema)
-- =============================================================

-- Tracks which users are enrolled in which courses, plus progress
-- create table if not exists public.enrollments (
--   id              uuid primary key default gen_random_uuid(),
--   user_id         uuid references public.users(id) on delete cascade,
--   course_id       bigint,
--   progress_percent integer default 0 check (progress_percent between 0 and 100),
--   status          text check (status in ('Not Started','In Progress','Completed','Quiz Ready'))
--                   default 'Not Started',
--   created_at      timestamp with time zone default timezone('utc'::text, now()),
--   updated_at      timestamp with time zone default timezone('utc'::text, now())
-- );
-- create index on public.enrollments(user_id);

-- Stores quiz answers for the AI Recommendation Engine
-- create table if not exists public.quiz_results (
--   id          uuid primary key default gen_random_uuid(),
--   user_id     uuid references public.users(id) on delete cascade,
--   course_id   bigint,
--   topic       text,
--   score       integer,
--   weak_areas  jsonb,
--   created_at  timestamp with time zone default timezone('utc'::text, now())
-- );
-- create index on public.quiz_results(user_id);

-- =============================================================
-- 9. Notifications table — public announcements, achievements, and new content
-- =============================================================

create table if not exists public.notifications (
  id          uuid        primary key default gen_random_uuid(),
  type        text        check (type in ('announcement', 'achievement', 'course'))
                     not null default 'announcement',
  title       text        not null,
  message     text        not null,
  metadata    jsonb,
  is_active   boolean     not null default true,
  created_at  timestamp   with time zone default timezone('utc'::text, now())
);

create index if not exists notifications_type_idx on public.notifications (type);
create index if not exists notifications_created_at_idx on public.notifications (created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "Public can view active notifications" on public.notifications;
create policy "Public can view active notifications" on public.notifications
  for select using (is_active = true);

drop policy if exists "Service role can manage notifications" on public.notifications;
create policy "Service role can manage notifications" on public.notifications
  for all using (auth.role() = 'service_role');

-- Seed notifications
insert into public.notifications (type, title, message, metadata)
values
  ('announcement', 'Welcome to Capacity Connect', 'The Ministry of Education & Skills Development is rolling out a new digital capacity building platform for all civil servants.', '{"icon": "📢"}')
on conflict do nothing;

insert into public.notifications (type, title, message, metadata)
values
  ('course', 'New Course: ISO 27001 Lead Auditor', 'A comprehensive 6-week pathway on information security management systems is now available in the catalog.', '{"icon": "🎓", "courseId": 4}')
on conflict do nothing;

insert into public.notifications (type, title, message, metadata)
values
  ('achievement', '1,000 Learners Enrolled', 'Our community has crossed 1,000 registered learners across all departments and agencies.', '{"icon": "🏆"}')
on conflict do nothing;

insert into public.notifications (type, title, message, metadata)
values
  ('announcement', 'Platform Maintenance Scheduled', 'Capacity Connect will undergo scheduled maintenance on Sunday 2:00 AM - 4:00 AM UTC. Expect brief downtime.', '{"icon": "🔧"}')
on conflict do nothing;

insert into public.notifications (type, title, message, metadata)
values
  ('course', 'Zero Trust Architecture Fundamentals', 'New modules on Zero Trust security models have been added to the Cybersecurity pathway.', '{"icon": "🛡️", "courseId": 2}')
on conflict do nothing;

-- =============================================================
-- 10. Feedback table — trainee course feedback
-- =============================================================

create table if not exists public.feedback (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        references public.users(id) on delete cascade,
  course_id   bigint      not null,
  rating      integer     check (rating between 1 and 5) not null,
  comment     text,
  created_at  timestamp   with time zone default timezone('utc'::text, now()),
  updated_at  timestamp   with time zone default timezone('utc'::text, now()),
  unique(user_id, course_id)
);

create index if not exists feedback_user_course_idx on public.feedback (user_id, course_id);
create index if not exists feedback_course_idx on public.feedback (course_id);
create index if not exists feedback_created_at_idx on public.feedback (created_at desc);

alter table public.feedback enable row level security;

drop policy if exists "Trainees can insert own feedback" on public.feedback;
create policy "Trainees can insert own feedback" on public.feedback
  for insert with check (auth.uid() = user_id);

drop policy if exists "Trainees can view own feedback" on public.feedback;
create policy "Trainees can view own feedback" on public.feedback
  for select using (auth.uid() = user_id);

drop policy if exists "Trainees can update own feedback" on public.feedback;
create policy "Trainees can update own feedback" on public.feedback
  for update using (auth.uid() = user_id);

drop policy if exists "Service role can manage all feedback" on public.feedback;
create policy "Service role can manage all feedback" on public.feedback
  for all using (auth.role() = 'service_role');

drop trigger if exists feedback_updated_at on public.feedback;
create trigger feedback_updated_at
  before update on public.feedback
  for each row
  execute function public.handle_updated_at();
--
-- A) In the Supabase Dashboard > Project Settings > API:
--    Copy the anon (public) key and the service_role key.
--
-- B) In the Express backend (backend/routes/core.js), replace the
--    in-memory users array with a Supabase client:
--
--    const { createClient } = require('@supabase/supabase-js');
--    const supabase = createClient(
--      process.env.SUPABASE_URL,
--      process.env.SUPABASE_SERVICE_ROLE_KEY  // never expose to frontend
--    );
--
--    // Login query:
--    const { data, error } = await supabase
--      .from('users')
--      .select('*')
--      .eq('email', email.toLowerCase())
--      .limit(1);
--
-- C) Add to your .env file:
--    SUPABASE_URL=your-supabase-project-url
--    SUPABASE_ANON_KEY=your-supabase-anon-key
--    SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
--
-- D) Install the required packages:
--    npm install @supabase/supabase-js bcryptjs
--
-- E) Password verification in the backend:
--    const bcrypt = require('bcryptjs');
--    const isValid = await bcrypt.compare(password, user.password_hash);
-- =============================================================
