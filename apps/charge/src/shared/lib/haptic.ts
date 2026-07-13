import {
  Actions,
  type HapticStyle,
  useBridgeProvider,
} from "@b1nd/aid-kit/bridge-kit/web";
import { useCallback } from "react";

export function useHaptic(): (style: HapticStyle) => void {
  const { send } = useBridgeProvider();
  return useCallback(
    (style: HapticStyle) => {
      send(Actions.HAPTIC, { style });
    },
    [send],
  );
}
