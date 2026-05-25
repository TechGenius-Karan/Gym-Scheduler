import { useEffect, useState } from 'react'
import { useSchedule } from '../context/ScheduleContext'
import { getSchedule, saveSchedule } from '../api/scheduleApi'
import WelcomeBanner from '../components/WelcomeBanner'
import SplitPicker from '../components/SplitPicker'
import TemplateView from '../components/TemplateView'
import WeeklyView from '../components/WeeklyView'
import ScheduleActionBar from '../components/ScheduleActionBar'

export default function SchedulePage() {
  const { activeView, setActiveView, setMyScheduleData, myScheduleData } = useSchedule()
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

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

  async function handleSave() {
    if (!myScheduleData?.days) return
    setSaving(true)
    setSaveError(null)
    setSaveSuccess(false)
    try {
      const saved = await saveSchedule(myScheduleData.days)
      setMyScheduleData(saved)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch {
      setSaveError('Failed to save. Your changes are still here — try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <WelcomeBanner />

      {saveSuccess && (
        <div className="mb-4 px-4 py-2.5 bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-lg">
          Schedule saved successfully.
        </div>
      )}

      {activeView === 'splitPicker' && <SplitPicker />}
      {activeView === 'template' && <TemplateView />}
      {activeView === 'mySchedule' && <WeeklyView />}

      <ScheduleActionBar onSave={handleSave} saving={saving} saveError={saveError} />
    </main>
  )
}
