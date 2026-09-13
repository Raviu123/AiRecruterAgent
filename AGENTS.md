# AGENTS.md: Multi-Agent Collaboration & Modular Workflows

This document defines the rules, boundaries, and standards for AI coding agents operating on the **AI Interview Preparation Platform** codebase.

---

## 1. Modular Architecture Strategy

To enable multiple agents to work concurrently without code collisions or merge conflicts, the codebase is partitioned into distinct feature modules:

```
AiRecruterAgent/
├── backend/                      # FastAPI backend: API routes, AI prompts/calls, Supabase access
│   ├── app/
│   │   ├── routers/             # auth, users, interviews, analytics, aptitude
│   │   ├── services/            # question generation, feedback grading, Vapi assistant config
│   │   ├── database.py          # Supabase repository (all table access)
│   │   └── prompts.py           # LLM prompts
│   └── tests/
└── frontend/                     # Next.js app (UI only)
    ├── app/                      # App Router pages
    │   ├── (main)/
    │   │   ├── dashboard/       # Candidate Dashboard
    │   │   ├── mock-interview/  # Self-Service JD Mock Interview
    │   │   ├── aptitude/        # Aptitude Playground & Quizzes
    │   │   ├── analytics/       # Progress & Feedback History
    │   │   └── settings/        # Candidate Settings
    │   └── interview/           # Candidate lobby, interview room, feedback report
    ├── modules/                  # Feature services (call the backend)
    │   ├── mock-interview/      # Interview API client, Vapi Web SDK wrapper
    │   ├── aptitude/            # Aptitude API client
    │   └── analytics/           # Analytics API client
    ├── services/                 # Shared Infrastructure Services
    │   ├── apiClient.js         # Backend HTTP client (attaches Supabase token)
    │   ├── authService.js       # Email/password sign-up, sign-in, sign-out (via backend)
    │   ├── supabaseClient.js    # Stores/refreshes the Supabase session only
    │   └── Constants.jsx        # UI constants
    ├── components/
    │   └── ui/                  # Reusable UI primitives (Radix UI / Shadcn)
    ├── types/                    # Shared TypeScript / JSON Schemas
    └── context/                  # App-wide React Contexts
```

Frontend paths below are relative to `frontend/`; backend paths are prefixed with `backend/`.

---

## 2. Agent Module Ownership & Boundaries

When assigning tasks to autonomous subagents, enforce module isolation:

| Agent Role | Scope / Assigned Directories | Constraints |
| :--- | :--- | :--- |
| **Aptitude Module Agent** | `app/(main)/aptitude/`, `modules/aptitude/`, `backend/app/routers/aptitude.py` | Cannot modify Vapi voice integrations or interview route handlers. |
| **Mock Interview Agent** | `app/(main)/mock-interview/`, `modules/mock-interview/`, `app/interview/`, `backend/app/routers/interviews.py`, `backend/app/services/` | Cannot alter aptitude quiz logic or database tables. |
| **Analytics & UI Agent** | `app/(main)/analytics/`, `modules/analytics/`, `components/ui/`, `backend/app/routers/analytics.py` | Must read from defined data models without changing backend API signatures. |
| **Database & Core Agent** | `backend/app/database.py`, `backend/app/config.py`, `backend/app/auth.py`, `services/`, `context/`, `types/`, `lib/` | Responsible for shared utilities and database migrations. |

---

## 3. Parallel Agent Execution Guidelines

1. **Contract-First Development:**
   - Define data schemas (e.g. Supabase tables, API response interfaces) in `types/` or `services/` **before** subagents build frontend UI components.
2. **Strict File Scoping:**
   - Subagents must only modify files inside their assigned feature module or page routes.
3. **Shared UI Components:**
   - UI primitives inside `components/ui/` should remain pure and uncoupled from business logic.
4. **Verification & Build Check:**
   - Every agent must verify frontend changes with `npm run build` (in `frontend/`) and backend changes with `pytest` (in `backend/`) before completing its work.
