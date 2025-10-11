import { createContext, useContext, useEffect, useState } from 'react';

type Mode = 'light' | 'dark' | 'system';
const Ctx = createContext<{mode:Mode,setMode:(m:Mode)=>void}>({mode:'system',setMode:()=>{}});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>(() => (localStorage.getItem('cc_theme') as Mode) || 'system');

  useEffect(() => {
    const root = document.documentElement;
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = mode === 'dark' || (mode === 'system' && prefersDark);
    root.classList.toggle('dark', dark);
    localStorage.setItem('cc_theme', mode);
  }, [mode]);

  return <Ctx.Provider value={{mode,setMode}}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);

