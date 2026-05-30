export default function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 gap-8">

      {/* Flexed arm / bicep illustration */}
      <div className="text-indigo-400/80">
        <svg viewBox="0 0 170 145" className="w-44 h-auto" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          {/* Forearm — vertical pill on the left going upward */}
          <rect x="30" y="10" width="40" height="90" rx="20" />
          {/* Bicep peak — dominant dome, overlapping forearm on the right */}
          <ellipse cx="100" cy="58" rx="44" ry="50" />
          {/* Upper arm — horizontal pill at the bottom */}
          <rect x="55" y="90" width="100" height="40" rx="20" />
          {/* Elbow joint — smooth circle connecting forearm to upper arm */}
          <circle cx="62" cy="108" r="24" />
        </svg>
      </div>

      {/* Title + spinner row */}
      <div className="flex flex-col items-center gap-5">
        <p className="text-white text-2xl font-bold tracking-wide">Loading...</p>

        {/* Circular spinner */}
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-4 border-gray-800" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin" />
        </div>
      </div>

      {/* Context subtext */}
      <p className="text-gray-600 text-sm">The server is warming up — just a moment.</p>

    </div>
  )
}
