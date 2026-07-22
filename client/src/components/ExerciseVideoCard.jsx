import exerciseVideos from '../data/exercise-videos.json'

const YouTubeIcon = () => (
  <svg className="w-3.5 h-3.5 text-red-500 shrink-0" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1C4.5 20.5 12 20.5 12 20.5s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.75 15.5v-7l6.5 3.5-6.5 3.5z" />
  </svg>
)

export default function ExerciseVideoCard({ exerciseName }) {
  const videoId = exerciseVideos[exerciseName.toLowerCase()]

  if (!videoId) {
    return (
      <div className="mt-1 rounded-xl border border-gray-700 bg-gray-800/60 px-3 py-2.5
                      flex items-center justify-between gap-2 text-[11px]">
        <span className="text-gray-400">No tutorial saved for "{exerciseName}"</span>
        <a
          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(exerciseName + ' exercise form tutorial')}`}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 text-blue-400 hover:text-blue-300 underline underline-offset-2 transition"
        >
          Search YouTube
        </a>
      </div>
    )
  }

  return (
    <div className="mt-1 rounded-xl border border-gray-700 overflow-hidden">
      <div className="px-3 py-2 bg-gray-800 text-[11px] text-gray-400 font-medium flex items-center gap-1.5">
        <YouTubeIcon />
        {exerciseName} — Form Tutorial
      </div>
      <div className="aspect-video">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          title={`${exerciseName} form tutorial`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    </div>
  )
}
