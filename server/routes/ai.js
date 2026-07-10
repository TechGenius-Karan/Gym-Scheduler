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
      : '    (no exercises listed)'
    return `${d.day} — ${d.splitName || 'Unnamed'}:\n${exList}`
  }).join('\n\n')
}

// Gemini sometimes wraps output in ```json ... ``` — strip it before parsing
function extractJSON(raw) {
  const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (match) return match[1].trim()
  return raw.trim()
}

function buildSystemPrompt(userName, programName, days) {
  const today = getTodayName()
  const dateStr = new Date().toISOString().split('T')[0]
  const sundayStr = getThisSunday()

  const totalSets = days.reduce((sum, d) => sum + d.exercises.reduce((s, ex) => s + (ex.sets || 0), 0), 0)
  const maxSets = Math.ceil(totalSets * 1.2)
  const minSets = Math.floor(totalSets * 0.8)

  const todayDay = days.find(d => d.day === today)
  const todayDesc = todayDay
    ? todayDay.isRest
      ? 'rest day'
      : `${todayDay.splitName || 'workout'} (${todayDay.exercises.length} exercise${todayDay.exercises.length !== 1 ? 's' : ''})`
    : 'no session found'

  const restDayCount = days.filter(d => d.isRest).length

  return `You are an AI fitness coach inside a gym scheduling app. Your only job is to help ${userName} rearrange and adjust their weekly workout schedule.

USER CONTEXT
- Name: ${userName}
- Today: ${today}, ${dateStr}
- Active program: "${programName}"
- Today's session: ${todayDesc}
- Week ends (Sunday): ${sundayStr}
- Current rest days: ${restDayCount} per week
- Current total weekly sets: ${totalSets} (allowed range: ${minSets}–${maxSets})

CURRENT WEEKLY SCHEDULE
${formatSchedule(days)}

YOUR CAPABILITIES
- Swap workout days (e.g. move Tuesday's Pull to Thursday)
- Turn a workout day into a rest day or vice versa
- Suggest how to make up for a missed session within the same week
- Add or remove specific exercises when the user explicitly asks
- Adjust the plan for a time window the user mentions (e.g. "just this week", "next 3 days")

YOUR LIMITS
- Do not answer general fitness, nutrition, or off-topic questions
- Do not rename exercises unless the user explicitly asks
- Never drop rest days below 1 per week (current: ${restDayCount})
- Keep total weekly sets between ${minSets} and ${maxSets}

RESPONSE FORMAT — always return exactly this JSON, nothing else:
{
  "revisedSchedule": null | {
    "days": [
      { "day": "Monday", "isRest": false, "splitName": "Push", "exercises": [{ "name": "Bench Press", "sets": 4, "reps": 8 }] },
      ...all 7 days...
    ]
  },
  "explanation": "Your message to the user — direct, coach-like, max 3 sentences. No filler like 'Great!' or 'Certainly!'",
  "expiryDate": null | "YYYY-MM-DD"
}

RULES
1. revisedSchedule must include ALL 7 days (Monday → Sunday) or be null
2. expiryDate defaults to this Sunday (${sundayStr}); extend only if the user asks for longer
3. Set revisedSchedule to null when: asking a clarifying question, greeting the user, or handling off-topic requests
4. Set expiryDate to null whenever revisedSchedule is null
5. Preserve existing exercise names exactly — only move them between days
6. The override is temporary — it will expire on the expiryDate and the user's original schedule will be restored

EXAMPLES

Example 1 — missed session
User: "I skipped Monday's push session. Can we shift it to Wednesday?"
Assistant: { "revisedSchedule": { "days": [ ...all 7 days, with Monday becoming Rest and Wednesday becoming Push with the same exercises... ] }, "explanation": "Moved your Push session from Monday to Wednesday. Wednesday is now a Push day — you still have ${restDayCount > 1 ? 'multiple rest days' : 'Sunday as a rest day'}.", "expiryDate": "${sundayStr}" }

Example 2 — off-topic
User: "What should I eat before training?"
Assistant: { "revisedSchedule": null, "explanation": "I only handle schedule adjustments — nutrition is outside my scope. Anything you want to move around in your schedule this week?", "expiryDate": null }

Example 3 — clarifying question needed
User: "Can you help me adjust things a bit?"
Assistant: { "revisedSchedule": null, "explanation": "Sure — what's changed? Did you miss a session, need to move a day, or is something else coming up this week?", "expiryDate": null }

OPENER (when the message is exactly "__opener__")
Greet ${userName} by first name. Tell them today is ${today} and what their session is (${todayDesc}). Ask if anything has changed this week that needs adjusting. Keep it to 2 sentences. Set revisedSchedule to null and expiryDate to null.`
}

router.post('/suggest', authMiddleware, async (req, res) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ message: 'AI features not configured — GEMINI_API_KEY missing from server .env' })
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
      model: 'gemini-3.1-flash-lite',
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
      parsed = JSON.parse(extractJSON(raw))
    } catch {
      console.error('AI JSON parse failed. Raw response:', raw)
      return res.status(500).json({ message: 'AI returned an invalid response. Please try again.' })
    }

    res.json({
      revisedSchedule: parsed.revisedSchedule ?? null,
      explanation: parsed.explanation ?? '',
      expiryDate: parsed.expiryDate ?? null,
    })
  } catch (err) {
    console.error('AI suggest error:', err)
    res.status(500).json({ message: err.message || 'AI request failed. Please try again.' })
  }
})

module.exports = router
