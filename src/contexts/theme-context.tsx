'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type AccentColor = 'teal' | 'purple' | 'blue' | 'green' | 'orange' | 'pink';

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  accentColor: AccentColor;
  setAccentColor: (color: AccentColor) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'voxnava_theme_mode';
const ACCENT_STORAGE_KEY = 'voxnava_accent_color';

// CSS variables for each accent color
const accentColors: Record<AccentColor, { light: Record<string, string>; dark: Record<string, string> }> = {
  teal: {
    light: {
      '--primary': '174 60% 51%',
      '--primary-foreground': '0 0% 100%',
      '--accent': '174 60% 95%',
      '--accent-foreground': '174 60% 30%',
    },
    dark: {
      '--primary': '174 60% 45%',
      '--primary-foreground': '0 0% 100%',
      '--accent': '174 40% 20%',
      '--accent-foreground': '174 60% 80%',
    },
  },
  purple: {
    light: {
      '--primary': '270 60% 55%',
      '--primary-foreground': '0 0% 100%',
      '--accent': '270 60% 95%',
      '--accent-foreground': '270 60% 30%',
    },
    dark: {
      '--primary': '270 60% 50%',
      '--primary-foreground': '0 0% 100%',
      '--accent': '270 40% 20%',
      '--accent-foreground': '270 60% 80%',
    },
  },
  blue: {
    light: {
      '--primary': '217 91% 60%',
      '--primary-foreground': '0 0% 100%',
      '--accent': '217 91% 95%',
      '--accent-foreground': '217 91% 30%',
    },
    dark: {
      '--primary': '217 91% 55%',
      '--primary-foreground': '0 0% 100%',
      '--accent': '217 50% 20%',
      '--accent-foreground': '217 91% 80%',
    },
  },
  green: {
    light: {
      '--primary': '142 71% 45%',
      '--primary-foreground': '0 0% 100%',
      '--accent': '142 71% 95%',
      '--accent-foreground': '142 71% 25%',
    },
    dark: {
      '--primary': '142 71% 40%',
      '--primary-foreground': '0 0% 100%',
      '--accent': '142 40% 18%',
      '--accent-foreground': '142 71% 75%',
    },
  },
  orange: {
    light: {
      '--primary': '25 95% 53%',
      '--primary-foreground': '0 0% 100%',
      '--accent': '25 95% 95%',
      '--accent-foreground': '25 95% 30%',
    },
    dark: {
      '--primary': '25 95% 48%',
      '--primary-foreground': '0 0% 100%',
      '--accent': '25 50% 20%',
      '--accent-foreground': '25 95% 75%',
    },
  },
  pink: {
    light: {
      '--primary': '330 80% 60%',
      '--primary-foreground': '0 0% 100%',
      '--accent': '330 80% 95%',
      '--accent-foreground': '330 80% 30%',
    },
    dark: {
      '--primary': '330 80% 55%',
      '--primary-foreground': '0 0% 100%',
      '--accent': '330 50% 20%',
      '--accent-foreground': '330 80% 80%',
    },
  },
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [accentColor, setAccentColorState] = useState<AccentColor>('teal');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  
  // Load saved preferences
  useEffect(() => {
    const savedMode = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
    const savedAccent = localStorage.getItem(ACCENT_STORAGE_KEY) as AccentColor | null;
    
    if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
      setModeState(savedMode);
    }
    
    if (savedAccent && Object.keys(accentColors).includes(savedAccent)) {
      setAccentColorState(savedAccent);
    }
  }, []);
  
  // Resolve theme based on mode and system preference
  useEffect(() => {
    const updateResolvedTheme = () => {
      if (mode === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setResolvedTheme(isDark ? 'dark' : 'light');
      } else {
        setResolvedTheme(mode);
      }
    };
    
    updateResolvedTheme();
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', updateResolvedTheme);
    
    return () => mediaQuery.removeEventListener('change', updateResolvedTheme);
  }, [mode]);
  
  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove both classes first
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedTheme);
    
    // Apply accent color CSS variables
    const colorVars = accentColors[accentColor][resolvedTheme];
    Object.entries(colorVars).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
  }, [resolvedTheme, accentColor]);
  
  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem(THEME_STORAGE_KEY, newMode);
  }, []);
  
  const setAccentColor = useCallback((newColor: AccentColor) => {
    setAccentColorState(newColor);
    localStorage.setItem(ACCENT_STORAGE_KEY, newColor);
  }, []);
  
  return (
    <ThemeContext.Provider
      value={{
        mode,
        setMode,
        accentColor,
        setAccentColor,
        resolvedTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  
  // Return default values if used outside provider (during SSR or before mount)
  if (context === undefined) {
    return {
      mode: 'system' as ThemeMode,
      setMode: () => {},
      accentColor: 'teal' as AccentColor,
      setAccentColor: () => {},
      resolvedTheme: 'light' as const,
    };
  }
  
  return context;
}
