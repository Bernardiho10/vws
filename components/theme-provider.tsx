"use client"

import React, { createContext, useContext, useEffect, useState } from "react";

interface ThemeProviderProps {
  children: React.ReactNode;
}

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface ThemeContextType {
  theme: 'system' | 'custom';
  setTheme: (theme: 'system' | 'custom') => void;
  customColor: RGB;
  setCustomColor: (color: RGB) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<'system' | 'custom'>('system');
  const [customColor, setCustomColor] = useState<RGB>({ r: 0, g: 0, b: 0 });

  // Handle initial mount and load saved preferences
  useEffect(() => {
    setMounted(true);
    
    try {
      const savedTheme = localStorage.getItem('theme-mode');
      const savedColor = localStorage.getItem('theme-color');
      
      if (savedTheme === 'system' || savedTheme === 'custom') {
        setTheme(savedTheme);
      }
      
      if (savedColor) {
        const color = JSON.parse(savedColor);
        if (color && typeof color === 'object' && 'r' in color && 'g' in color && 'b' in color) {
          setCustomColor(color);
        }
      }
    } catch (error) {
      console.error('Error loading theme preferences:', error);
    }
  }, []);

  // Apply theme changes
  useEffect(() => {
    if (!mounted) return;

    try {
      const root = document.documentElement;
      
      if (theme === 'system') {
        root.style.removeProperty('--theme-primary');
        root.classList.remove('custom-theme');
        root.classList.add('system-theme');
      } else {
        const { r, g, b } = customColor;
        root.style.setProperty('--theme-primary', `${r}, ${g}, ${b}`);
        root.classList.remove('system-theme');
        root.classList.add('custom-theme');
      }

      // Save preferences
      localStorage.setItem('theme-mode', theme);
      localStorage.setItem('theme-color', JSON.stringify(customColor));
    } catch (error) {
      console.error('Error applying theme:', error);
    }
  }, [theme, customColor, mounted]);

  const value = {
    theme,
    setTheme,
    customColor,
    setCustomColor
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

