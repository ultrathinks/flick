"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function prefersDark() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

function resolve(theme: Theme): ResolvedTheme {
  if (theme === "system") {
    return prefersDark() ? "dark" : "light";
  }
  return theme;
}

export function ThemeProvider({
  children,
  storageKey = "flick-theme",
  defaultTheme = "system",
}: {
  children: ReactNode;
  storageKey?: string;
  defaultTheme?: Theme;
}) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") {
      return defaultTheme;
    }
    const stored = localStorage.getItem(storageKey);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
    return defaultTheme;
  });
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    typeof window === "undefined" ? "light" : resolve(theme),
  );

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored === "light" || stored === "dark" || stored === "system") {
      setThemeState(stored);
    }
  }, [storageKey]);

  useEffect(() => {
    const apply = () => {
      const next = resolve(theme);
      setResolvedTheme(next);
      document.documentElement.classList.toggle("dark", next === "dark");
    };
    apply();
    if (theme !== "system") {
      return;
    }
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      setTheme: (next: Theme) => {
        localStorage.setItem(storageKey, next);
        setThemeState(next);
      },
    }),
    [theme, resolvedTheme, storageKey],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}

export function themeInitScript(storageKey = "flick-theme") {
  return `(function(){try{var t=localStorage.getItem('${storageKey}')||'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;
}
