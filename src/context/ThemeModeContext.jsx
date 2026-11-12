import {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import {Theme} from '@astryxdesign/core/theme';

import {themes, defaultThemeSlug} from '../astryx-themes.js';

const STORAGE_KEY = 'epocketshop_admin.mode.v1';
const MODES = ['light', 'dark', 'system'];

const ThemeModeContext = createContext(null);

function readMode() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return MODES.includes(saved) ? saved : 'light';
  } catch {
    return 'light';
  }
}

/** Owns the colour mode (light by default, remembered per browser) and applies it to Astryx. */
export function ThemeModeProvider({children}) {
  const [mode, setModeState] = useState(readMode);

  const setMode = useCallback((next) => {
    if (!MODES.includes(next)) return;
    setModeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* private mode: keep the choice for this session only */
    }
  }, []);

  // Keep the page background and browser UI (scrollbars, mobile address bar) in step.
  useEffect(() => {
    document.documentElement.style.colorScheme = mode === 'system' ? 'light dark' : mode;
  }, [mode]);

  const value = useMemo(() => ({mode, setMode}), [mode, setMode]);

  return (
    <ThemeModeContext.Provider value={value}>
      <Theme theme={themes[defaultThemeSlug]} mode={mode}>
        {children}
      </Theme>
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode() {
  const ctx = useContext(ThemeModeContext);
  if (!ctx) throw new Error('useThemeMode must be used inside <ThemeModeProvider>');
  return ctx;
}
