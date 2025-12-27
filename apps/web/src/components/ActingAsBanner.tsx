import { useActingAs } from '@/contexts/ActingAsContext'
import { useNavigate } from 'react-router-dom'

export default function ActingAsBanner() {
  const { actingAsKidId, actingAsKidName, clearActingAs } = useActingAs()
  const navigate = useNavigate()

  if (!actingAsKidId) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-emerald-500/20 border-b border-emerald-500/40 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎭</span>
          <div>
            <div className="text-emerald-300 font-semibold text-sm">
              Acting as {actingAsKidName}
            </div>
            <div className="text-emerald-400/80 text-xs">
              Actions will be auto-approved
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            clearActingAs()
            navigate('/kids')
          }}
          className="bg-zinc-800/60 hover:bg-zinc-700/60 text-zinc-200 text-sm px-4 py-2 rounded-lg transition"
        >
          ← Back to Parent View
        </button>
      </div>
    </div>
  )
}

