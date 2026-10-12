import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Theme mode: 'light' | 'dark'
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem('hrms_theme') || 'light';
  });

  const [themeFamily, setThemeFamily] = useState(() => {
    return localStorage.getItem('hrms_theme_family') || 'corporate';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    if (themeMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    localStorage.setItem('hrms_theme', themeMode);
    localStorage.setItem('hrms_theme_family', themeFamily);
  }, [themeMode, themeFamily]);

  const toggleTheme = () => {
    setThemeMode(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ 
      theme: themeMode, 
      toggleTheme, 
      themeMode, 
      setThemeMode, 
      themeFamily, 
      setThemeFamily 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
