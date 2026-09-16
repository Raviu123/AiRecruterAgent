-- Aptitude module: seedable question bank + generated quiz papers.
--
-- 0001 created aptitude_questions/aptitude_attempts. This migration makes the bank
-- seedable from data/aptiqbank.json (see backend/seed_aptitude.py) and adds the
-- aptitude_quizzes table that stores a generated paper: which questions were drawn
-- and the shuffled option order shown to the candidate. Correct answers stay in the
-- database, so grading happens on the server and the browser never sees the key.

-- ---------------------------------------------------------------------------
-- Question bank: stable identity per imported question so re-seeding updates
-- rows instead of duplicating them.
-- ---------------------------------------------------------------------------
alter table public.aptitude_questions
  add column if not exists external_id text,
  add column if not exists source      text not null default 'aptiqbank';

create unique index if not exists aptitude_questions_external_id_key
  on public.aptitude_questions (external_id)
  where external_id is not null;

create index if not exists aptitude_questions_topic_idx
  on public.aptitude_questions (topic);

-- ---------------------------------------------------------------------------
-- aptitude_quizzes: one generated paper per "Start quiz" click
--
-- questions: [{ "questionId": 12, "optionOrder": [2, 0, 3, 1] }, ...]
--   optionOrder[displayedIndex] = index into the question's stored options array.
-- ---------------------------------------------------------------------------
create table if not exists public.aptitude_quizzes (
  quiz_id           uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  "userId"          text,
  "userEmail"       text not null,
  category          text,
  topic             text,
  difficulty        text not null default 'mixed',
  "totalQuestions"  integer not null check ("totalQuestions" > 0),
  "durationSeconds" integer not null default 0,
  questions         jsonb not null default '[]'::jsonb,
  status            text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  completed_at      timestamptz
);

create index if not exists aptitude_quizzes_user_email_idx
  on public.aptitude_quizzes ("userEmail", created_at desc);

-- ---------------------------------------------------------------------------
-- Attempts: link back to the paper and keep the per-topic review payload
-- ---------------------------------------------------------------------------
alter table public.aptitude_attempts
  add column if not exists quiz_id uuid references public.aptitude_quizzes (quiz_id) on delete set null,
  add column if not exists topic   text,
  add column if not exists "timeTakenSeconds" integer not null default 0,
  add column if not exists review  jsonb not null default '[]'::jsonb;

create index if not exists aptitude_attempts_quiz_id_idx
  on public.aptitude_attempts (quiz_id);

alter table public.aptitude_quizzes enable row level security;
