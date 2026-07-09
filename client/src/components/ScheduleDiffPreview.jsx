import { useSchedule } from '../context/ScheduleContext'

function dayLabel(day) {
  if (day.isRest) return 'Rest Day'
  const count = day.exercises?.length ?? 0
  return `${day.splitName || 'Unnamed'} · ${count} ex`
}

function isDayChanged(original, revised) {
  if (!original) return true
  if (original.isRest !== revised.isRest) return true
  if (original.splitName !== revised.splitName) return true
  const origNames = (original.exercises ?? []).map(e => e.name).join(',')
  const revNames = (revised.exercises ?? []).map(e => e.name).join(',')
  return origNames !== revNames
}

export default function ScheduleDiffPreview({ revisedSchedule }) {
  const { myScheduleData } = useSchedule()
  const originalDays = myScheduleData?.days ?? []
  const revisedDays = revisedSchedule?.days ?? []

  const changedCount = revisedDays.filter(r =>
    isDayChanged(originalDays.find(o => o.day === r.day), r)
  ).length

  return (
    <div className="mt-1 rounded-xl border border-gray-700 overflow-hidden text-xs w-full">

      {/* Table header */}
      <div className="grid grid-cols-3 bg-gray-800/80 text-gray-400 font-medium px-3 py-2 uppercase tracking-wide text-[10px]">
        <span>Day</span>
        <span>Current</span>
        <span>Suggested</span>
      </div>

      {/* Rows */}
      {revisedDays.map(revised => {
        const original = originalDays.find(d => d.day === revised.day) ?? revised
        const changed = isDayChanged(original, revised)

        return (
          <div
            key={revised.day}
            className={`grid grid-cols-3 px-3 py-2 border-t border-gray-700/40 transition-colors
              ${changed ? 'bg-blue-950/50' : 'opacity-40'}`}
          >
            <span className={`font-medium ${changed ? 'text-blue-300' : 'text-gray-400'}`}>
              {revised.day.slice(0, 3)}
            </span>
            <span className={changed ? 'text-gray-300' : 'text-gray-500'}>
              {dayLabel(original)}
            </span>
            <span className={changed ? 'text-blue-200 font-medium' : 'text-gray-500'}>
              {dayLabel(revised)}
            </span>
          </div>
        )
      })}

      {/* Footer */}
      <div className="px-3 py-2 border-t border-gray-700/40 bg-gray-800/40 text-gray-500 text-[10px]">
        {changedCount === 0 ? 'No changes from your current schedule.' : `${changedCount} day${changedCount !== 1 ? 's' : ''} changed`}
      </div>
    </div>
  )
}
