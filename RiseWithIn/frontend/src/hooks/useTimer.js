import { useCallback, useEffect, useRef, useState } from 'react';

export function useTimer(initial = 1500) {
  const [seconds, setSeconds] = useState(initial);
  const [running, setRunning] = useState(false);
  const deadline = useRef(null);

  const changeRunning = useCallback((next) => {
    if (next) deadline.current = Date.now() + seconds * 1000;
    setRunning(next);
  }, [seconds]);

  useEffect(() => {
    if (!running) return undefined;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000));
      setSeconds(remaining);
      if (remaining === 0) setRunning(false);
    };
    const id = window.setInterval(tick, 250);
    tick();
    return () => window.clearInterval(id);
  }, [running]);

  const reset = useCallback((next = initial) => {
    setRunning(false);
    setSeconds(next);
  }, [initial]);

  return {
    seconds,
    running,
    setRunning: changeRunning,
    reset
  };
}
