import { createContext, useContext, useState } from 'react'
import { getTemplate } from '../api/templateApi'

const BLANK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const ScheduleContext = createContext(null)

export function ScheduleProvider({ children }) {
  const [activeView, setActiveView] = useState('splitPicker')
  const [templateData, setTemplateData] = useState(null)
  const [myScheduleData, setMyScheduleData] = useState(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState(null)
  const [loadingTemplate, setLoadingTemplate] = useState(false)

  async function selectTemplate(id) {
    setLoadingTemplate(true)
    try {
      const template = await getTemplate(id)
      setTemplateData(template)
      setSelectedTemplateId(id)
      setActiveView('template')
    } finally {
      setLoadingTemplate(false)
    }
  }

  function copyToMySchedule() {
    if (!templateData) return
    const days = templateData.days.map(d => ({
      day: d.day,
      isRest: d.isRest,
      splitName: d.splitName,
      exercises: d.exercises.map(ex => ({
        id: crypto.randomUUID(),
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
      })),
    }))
    setMyScheduleData({ days })
    setActiveView('mySchedule')
  }

  function startFresh() {
    setMyScheduleData({
      days: BLANK_DAYS.map(day => ({ day, isRest: false, splitName: '', exercises: [] })),
    })
    setActiveView('mySchedule')
  }

  return (
    <ScheduleContext.Provider value={{
      activeView, setActiveView,
      templateData, setTemplateData,
      myScheduleData, setMyScheduleData,
      selectedTemplateId,
      loadingTemplate,
      selectTemplate,
      copyToMySchedule,
      startFresh,
    }}>
      {children}
    </ScheduleContext.Provider>
  )
}

export function useSchedule() {
  return useContext(ScheduleContext)
}
