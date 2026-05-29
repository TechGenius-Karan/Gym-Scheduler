import { useState } from 'react'

const inputClass = "bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition w-full"

export default function ToolsPage() {
  // 1RM state
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [label, setLabel] = useState('')

  // Macro estimator state
  const [sex, setSex] = useState('male')
  const [age, setAge] = useState('')
  const [heightUnit, setHeightUnit] = useState('cm')
  const [heightCm, setHeightCm] = useState('')
  const [heightFt, setHeightFt] = useState('')
  const [heightIn, setHeightIn] = useState('')
  const [macroWeight, setMacroWeight] = useState('')
  const [activity, setActivity] = useState('1.55')
  const [goal, setGoal] = useState('maintain')

  // 1RM calc
  const w = parseFloat(weight)
  const r = parseInt(reps, 10)
  const oneRM = w > 0 && r > 0 ? +(w * (1 + r / 30)).toFixed(1) : null

  // Macro calc
  const mAge = parseInt(age, 10)
  const mWeight = parseFloat(macroWeight)
  const mHeightCm = heightUnit === 'cm'
    ? parseFloat(heightCm)
    : (parseInt(heightFt || 0, 10) * 12 + parseInt(heightIn || 0, 10)) * 2.54
  const ageError = mAge > 0 && mAge < 14
  const validMacro = mAge >= 14 && mWeight > 0 && mHeightCm > 0
  const bmr = validMacro
    ? (sex === 'male'
        ? 10 * mWeight + 6.25 * mHeightCm - 5 * mAge + 5
        : 10 * mWeight + 6.25 * mHeightCm - 5 * mAge - 161)
    : null
  const tdee = bmr ? bmr * parseFloat(activity) : null
  const targetCalories = tdee
    ? Math.round(tdee + (goal === 'cut' ? -300 : goal === 'bulk' ? 300 : 0))
    : null
  const protein = mWeight > 0 ? Math.round(mWeight * 2) : null

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <h2 className="text-xl font-bold text-white mb-1">Tools</h2>
      <p className="text-gray-500 text-sm mb-8">Utilities to support your training.</p>

      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* 1RM Calculator */}
        <div className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col gap-5">
          <div>
            <h3 className="text-white font-semibold">1RM Calculator</h3>
            <p className="text-gray-500 text-xs mt-0.5">Estimates your one-rep max using the Epley formula.</p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">Exercise (optional)</label>
              <input
                type="text"
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder="e.g. Bench Press"
                className={inputClass}
              />
            </div>
            <div className="flex gap-3">
              <div className="flex flex-col gap-1 flex-1 min-w-0">
                <label className="text-xs text-gray-400">Weight (kg)</label>
                <input
                  type="number"
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                  placeholder="80"
                  min={0}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1 flex-1 min-w-0">
                <label className="text-xs text-gray-400">Reps</label>
                <input
                  type="number"
                  value={reps}
                  onChange={e => setReps(e.target.value)}
                  placeholder="8"
                  min={1}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <div className={`rounded-xl p-4 text-center transition-all ${oneRM ? 'bg-indigo-500/10 border border-indigo-500/30' : 'bg-gray-800 border border-gray-700'}`}>
            {oneRM ? (
              <>
                <p className="text-xs text-indigo-400 mb-1">{label ? `${label} — estimated 1RM` : 'Estimated 1RM'}</p>
                <p className="text-3xl font-bold text-white">{oneRM} <span className="text-lg font-normal text-gray-400">kg</span></p>
                <p className="text-xs text-gray-500 mt-2">Based on {weight} kg × {reps} reps</p>
              </>
            ) : (
              <p className="text-gray-600 text-sm">Enter weight and reps to see your estimated 1RM</p>
            )}
          </div>

          <p className="text-gray-600 text-xs text-center">Formula: weight × (1 + reps ÷ 30)</p>
        </div>

        {/* Calorie & Protein Estimator */}
        <div className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col gap-5">
          <div>
            <h3 className="text-white font-semibold">Calorie & Protein Estimator</h3>
            <p className="text-gray-500 text-xs mt-0.5">Estimates daily targets using the Mifflin-St Jeor formula.</p>
          </div>

          <div className="flex flex-col gap-3">

            {/* Sex toggle */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">Sex</label>
              <div className="flex gap-2">
                {['male', 'female'].map(s => (
                  <button
                    key={s}
                    onClick={() => setSex(s)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition ${
                      sex === s ? 'bg-indigo-500 text-white' : 'bg-gray-800 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'
                    }`}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Age + Weight */}
            <div className="flex gap-3">
              <div className="flex flex-col gap-1 flex-1 min-w-0">
                <label className="text-xs text-gray-400">Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={e => setAge(e.target.value)}
                  placeholder="25"
                  min={14}
                  className={`${inputClass} ${ageError ? 'border-red-500/60 focus:border-red-500' : ''}`}
                />
                {ageError && (
                  <p className="text-xs text-red-400 mt-0.5">Minimum age is 14.</p>
                )}
              </div>
              <div className="flex flex-col gap-1 flex-1 min-w-0">
                <label className="text-xs text-gray-400">Weight (kg)</label>
                <input
                  type="number"
                  value={macroWeight}
                  onChange={e => setMacroWeight(e.target.value)}
                  placeholder="80"
                  min={0}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Height */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-400">Height</label>
                <div className="flex rounded-lg overflow-hidden border border-gray-700 text-xs">
                  {['cm', 'ft'].map(u => (
                    <button
                      key={u}
                      onClick={() => setHeightUnit(u)}
                      className={`px-2.5 py-1 transition ${
                        heightUnit === u ? 'bg-indigo-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>
              {heightUnit === 'cm' ? (
                <input
                  type="number"
                  value={heightCm}
                  onChange={e => setHeightCm(e.target.value)}
                  placeholder="175"
                  min={0}
                  className={inputClass}
                />
              ) : (
                <div className="flex gap-2">
                  <div className="flex-1 min-w-0 relative">
                    <input
                      type="number"
                      value={heightFt}
                      onChange={e => setHeightFt(e.target.value)}
                      placeholder="5"
                      min={0}
                      className={inputClass}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">ft</span>
                  </div>
                  <div className="flex-1 min-w-0 relative">
                    <input
                      type="number"
                      value={heightIn}
                      onChange={e => setHeightIn(e.target.value)}
                      placeholder="10"
                      min={0}
                      max={11}
                      className={inputClass}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">in</span>
                  </div>
                </div>
              )}
            </div>

            {/* Activity level */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">Activity level</label>
              <select
                value={activity}
                onChange={e => setActivity(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
              >
                <option value="1.2">Sedentary (little/no exercise)</option>
                <option value="1.375">Lightly active (1–3x / week)</option>
                <option value="1.55">Moderately active (3–5x / week)</option>
                <option value="1.725">Very active (6–7x / week)</option>
              </select>
            </div>

            {/* Goal */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">Goal</label>
              <div className="flex gap-2">
                {['cut', 'maintain', 'bulk'].map(g => (
                  <button
                    key={g}
                    onClick={() => setGoal(g)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition ${
                      goal === g ? 'bg-indigo-500 text-white' : 'bg-gray-800 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'
                    }`}
                  >
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Result */}
          <div className={`rounded-xl p-4 transition-all ${targetCalories ? 'bg-indigo-500/10 border border-indigo-500/30' : 'bg-gray-800 border border-gray-700'}`}>
            {targetCalories ? (
              <div className="flex items-center justify-around gap-4">
                <div className="text-center">
                  <p className="text-xs text-indigo-400 mb-1">Daily calories</p>
                  <p className="text-3xl font-bold text-white">{targetCalories.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">kcal</p>
                </div>
                <div className="w-px h-12 bg-indigo-500/20" />
                <div className="text-center">
                  <p className="text-xs text-indigo-400 mb-1">Protein</p>
                  <p className="text-3xl font-bold text-white">{protein}</p>
                  <p className="text-xs text-gray-500 mt-1">g / day</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-600 text-sm text-center">Fill in your details to see your targets</p>
            )}
          </div>

          <p className="text-gray-600 text-xs text-center">Estimates only — adjust based on real-world progress.</p>
        </div>

      </div>
    </main>
  )
}
