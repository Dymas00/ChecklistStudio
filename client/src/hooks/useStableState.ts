import { useState, useRef, useCallback } from 'react';

export function useStableState<T>(initialValue: T) {
  const [state, setState] = useState<T>(initialValue);
  const stateRef = useRef(state);
  const updateCount = useRef(0);

  // Update ref whenever state changes
  stateRef.current = state;

  const stableSetState = useCallback((valueOrUpdater: T | ((prev: T) => T)) => {
    updateCount.current++;
    setState(prev => {
      const newValue = typeof valueOrUpdater === 'function' 
        ? (valueOrUpdater as (prev: T) => T)(prev)
        : valueOrUpdater;
      
      return newValue;
    });
  }, []);

  return [state, stableSetState, stateRef] as const;
}