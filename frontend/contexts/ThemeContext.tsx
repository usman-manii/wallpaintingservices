'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { THEME, ThemeMode, LOCAL_STORAGE_KEYS } from '@/lib/constants';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(THEME.SYSTEM);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem(LOCAL_STORAGE_KEYS.THEME) as ThemeMode | null;
    if (savedTheme && Object.values(THEME).includes(savedTheme as ThemeMode)) {
      setThemeState(savedTheme);
    }
  }, []);

  useEffect(() => {
    const updateTheme = () => {
      const root = document.documentElement;
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const shouldBeDark = theme === THEME.DARK || (theme === THEME.SYSTEM && systemDark);
      
      setIsDark(shouldBeDark);
      
      if (shouldBeDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    updateTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (theme === THEME.SYSTEM) {
        updateTheme();
      }
    };
    
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [theme]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem(LOCAL_STORAGE_KEYS.THEME, newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
