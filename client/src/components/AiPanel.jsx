import { useEffect, useRef } from 'react'

const sparkleIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" />
    <path d="M19 15l.75 2.25L22 18l-2.25.75L19 21l-.75-2.25L16 18l2.25-.75z" />
    <path d="M5 3l.5 1.5L7 5l-1.5.5L5 7l-.5-1.5L3 5l1.5-.5z" />
  </svg>
)

const closeIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const sendIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
)

export default function AiPanel({ isOpen, onOpen, onClose }) {
  const inputRef = useRef(null)

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300)
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  return (
    <>
      {/* Toggle button — visible when panel is closed */}
      {!isOpen && (
        <button
          onClick={onOpen}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-2xl
                     bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium shadow-lg
                     shadow-blue-900/40 transition-all duration-200 hover:scale-105"
        >
          {sparkleIcon}
          AI Coach
        </button>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={onClose}
        />
      )}

      {/* Slide-in panel */}
      <div className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-gray-950 border-l border-gray-800
                       z-50 flex flex-col transition-transform duration-300 ease-in-out
                       ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-800 shrink-0">
          <div className="flex items-center gap-2 text-blue-400">
            {sparkleIcon}
            <span className="font-semibold text-white">AI Coach</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition p-1 rounded-lg hover:bg-gray-800"
          >
            {closeIcon}
          </button>
        </div>

        {/* Message list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">

          {/* Placeholder welcome message */}
          <div className="flex gap-2.5">
            <div className="shrink-0 w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white mt-0.5">
              {sparkleIcon}
            </div>
            <div className="bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-gray-200 leading-relaxed max-w-[85%]">
              Hey! I'm your AI Coach. Once connected, I'll read your current schedule and help you
              adjust your week — whether you've missed a session, need to swap days, or just want
              to shake things up.
            </div>
          </div>

        </div>

        {/* Input bar */}
        <div className="shrink-0 border-t border-gray-800 p-4">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              rows={1}
              placeholder="Ask your coach..."
              className="flex-1 bg-gray-800 border border-gray-700 text-white placeholder-gray-500
                         rounded-xl px-3 py-2.5 text-sm resize-none leading-relaxed
                         focus:outline-none focus:border-blue-600 transition
                         max-h-32 overflow-y-auto"
              onInput={e => {
                e.target.style.height = 'auto'
                e.target.style.height = e.target.scrollHeight + 'px'
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  // Phase 3 will wire this up
                }
              }}
            />
            <button
              className="shrink-0 p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white
                         transition disabled:opacity-40 disabled:cursor-not-allowed"
              disabled
              title="Coming soon"
            >
              {sendIcon}
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-2 text-center">
            Shift+Enter for new line · Esc to close
          </p>
        </div>

      </div>
    </>
  )
}
