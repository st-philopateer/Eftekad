import React, { useEffect, useState } from 'react';

export default function ThemeToggle({ isFixed = false }) {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-bs-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <button 
      className={isFixed ? "auth-theme-toggle" : "theme-toggle-btn w-100 h-100 d-flex align-items-center justify-content-center border-0 bg-transparent"} 
      onClick={toggleTheme} 
      title={theme === 'dark' ? 'التبديل للوضع الفاتح' : 'التبديل للوضع الداكن'}
    >
      {theme === 'dark' ? (
        <i className="fas fa-sun"></i>
      ) : (
        <i className="fas fa-moon"></i>
      )}
    </button>
  );
}
