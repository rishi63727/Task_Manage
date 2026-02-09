import React, { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

const getStoredTheme = (): Theme => (localStorage.getItem('theme') as Theme) || 'light';

const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(getStoredTheme());

  useEffect(() => {
    document.body.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <button className="btn btn-ghost" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      {theme === 'light' ? 'Dark mode' : 'Light mode'}
    </button>
  );
};

export default ThemeToggle;
