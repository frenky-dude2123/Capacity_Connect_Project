require('dotenv').config();
const fetch = require('node-fetch');

const url = process.env.SUPABASE_URL + '/rest/v1/sql';
const headers = {
  'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
  'Authorization': 'Bearer ' + process.env.SUPABASE_SERVICE_ROLE_KEY,
  'Content-Type': 'application/json',
  'Prefer': 'txn'
};

const sql = `
  CREATE TABLE IF NOT EXISTS public.feedback (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.users(id) on delete cascade,
    course_id bigint not null,
    rating integer check (rating between 1 and 5) not null,
    comment text,
    created_at timestamp with time zone default timezone('utc'::text, now()),
    updated_at timestamp with time zone default timezone('utc'::text, now()),
    unique(user_id, course_id)
  );
  CREATE INDEX IF NOT EXISTS feedback_user_course_idx ON public.feedback (user_id, course_id);
  CREATE INDEX IF NOT EXISTS feedback_course_idx ON public.feedback (course_id);
  ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "Trainees can insert own feedback" ON public.feedback;
  CREATE POLICY "Trainees can insert own feedback" ON public.feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
  DROP POLICY IF EXISTS "Trainees can view own feedback" ON public.feedback;
  CREATE POLICY "Trainees can view own feedback" ON public.feedback FOR SELECT USING (auth.uid() = user_id);
  DROP POLICY IF EXISTS "Trainees can update own feedback" ON public.feedback;
  CREATE POLICY "Trainees can update own feedback" ON public.feedback FOR UPDATE USING (auth.uid() = user_id);
  DROP POLICY IF EXISTS "Service role can manage all feedback" ON public.feedback;
  CREATE POLICY "Service role can manage all feedback" ON public.feedback FOR ALL USING (auth.role() = 'service_role');
`;

fetch(url, {
  method: 'POST',
  headers,
  body: JSON.stringify({ sql })
})
.then(r => r.json())
.then(d => console.log('Success:', JSON.stringify(d, null, 2)))
.catch(e => console.error('Error:', e.message));
