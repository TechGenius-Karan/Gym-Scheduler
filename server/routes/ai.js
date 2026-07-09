const router = require('express').Router()
const { GoogleGenerativeAI } = require('@google/generative-ai')
const authMiddleware = require('../middleware/authMiddleware')
const Program = require('../models/Program')
const User = require('../models/User')

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function getTodayName() {
  const idx = new Date().getDay() // 0=Sun … 6=Sat
  return DAYS[idx === 0 ? 6 : idx - 1]
}

function getThisSunday() {
  const now = new Date()
  const daysUntilSunday = now.getDay() === 0 ? 0 : 7 - now.getDay()
  const sunday = new Date(now)
  sunday.setDate(now.getDate() + daysUntilSunday)
  return sunday.toISOString().split('T')[0]
}

function formatSchedule(days) {
  return days.map(d => {
    if (d.isRest) return `${d.day}: REST DAY`
    const exList = d.exercises.length
      ? d.exercises.map(ex => `    - ${ex.name}: ${ex.sets} sets × ${ex.reps} reps`).join('\n')
      : '    (no exercises)'
    return `${d.day} — ${d.splitName || 'Unnamed'}:\n${exList}`
  }).join('\n\n')
}

function buildSystemPrompt(userName, programName, days) {
  const today = getTodayName()
  const dateStr = new Date().toISOString().split('T')[0]
  const sundayStr = getThisSunday()

  return `You are an AI fitness coach assistant inside a gym scheduling app.

USER CONTEXT:
- Name: ${userName}
- Today: ${today}, ${dateStr}
- Active program: "${programName}"
- End of current week (Sunday): ${sundayStr}

CURRENT SCHEDULE:
${formatSchedule(days)}

YOUR ROLE:
Help the user revise their weekly workout schedule — e.g. they missed a session, want to swap days, or need to adjust their week due to life events. Stay strictly on schedule revision and weekly planning. Do not answer general fitness, nutrition, or unrelated questions.

RESPONSE FORMAT — always return valid JSON with exactly this shape:
{
  "revisedSchedule": null | {
    "days": [
      {
        "day": "Monday",
        "isRest": false,
        "splitName": "Push",
        "exercises": [{ "name": "Bench Press", "sets": 4, "reps": 8 }]
      }
    ]
  },
  "explanation": "string",
  "expiryDate": null | "YYYY-MM-DD"
}

STRICT RULES:
1. revisedSchedule must contain ALL 7 days (Monday → Sunday) or be null
2. Never reduce rest days below 1 per week
3. Keep total weekly sets within 20% of the original total (original total: ${days.reduce((sum, d) => sum + d.exercises.reduce((s, ex) => s + (ex.sets || 0), 0), 0)} sets)
4. Preserve exercise names exactly — only move exercises between days, never rename them. You may add exercises only if the user explicitly asks
5. expiryDate defaults to this Sunday (${sundayStr}); use a later date only if the user specifies a longer window
6. Set revisedSchedule to null when: asking a clarifying question, responding to off-topic requests, or giving the opener greeting
7. Set expiryDate to null whenever revisedSchedule is null
8. Off-topic requests: set explanation to a brief, friendly redirect back to schedule planning
9. Tone: direct, concise, coach-like — no filler like "Great question!" or "Certainly!"

OPENER GREETING (triggered when the message is exactly "__opener__"):
Greet ${userName} by first name. Mention today is ${today} and what their scheduled session is today (from the schedule above). Invite them to tell you if anything has changed this week. Keep it to 2–3 sentences. Set revisedSchedule to null and expiryDate to null.`
}

router.post('/suggest', authMiddleware, async (req, res) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ message: 'AI features not configured' })
  }

  const { userMessage, history = [] } = req.body

  try {
    const [user, program] = await Promise.all([
      User.findById(req.user.id),
      Program.findOne({ userId: req.user.id, isActive: true }),
    ])

    if (!program) {
      return res.status(400).json({ message: 'No active program found. Save a schedule first.' })
    }

    const systemPrompt = buildSystemPrompt(
      user?.name ?? 'there',
      program.name,
      program.days,
    )

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: systemPrompt,
      generationConfig: { responseMimeType: 'application/json' },
    })

    const geminiHistory = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    }))

    const chat = model.startChat({ history: geminiHistory })
    const message = userMessage?.trim() || '__opener__'
    const result = await chat.sendMessage(message)
    const raw = result.response.text()

    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch {
      return res.status(500).json({ message: 'AI returned an invalid response. Please try again.' })
    }

    res.json({
      revisedSchedule: parsed.revisedSchedule ?? null,
      explanation: parsed.explanation ?? '',
      expiryDate: parsed.expiryDate ?? null,
    })
  } catch (err) {
    console.error('AI suggest error:', err.message)
    res.status(500).json({ message: 'AI request failed. Please try again.' })
  }
})

module.exports = router
