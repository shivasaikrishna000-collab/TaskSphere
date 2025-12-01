// simple theme helper using localStorage and documentElement class
const THEME_KEY = 'tm_theme';
const THEMES = { LIGHT: 'light', DARK: 'dark' };

export { THEMES };

function applyTheme(theme) {
  if (theme === THEMES.DARK) {
    document.documentElement.classList.add('theme-dark');
    document.documentElement.classList.remove('theme-light');
  } else {
    document.documentElement.classList.add('theme-light');
    document.documentElement.classList.remove('theme-dark');
  }
}

export function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) || THEMES.LIGHT;
  applyTheme(saved);
  // notify listeners
  try { window.dispatchEvent(new CustomEvent('themechange', { detail: saved })); } catch (e) {}
}

export function getTheme() {
  return localStorage.getItem(THEME_KEY) || THEMES.LIGHT;
}

export function setTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
  applyTheme(theme);
  try { window.dispatchEvent(new CustomEvent('themechange', { detail: theme })); } catch (e) {}
}

export function toggleTheme() {
  const next = getTheme() === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
  setTheme(next);
  return next;
}

export default { initTheme, getTheme, setTheme, toggleTheme, THEMES };
