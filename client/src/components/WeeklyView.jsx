import { useSchedule } from '../context/ScheduleContext'
import { getTodayName } from '../utils/dateUtils'
import DayCard from './DayCard'

function isDayChanged(original, revised) {
  if (!original || !revised) return false
  if (original.isRest !== revised.isRest) return true
  if (original.splitName !== revised.splitName) return true
  const origNames = (original.exercises ?? []).map(e => e.name).join(',')
  const revNames = (revised.exercises ?? []).map(e => e.name).join(',')
  return origNames !== revNames
}

export default function WeeklyView() {
  const { myScheduleData, weeklyOverride, clearOverride } = useSchedule()
  const today = getTodayName()

  const activeDays = weeklyOverride?.days ?? myScheduleData?.days
  if (!activeDays) return null

  let restCount = 0

  return (
    <div>
      {/* Override banner */}
      {weeklyOverride && (
        <div className="mb-4 flex items-center justify-between gap-3 px-4 py-3
                        bg-blue-950/50 border border-blue-800/60 rounded-xl text-sm">
          <span className="text-blue-300">
            AI-suggested schedule active until <strong>{weeklyOverride.expiryDate}</strong>
          </span>
          <button
            onClick={clearOverride}
            className="shrink-0 text-xs text-blue-400 hover:text-white underline underline-offset-2 transition"
          >
            Revert to original
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {activeDays.map(day => {
          const restIndex = day.isRest ? restCount++ : -1
          const original = weeklyOverride?.originalDays?.find(d => d.day === day.day)
          const isChanged = weeklyOverride ? isDayChanged(original, day) : false
          return (
            <DayCard
              key={day.day}
              day={day}
              isToday={day.day === today}
              restIndex={restIndex}
              isChanged={isChanged}
            />
          )
        })}
      </div>
    </div>
  )
}
