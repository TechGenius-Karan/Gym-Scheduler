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

function getExerciseDiff(origExercises, revExercises) {
  const orig = origExercises ?? []
  const rev = revExercises ?? []
  const origNames = new Set(orig.map(e => e.name))
  const revNames = new Set(rev.map(e => e.name))

  const added = rev.filter(e => !origNames.has(e.name))
  const removed = orig.filter(e => !revNames.has(e.name))
  const setsRepsChanged = rev
    .filter(e => {
      const o = orig.find(oe => oe.name === e.name)
      return o && (o.sets !== e.sets || o.reps !== e.reps)
    })
    .map(e => {
      const o = orig.find(oe => oe.name === e.name)
      return { name: e.name, from: `${o.sets}×${o.reps}`, to: `${e.sets}×${e.reps}` }
    })

  return { added, removed, setsRepsChanged }
}

export default function ScheduleDiffPreview({ revisedSchedule, onApply, onDismiss }) {
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

        const exDiff = changed && !revised.isRest && !original.isRest
          ? getExerciseDiff(original.exercises, revised.exercises)
          : null
        const hasExDiff = exDiff && (
          exDiff.added.length > 0 ||
          exDiff.removed.length > 0 ||
          exDiff.setsRepsChanged.length > 0
        )

        return (
          <div
            key={revised.day}
            className={changed ? 'bg-blue-950/50' : 'opacity-40'}
          >
            {/* Summary row */}
            <div className="grid grid-cols-3 px-3 py-2 border-t border-gray-700/40">
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

            {/* Exercise-level diff */}
            {hasExDiff && (
              <div className="px-3 pb-2.5 flex flex-col gap-0.5 border-t border-blue-900/30">
                {exDiff.added.map(e => (
                  <span key={e.name} className="text-[10px] text-green-400">
                    + {e.name} ({e.sets}×{e.reps})
                  </span>
                ))}
                {exDiff.removed.map(e => (
                  <span key={e.name} className="text-[10px] text-red-400">
                    − {e.name}
                  </span>
                ))}
                {exDiff.setsRepsChanged.map(e => (
                  <span key={e.name} className="text-[10px] text-amber-400">
                    ~ {e.name}: {e.from} → {e.to}
                  </span>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* Footer */}
      <div className="px-3 py-2 border-t border-gray-700/40 bg-gray-800/40 text-gray-500 text-[10px]">
        {changedCount === 0
          ? 'No changes from your current schedule.'
          : `${changedCount} day${changedCount !== 1 ? 's' : ''} changed`}
      </div>

      {/* Apply / Dismiss */}
      <div className="flex gap-2 px-3 py-3 border-t border-gray-700/40 bg-gray-900/60">
        <button
          onClick={onApply}
          className="flex-1 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs
                     font-medium transition"
        >
          Apply
        </button>
        <button
          onClick={onDismiss}
          className="flex-1 py-1.5 rounded-lg border border-gray-700 hover:border-gray-500
                     text-gray-400 hover:text-gray-200 text-xs transition"
        >
          Dismiss
        </button>
      </div>

    </div>
  )
}
