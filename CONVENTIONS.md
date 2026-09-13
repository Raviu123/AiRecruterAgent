# CONVENTIONS.md: Codebase & Development Standards

This document establishes the coding standards, patterns, and conventions for the **AI Interview Preparation Platform**.

---

## 1. Tech Stack & Framework Standards

- **Framework:** Next.js 15 (App Router).
- **React Version:** React 19 (Server Components by default, `'use client'` for interactive views).
- **Styling:** Tailwind CSS v4 with PostCSS. Use `clsx` and `tailwind-merge` (`cn` helper in `lib/utils.js`) for conditional class merging.
- **Database:** Supabase JS Client (`@supabase/supabase-js`).
- **Voice / AI:** `@vapi-ai/web` and `openai` official SDK.

---

## 2. Directory & Naming Conventions

- **Pages & Routes:** Folders under `app/` use `kebab-case` (e.g., `mock-interview`, `schedule-interview`).
- **Components:** `PascalCase` for React component files (e.g., `FormContainer.jsx`, `AptitudeRunner.jsx`).
- **Utilities & Helpers:** `camelCase` for functions and utility files (e.g., `supabaseClient.js`, `utils.js`).
- **Constants:** Screaming `SNAKE_CASE` for prompts and configuration constants (e.g., `QUESTION_PROMPT`, `FEEDBACK_PROMPT`).

---

## 3. Database & API Patterns

- **Supabase Query Isolation:** All database calls should go through typed service functions or module controllers rather than raw inline queries inside React components.
- **API Route Handlers:**
  - Store API routes in `app/api/<feature>/route.js`.
  - Always handle errors with standard JSON error responses: `{ error: "Message", status: 500 }`.
- **Environment Variables:** Store keys in `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_VAPI_PUBLIC_KEY`, `OPENAI_API_KEY`).

---

## 4. UI & Accessibility Standards

- Use Radix UI primitives (`@radix-ui/react-*`) for accessible dialogs, modals, select boxes, and tooltips.
- Notification toasts must use `sonner` (`toast.success()`, `toast.error()`).
- All icons must come from `lucide-react`.

---

## 5. Error Handling & Verification

- Never swallow exceptions silently. Always log errors or show friendly toast alerts to the user.
- Run `npm run build` to verify Next.js route builds and compilation before submitting updates.
