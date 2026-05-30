import { useSchedule } from '../context/ScheduleContext'

export default function EmptyScheduleState({ onPickSplit }) {
  const { startFresh } = useSchedule()

  return (
    <div className="flex flex-col items-center justify-center min-h-[55vh] gap-8 text-center">
      {/* Barbell illustration */}
      <div className="text-indigo-500/50">
        <svg viewBox="0 0 240 80" className="w-52 h-auto" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          {/* Left large plate */}
          <rect x="10" y="16" width="20" height="48" rx="5" opacity="0.9" />
          {/* Left small plate */}
          <rect x="34" y="24" width="13" height="32" rx="4" opacity="0.6" />
          {/* Bar */}
          <rect x="47" y="34" width="146" height="12" rx="6" opacity="0.35" />
          {/* Right small plate */}
          <rect x="193" y="24" width="13" height="32" rx="4" opacity="0.6" />
          {/* Right large plate */}
          <rect x="210" y="16" width="20" height="48" rx="5" opacity="0.9" />
        </svg>
      </div>

      {/* Text */}
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-white">Your week is empty.</h2>
        <p className="text-gray-400 text-sm max-w-xs mx-auto leading-relaxed">
          Build your training split in 30 seconds — pick a template or start from scratch.
        </p>
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={onPickSplit}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition"
        >
          Pick a Split
        </button>
        <button
          onClick={startFresh}
          className="px-6 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 text-gray-300 hover:text-white text-sm font-semibold rounded-xl transition"
        >
          Start Fresh
        </button>
      </div>
    </div>
  )
}
