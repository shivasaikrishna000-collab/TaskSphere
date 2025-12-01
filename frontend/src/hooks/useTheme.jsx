import { useEffect, useState } from 'react';
import { getTheme } from '../utils/theme';

export default function useTheme() {
  const [theme, setTheme] = useState(() => getTheme());

  useEffect(() => {
    const handler = (e) => setTheme(e.detail || getTheme());
    window.addEventListener('themechange', handler);
    return () => window.removeEventListener('themechange', handler);
  }, []);

  return theme;
}
