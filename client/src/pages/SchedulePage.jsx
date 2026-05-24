import { useEffect } from 'react'
import { useSchedule } from '../context/ScheduleContext'
import { getSchedule } from '../api/scheduleApi'
import WelcomeBanner from '../components/WelcomeBanner'

export default function SchedulePage() {
  const { setActiveView, setMyScheduleData } = useSchedule()

  useEffect(() => {
    getSchedule()
      .then(schedule => {
        if (schedule) {
          setMyScheduleData(schedule)
          setActiveView('mySchedule')
        } else {
          setActiveView('splitPicker')
        }
      })
      .catch(() => setActiveView('splitPicker'))
  }, [])

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <WelcomeBanner />
      <p className="text-gray-500 text-sm">Schedule view coming in Phase 5 & 6</p>
    </main>
  )
}
