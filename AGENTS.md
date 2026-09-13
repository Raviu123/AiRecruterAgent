# AGENTS.md: Multi-Agent Collaboration & Modular Workflows

This document defines the rules, boundaries, and standards for AI coding agents operating on the **AI Interview Preparation Platform** codebase.

---

## 1. Modular Architecture Strategy

To enable multiple agents to work concurrently without code collisions or merge conflicts, the codebase is partitioned into distinct feature modules:

```
AiRecruterAgent/
├── app/                      # Next.js App Router Pages & API routes
│   ├── (main)/
│   │   ├── dashboard/       # Candidate Dashboard
│   │   ├── mock-interview/  # Self-Service JD Mock Interview
│   │   ├── aptitude/        # Aptitude Playground & Quizzes
│   │   ├── analytics/       # Progress & Feedback History
│   │   └── settings/        # Candidate Settings
│   └── api/                 # Modular API endpoints
├── modules/                  # Isolated Feature Business Logic
│   ├── mock-interview/      # JD parsing, Vapi voice call wrapper, question generator
│   ├── aptitude/            # Question bank queries, quiz runner, solution evaluator
│   └── analytics/           # Score aggregator, feedback visualizers
├── services/                 # Shared Infrastructure Services
│   ├── supabaseClient.js    # Supabase connection
│   ├── Constants.jsx        # Prompts & system constants
│   └── ai/                  # OpenAI & Vapi client abstractions
├── components/
│   ├── ui/                  # Reusable UI primitives (Radix UI / Shadcn)
│   └── shared/              # Cross-module components (Header, Sidebar)
├── types/                    # Shared TypeScript / JSON Schemas
└── context/                  # App-wide React Contexts
```

---

## 2. Agent Module Ownership & Boundaries

When assigning tasks to autonomous subagents, enforce module isolation:

| Agent Role | Scope / Assigned Directories | Constraints |
| :--- | :--- | :--- |
| **Aptitude Module Agent** | `app/(main)/aptitude/`, `modules/aptitude/`, `app/api/aptitude/` | Cannot modify Vapi voice integrations or interview route handlers. |
| **Mock Interview Agent** | `app/(main)/mock-interview/`, `modules/mock-interview/`, `app/api/ai-feedback/`, `app/interview/` | Cannot alter aptitude quiz logic or database tables. |
| **Analytics & UI Agent** | `app/(main)/analytics/`, `modules/analytics/`, `components/ui/` | Must read from defined data models without changing backend API signatures. |
| **Database & Core Agent** | `services/`, `context/`, `types/`, `lib/` | Responsible for shared utilities and database migrations. |

---

## 3. Parallel Agent Execution Guidelines

1. **Contract-First Development:**
   - Define data schemas (e.g. Supabase tables, API response interfaces) in `types/` or `services/` **before** subagents build frontend UI components.
2. **Strict File Scoping:**
   - Subagents must only modify files inside their assigned feature module or page routes.
3. **Shared UI Components:**
   - UI primitives inside `components/ui/` should remain pure and uncoupled from business logic.
4. **Verification & Build Check:**
   - Every agent must verify changes with `npm run build` or `npm run lint` before completing its work.
