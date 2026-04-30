import { useRef, useCallback, useEffect } from "react";

/**
 * Debounced auto-save hook.
 * - `saveFn` is called with the latest value after `delay` ms of inactivity.
 * - Call `saveNow()` to flush immediately (for crop move/delete).
 */
export default function useAutoSave(saveFn, delay = 500) {
  const timerRef = useRef(null);
  const latestFn = useRef(saveFn);
  latestFn.current = saveFn;

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const schedule = useCallback(
    (...args) => {
      cancel();
      timerRef.current = setTimeout(() => {
        latestFn.current(...args);
        timerRef.current = null;
      }, delay);
    },
    [delay, cancel]
  );

  const saveNow = useCallback(
    (...args) => {
      cancel();
      latestFn.current(...args);
    },
    [cancel]
  );

  useEffect(() => cancel, [cancel]);

  return { schedule, saveNow, cancel };
}
