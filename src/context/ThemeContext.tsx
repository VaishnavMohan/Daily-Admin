import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../constants/Colors';

type ThemeMode = 'dark' | 'light';

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  colors: typeof Colors.dark;
}

const THEME_KEY = '@life_admin_theme';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeMode>('dark');

  useEffect(() => {
    // Enforce dark mode
    setTheme('dark');
    AsyncStorage.setItem(THEME_KEY, 'dark');
  }, []);

  const toggleTheme = () => {
    // Prevent switching to light mode
    setTheme('dark');
    AsyncStorage.setItem(THEME_KEY, 'dark');
  };

  const colors = Colors.dark;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};
