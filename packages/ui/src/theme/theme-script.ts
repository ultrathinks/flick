export const DEFAULT_THEME_STORAGE_KEY = "flick:theme";

export function themeInitScript(storageKey = DEFAULT_THEME_STORAGE_KEY) {
  return `(function(){try{var t=localStorage.getItem('${storageKey}')||'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;
}
