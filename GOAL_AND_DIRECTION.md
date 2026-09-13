# AI Interview Preparation Platform: Goals, Vision & Evolution

## 1. Executive Summary & Vision

The project is undergoing a strategic pivot from AI Recruiter Agent (an enterprise HR/Recruitment tool where recruiters create interviews for candidate screening) to AI Interview Preparation Platform (a candidate-centric self-service preparation and learning playground).

### Core Mission
Empower job seekers and candidates to prepare for technical, behavioral, and aptitude interviews through on-demand AI mock voice interviews and structured aptitude test playgrounds.

---

## 2. Tasks & Ticket Management Matrix

### Status Summary
- Done: TASK-001 through TASK-007, plus Root Navigation & Mock Interview fixes
- To-Do: TASK-008 through TASK-019

### Ticket Roster

| Check | Ticket ID | Task Title | Module Tag | Status Tag | Priority Tag | Deliverable |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| [x] | **TASK-001** | Project Pivot Vision & Doc | `CORE` | `DONE` | `HIGH` | Created GOAL_AND_DIRECTION.md and updated Notion page with vision. |
| [x] | **TASK-002** | Multi-Agent Guidelines | `CORE` | `DONE` | `HIGH` | Created AGENTS.md defining module boundaries & subagent execution protocols. |
| [x] | **TASK-003** | Development Conventions | `CORE` | `DONE` | `MEDIUM` | Created CONVENTIONS.md for Next.js 15, React 19, Supabase & styling rules. |
| [x] | **TASK-004** | Tasks Database in Notion | `CORE` | `DONE` | `HIGH` | Created task tracking database in Notion to track all project tickets. |
| [x] | **TASK-005** | Navigation & Sidebar Update | `UI/SHARED` | `DONE` | `HIGH` | Updated Constants.jsx & AppSidebar to reflect candidate prep routes. |
| [x] | **TASK-006** | Candidate Dashboard Redesign | `UI/DASHBOARD` | `DONE` | `HIGH` | Redesigned /dashboard into candidate control hub with Quick Start cards. |
| [x] | **TASK-007** | Deprecate Recruiter Routes | `CORE` | `DONE` | `MEDIUM` | Refactored root / to /dashboard and created modules/ architecture. |
| [ ] | **TASK-008** | Aptitude Supabase Schema | `APTITUDE` | `TODO` | `HIGH` | Create aptitude_questions and aptitude_attempts database tables in Supabase. |
| [ ] | **TASK-009** | Aptitude Book Ingestion Pipeline | `APTITUDE` | `TODO` | `HIGH` | Build script/tool to ingest aptitude questions from reference books into Supabase. |
| [ ] | **TASK-010** | Aptitude Quiz Configurator | `APTITUDE` | `TODO` | `HIGH` | Build UI (AptitudeGenerator) for selecting topic, difficulty, format & count. |
| [ ] | **TASK-011** | Interactive Quiz Runner & Timer | `APTITUDE` | `TODO` | `HIGH` | Build quiz runner (AptitudeRunner) with question stepper, timer & options. |
| [ ] | **TASK-012** | Solution & Explanation Viewer | `APTITUDE` | `TODO` | `MEDIUM` | Build review UI (SolutionViewer) showing detailed step-by-step solutions. |
| [ ] | **TASK-013** | Candidate JD Input Form | `MOCK-INTERVIEW` | `TODO` | `HIGH` | Create form (/mock-interview) to paste/upload JD & Job Title for instant mock setup. |
| [ ] | **TASK-014** | Dynamic OpenAI Question Matrix | `MOCK-INTERVIEW` | `TODO` | `HIGH` | Enhance OpenAI prompts for custom tech/behavioral question generation from JDs. |
| [ ] | **TASK-015** | Vapi Voice Session Refactor | `MOCK-INTERVIEW` | `TODO` | `HIGH` | Refactor Vapi SDK wrapper for seamless candidate voice mock sessions. |
| [ ] | **TASK-016** | Candidate Feedback Report | `MOCK-INTERVIEW` | `TODO` | `HIGH` | Refactor feedback page with candidate rating breakdown, strengths, and advice. |
| [ ] | **TASK-017** | Readiness Score Aggregator | `ANALYTICS` | `TODO` | `MEDIUM` | Build service to aggregate aptitude quiz scores & voice interview ratings. |
| [ ] | **TASK-018** | Readiness & Analytics UI | `ANALYTICS` | `TODO` | `MEDIUM` | Build analytics page (/analytics) with readiness gauge and weakness heatmaps. |
| [ ] | **TASK-019** | Integration & End-to-End Build | `CORE` | `TODO` | `HIGH` | Run npm run build, linting, and verify full candidate preparation workflow. |

---

## 3. Technology Stack

- **Frontend Framework:** Next.js 15 (App Router), React 19, Tailwind CSS v4.
- **UI Components & Icons:** Radix UI primitives (`@radix-ui/react-*`), Lucide React icons, Sonner toast notifications.
- **Database & Auth:** Supabase (`@supabase/supabase-js`).
- **AI & Voice Services:**
  - **Vapi Web SDK (`@vapi-ai/web`):** Real-time conversational voice agent.
  - **OpenAI API (`openai`):** Structured question generation, answer evaluation, and feedback synthesis.
