const PHRASES = [
  { keywords: ['push'],               phrase: 'Chest day is the best day.' },
  { keywords: ['pull'],               phrase: 'Back is the new chest.' },
  { keywords: ['full'],               phrase: 'No muscle left behind.' },
  { keywords: ['leg'],                phrase: 'Legs day \u{1F629} let\'s get it.' },
  { keywords: ['arm'],                phrase: 'Time to fill those sleeves.' },
  { keywords: ['upper'],              phrase: 'All the good stuff in one session.' },
  { keywords: ['lower'],              phrase: 'Basically legs, but you get to call it something nicer.' },
  { keywords: ['core', 'abs'],        phrase: "They're already there. Just need to uncover them." },
]

export function getDayPhrase(splitName) {
  if (!splitName?.trim()) return null
  const lower = splitName.toLowerCase()
  for (const { keywords, phrase } of PHRASES) {
    if (keywords.some(k => lower.includes(k))) return phrase
  }
  return null
}

const REST_PHRASES = [
  name => name ? `Rest up, ${name}. Recovery is gains.` : 'Rest up. Recovery is gains.',
  name => name ? `The gains happen here, ${name}. Enjoy it.` : 'The gains happen here. Enjoy it.',
]

export function getRestPhrase(restIndex, firstName) {
  return REST_PHRASES[restIndex % REST_PHRASES.length](firstName)
}
