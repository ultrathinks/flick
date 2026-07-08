import { useState } from "react";

export function useLocalState<T>(load: () => T, save: (value: T) => void) {
  const [value, setValue] = useState<T>(load);

  function update(nextValue: T | ((current: T) => T)) {
    setValue((current) => {
      const resolved =
        typeof nextValue === "function"
          ? (nextValue as (current: T) => T)(current)
          : nextValue;
      save(resolved);
      return resolved;
    });
  }

  return [value, update] as const;
}
