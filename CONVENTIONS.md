# CONVENTIONS.md: Codebase & Development Standards

This document establishes the coding standards, patterns, and conventions for the **AI Interview Preparation Platform**.

---

## 1. Tech Stack & Framework Standards

- **Repository layout:** Two independent apps — `frontend/` (Next.js) and `backend/` (FastAPI). Each has its own dependencies, `.env`, `.env.example` and `.gitignore`. Frontend paths in this document are relative to `frontend/`.
- **Framework:** Next.js 15 (App Router).
- **React Version:** React 19 (Server Components by default, `'use client'` for interactive views).
- **Styling:** Tailwind CSS v4 with PostCSS. Use `clsx` and `tailwind-merge` (`cn` helper in `lib/utils.js`) for conditional class merging.
- **Backend:** FastAPI (Python 3.11) in `backend/`. Owns all API endpoints, AI calls and database access.
- **Database:** Supabase, accessed only from the backend via `supabase-py` (`backend/app/database.py`).
  Email/password auth runs through `backend/app/routers/auth.py`; the frontend uses `@supabase/supabase-js` only to store and refresh the session (`services/authService.js`).
- **Voice / AI:** `@vapi-ai/web` in the browser; OpenRouter/OpenAI via the `openai` Python SDK in the backend.

---

## 2. Directory & Naming Conventions

- **Pages & Routes:** Folders under `app/` use `kebab-case` (e.g., `mock-interview`, `schedule-interview`).
- **Components:** `PascalCase` for React component files (e.g., `FormContainer.jsx`, `AptitudeRunner.jsx`).
- **Utilities & Helpers:** `camelCase` for functions and utility files (e.g., `supabaseClient.js`, `utils.js`).
- **Constants:** Screaming `SNAKE_CASE` for prompts and configuration constants (e.g., `QUESTION_PROMPT`, `FEEDBACK_PROMPT`).

---

## 3. Database & API Patterns

- **No database or AI calls in the frontend:** React components call module services (`modules/*/…Service.js`), which call the backend through `services/apiClient.js`.
- **Backend routes:** Add endpoints as routers in `backend/app/routers/<feature>.py`; table access goes through `Repository` in `backend/app/database.py`; prompts live in `backend/app/prompts.py`.
- **Errors:** Raise `HTTPException` with a human-readable `detail`; the frontend `ApiError` surfaces `detail` in toasts.
- **Auth:** Endpoints that act on a user's data depend on `get_current_user` (Supabase access token). Never trust a user email sent in the request body.
- **Environment Variables:** See `frontend/.env.example` and `backend/.env.example`. Server secrets (`SUPABASE_SERVICE_ROLE_KEY`, `OPENROUTER_API_KEY`) live only in `backend/.env` and must never use the `NEXT_PUBLIC_` prefix.
- **Verification:** Run `pytest` in `backend/` for backend changes.

---

## 4. UI & Accessibility Standards

- Use Radix UI primitives (`@radix-ui/react-*`) for accessible dialogs, modals, select boxes, and tooltips.
- Notification toasts must use `sonner` (`toast.success()`, `toast.error()`).
- All icons must come from `lucide-react`.

---

## 5. Error Handling & Verification

- Never swallow exceptions silently. Always log errors or show friendly toast alerts to the user.
- Run `npm run build` in `frontend/` to verify Next.js route builds and compilation before submitting updates.
