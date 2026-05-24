import { createContext, useContext, useState } from 'react'

const ScheduleContext = createContext(null)

export function ScheduleProvider({ children }) {
  const [activeView, setActiveView] = useState('splitPicker')
  const [templateData, setTemplateData] = useState(null)
  const [myScheduleData, setMyScheduleData] = useState(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState(null)

  return (
    <ScheduleContext.Provider value={{
      activeView, setActiveView,
      templateData, setTemplateData,
      myScheduleData, setMyScheduleData,
      selectedTemplateId, setSelectedTemplateId,
    }}>
      {children}
    </ScheduleContext.Provider>
  )
}

export function useSchedule() {
  return useContext(ScheduleContext)
}
