import React, { createContext, useContext, useState, useEffect } from 'react';

export type AppMode = 'agenda' | 'avancado' | null;

interface ModeContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  clearMode: () => void;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export function useAppMode() {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error('useAppMode must be used within ModeProvider');
  return ctx;
}

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<AppMode>(() => {
    const stored = localStorage.getItem('imag-app-mode');
    return (stored === 'agenda' || stored === 'avancado') ? stored : null;
  });

  const setMode = (m: AppMode) => {
    setModeState(m);
    if (m) localStorage.setItem('imag-app-mode', m);
  };

  const clearMode = () => {
    setModeState(null);
    localStorage.removeItem('imag-app-mode');
  };

  return (
    <ModeContext.Provider value={{ mode, setMode, clearMode }}>
      {children}
    </ModeContext.Provider>
  );
}
