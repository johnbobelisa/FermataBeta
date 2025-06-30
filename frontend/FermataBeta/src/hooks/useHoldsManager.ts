import { useState, useRef, useCallback } from 'react';
import type { Hold, HoldType, ClimberState } from '../types';

export function useHoldsManager() {
  const [holds, setHolds] = useState<Hold[]>([]);
  const [selectedHold, setSelectedHold] = useState<number | null>(null);
  const nextHoldId = useRef(0);
  const [startState, setStartState] = useState<ClimberState>({
    RH: null, LH: null, RF: null, LF: null,
  });
  const [finishHold, setFinishHold] = useState<number | null>(null);

  const addHold = useCallback((xNorm: number, yNorm: number) => {
    const newHold: Hold = {
      id: nextHoldId.current,
      xNorm,
      yNorm,
      type: 'climbing_hold',
    };
    setHolds(prev => [...prev, newHold]);
    setSelectedHold(newHold.id);
    nextHoldId.current++;
  }, []);

  const selectHold = useCallback((holdId: number | null) => {
    setSelectedHold(prev => (prev === holdId ? null : holdId));
  }, []);

  const assignHoldType = useCallback((type: HoldType) => {
    if (selectedHold === null) return;
    setHolds(prev => prev.map(h => (h.id === selectedHold ? { ...h, type } : h)));
    if (type === 'finish_hold') {
      setFinishHold(selectedHold);
    }
    setSelectedHold(null);
  }, [selectedHold]);

  const assignLimbToHold = useCallback((limb: keyof ClimberState) => {
    if (selectedHold === null) return;
    setStartState(prev => ({ ...prev, [limb]: selectedHold }));
    // A hold can be both a start hand and start foot
    setHolds(prev => prev.map(h => {
        if (h.id === selectedHold && h.type === 'climbing_hold') {
            const isHand = limb === 'RH' || limb === 'LH';
            return { ...h, type: isHand ? 'start_hand' : 'start_foot' };
        }
        return h;
    }));
    setSelectedHold(null);
  }, [selectedHold]);

  const removeSelectedHold = useCallback(() => {
    if (selectedHold === null) return;
    setHolds(prev => prev.filter(h => h.id !== selectedHold));
    setStartState(prev => {
      const updated = { ...prev };
      (Object.keys(updated) as Array<keyof ClimberState>).forEach((limb) => {
        if (updated[limb] === selectedHold) {
          updated[limb] = null;
        }
      });
      return updated;
    });
    if (finishHold === selectedHold) {
      setFinishHold(null);
    }
    setSelectedHold(null);
  }, [selectedHold, finishHold]);

  const resetState = useCallback(() => {
    setHolds([]);
    setSelectedHold(null);
    setStartState({ RH: null, LH: null, RF: null, LF: null });
    setFinishHold(null);
    nextHoldId.current = 0;
  }, []);

  return {
    holds,
    selectedHold,
    startState,
    finishHold,
    addHold,
    selectHold,
    assignHoldType,
    assignLimbToHold,
    removeSelectedHold,
    resetState,
  };
}