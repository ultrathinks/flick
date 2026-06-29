"use client";

import { useEffect, useState } from "react";

export function useLocalState<T>(load: () => T, save: (value: T) => void) {
  const [value, setValue] = useState<T | null>(null);

  useEffect(() => {
    setValue(load());
  }, [load]);

  function update(nextValue: T | ((current: T) => T)) {
    setValue((current) => {
      const base = current ?? load();
      const resolved =
        typeof nextValue === "function"
          ? (nextValue as (current: T) => T)(base)
          : nextValue;
      save(resolved);
      return resolved;
    });
  }

  return [value, update] as const;
}
