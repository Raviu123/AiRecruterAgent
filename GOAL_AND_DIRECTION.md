# AI Interview Preparation Platform: Goals, Vision & Evolution

## 1. Executive Summary & Vision

The project is undergoing a strategic pivot from AI Recruiter Agent (an enterprise HR/Recruitment tool where recruiters create interviews for candidate screening) to AI Interview Preparation Platform (a candidate-centric self-service preparation and learning playground).

### Core Mission
Empower job seekers and candidates to prepare for technical, behavioral, and aptitude interviews through on-demand AI mock voice interviews and structured aptitude test playgrounds.

---

## 2. Tasks & Ticket Management Matrix

### Status Summary
- Done: TASK-001 through TASK-004
- To-Do: TASK-005 through TASK-019

### Ticket Roster

| Check | Ticket ID | Task Title | Module Tag | Status Tag | Priority Tag | Deliverable |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| [x] | **TASK-001** | Project Pivot Vision & Doc | `CORE` | `DONE` | `HIGH` | Created GOAL_AND_DIRECTION.md and updated Notion page with vision. |
| [x] | **TASK-002** | Multi-Agent Guidelines | `CORE` | `DONE` | `HIGH` | Created AGENTS.md defining module boundaries & subagent execution protocols. |
| [x] | **TASK-003** | Development Conventions | `CORE` | `DONE` | `MEDIUM` | Created CONVENTIONS.md for Next.js 15, React 19, Supabase & styling rules. |
| [x] | **TASK-004** | Tasks Database in Notion | `CORE` | `DONE` | `HIGH` | Created task tracking database in Notion to track all project tickets. |
| [ ] | **TASK-005** | Navigation & Sidebar Update | `UI/SHARED` | `TODO` | `HIGH` | Update Constants.jsx & AppSidebar to reflect candidate prep routes. |
| [ ] | **TASK-006** | Candidate Dashboard Redesign | `UI/DASHBOARD` | `TODO` | `HIGH` | Redesign /dashboard into candidate control hub with Quick Start cards. |
| [ ] | **TASK-007** | Deprecate Recruiter Routes | `CORE` | `TODO` | `MEDIUM` | Refactor /schedule-interview into candidate preparation history. |
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

## 3. Pivot Matrix: Existing vs. Transformed Architecture

| Domain | Original (AI Recruiter Agent) | Transformed (AI Interview Prep Platform) |
| :--- | :--- | :--- |
| **Primary User** | HR / Recruiter / Hiring Manager | Job Candidate / Student / Job Seeker |
| **Interview Creation** | Recruiter posts job & sends invite link to candidates | Candidate inputs target JD / Job Title to create self-mock session |
| **Evaluation View** | Recruiter views candidate roster & hiring recommendation | Candidate views personal performance report, score trends, and AI feedback |
| **Learning Modules** | None (Screening only) | **Aptitude Learning Playground** with question bank from standard reference books |
| **Analytics** | Candidate selection funnel | Candidate readiness score, topic weaknesses, & improvement trajectory |

---

## 4. Key Feature Specifications

### 4.1 Aptitude Learning Playground
- **Question Bank Engine:** Ingested question database covering Quantitative Aptitude, Logical Reasoning, Verbal Ability, and Data Interpretation.
- **Custom Quiz Generator:**
  - **Topics:** Topic-wise drill (e.g., Time & Work, Pointers, Syllogisms) vs. Mixed Full Mock.
  - **Complexity:** Easy, Medium, Hard.
  - **Configuration:** Select question count (5, 10, 20, 30) and time limits.
- **Interactive Practice UI:** Instant answer checking, step-by-step solution breakdowns, speed/accuracy metrics.

### 4.2 On-Demand JD Voice Mock Interview
- **Job Description Parsing:** User inputs Job Title + Job Description or pastes target role details.
- **AI Interviewer Customization:** OpenAI generates a tailored question matrix matching job seniorities and required tech stacks.
- **Live Voice Simulation:** Web-based real-time voice interview powered by Vapi (`@vapi-ai/web`) and OpenAI.
- **AI Feedback & Scoring:** Post-interview breakdown with ratings (0-10) across Technical Skills, Communication, Problem Solving, and Domain Experience.

### 4.3 Candidate Analytics & Progress Tracking
- Personal Dashboard displaying recent interview performances and aptitude quiz history.
- Cumulative Readiness Score and topic-by-topic mastery breakdown.

---

## 5. Technology Stack

- **Frontend Framework:** Next.js 15 (App Router), React 19, Tailwind CSS v4.
- **UI Components & Icons:** Radix UI primitives (`@radix-ui/react-*`), Lucide React icons, Sonner toast notifications.
- **Database & Auth:** Supabase (`@supabase/supabase-js`).
- **AI & Voice Services:**
  - **Vapi Web SDK (`@vapi-ai/web`):** Real-time conversational voice agent.
  - **OpenAI API (`openai`):** Structured question generation, answer evaluation, and feedback synthesis.
