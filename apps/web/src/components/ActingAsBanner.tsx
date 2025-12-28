import { useActingAs } from '@/contexts/ActingAsContext'
import { useNavigate } from 'react-router-dom'

export default function ActingAsBanner() {
  const { actingAsKidId, actingAsKidName, clearActingAs } = useActingAs()
  const navigate = useNavigate()

  if (!actingAsKidId) return null

  return (
    <div className="fixed top-[64px] left-0 right-0 z-40 bg-emerald-500/20 border-b border-emerald-500/40 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎭</span>
          <div>
            <div className="text-emerald-300 font-semibold text-xs md:text-sm">
              Acting as {actingAsKidName}
            </div>
            <div className="text-emerald-400/80 text-[10px] md:text-xs">
              Actions will be auto-approved
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            clearActingAs()
            navigate('/kids')
          }}
          className="bg-zinc-800/60 hover:bg-zinc-700/60 text-zinc-200 text-xs md:text-sm px-3 py-1.5 rounded-lg transition whitespace-nowrap"
        >
          ← Back
        </button>
      </div>
    </div>
  )
}

