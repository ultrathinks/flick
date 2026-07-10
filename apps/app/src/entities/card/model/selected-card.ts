import { useSyncExternalStore } from "react";

const CARD_THEME_KEY = "flick:app:card-theme";

const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function readSelectedCardThemeId(): string | null {
  try {
    return window.localStorage.getItem(CARD_THEME_KEY);
  } catch {
    return null;
  }
}

export function setSelectedCardThemeId(id: string): void {
  try {
    window.localStorage.setItem(CARD_THEME_KEY, id);
  } catch {
    return;
  }
  emit();
}

export function useSelectedCardThemeId(): string | null {
  return useSyncExternalStore(subscribe, readSelectedCardThemeId, () => null);
}
