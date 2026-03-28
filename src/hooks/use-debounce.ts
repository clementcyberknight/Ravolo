import { useCallback, useRef } from "react";

/**
 * Returns a memoized function that will only execute if it hasn't been called
 * within the last `delay` milliseconds.
 *
 * @param callback The function to debounce/throttle
 * @param delay The delay in milliseconds (default 500ms)
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500,
): (...args: Parameters<T>) => void {
  const isCoolingDown = useRef(false);

  return useCallback(
    (...args: Parameters<T>) => {
      if (isCoolingDown.current) {
        return;
      }

      isCoolingDown.current = true;
      callback(...args);

      setTimeout(() => {
        isCoolingDown.current = false;
      }, delay);
    },
    [callback, delay],
  );
}
