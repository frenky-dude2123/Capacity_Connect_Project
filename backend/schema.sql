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
-- 7a. Courses table — static course catalog used by trainees, trainers, and admins
-- =============================================================

create table if not exists public.courses (
  id              bigint    primary key,
  title           text      not null,
  category        text      not null,
  description     text      not null,
  instructor      text      not null,
  video_url       text,
  youtube_embed_id text,
  reading_content text,
  syllabus        jsonb     not null default '[]'::jsonb,
  quiz            jsonb,
  created_at      timestamp with time zone default timezone('utc'::text, now()),
  updated_at      timestamp with time zone default timezone('utc'::text, now())
);

create index if not exists courses_category_idx on public.courses (category);
create index if not exists courses_title_idx on public.courses (title);

drop trigger if exists courses_updated_at on public.courses;
create trigger courses_updated_at
  before update on public.courses
  for each row
  execute function public.handle_updated_at();

alter table public.courses enable row level security;

drop policy if exists "Public can view courses" on public.courses;
create policy "Public can view courses"
  for select using (true);

drop policy if exists "Service role can manage courses" on public.courses;
create policy "Service role can manage courses"
  for all using (auth.role() = 'service_role');

-- Seed courses (idempotent)
insert into public.courses (id, title, category, description, instructor, video_url, youtube_embed_id, reading_content, syllabus, quiz)
values
  (
    1,
    'Advanced Astrophysics',
    'Physics',
    'Deep dive into stellar dynamics, black hole mechanics, and relativistic cosmology.',
    'Dr. Elena Vasquez',
    'https://sample-videos.com/video123.mp4',
    null,
    'This course covers the fundamentals of modern astrophysics, including gravitational physics, stellar evolution, galaxy formation, and dark matter theory. Students will explore the mathematical foundations underlying cosmic phenomena.',
    '["Module 1: Gravitational Physics and Relativity","Module 2: Stellar Structure and Evolution","Module 3: Galactic Dynamics and Dark Matter","Module 4: Cosmology and the Big Bang","Module 5: Black Holes and Spacetime Curvature"]'::jsonb,
    '{"question":"Which force is responsible for holding galaxies together?","options":["Electromagnetic force","Strong nuclear force","Weak nuclear force","Gravitational force"],"correctIndex":3}'::jsonb
  ),
  (
    2,
    'Deep Space Navigation',
    'Aerospace',
    'Learn orbital mechanics, celestial navigation, and interstellar trajectory planning.',
    'Capt. M. Reyes',
    'https://sample-videos.com/video123.mp4',
    null,
    'Master the art of navigating spacecraft through the solar system and beyond. This course covers orbital mechanics, celestial navigation techniques, and mission planning for deep space missions.',
    '["Module 1: Orbital Mechanics Fundamentals","Module 2: Celestial Navigation Techniques","Module 3: Propulsion Systems","Module 4: Interstellar Trajectory Planning","Module 5: Mission Control Operations"]'::jsonb,
    '{"question":"What is the primary reference frame for celestial navigation?","options":["Earth-fixed frame","Solar system barycenter","Ecliptic coordinate system","Equatorial coordinate system"],"correctIndex":3}'::jsonb
  ),
  (
    3,
    'Exoplanet Habitability',
    'Astronomy',
    'Explore the criteria for planetary habitability and the search for extraterrestrial life.',
    'Dr. S. Kumar',
    'https://sample-videos.com/video123.mp4',
    null,
    'Examine the conditions necessary for life on exoplanets, including atmospheric composition, orbital resonance, and the habitable zone. This course covers current research in astrobiology and the detection of potentially habitable worlds.',
    '["Module 1: The Habitable Zone Concept","Module 2: Atmospheric Composition and Retention","Module 3: Exoplanet Detection Methods","Module 4: Astrobiology and Biosignatures","Module 5: The Drake Equation and SETI"]'::jsonb,
    '{"question":"What defines the circumstellar habitable zone?","options":["Region with liquid water potential","Region with magnetic field","Region with Earth-like gravity","Region with oxygen atmosphere"],"correctIndex":0}'::jsonb
  ),
  (
    4,
    'Stellar Engineering',
    'Engineering',
    'Advanced techniques for starship construction and stellar-scale engineering projects.',
    'Eng. Aria Chen',
    'https://sample-videos.com/video123.mp4',
    null,
    'Study the theoretical foundations and practical applications of stellar engineering, including Dyson sphere construction, stellar lifting, and fusion reactor design for interstellar vessels.',
    '["Module 1: Fusion Reactor Fundamentals","Module 2: Structural Materials for Spacecraft","Module 3: Propulsion and Power Systems","Module 4: Life Support and Atmospheric Control","Module 5: Large-Scale Engineering Projects"]'::jsonb,
    '{"question":"What is the primary fuel source for a Dyson sphere?","options":["Hydrogen","Helium","Starlight fusion","Captured stellar energy"],"correctIndex":3}'::jsonb
  ),
  (
    5,
    'Galactic Civilizations',
    'Sociology',
    'Survey of potential galactic civilizations and their societal structures.',
    'Prof. Marcus Webb',
    'https://sample-videos.com/video123.mp4',
    null,
    'Explore the sociological implications of galactic-scale civilization, including the Fermi paradox, the Great Filter, and models of interstellar society formation across cosmic time.',
    '["Module 1: The Fermi Paradox","Module 2: The Great Filter Theory","Module 3: Interstellar Communication","Module 4: Societal Models for Galactic Civilizations","Module 5: Xenolinguistics and Cultural Exchange"]'::jsonb,
    '{"question":"What does the Great Filter hypothesis attempt to explain?","options":["Origin of life","Rare Earth hypothesis","Missing link in evolution","Absence of extraterrestrial civilizations"],"correctIndex":3}'::jsonb
  ),
  (
    6,
    'Introduction to Java Programming & Object-Oriented Design',
    'Software Engineering',
    'A 4-week foundational module covering Java syntax, object-oriented design principles, and building real console/GUI applications. Designed for learners with no prior programming background moving into software development roles.',
    'Ms. Rachel Torres',
    'https://sample-videos.com/video123.mp4',
    null,
    'This course covers the fundamentals of Java programming, including syntax, data types, control structures, object-oriented design principles, and hands-on projects building console and GUI applications.',
    '["Module 1: Java Fundamentals — syntax, data types, control structures","Module 2: Object-Oriented Programming — classes, inheritance, polymorphism, interfaces","Module 3: Collections Framework and Exception Handling","Module 4: Building and Testing a Capstone Java Application"]'::jsonb,
    '{"question":"Which principle is NOT a core pillar of Object-Oriented Programming?","options":["Encapsulation","Abstraction","Compilation","Polymorphism"],"correctIndex":2}'::jsonb
  ),
  (
    7,
    'Python for Data Analysis & Automation',
    'Data Science / Automation',
    'A 4-week module covering Python fundamentals and practical data analysis skills using pandas and NumPy, plus scripting for task automation. Suited for learners moving toward data-focused or automation-heavy roles.',
    'Dr. Anil Kapoor',
    'https://sample-videos.com/video123.mp4',
    null,
    'Master Python for data analysis and automation. Learn to manipulate data with pandas, compute with NumPy, and write scripts that automate repetitive tasks across enterprise workflows.',
    '["Module 1: Python Fundamentals and Scripting","Module 2: Data Structures, Functions, and File I/O","Module 3: Data Analysis with pandas and NumPy","Module 4: Automation Scripts and Capstone Data Project"]'::jsonb,
    '{"question":"Which library is primarily used for data manipulation and analysis in Python?","options":["NumPy","pandas","matplotlib","requests"],"correctIndex":1}'::jsonb
  ),
  (
    8,
    'Introduction to Atmospheric Science & Weather Forecasting',
    'Earth Sciences',
    'A foundational 4-week module covering meteorological fundamentals, atmospheric thermodynamics, synoptic chart analysis, and modern numerical weather prediction (NWP) models. Designed to train technical officers in interpreting satellite and radar telemetry.',
    'Dr. Meena Iyer',
    'https://sample-videos.com/video123.mp4',
    'PLACEHOLDER_YOUTUBE_EMBED_ID',
    'Target Ministry Division: India Meteorological Department (IMD) / Operational Forecasting Cadre. YouTube Source Reference: NPTEL / IMD Training Wing Public Lecture Series (Atmospheric Science Playlist).',
    '["Module 1: Structure of the Atmosphere and Global Circulation Patterns","Module 2: Thermodynamic Diagrams and Air Mass Analysis","Module 3: Radar Meteorology and Satellite Cloud Imagery Interpretation","Module 4: Issuing Severe Weather Warnings and Cyclone Tracking Protocols"]'::jsonb,
    '{"question":"Which instrument is primarily used to measure atmospheric pressure?","options":["Thermometer","Barometer","Hygrometer","Anemometer"],"correctIndex":1}'::jsonb
  ),
  (
    9,
    'Oceanography & Marine Earth Systems',
    'Earth Sciences',
    'A comprehensive 6-week professional development course focusing on physical oceanography, marine meteorology, and tsunami early warning systems. Tailored for researchers and marine science officers managing coastal data infrastructure.',
    'Dr. Kiran Nayak',
    'https://sample-videos.com/video123.mp4',
    'PLACEHOLDER_YOUTUBE_EMBED_ID',
    'Target Ministry Division: Ministry of Earth Sciences (MoES) / Ocean Science & Services Division. YouTube Source Reference: INCOIS / MoES Academic Outreach Lecture Series (Oceanography & Marine Dynamics).',
    '["Module 1: Ocean-Atmosphere Coupling and El Niño / La Niña Dynamics","Module 2: Sea Surface Temperature (SST) Monitoring and Oceanic Heat Content","Module 3: Tsunami Generation Mechanisms and Deep-Ocean Buoy Telemetry","Module 4: Integrated Coastal Zone Management and Data Modeling"]'::jsonb,
    '{"question":"What is the primary driver of El Niño events?","options":["Increased trade winds","Weakening of trade winds and warm water shift","Decreased sea surface temperature","Increased upwelling"],"correctIndex":1}'::jsonb
  )
on conflict (id) do update set
  title = excluded.title,
  category = excluded.category,
  description = excluded.description,
  instructor = excluded.instructor,
  video_url = excluded.video_url,
  youtube_embed_id = excluded.youtube_embed_id,
  reading_content = excluded.reading_content,
  syllabus = excluded.syllabus,
  quiz = excluded.quiz,
  updated_at = timezone('utc'::text, now());

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
