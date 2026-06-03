import { createContext, useContext, useState, useMemo } from 'react'
import { getTemplate } from '../api/templateApi'
import {
  activateProgram, saveProgram, createProgram,
  getProgram, renameProgram, deleteProgram,
} from '../api/programApi'

const BLANK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const ScheduleContext = createContext(null)

export function ScheduleProvider({ children }) {
  const [activeView, setActiveView] = useState('splitPicker')
  const [templateData, setTemplateData] = useState(null)
  const [myScheduleData, setMyScheduleData] = useState(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState(null)
  const [loadingTemplate, setLoadingTemplate] = useState(false)

  // ── programs state ────────────────────────────────────────────────
  const [programs, setPrograms] = useState([])
  const [activeProgramId, setActiveProgramId] = useState(null)
  const [savedScheduleData, setSavedScheduleData] = useState(null)

  const hasUnsavedChanges = useMemo(() => {
    if (!myScheduleData?.days || !savedScheduleData?.days) return false
    return JSON.stringify(myScheduleData.days) !== JSON.stringify(savedScheduleData.days)
  }, [myScheduleData, savedScheduleData])

  // ── template actions ──────────────────────────────────────────────

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

  // ── schedule mutation helpers ─────────────────────────────────────

  function updateDay(dayName, updates) {
    setMyScheduleData(prev => ({
      ...prev,
      days: prev.days.map(d => d.day === dayName ? { ...d, ...updates } : d),
    }))
  }

  function addExercise(dayName) {
    setMyScheduleData(prev => ({
      ...prev,
      days: prev.days.map(d =>
        d.day === dayName
          ? { ...d, exercises: [...d.exercises, { id: crypto.randomUUID(), name: '', sets: 3, reps: 10 }] }
          : d
      ),
    }))
  }

  function removeExercise(dayName, exerciseId) {
    setMyScheduleData(prev => ({
      ...prev,
      days: prev.days.map(d =>
        d.day === dayName
          ? { ...d, exercises: d.exercises.filter(ex => ex.id !== exerciseId) }
          : d
      ),
    }))
  }

  function updateExercise(dayName, exerciseId, updates) {
    setMyScheduleData(prev => ({
      ...prev,
      days: prev.days.map(d =>
        d.day === dayName
          ? { ...d, exercises: d.exercises.map(ex => ex.id === exerciseId ? { ...ex, ...updates } : ex) }
          : d
      ),
    }))
  }

  function reorderExercises(dayName, oldIndex, newIndex) {
    setMyScheduleData(prev => ({
      ...prev,
      days: prev.days.map(d => {
        if (d.day !== dayName) return d
        const exercises = [...d.exercises]
        const [moved] = exercises.splice(oldIndex, 1)
        exercises.splice(newIndex, 0, moved)
        return { ...d, exercises }
      }),
    }))
  }

  // ── program actions ───────────────────────────────────────────────

  async function saveActiveProgram() {
    if (!myScheduleData?.days) return
    if (activeProgramId) {
      const saved = await saveProgram(activeProgramId, myScheduleData.days)
      setMyScheduleData(saved)
      setSavedScheduleData(saved)
      setPrograms(prev => prev.map(p =>
        p._id === activeProgramId ? { ...p, updatedAt: saved.updatedAt } : p
      ))
      return saved
    } else {
      // First-ever save — no program exists yet, create with default name
      const created = await createProgram('My Schedule', myScheduleData.days)
      setActiveProgramId(created._id)
      setMyScheduleData(created)
      setSavedScheduleData(created)
      setPrograms([{
        _id: created._id,
        name: created.name,
        isActive: true,
        updatedAt: created.updatedAt,
        createdAt: created.createdAt,
      }])
      return created
    }
  }

  async function switchProgram(id) {
    const program = await activateProgram(id)
    setActiveProgramId(program._id)
    setMyScheduleData(program)
    setSavedScheduleData(program)
    setActiveView('mySchedule')
    setPrograms(prev => prev.map(p => ({ ...p, isActive: p._id === program._id })))
  }

  async function createNewProgram(name, days) {
    const program = await createProgram(name, days)
    setActiveProgramId(program._id)
    setMyScheduleData(program)
    setSavedScheduleData(program)
    setActiveView('mySchedule')
    setPrograms(prev => [
      ...prev.map(p => ({ ...p, isActive: false })),
      { _id: program._id, name: program.name, isActive: true, updatedAt: program.updatedAt, createdAt: program.createdAt },
    ])
    return program
  }

  async function renameProgramById(id, name) {
    const result = await renameProgram(id, name)
    setPrograms(prev => prev.map(p => p._id === id ? { ...p, name: result.name } : p))
  }

  async function deleteProgramById(id) {
    const wasActive = id === activeProgramId
    const result = await deleteProgram(id)
    const remaining = programs.filter(p => p._id !== id)

    if (result.newActiveId) {
      const next = await getProgram(result.newActiveId)
      setActiveProgramId(next._id)
      setMyScheduleData(next)
      setSavedScheduleData(next)
      setActiveView('mySchedule')
      setPrograms(remaining.map(p => ({ ...p, isActive: p._id === next._id })))
    } else if (wasActive) {
      setActiveProgramId(null)
      setMyScheduleData(null)
      setSavedScheduleData(null)
      setActiveView('splitPicker')
      setPrograms([])
    } else {
      setPrograms(remaining)
    }
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
      updateDay,
      addExercise,
      removeExercise,
      updateExercise,
      reorderExercises,
      // programs
      programs, setPrograms,
      activeProgramId, setActiveProgramId,
      savedScheduleData, setSavedScheduleData,
      hasUnsavedChanges,
      saveActiveProgram,
      switchProgram,
      createNewProgram,
      renameProgramById,
      deleteProgramById,
    }}>
      {children}
    </ScheduleContext.Provider>
  )
}

export function useSchedule() {
  return useContext(ScheduleContext)
}
