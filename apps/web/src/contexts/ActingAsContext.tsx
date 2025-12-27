import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface ActingAsContextType {
  actingAsKidId: string | null
  actingAsKidName: string | null
  setActingAsKid: (kidId: string | null, kidName: string | null) => void
  clearActingAs: () => void
}

const ActingAsContext = createContext<ActingAsContextType | undefined>(undefined)

export function ActingAsProvider({ children }: { children: ReactNode }) {
  // Load from sessionStorage on mount
  const [actingAsKidId, setActingAsKidId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('actingAsKidId')
    }
    return null
  })
  const [actingAsKidName, setActingAsKidName] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('actingAsKidName')
    }
    return null
  })

  const setActingAsKid = (kidId: string | null, kidName: string | null) => {
    setActingAsKidId(kidId)
    setActingAsKidName(kidName)
    // Store in sessionStorage for persistence
    if (kidId) {
      sessionStorage.setItem('actingAsKidId', kidId)
      sessionStorage.setItem('actingAsKidName', kidName || '')
    } else {
      sessionStorage.removeItem('actingAsKidId')
      sessionStorage.removeItem('actingAsKidName')
    }
  }

  const clearActingAs = () => {
    setActingAsKid(null, null)
  }

  return (
    <ActingAsContext.Provider value={{ actingAsKidId, actingAsKidName, setActingAsKid, clearActingAs }}>
      {children}
    </ActingAsContext.Provider>
  )
}

export function useActingAs() {
  const context = useContext(ActingAsContext)
  if (!context) {
    throw new Error('useActingAs must be used within ActingAsProvider')
  }
  return context
}

