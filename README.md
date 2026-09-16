# AI Interview Preparation Platform

Next.js frontend + FastAPI backend + Supabase, kept as two independent apps.

```
AiRecruterAgent/
├── frontend/                  # Next.js 15 app (UI only)
│   ├── app/                   # App Router pages
│   ├── components/            # UI primitives (shadcn / Radix)
│   ├── context/, hooks/, lib/, types/
│   ├── modules/               # Feature services that call the backend
│   ├── services/              # apiClient.js, authService.js, supabaseClient.js (session only), Constants.jsx
│   ├── public/
│   └── package.json, next.config.mjs, .env.example
├── backend/                   # FastAPI app (all API, AI and database logic)
│   ├── app/main.py            # FastAPI app, CORS, error handling
│   ├── app/config.py          # Settings (reads backend/.env)
│   ├── app/database.py        # Supabase repository — every table read/write
│   ├── app/auth.py            # Verifies the Supabase access token sent by the browser
│   ├── app/llm.py             # OpenRouter / OpenAI client
│   ├── app/prompts.py         # Question, feedback and voice-interviewer prompts
│   ├── app/services/          # Question generation, feedback grading, Vapi assistant config
│   ├── app/routers/           # /api/auth, /api/users, /api/interviews, /api/analytics, /api/aptitude
│   ├── migrations/            # SQL applied by `python migrate.py`
│   ├── seed_aptitude.py       # Loads data/aptiqbank.json into the aptitude question bank
│   ├── tests/
│   └── requirements.txt, .env.example
├── data/                      # Source question bank (aptiqbank.json) and reference material
└── AGENTS.md, CONVENTIONS.md, GOAL_AND_DIRECTION.md
```

Sign-up and sign-in (email + password) go through the backend, which calls Supabase Auth; the browser only stores the
returned session. The browser talks to Vapi directly for the live voice call. Everything else goes through the backend too.

## Setup

Run the backend and frontend in two terminals.

### 1. Backend (http://localhost:8000)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env          # macOS/Linux: cp .env.example .env — then fill in values
python migrate.py               # create/update the Supabase tables (needs SUPABASE_DB_URL)
python seed_aptitude.py         # load data/aptiqbank.json into the aptitude question bank
uvicorn app.main:app --reload --port 8000
```

`seed_aptitude.py` upserts on a stable key, so re-running it updates questions instead of
duplicating them; `--dry-run` validates the file and prints a per-category summary without writing.

API docs: http://localhost:8000/docs · Tests: `pytest`

On startup the backend logs a dependency check (`OK` / `WARN` / `FAIL`) for the Supabase database
tables, Supabase auth, and the AI provider key, plus the Vapi and CORS settings. The server still starts
if a check fails. The same report is available at http://localhost:8000/api/health; add `?refresh=true` to re-run it.

| Variable (`backend/.env`) | Purpose |
| --- | --- |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` (recommended) or `SUPABASE_ANON_KEY` | Database access |
| `OPENROUTER_API_KEY` or `OPENAI_API_KEY` | Question generation and feedback grading |
| `FRONTEND_ORIGINS` | CORS origins (default `http://localhost:3000`) |

### 2. Frontend (http://localhost:3000)

```bash
cd frontend
npm install
copy .env.example .env          # macOS/Linux: cp .env.example .env — then fill in values
npm run dev
```

| Variable (`frontend/.env`) | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Backend URL (default `http://localhost:8000`) |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Storing/refreshing the login session in the browser |
| `NEXT_PUBLIC_VAPI_PUBLIC_KEY` | Voice interviews (text mode works without it) |
| `NEXT_PUBLIC_HOST_URL` | Base URL for shareable interview links |

## Interview flow

1. **Create** (`/mock-interview`, signed in): paste a JD → `POST /api/interviews/generate-questions`
   → edit questions → `POST /api/interviews` saves to the `Interviews` table.
2. **Attempt** (`/interview/:id`, public link): enter name → `/interview/:id/start` → choose
   - **Voice**: browser fetches `GET /api/interviews/:id/assistant-config` and starts a Vapi call; the transcript is collected live.
   - **Text**: answer each question in writing.
3. **Feedback**: `POST /api/interviews/:id/feedback` grades the transcript with the LLM and stores it in
   `interview-feedback`; the report is shown at `/interview/:id/completed?feedback=<id>`.

## Aptitude flow

Aptitude questions are **not** AI-generated — they are served from the seeded `aptitude_questions`
bank (`data/aptiqbank.json` → `backend/seed_aptitude.py`).

1. **Configure** (`/aptitude`, signed in): `GET /api/aptitude/catalog` lists the categories, topics
   and per-difficulty counts actually in the bank; pick a category/topic, a difficulty and a length.
2. **Draw** — `POST /api/aptitude/quizzes` builds one paper and stores it in `aptitude_quizzes`:
   - questions are shuffled, and questions from the candidate's recent papers with the same settings
     are skipped, so repeating a drill gives new questions until the pool is exhausted;
   - `mixed` spreads the paper across easy/medium/hard;
   - each question's options are re-ordered, and only the permutation is stored — the browser never
     receives `correctOptionIndex`.
3. **Sit the paper**: 60 seconds per question overall; the runner auto-submits when the clock expires.
4. **Grade** — `POST /api/aptitude/quizzes/{id}/submit` maps answers back through the stored
   permutation on the server, writes an `aptitude_attempts` row, and returns the score, per-topic and
   per-difficulty breakdowns, and every question with its worked solution. Re-submitting a finished
   paper returns the stored attempt instead of re-grading.

## API summary

| Method | Path | Auth |
| --- | --- | --- |
| POST | `/api/auth/signup` (name, email, password) | public |
| POST | `/api/auth/login` (email, password) | public |
| POST | `/api/users/me` | signed in |
| POST | `/api/interviews/generate-questions` | signed in |
| POST / GET | `/api/interviews` | signed in (own interviews) |
| GET | `/api/interviews/{id}` | public |
| GET | `/api/interviews/{id}/details` | owner |
| GET | `/api/interviews/{id}/assistant-config` | public |
| POST | `/api/interviews/{id}/feedback` | public |
| GET | `/api/interviews/{id}/feedback/{feedback_id}` | public |
| GET | `/api/analytics/summary` | signed in |
| GET | `/api/aptitude/catalog` | signed in |
| POST | `/api/aptitude/quizzes` (draw a randomised paper) | signed in |
| GET | `/api/aptitude/quizzes/{quiz_id}` | owner |
| POST | `/api/aptitude/quizzes/{quiz_id}/submit` (graded server-side) | owner |
| GET | `/api/aptitude/attempts`, `/api/aptitude/attempts/{id}` | signed in (own attempts) |

"Signed in" means the request carries `Authorization: Bearer <Supabase access token>`;
`frontend/services/apiClient.js` attaches it automatically.
