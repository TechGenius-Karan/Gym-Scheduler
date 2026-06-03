# Gym Schedule App — Project Planning Document

## Purpose
A web application that lets users plan and manage their weekly gym workout schedule. Users can organize their training split across the week, define exercises per day, and configure sets and reps. The app prioritizes simplicity and convenience — it should feel like a purpose-built tool, not a chatbot or spreadsheet.

---

## Core Philosophy
- **Convenience first** — every interaction should be fast and intuitive
- **Real app feel** — structured UI with clear sections, not a chat-driven interface
- **Minimal friction** — Google login (one click, no passwords), inline editing (no separate edit pages)
- **Built to extend** — single-user v1, but architecture supports multi-user; no AI in v1, but designed to add it cleanly in v2

---

## Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Frontend framework | React + Vite | Component model fits the UI perfectly. Large ecosystem. Fast dev server. |
| Styling | Tailwind CSS | Utility classes in JSX, no separate CSS files, great for responsive layouts |
| Frontend state | React Context + useState | AuthContext (user) + ScheduleContext (schedule). No extra libraries needed. |
| Backend | Node.js + Express | Lightweight REST API. JS throughout (same language as frontend). |
| Database | MongoDB + Mongoose | Flexible document structure. Schedule data maps naturally to a JSON document. |
| Authentication | Google OAuth 2.0 + JWT | One-click sign in. JWT stored in localStorage, verified on every API request. |

---

## Architecture

This project uses a simplified two-layer architecture: a **data layer** and a **UI layer**, with context acting as glue between them.

```
┌──────────────────────────────────────────────┐
│                  UI LAYER                    │
│  Pages, Components, Context (React)          │
├──────────────────────────────────────────────┤
│              DATA ACCESS LAYER               │
│  api/ (frontend fetch wrappers)              │
│  models/ + routes/ (backend Mongoose + HTTP) │
└──────────────────────────────────────────────┘
```

**Why this and not more layers:** The business logic in this app is negligible — the 1RM formula is one line, preset merging is a few lines of array spreading, and schedule CRUD is a direct find/upsert. A service layer or repository layer would add indirection with no real benefit at this scale.

**Where SOLID is applied (only where it earns its keep):**
- **Single Responsibility** — each file has one clear job. Routes don't import from other routes. Models don't know about HTTP.
- **Open/Closed** — preset templates are static JSON files on the server; adding a new split requires only a new file, no code changes.
- **Interface Segregation** — `api/` is split by domain (`scheduleApi.js`, `authApi.js`, `templateApi.js`) so components only import what they need.
- Other principles not forced — no inheritance, no abstractions for their own sake.

**OOP in the model layer:** Mongoose models are proper OOP classes, not plain schema exports:
- `User.js` — static `fromGoogle(profile)` factory, instance `toJSON()`, `markReturning()`
- `Schedule.js` — instance `getDay(dayName)`, `applyTemplate(templateDays)`, static `buildBlank(userId)`
- `Exercise.js` — constructor with validation (sets/reps must be positive integers), `toJSON()`

---

## App Structure

### Pages
| Route | Page | Description |
|---|---|---|
| `/login` | LoginPage | Google sign-in button. Redirects to `/schedule` on success. |
| `/schedule` | SchedulePage | Main page. Shows all 7 days as cards. Inline editing, save, preset picker. |
| `/tools` | ToolsPage | 1RM Calculator. Enter weight + reps, get estimated one-rep max. |

### Navigation
- Top navbar with two links: **My Schedule** and **Tools**
- User avatar + **Logout** button on the right
- Unauthenticated users are redirected to `/login`

---

## Features (v1)

### 1. Google OAuth Login
- User clicks "Sign in with Google"
- App redirects through Google OAuth
- On success: backend creates/finds the user, issues a JWT
- Backend determines if this is a **new** or **returning** user — `isNew` flag included in the JWT payload and `/auth/me` response
- JWT stored in `localStorage`, sent as `Authorization: Bearer <token>` on every API request
- Logout clears the JWT and redirects to `/login`

### 2. Weekly Schedule View
- All 7 days displayed as cards on one page (Mon → Sun)
- Each card shows:
  - Day name (e.g. Monday)
  - Split name (e.g. "Push", "Pull & Biceps", "Cardio") — editable inline
  - List of exercises with sets × reps — editable inline
  - A **Rest Day** toggle button
- **New users** (no saved schedule) are shown the SplitPicker automatically — they pick a template or start fresh before reaching the editable view
- **Returning users** see their saved schedule immediately on load

### 3. Inline Editing
- Clicking any field (split name, exercise name, sets, reps) turns it into an input
- Changes are held in local state (ScheduleContext) until the user saves
- No modal or separate edit page needed

### 4. Exercises
- Free-type: user types any exercise name
- Fields per exercise: **Name**, **Sets**, **Reps**
- "+ Add Exercise" appends a blank row to the day
- × button removes an exercise from the day
- No reordering needed in v1

### 5. Rest Day Toggle
- Each day card has a toggle: workout day ↔ rest day
- When toggled to Rest: split name and exercises are hidden; a "Rest Day" badge is shown
- Toggling back to workout day restores editing

### 6. Template Splits

Templates are stored as static JSON files on the server (`server/data/templates/`) and served via `GET /api/templates`. Adding a new split requires only a new JSON file — no code changes needed (Open/Closed Principle).

#### Viewing a template
- SplitPicker opens automatically for new users, or via a "Change Split" button for returning users
- User picks from 4 splits: **PPL**, **Upper/Lower**, **Full Body**, **Bro Split**
- Selecting a split fetches `GET /api/templates/:id` and renders `TemplateView` — a read-only 7-day display showing all exercises pre-populated
- Template updates live as the user switches between splits in the picker

#### Template actions (ScheduleActionBar)
- **"Copy to My Schedule"** — deep-copies the full template (days + exercises) into editable state, switches to the editable WeeklyView
- **"Edit"** — same as Copy but signals the intent to edit immediately
- **"Start Fresh"** — creates a blank 7-day schedule (no split names, no exercises), switches to editable WeeklyView
- Returning users: selecting a new template shows it in TemplateView without overwriting their saved schedule until they explicitly confirm "Copy to My Schedule"

#### Split Definitions
| Split | Day Layout |
|---|---|
| PPL (6-day) | Mon=Push, Tue=Pull, Wed=Legs, Thu=Push, Fri=Pull, Sat=Legs, Sun=Rest |
| Upper/Lower (4-day) | Mon=Upper, Tue=Lower, Wed=Rest, Thu=Upper, Fri=Lower, Sat=Rest, Sun=Rest |
| Full Body (3-day) | Mon=Full Body, Wed=Full Body, Fri=Full Body, others=Rest |
| Bro Split (5-day) | Mon=Chest, Tue=Back, Wed=Shoulders, Thu=Arms, Fri=Legs, others=Rest |

### 7. Save
- One **Save** button on the schedule page
- Sends the full schedule state via `POST /api/schedule`
- Success (200): show a success toast notification
- Failure (500): show an inline error message; keep the user's edits in state

### 8. 1RM Calculator (Tools Page)
- User enters: exercise name (optional label), weight lifted, reps completed
- App calculates estimated one-rep max using the **Epley formula**: `1RM = weight × (1 + reps / 30)`
- Result updates live as the user types
- Example: 80 kg × 8 reps → estimated 1RM ≈ 101 kg

### 9. Welcome Message
- `WelcomeBanner` component sits at the top of SchedulePage
- Reads `isNew` from AuthContext and `user.name` from the user object
- `isNew === true` (first login ever) → **"Welcome, [Name]"**
- `isNew === false` (returning user) → **"Hi, [Name]"**
- `isNew` is stored in the `users` collection; set to `false` permanently after the user's first schedule save

### 10. Today's Workout Notification
- `utils/dateUtils.js` exposes two helpers:
  - `getTodayName()` — returns the current weekday string (e.g. `"Monday"`) matching the schedule's day format
  - `getTodayWorkout(schedule)` — finds the matching day in the schedule and returns `{ dayName, isRest, splitName, exerciseCount }`
- `WelcomeBanner` shows today's status below the greeting:
  - Browsing a template: `"Today is Monday — Push Day (from PPL template)"`
  - Saved schedule, workout day: `"Today is Monday — Push Day"`
  - Saved schedule, rest day: `"Today is Monday — Rest Day"`
  - No schedule yet: greeting only, no workout line shown

---

## Data Flow

```
App loads
  └─ AuthContext checks localStorage for JWT
       ├─ Valid JWT → GET /auth/me → store user → proceed to app
       └─ No/invalid JWT → redirect to /login

/login
  └─ Google OAuth button → GET /auth/google → Google → GET /auth/google/callback
       └─ Backend issues JWT → stored in localStorage → redirect to /schedule

/schedule mounts
  └─ AuthContext provides { user, isNew } → WelcomeBanner renders greeting
  └─ ScheduleContext → GET /api/schedule (JWT in header)
       ├─ Schedule found → populate 7 day cards (returning user flow)
       └─ No schedule → SplitPicker opens automatically (new user flow)

New user selects a split
  └─ GET /api/templates/:id → TemplateView renders (read-only)
       ├─ "Copy to My Schedule" → deep-copy into editable state → WeeklyView
       ├─ "Edit" → same as Copy, enters edit mode immediately
       └─ "Start Fresh" → blank 7-day schedule → WeeklyView

User edits
  └─ Update ScheduleContext local state (not saved yet)

User clicks Save
  └─ POST /api/schedule (full state + JWT)
       ├─ 200 OK → update context with response, show success toast; server sets isNew=false on first save
       └─ 500 Error → show error message, keep edits in state

Returning user changes split
  └─ "Change Split" button → SplitPicker modal → user picks new split
       └─ GET /api/templates/:id → TemplateView renders (safe preview, does not overwrite saved schedule)
            └─ "Copy to My Schedule" → overwrites editable state → user edits and saves

/tools
  └─ User types weight + reps → Epley formula runs live → display 1RM
```

---

## Data Model (MongoDB)

### `users` collection
```json
{
  "_id": "ObjectId",
  "googleId": "Google account ID string",
  "email": "user@gmail.com",
  "name": "Display name from Google",
  "createdAt": "ISO timestamp",
  "isNew": true
}
```
`isNew` starts as `true` on account creation; permanently set to `false` after the user's first `POST /api/schedule`.

### `schedules` collection
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId (ref: users)",
  "days": [
    {
      "day": "Monday",
      "isRest": false,
      "splitName": "Push",
      "exercises": [
        { "id": "uuid-v4", "name": "Bench Press", "sets": 4, "reps": 8 },
        { "id": "uuid-v4", "name": "Overhead Press", "sets": 3, "reps": 10 },
        { "id": "uuid-v4", "name": "Tricep Pushdown", "sets": 3, "reps": 12 }
      ]
    },
    {
      "day": "Sunday",
      "isRest": true,
      "splitName": "",
      "exercises": []
    }
  ],
  "updatedAt": "ISO timestamp"
}
```
Exercise `id` fields (uuid v4) are assigned server-side on first save, providing stable identity for client-side add/remove operations.

### Template data (`server/data/templates/*.json`)
Static JSON files committed to the repo. Same shape as a schedule's `days` array, but exercises have no `id` fields — IDs are assigned when a template is copied into a user's schedule.
```json
{
  "id": "ppl",
  "name": "Push / Pull / Legs",
  "description": "6-day split, Push/Pull/Legs twice per week.",
  "days": [
    {
      "day": "Monday", "isRest": false, "splitName": "Push",
      "exercises": [
        { "name": "Bench Press", "sets": 4, "reps": 8 },
        { "name": "Overhead Press", "sets": 3, "reps": 10 }
      ]
    }
  ]
}
```

---

## API Endpoints

| Method | Route | Auth Required | Description |
|---|---|---|---|
| GET | `/auth/google` | No | Initiates Google OAuth redirect |
| GET | `/auth/google/callback` | No | Google callback — creates/finds user, issues JWT. Response includes `isNew` flag. |
| GET | `/auth/me` | JWT | Returns current user info including `isNew` |
| GET | `/api/schedule` | JWT | Returns user's schedule (or `null` if none — not a 404) |
| POST | `/api/schedule` | JWT | Creates or overwrites user's full schedule; sets `isNew=false` on first save |
| GET | `/api/templates` | JWT | Returns all template summaries `{ id, name, description }` |
| GET | `/api/templates/:id` | JWT | Returns full template with all days and exercises |

---

## Project File Structure

```
Gym-schedule-app/
├── planning.md
│
├── client/                             ← React + Vite frontend
│   ├── src/
│   │   ├── api/                        ← DATA ACCESS LAYER: fetch wrappers only
│   │   │   ├── scheduleApi.js          ← getSchedule(), saveSchedule()
│   │   │   ├── authApi.js              ← getMe()
│   │   │   └── templateApi.js          ← getAllTemplates(), getTemplate(id)
│   │   ├── context/                    ← STATE GLUE: holds data, calls api/, triggers re-renders
│   │   │   ├── AuthContext.jsx         ← User state: login, logout, current user + isNew flag
│   │   │   └── ScheduleContext.jsx     ← Schedule state: activeView, templateData, myScheduleData
│   │   ├── pages/                      ← UI LAYER
│   │   │   ├── LoginPage.jsx
│   │   │   ├── SchedulePage.jsx        ← Orchestrates WelcomeBanner + view switching
│   │   │   └── ToolsPage.jsx           ← Epley formula lives here (one line, not worth extracting)
│   │   ├── components/                 ← UI LAYER
│   │   │   ├── Navbar.jsx
│   │   │   ├── WelcomeBanner.jsx       ← Greeting (Welcome/Hi) + today's workout notification
│   │   │   ├── WeeklyView.jsx
│   │   │   ├── DayCard.jsx
│   │   │   ├── ExerciseRow.jsx
│   │   │   ├── SplitPicker.jsx         ← Split selection modal; triggers template fetch on pick
│   │   │   ├── TemplateView.jsx        ← Read-only 7-day template display
│   │   │   └── ScheduleActionBar.jsx   ← "Copy to My Schedule" / "Start Fresh" / "Save" buttons
│   │   ├── utils/
│   │   │   └── dateUtils.js            ← getTodayName(), getTodayWorkout(schedule)
│   │   ├── App.jsx                     ← React Router setup + auth guard
│   │   └── main.jsx                    ← Vite entry point, wraps app in context providers
│   ├── .env                            ← VITE_API_URL=http://localhost:5000
│   └── package.json
│
└── server/
    ├── models/                         ← DATA LAYER: Mongoose OOP classes
    │   ├── User.js                     ← fromGoogle(), toJSON(), markReturning(); includes isNew field
    │   ├── Schedule.js                 ← getDay(), applyTemplate(), buildBlank(); exercises use uuid ids
    │   └── Exercise.js                 ← constructor with validation, toJSON()
    ├── routes/                         ← HTTP handlers (thin — delegates to Mongoose methods)
    │   ├── auth.js                     ← Passport OAuth wiring + JWT issuance with isNew flag
    │   ├── schedule.js                 ← GET + POST /api/schedule; sets isNew=false on first POST
    │   └── templates.js               ← GET /api/templates, GET /api/templates/:id
    ├── middleware/
    │   └── authMiddleware.js           ← JWT verification, attaches req.user
    ├── config/
    │   └── db.js                       ← MongoDB connection (keeps index.js clean)
    ├── data/
    │   └── templates/                  ← Static JSON files (committed to repo; auto-discovered)
    │       ├── ppl.json
    │       ├── upper-lower.json
    │       ├── full-body.json
    │       └── bro-split.json
    ├── index.js                        ← App bootstrap: Express setup, route mounting
    ├── .env
    └── package.json
```

---

## Build Order (Step-by-Step)

**Phase 1 — Scaffold**
1. Initialize `client/` with Vite + React, install Tailwind CSS and React Router
2. Initialize `server/` with npm, install Express, Mongoose, Passport, jsonwebtoken, cors, dotenv, uuid

**Phase 2 — Server Data Layer**
3. Set up MongoDB connection in `server/config/db.js`, import in `index.js`
4. Build `Exercise.js` OOP class (constructor with validation, `toJSON()`)
5. Build `Schedule.js` OOP class (`getDay()`, `applyTemplate()`, `buildBlank()`, `fromJSON()`)
6. Build `User.js` OOP class (`fromGoogle()`, `markReturning()`, `toJSON()`); include `isNew` field
7. Write all 4 template JSON files in `server/data/templates/` (ppl, upper-lower, full-body, bro-split) with full exercise definitions

**Phase 3 — Server HTTP Layer**
8. Implement Google OAuth flow (`passport-google-oauth20`); include `isNew` in JWT payload; set `isNew=false` on first `POST /api/schedule`
9. Build `authMiddleware.js` to verify JWT and attach `req.user`
10. Build `GET /api/schedule` and `POST /api/schedule` routes
11. Build `GET /api/templates` and `GET /api/templates/:id` routes (reads from `server/data/templates/`)

**Phase 4 — Frontend Auth + Welcome**
12. Build `authApi.js` (`getMe()`), `AuthContext` (stores `user` + `isNew`), `LoginPage`; test sign-in round-trip
13. Build `WelcomeBanner.jsx` — renders "Welcome, [Name]" or "Hi, [Name]" based on `isNew`; today's workout line wired up in step 20

**Phase 5 — Template Flow**
14. Build `templateApi.js` (`getAllTemplates()`, `getTemplate(id)`)
15. Build `ScheduleContext` with `activeView` state (`"splitPicker"` | `"template"` | `"mySchedule"`), `templateData`, `myScheduleData`
16. Build `SplitPicker.jsx` (updated) — on split pick, fetches template and switches to `"template"` view; auto-opens for new users
17. Build `TemplateView.jsx` — read-only 7-day display of a fetched template
18. Build `ScheduleActionBar.jsx` — "Copy to My Schedule", "Start Fresh" (template view); "Save" (schedule view)

**Phase 6 — Schedule Editing**
19. Build `scheduleApi.js`, `WeeklyView`, `DayCard`, `ExerciseRow` — render schedule from context
20. Add inline editing to all fields; add/remove exercise; rest day toggle
21. Wire `Save` button → `POST /api/schedule` → toast on success, error message on failure
22. Build `utils/dateUtils.js` (`getTodayName()`, `getTodayWorkout()`); wire today's notification into `WelcomeBanner`

**Phase 7 — Navigation + Tools**
23. Build `Navbar` with routing + "Change Split" button + logout
24. Build `ToolsPage` with inline 1RM calculator

**Phase 8 — Polish**
25. Responsive layout (Tailwind breakpoints on the 7-day grid)
26. Loading states (skeleton cards while schedule/template fetches)
27. Empty/error state handling throughout

---

## v2 Features (Do Not Build Yet)

- **AI Chat Assistant** (requires Anthropic API key + billing setup)
  - Floating chat bubble in the corner of the schedule page
  - User describes what happened: "I missed Push day" or "I only did half my leg workout"
  - AI (Claude API) reads the current schedule and suggests:
    - Which exercises to redistribute to upcoming days
    - A revised full weekly plan with before/after view
  - Powered by `@anthropic-ai/sdk` calling `claude-sonnet-4-6` or newer

---

## v1.5 — Enhancements & New Features (Backlog)

These are ideas to tackle after the core v1 is complete. Ordered roughly by complexity (simplest first). AI features are saved for v2.

---

### UI / UX Improvements

#### 1. Toast Notifications
Currently save success/failure is shown inline. Replace with a brief, auto-dismissing toast that slides in from the bottom corner. Applies to: schedule saved, exercise added, schedule cleared. Keeps the UI clean while still giving clear feedback.

#### 2. Loading Skeletons
Replace any spinner or blank-while-loading states with skeleton placeholder cards that mirror the shape of the real content. Makes the app feel faster and more polished, especially on first load.

#### 3. Today Highlight on Day Card
The app already detects today's weekday. Add a stronger visual treatment to the current day's card — a colored top border or accent ring — so it jumps out immediately in the weekly grid.

#### 4. Rest Day Visual Badge
When a day is toggled to Rest, show a distinct "Rest Day" badge or muted card style instead of just empty space. Makes it clear the rest is intentional, not an unfilled day.

#### 5. Exercise Notes Field
Add a small optional notes input per exercise (e.g. "pause reps", "superset with X", "drop set on last"). Stored as a `notes` string on the exercise object. Hidden by default; revealed by a small icon button to keep the UI uncluttered.

#### 6. Collapsible Day Cards (Mobile)
On small screens, collapse all day cards except today's by default. A tap expands them. Reduces scrolling on mobile significantly.

#### 7. Drag-to-Reorder Exercises
Let users drag exercises up and down within a day card to reorder them. Use `@dnd-kit/core` (lightweight, accessible). The order is preserved in the schedule array and saved with the rest of the schedule.

#### 8. Split Name / Program Notes
Let users give their current program a name (e.g. "PPL — Bulk Phase Q3") and a short description. Displayed at the top of the schedule page as a header. Stored as `programName` and `programNotes` on the schedule document.

#### 9. Weekly Volume Summary
Below the 7-day grid, show a small summary row: total sets per week, number of training days, and rest days. Helps users quickly sanity-check their volume without counting manually.

#### 10. Empty State Illustration
When a brand-new user lands on the schedule page before picking a split, show a simple SVG illustration with a clear call-to-action ("Pick a split to get started"). Better than a blank screen.

---

### New Tools

#### 11. Plate Calculator
User enters a target barbell weight; the tool calculates which plates to load on each side of the bar (assuming a standard 20 kg Olympic bar). Outputs a visual plate stack. Entirely client-side. Extremely useful at the gym when loading up quickly.

#### 12. Macro / Calorie Estimator
User enters bodyweight, height, age, sex, and goal (bulk / maintain / cut). App computes an estimated TDEE using the Mifflin-St Jeor formula and a simple activity multiplier, then splits it into a suggested macro breakdown (protein / carbs / fat in grams). All client-side, no API needed.

#### 13. Rest Timer
A simple countdown timer with preset durations (60s, 90s, 2m, 3m) and a custom input. Plays a short audio tone when it hits zero. Lives as a small floating widget or a dedicated card on the Tools page. Extremely useful mid-workout.

#### 14. Wilks / DOTS Score Calculator
Takes bodyweight and total lifted weight (or individual lifts), outputs a Wilks or DOTS score — a bodyweight-normalized strength metric used in powerlifting. Useful for intermediate/advanced lifters who want to compare strength across weight classes.

#### 15. Bodyweight Tracker
A simple log where users record their bodyweight over time with a date. Displays a minimal line chart (using a lightweight library like `recharts`). Stored in a new `bodyweightLogs` collection on the backend. Gives users a second reason to open the app regularly.

---

### Feature Ideas

#### 16. Workout Completion Tracking
A "Mark as done" checkbox on each day card that resets every Monday. Ticked days get a visual strikethrough or checkmark. Store completion state in localStorage first (no backend changes needed); can be synced to the server in a later pass. Gives users a satisfying sense of progress through the week.

#### 17. Multiple Saved Programs
Allow users to save more than one named program (e.g. "Bulk — PPL", "Cut Phase", "Strength Block") and switch between them freely. A user's training changes across phases — they shouldn't have to rebuild their schedule from scratch every time they switch goals.

A **Program Bar** sits at the top of the schedule page showing the active program name with a dropdown to switch between saved programs and a "+ New Program" button. Creating a new program follows the same flow as the current new-user experience: pick a template, duplicate an existing program, or start fresh — then give it a name. Switching programs loads that program's schedule into the page. If there are unsaved changes when switching, the user is prompted to save or discard first.

Programs can be renamed and deleted via a small options menu. Deleting the active program auto-activates the next available one; if it was the last program, the SplitPicker opens again. The 7-day grid, inline editing, and Save button all behave exactly as they do today — they just operate on whichever program is currently active. Under the hood, the `schedules` collection becomes a `programs` collection with many documents per user, each carrying a `name`, `isActive` flag, and the same `days` array as today.

#### 18. RPE Field per Exercise
Add an optional RPE (Rate of Perceived Exertion, 1–10) field alongside sets and reps. Useful for auto-regulation training. Hidden by default like the notes field — shown only if the user wants it.

#### 19. Export Schedule
A button that generates a clean printable or shareable view of the weekly schedule — either a PDF (via `window.print()` + print stylesheet) or a shareable image (via `html-to-image`). No backend changes needed.

#### 20. Keyboard Shortcuts
Power-user shortcuts for the schedule page: `E` to focus the first editable field on today's card, `S` to save, `Escape` to cancel an edit. Documented in a small tooltip or help modal.

#### 21. Motivational / Humorous Day Phrases
Each day card shows a small personality-driven subtitle line beneath the split name — something relatable and gym-culture-aware. Examples:
- Push day: "Chest day is the best day."
- Pull day: "Back is the new chest."
- Legs day: "Legs day 😩 let's get it."
- Arms day: "Time to fill those sleeves."
- Rest day: "Rest up, [name]. Recovery is gains."
The phrase is determined by the split name (fuzzy match on keywords like "push", "legs", "pull", etc.). Falls back to a generic motivational line if no keyword matches. Phrases should feel genuine and relatable, not generic fitness-app filler. Rest day phrase uses the user's first name for a personal touch.

---

## Implementation Plan — Multiple Programs Feature

All new files already exist (commented out). The plan below is strictly what needs to happen to make them live.

---

### Step 1 — Uncomment the server files

- `server/models/Program.js` — remove the `/* */` wrapper. No logic changes needed.
- `server/routes/programs.js` — remove the `/* */` wrapper. No logic changes needed.
- `server/index.js` — add `app.use('/api/programs', require('./routes/programs'))` after the schedule route.

---

### Step 2 — Uncomment the client API file

- `client/src/api/programApi.js` — remove the `/* */` wrapper. No logic changes needed.

---

### Step 3 — Update `ScheduleContext.jsx`

This is where things went wrong last time. Be precise:

**Imports** — change the first two lines to:
```js
import { createContext, useContext, useState, useMemo } from 'react'
import { getTemplate } from '../api/templateApi'
import {
  activateProgram, saveProgram, createProgram,
  getProgram, renameProgram, deleteProgram,
} from '../api/programApi'
```

**New state** — add directly after the existing `loadingTemplate` state line:
```js
const [programs, setPrograms] = useState([])
const [activeProgramId, setActiveProgramId] = useState(null)
const [savedScheduleData, setSavedScheduleData] = useState(null)

const hasUnsavedChanges = useMemo(() => {
  if (!myScheduleData?.days || !savedScheduleData?.days) return false
  return JSON.stringify(myScheduleData.days) !== JSON.stringify(savedScheduleData.days)
}, [myScheduleData, savedScheduleData])
```

**New functions** — add a new `// ── program actions` section after `reorderExercises`. Five functions total:

1. `saveActiveProgram()` — if `activeProgramId` exists: calls `saveProgram(activeProgramId, days)`, updates both `myScheduleData` and `savedScheduleData` with the server response, patches the program name in the `programs` list. If no `activeProgramId` (first-ever save): calls `createProgram('My Schedule', days)`, sets `activeProgramId`, sets both data states, sets `programs` list to the single created entry.

2. `switchProgram(id)` — calls `activateProgram(id)`, sets `activeProgramId`, sets both data states to the returned program, sets `activeView('mySchedule')`, updates `programs` list to reflect new `isActive` flags.

3. `createNewProgram(name, days)` — calls `createProgram(name, days)`, sets `activeProgramId`, sets both data states, sets `activeView('mySchedule')`, appends to `programs` list with all others marked inactive.

4. `renameProgramById(id, name)` — calls `renameProgram(id, name)`, patches the name in the `programs` list.

5. `deleteProgramById(id)` — calls `deleteProgram(id)`. If response has `newActiveId`: calls `getProgram(newActiveId)`, loads it into both data states, updates `programs` list. If deleted program was active and no `newActiveId`: clears all data states, sets `activeView('splitPicker')`, empties `programs`. If deleted program was not active: just removes it from `programs` list.

**Provider value** — add all new items:
```
programs, setPrograms,
activeProgramId, setActiveProgramId,
savedScheduleData, setSavedScheduleData,
hasUnsavedChanges,
saveActiveProgram,
switchProgram,
createNewProgram,
renameProgramById,
deleteProgramById,
```

---

### Step 4 — Update `SchedulePage.jsx`

Three targeted changes only — the rest of the file stays identical:

1. **Swap the API import**: remove `import { getSchedule, saveSchedule } from '../api/scheduleApi'`, add `import { getActiveProgram, getPrograms } from '../api/programApi'`.

2. **Expand the context destructure**: add `setActiveProgramId, setSavedScheduleData, setPrograms, saveActiveProgram` alongside the existing destructured values.

3. **Replace the `useEffect`**: instead of calling `getSchedule()`, call `Promise.all([getActiveProgram(), getPrograms()])`. On success: call `setPrograms(all)`, and if active program exists set `setActiveProgramId`, `setSavedScheduleData`, `setMyScheduleData`, `setActiveView('mySchedule')`. If null, fall through to `setActiveView('splitPicker')`.

4. **Replace `handleSave` body**: remove the `saveSchedule(days)` call. Instead call `await saveActiveProgram()` (which is now a context function that handles both create-on-first-save and update-existing). The `setSaving`, `setSaveSuccess`, `setSaveError` states stay exactly as they are around it.

5. **Add `<ProgramBar />`** import and render it above the schedule content (below `<WelcomeBanner />`), only rendered once the schedule has loaded (inside the non-loading branch). It self-hides via `if (!programs.length) return null` when the user has no saved programs yet (new user flow).

---

### Step 5 — Uncomment `ProgramBar.jsx` and `NewProgramModal.jsx`

Remove the `/* */` wrappers from both files. No logic changes needed. `ProgramBar` reads from context so it just works once the context changes in Step 3 are in place.

---

### What does NOT change

- `WeeklyView`, `DayCard`, `ExerciseRow` — untouched. They read `myScheduleData.days` from context, which is still the same shape.
- `ScheduleActionBar` — untouched. Save button still calls `onSave` from SchedulePage.
- `SplitPicker`, `TemplateView` — untouched. The change-split flow still works identically.
- `Navbar` — untouched for now. ProgramBar lives on the schedule page above the grid.
- `WelcomeBanner` — untouched. Today's notification reads from `myScheduleData.days`.
- Existing user data — safe. The migration in `programs.js` (`migrateIfNeeded`) wraps the old Schedule into a Program called "My Schedule" on first request. The user sees their existing data immediately.

---

## v2 Features (Do Not Build Yet)

### `server/.env`
```
MONGO_URI=mongodb://localhost:27017/gym-schedule
PORT=5000
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
JWT_SECRET=<any long random string>
CLIENT_URL=http://localhost:5173
```

### `client/.env`
```
VITE_API_URL=http://localhost:5000
```

To get Google OAuth credentials:
1. Go to https://console.cloud.google.com
2. Create a new project
3. Enable the Google+ API / OAuth
4. Create OAuth 2.0 credentials (Web application type)
5. Set authorized redirect URI to: `http://localhost:5000/auth/google/callback`
