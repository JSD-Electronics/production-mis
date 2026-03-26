import { useEffect, useRef } from "react";
import { usePageVisibility } from "./usePageVisibility";

type IntervalOptions = {
  runImmediately?: boolean;
  pauseWhenHidden?: boolean;
};

export const useManagedInterval = (
  callback: () => void | Promise<void>,
  delayMs: number,
  enabled = true,
  options: IntervalOptions = {},
) => {
  const { runImmediately = false, pauseWhenHidden = true } = options;
  const savedCallback = useRef(callback);
  const isVisible = usePageVisibility();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;
    if (pauseWhenHidden && !isVisible) return;
    if (!Number.isFinite(delayMs) || delayMs <= 0) return;

    if (runImmediately) {
      void savedCallback.current();
    }

    const id = setInterval(() => {
      void savedCallback.current();
    }, delayMs);

    return () => clearInterval(id);
  }, [delayMs, enabled, isVisible, pauseWhenHidden, runImmediately]);
};

