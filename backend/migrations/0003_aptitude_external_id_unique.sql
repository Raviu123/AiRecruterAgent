-- Make the question-bank key usable as an upsert target.
--
-- 0002 created a partial unique index (WHERE external_id is not null). Postgres only
-- matches ON CONFLICT (external_id) against a non-partial index, so PostgREST upserts
-- from seed_aptitude.py failed with 42P10. A plain unique index behaves the same for
-- our data - Postgres treats NULLs as distinct, so unseeded rows are still unconstrained.

drop index if exists public.aptitude_questions_external_id_key;

create unique index if not exists aptitude_questions_external_id_key
  on public.aptitude_questions (external_id);
