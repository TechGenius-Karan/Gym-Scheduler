# Gym Scheduler

A web app for planning your weekly gym split. Pick a training template, customise your exercises, and save your schedule — all in one place. No spreadsheets, no notes app, no forgetting what day is leg day.

---

## Features

- **Google Sign-In** — one click, no passwords
- **Training templates** — choose from PPL, Upper/Lower, Full Body, or Bro Split as a starting point
- **Fully editable schedule** — rename splits, add/remove exercises, tweak sets and reps inline
- **Rest day toggle** — mark any day as a rest day with one click
- **Today highlight** — your current day is always visually marked on the schedule
- **1RM Calculator** — estimate your one-rep max using the Epley formula
- **Auto-save state** — edits stay in memory until you explicitly save

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS v4, React Router |
| Backend | Node.js, Express 5 |
| Database | MongoDB (Mongoose) |
| Auth | Google OAuth 2.0, JWT |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [MongoDB Atlas](https://cloud.mongodb.com) account (free tier works fine)
- A Google Cloud project with OAuth 2.0 credentials

### 1. Clone the repo

```bash
git clone https://github.com/TechGenius-Karan/Gym-Scheduler.git
cd Gym-Scheduler
```

### 2. Install dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Set up environment variables

Create a `.env` file inside the `server/` folder. Use `server/.env.example` as a reference:

```env
MONGO_URI=your_mongodb_connection_string
PORT=5000
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
JWT_SECRET=any_long_random_string
CLIENT_URL=http://localhost:5173
```

**MongoDB** — get your connection string from Atlas: Connect → Drivers → Node.js. If you run into DNS issues with the `mongodb+srv://` format on Windows, use the standard connection string (there's a "connecting behind a firewall" link in the same Atlas dialog that gives you the direct format).

**Google OAuth** — go to [Google Cloud Console](https://console.cloud.google.com), create a project, and set up an OAuth 2.0 Web Client. Add `http://localhost:5000/auth/google/callback` as an authorised redirect URI.

Also create `client/.env`:

```env
VITE_API_URL=http://localhost:5000
```

### 4. Run the app

Open two terminals:

```bash
# Terminal 1 — server
cd server
npm run dev
```

```bash
# Terminal 2 — client
cd client
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Project Structure

```
Gym-Scheduler/
├── client/                  # React frontend
│   └── src/
│       ├── api/             # Fetch wrappers (authApi, scheduleApi, templateApi)
│       ├── components/      # UI components
│       ├── context/         # AuthContext, ScheduleContext
│       ├── pages/           # LoginPage, SchedulePage, ToolsPage
│       └── utils/           # dateUtils
│
└── server/                  # Express backend
    ├── config/              # MongoDB connection
    ├── data/templates/      # Static JSON split templates
    ├── middleware/          # JWT auth middleware
    ├── models/              # Mongoose models (User, Schedule, Exercise)
    └── routes/              # auth, schedule, templates
```

---

## API Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/auth/google` | No | Redirect to Google consent screen |
| GET | `/auth/google/callback` | No | OAuth callback, issues JWT |
| GET | `/auth/me` | JWT | Returns current user |
| GET | `/api/schedule` | JWT | Returns user's schedule or null |
| POST | `/api/schedule` | JWT | Save or overwrite schedule |
| GET | `/api/templates` | JWT | List all template summaries |
| GET | `/api/templates/:id` | JWT | Full template with exercises |

---

## Adding a New Training Template

Drop a `.json` file into `server/data/templates/`. It gets picked up automatically — no code changes needed. Follow the same shape as the existing templates:

```json
{
  "id": "your-template-id",
  "name": "Template Name",
  "description": "Short description.",
  "days": [
    {
      "day": "Monday",
      "isRest": false,
      "splitName": "Push",
      "exercises": [
        { "name": "Bench Press", "sets": 4, "reps": 8 }
      ]
    }
  ]
}
```

---

## Roadmap

- [ ] AI assistant — chat with Claude to adjust your schedule when you miss a session
- [ ] Progress tracking — log weights over time
- [ ] Mobile app
