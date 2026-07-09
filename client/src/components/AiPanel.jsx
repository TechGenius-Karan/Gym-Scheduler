import { useEffect, useRef, useState } from 'react'
import { sendMessage } from '../api/aiApi'
import { useSchedule } from '../context/ScheduleContext'
import ScheduleDiffPreview from './ScheduleDiffPreview'

// ── Icons ──────────────────────────────────────────────────────────────────

const SparkleIcon = ({ className = 'w-5 h-5' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" />
    <path d="M19 15l.75 2.25L22 18l-2.25.75L19 21l-.75-2.25L16 18l2.25-.75z" />
    <path d="M5 3l.5 1.5L7 5l-1.5.5L5 7l-.5-1.5L3 5l1.5-.5z" />
  </svg>
)

const closeIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const sendIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
)

// ── Sub-components ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex gap-2.5">
      <div className="shrink-0 w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center">
        <SparkleIcon className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
      </div>
    </div>
  )
}

function UserBubble({ text }) {
  return (
    <div className="flex justify-end">
      <div className="bg-blue-600 rounded-2xl rounded-tr-sm px-4 py-3 text-sm text-white
                      leading-relaxed max-w-[85%] break-words">
        {text}
      </div>
    </div>
  )
}

function AiBubble({ msg, onApply, onDismiss, onRetry, isDismissed, isApplied }) {
  return (
    <div className="flex gap-2.5">
      <div className="shrink-0 w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center mt-0.5">
        <SparkleIcon className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="flex flex-col gap-2 max-w-[90%]">
        {/* Diff preview — hidden if dismissed or applied */}
        {msg.revisedSchedule && !isDismissed && !isApplied && (
          <ScheduleDiffPreview
            revisedSchedule={msg.revisedSchedule}
            onApply={onApply}
            onDismiss={onDismiss}
          />
        )}
        {/* Applied confirmation */}
        {msg.revisedSchedule && isApplied && (
          <div className="text-[10px] text-blue-400 bg-blue-950/40 border border-blue-800/50
                          rounded-lg px-3 py-2">
            Schedule override applied until {msg.expiryDate}.
          </div>
        )}
        <div className={`rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed
          ${msg.isError ? 'bg-red-950 border border-red-800 text-red-300' : 'bg-gray-800 text-gray-200'}`}>
          {msg.text}
        </div>
        {/* Retry button for error messages */}
        {msg.isError && onRetry && (
          <button
            onClick={onRetry}
            className="self-start text-xs text-red-400 hover:text-red-300 underline
                       underline-offset-2 transition pl-1"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  )
}

function SessionEndNotice() {
  return (
    <div className="text-center text-xs text-gray-500 border border-gray-700 rounded-xl px-4 py-3 bg-gray-900 mt-2">
      Session limit reached — start a new conversation to continue.
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-3 pb-8">
      <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center">
        <SparkleIcon className="w-6 h-6 text-gray-600" />
      </div>
      <p className="text-sm text-gray-300 font-medium">No saved schedule yet</p>
      <p className="text-xs text-gray-600 leading-relaxed">
        Save your schedule first and I'll help you optimise and adjust your week.
      </p>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

const MAX_EXCHANGES = 10

export default function AiPanel({ isOpen, onOpen, onClose }) {
  const { applyOverride, myScheduleData } = useSchedule()

  const [messages, setMessages] = useState([])
  const [history, setHistory] = useState([])   // raw pairs sent to Gemini
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionEnded, setSessionEnded] = useState(false)
  const [dismissedDiffs, setDismissedDiffs] = useState(new Set())
  const [appliedDiffs, setAppliedDiffs] = useState(new Set())

  const textareaRef = useRef(null)
  const messagesEndRef = useRef(null)

  const exchangeCount = messages.filter(m => m.role === 'user').length
  const hasSchedule = !!myScheduleData

  // Fire opener when panel first opens (only if a schedule exists)
  useEffect(() => {
    if (isOpen && hasSchedule && messages.length === 0 && !loading) fireOpener()
  }, [isOpen])

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Focus textarea when panel opens
  useEffect(() => {
    if (isOpen) setTimeout(() => textareaRef.current?.focus(), 310)
  }, [isOpen])

  // Escape key
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape' && isOpen) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  // Reset textarea height when input is cleared
  useEffect(() => {
    if (!inputValue && textareaRef.current) textareaRef.current.style.height = 'auto'
  }, [inputValue])

  async function fireOpener() {
    setLoading(true)
    try {
      const data = await sendMessage(null, [])
      setHistory([
        { role: 'user', text: '__opener__' },
        { role: 'model', text: data.explanation },
      ])
      setMessages([{
        id: crypto.randomUUID(),
        role: 'ai',
        text: data.explanation,
        revisedSchedule: null,
        expiryDate: null,
      }])
    } catch (err) {
      const id = crypto.randomUUID()
      setMessages([{
        id,
        role: 'ai',
        text: err.message || 'Failed to connect to AI Coach. Please try again.',
        isError: true,
        retryPayload: { type: 'opener' },
      }])
    } finally {
      setLoading(false)
    }
  }

  async function handleSend(overrideText, overrideHistory) {
    const text = overrideText ?? inputValue.trim()
    const baseHistory = overrideHistory ?? history
    if (!text || loading || sessionEnded) return

    if (!overrideText) {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'user', text }])
      setInputValue('')
    }
    setLoading(true)

    const updatedHistory = [...baseHistory, { role: 'user', text }]

    try {
      const data = await sendMessage(text, updatedHistory)
      const aiMsg = {
        id: crypto.randomUUID(),
        role: 'ai',
        text: data.explanation,
        revisedSchedule: data.revisedSchedule ?? null,
        expiryDate: data.expiryDate ?? null,
      }
      setMessages(prev => [...prev, aiMsg])
      setHistory([...updatedHistory, { role: 'model', text: data.explanation }])
      if (exchangeCount + 1 >= MAX_EXCHANGES) setSessionEnded(true)
    } catch (err) {
      const id = crypto.randomUUID()
      setMessages(prev => [...prev, {
        id,
        role: 'ai',
        text: err.message || 'Something went wrong. Please try again.',
        isError: true,
        retryPayload: { type: 'message', text, historyAtSend: baseHistory },
      }])
    } finally {
      setLoading(false)
    }
  }

  function handleRetry(errorMsgId, retryPayload) {
    setMessages(prev => prev.filter(m => m.id !== errorMsgId))
    if (retryPayload.type === 'opener') {
      setMessages([])
      setHistory([])
      fireOpener()
    } else {
      handleSend(retryPayload.text, retryPayload.historyAtSend)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleInput(e) {
    setInputValue(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px'
  }

  const canSend = inputValue.trim().length > 0 && !loading && !sessionEnded && hasSchedule

  return (
    <>
      {/* Toggle button */}
      {!isOpen && (
        <button
          onClick={onOpen}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-2xl
                     bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium shadow-lg
                     shadow-blue-900/40 transition-all duration-200 hover:scale-105"
        >
          <SparkleIcon className="w-4 h-4" />
          AI Coach
        </button>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      )}

      {/* Slide-in panel */}
      <div className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-gray-950 border-l border-gray-800
                       z-50 flex flex-col transition-transform duration-300 ease-in-out
                       ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-4 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <SparkleIcon className="w-4 h-4 text-blue-400" />
            <span className="font-semibold text-white text-sm">AI Coach</span>
            {exchangeCount > 0 && (
              <span className="text-[10px] text-gray-600 ml-1">
                {exchangeCount}/{MAX_EXCHANGES} exchanges
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition p-1 rounded-lg hover:bg-gray-800"
          >
            {closeIcon}
          </button>
        </div>

        {/* Body */}
        {!hasSchedule ? (
          <EmptyState />
        ) : (
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
            {messages.map(msg =>
              msg.role === 'user'
                ? <UserBubble key={msg.id} text={msg.text} />
                : (
                  <AiBubble
                    key={msg.id}
                    msg={msg}
                    isDismissed={dismissedDiffs.has(msg.id)}
                    isApplied={appliedDiffs.has(msg.id)}
                    onApply={() => {
                      applyOverride(msg.revisedSchedule.days, msg.expiryDate)
                      setAppliedDiffs(prev => new Set(prev).add(msg.id))
                    }}
                    onDismiss={() => setDismissedDiffs(prev => new Set(prev).add(msg.id))}
                    onRetry={msg.isError && msg.retryPayload
                      ? () => handleRetry(msg.id, msg.retryPayload)
                      : null
                    }
                  />
                )
            )}
            {loading && <TypingIndicator />}
            {sessionEnded && <SessionEndNotice />}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input bar */}
        <div className="shrink-0 border-t border-gray-800 p-4">
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder={
                !hasSchedule ? 'Save your schedule first...'
                : sessionEnded ? 'Session ended'
                : 'Ask your coach...'
              }
              disabled={!hasSchedule || sessionEnded}
              className="flex-1 bg-gray-800 border border-gray-700 text-white placeholder-gray-500
                         rounded-xl px-3 py-2.5 text-sm resize-none leading-relaxed
                         focus:outline-none focus:border-blue-600 transition overflow-hidden
                         disabled:opacity-40 disabled:cursor-not-allowed"
            />
            <button
              onClick={() => handleSend()}
              disabled={!canSend}
              className="shrink-0 p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white
                         transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {sendIcon}
            </button>
          </div>
          <p className="text-[10px] text-gray-600 mt-2 text-center">
            Enter to send · Shift+Enter for new line · Esc to close
          </p>
        </div>

      </div>
    </>
  )
}
