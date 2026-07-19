# AI Coach Improvement Plan

## Context

The AI coach currently works as a chat panel that can suggest weekly schedule adjustments (swap days, handle missed sessions, toggle rest days). It works well locally but the system prompt lacks exercise science grounding, the diff preview is superficial (split-name only), and the feature set is limited to schedule rearrangement. The goal is to make this the standout, impressive feature of the app across three priority tiers.

---

## Priority 1 — Quality: Science-backed AI Suggestions

### 1a. Expand System Prompt with Embedded Exercise Science Knowledge

**File:** `server/routes/ai.js` — `buildSystemPrompt()`

Add an **EXERCISE SCIENCE KNOWLEDGE BASE** section to the system prompt containing:

- **Recovery:** Chest/shoulders/triceps need 48h minimum; back/biceps 48h; legs 72h (large muscle mass)
- **Training frequency:** 2× per muscle group/week is optimal for hypertrophy (Schoenfeld et al. 2016, 2017 meta-analyses)
- **Compound lifts** (Squat, Deadlift, Bench, Row, OHP) stress CNS heavily — avoid placing them on consecutive days
- **Volume landmarks:** Minimum Effective Volume (MEV) ~10 sets/muscle/week; Maximum Adaptive Volume (MAV) ~16–20 sets; Maximum Recoverable Volume (MRV) ~25 sets
- **Deload:** Recommend a deload week (50% volume) every 4–6 weeks or when user reports persistent fatigue/soreness
- **Rest day placement:** At least 1 full rest day after leg day is optimal; never schedule Legs → Legs with no rest between
- **Split logic:** PPL — consecutive push/pull/legs is intentional (different muscle groups); Upper/Lower — upper and lower should not repeat consecutively without rest

Also add a **MUSCLE GROUP MAP** section so the AI knows which exercises hit which muscles:

| Exercise | Primary | Secondary |
|---|---|---|
| Bench Press | Chest | Triceps, anterior deltoid |
| Overhead Press | Shoulders | Triceps |
| Squat | Quads, glutes | Hamstrings, lower back |
| Deadlift | Hamstrings, glutes, lower back | Traps, lats |
| Pull-up / Lat Pulldown | Lats, rhomboids | Biceps |
| Barbell Row / Cable Row | Lats, rhomboids | Biceps, rear delt |
| Romanian Deadlift | Hamstrings | Glutes, lower back |
| Tricep Pushdown / Skull Crusher | Triceps | — |
| Barbell Curl / Hammer Curl | Biceps | — |
| Leg Press / Hack Squat | Quads | Glutes |
| Lateral Raise | Lateral deltoid | — |
| Face Pull | Rear delt, rotator cuff | — |
| Calf Raise | Gastrocnemius, soleus | — |
| Chest Fly / Cable Fly | Chest | — |
| Leg Curl | Hamstrings | — |

### 1b. Smarter Constraint Reasoning in Prompt

Update the AI's **RULES** section to include recovery-aware logic:

- "When swapping workout days, verify the resulting order does not violate 48h/72h muscle recovery rules based on the MUSCLE GROUP MAP."
- "If the user reports fatigue, soreness, or feeling overtrained, suggest reducing volume to MEV or propose a deload week (50% volume across all days)."
- "If a user asks to add exercises, check current volume for the relevant muscle group against MAV before recommending."

### 1c. Prompt Tests

**New file:** `server/tests/ai-prompt-tests.md`

Curated test conversations to run manually against the AI to verify quality:

| # | User Input | Expected Behaviour |
|---|---|---|
| 1 | "I missed Monday's push session, can you move it to Wednesday?" | Moves Push to Wed, makes Mon a rest day, checks Wed muscle conflict |
| 2 | "What should I eat before training?" | Declines (off-topic), stays in scope |
| 3 | "I'm travelling Wed–Thu and can only train at the hotel" | Asks what equipment is available OR suggests bodyweight substitutions for those days |
| 4 | "I'm feeling really sore and overtrained" | Suggests deload week (50% volume) or extra rest day, references recovery principles |
| 5 | "Can you add more chest work?" | Checks current chest volume vs MAV, adds or warns if already at limit |
| 6 | "I can only train 3 days this week" | Collapses schedule into 3 days intelligently (full body or push/pull/legs variant) |
| 7 | "Show me how to do a bench press" | Returns `exerciseVideoQuery: "Bench Press"`, embeds video |
| 8 | "Move my leg day — it's always after chest and I feel dead" | Identifies CNS fatigue pattern, moves leg day with recovery gap |
| 9 | "I want to train every day this week" | Warns about recovery, proposes a plan with at least 1 rest day, enforces minimum rest rule |
| 10 | *(opener) panel opens fresh* | Greets by name, states today + today's session, asks what needs adjusting |

---

## Priority 2 — App Impact: Make It a Standout Feature

### 2a. Exercise-level Diff in ScheduleDiffPreview

**File:** `client/src/components/ScheduleDiffPreview.jsx`

**Current behaviour:** Only compares `splitName` per day — users can't see which exercises actually changed.

**New behaviour:**
- Within each changed day, show a sub-list of exercises: **green** for added, **red** for removed, unchanged greyed out
- Use set/rep changes as a secondary indicator (e.g. "Bench Press 4×8 → 3×8" shown in amber)
- "X exercises changed" footer detail

### 2b. Conversation Starter Chips

**File:** `client/src/components/AiPanel.jsx`

When the chat has 0 user messages (opener just fired), show 4 tappable suggestion chips below the opener message:

- "I missed today's session"
- "I'm travelling this week"
- "I'm feeling overtrained"
- "Suggest a deload week"

Clicking a chip pre-fills and auto-sends the message. **Chips disappear after the first user message.**

### 2c. Reset Conversation Button

**File:** `client/src/components/AiPanel.jsx`

Add a circular reset icon button in the panel header (top-right, next to close button). Clicking it:
- Clears `messages`, `history`, `exchangeCount`
- Re-fires the opener greeting
- Shows confirmation tooltip "Conversation reset"

### 2d. AI Badge on Modified DayCards

**File:** `client/src/components/DayCard.jsx` (and `WeeklyView.jsx`)

When a weekly override is active, DayCards whose day differs from the saved version show a small **"AI" pill badge** (blue, top-right corner of the card). This makes the override visually obvious in the schedule grid — users immediately see which days the AI touched.

**Implementation:** Pass `isAiModified` boolean prop from WeeklyView (compare override days vs saved days).

### 2e. Persist Conversation Across Page Refreshes

**File:** `client/src/components/AiPanel.jsx`

Store `messages` and `history` in `localStorage` under key `gym_ai_conversation`. On panel mount, restore from localStorage if present (and not expired — tie expiry to the current day, clear at midnight). This means users can close the panel, navigate to Tools page, come back, and their conversation is still there.

---

## Priority 3 — New AI Capability: Exercise Form Videos

### 3a. Static Exercise Video JSON

**New file:** `client/src/data/exercise-videos.json`

Hand-curated map of exercise name (lowercase, normalised) → YouTube video ID. Source videos from 1–2 high-quality channels (e.g. Jeff Nippard, Alan Thrall, or similar form-focused channels). Cover all exercises across the 4 templates + common variants (~50–60 total).

```json
{
  "bench press": "video_id_here",
  "barbell squat": "video_id_here",
  "deadlift": "video_id_here",
  ...
}
```

Stored client-side (no server route needed — it's static read-only data, imported directly in the component).

### 3b. Extend AI Response JSON Schema

**File:** `server/routes/ai.js`

Add `exerciseVideoQuery` field to the enforced response format:

```json
{
  "revisedSchedule": null,
  "explanation": "Here's a bench press tutorial...",
  "expiryDate": null,
  "exerciseVideoQuery": "Bench Press"
}
```

**Updates to `buildSystemPrompt()`:**
- Add to **CAPABILITIES:** "Answer questions about exercise form by returning the exercise name in `exerciseVideoQuery`"
- Add to **RESPONSE FORMAT:** `"exerciseVideoQuery": null | "Exact exercise name"`
- Add **RULE:** "Set `exerciseVideoQuery` when the user asks how to perform an exercise or asks for a form tutorial. Set `revisedSchedule` to null in these cases."
- Add example:
  ```
  User: "How do I do a Romanian deadlift?"
  Assistant: { "revisedSchedule": null, "explanation": "Here's a form video for the Romanian Deadlift.", "expiryDate": null, "exerciseVideoQuery": "Romanian Deadlift" }
  ```

Update `extractJSON` + route handler to pass `exerciseVideoQuery` through in the response.

### 3c. ExerciseVideoCard Component

**New file:** `client/src/components/ExerciseVideoCard.jsx`

Renders a YouTube embed inside the chat panel:
- Looks up `exerciseVideoQuery` (lowercased) in the local `exercise-videos.json` map
- **If found:** renders a 16:9 iframe embed (`youtube.com/embed/{videoId}`) with the exercise name as title
- **If not found:** shows "No tutorial video available for [exercise]" with a link to search YouTube

### 3d. Wire into AiPanel

**File:** `client/src/components/AiPanel.jsx`

When rendering an AI message that has `exerciseVideoQuery` set, render `<ExerciseVideoCard exerciseName={...} />` below the explanation text bubble.

---

## Files to Create / Modify

| File | Action | What Changes |
|---|---|---|
| `server/routes/ai.js` | **Modify** | Expand system prompt (science KB + muscle map + video capability), add `exerciseVideoQuery` to response schema and pass-through |
| `server/tests/ai-prompt-tests.md` | **Create** | 10 manual test cases for prompt quality verification |
| `client/src/components/ScheduleDiffPreview.jsx` | **Modify** | Exercise-level diff (added/removed/changed exercises per day) |
| `client/src/components/AiPanel.jsx` | **Modify** | Conversation starter chips, reset button, localStorage persistence, render ExerciseVideoCard |
| `client/src/components/DayCard.jsx` | **Modify** | Accept + display `isAiModified` prop as "AI" badge |
| `client/src/components/WeeklyView.jsx` | **Modify** | Compute `isAiModified` per day, pass to DayCard |
| `client/src/components/ExerciseVideoCard.jsx` | **Create** | YouTube embed card with lookup from static map |
| `client/src/data/exercise-videos.json` | **Create** | Curated exercise name → YouTube video ID map (~50–60 exercises) |

---

## Verification

1. **Prompt quality:** After updating system prompt, run all 10 test cases manually in the app. Check that:
   - Off-topic requests are declined
   - Recovery conflicts are flagged (e.g. legs → legs consecutive)
   - Volume cap warnings appear when adding exercises near MAV
   - Deload suggestion triggers on fatigue/overtraining signals

2. **Exercise-level diff:** Apply an AI suggestion that swaps a session AND adds an exercise. Confirm the diff preview shows the new exercise in green.

3. **Conversation starters:** Open AI panel fresh → confirm chips appear → tap one → confirm it sends and chips disappear.

4. **Reset button:** Have a 3-message conversation → click reset → opener fires again → old messages gone.

5. **AI badge:** Apply an AI override → navigate to schedule → confirm modified DayCards show the "AI" pill.

6. **YouTube videos:** Type "How do I do a bench press?" → confirm video embed appears in chat with correct YouTube player.

7. **Persistence:** Open panel, send 2 messages, close panel, navigate to /tools, go back to /schedule, open panel — conversation should still be there.
