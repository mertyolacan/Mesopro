import React, { useRef, useEffect } from 'react';

interface DualRangeSliderProps {
  min: number;
  max: number;
  low: number;
  high: number;
  onChange: (low: number, high: number) => void;
}

export function DualRangeSlider({ min, max, low, high, onChange }: DualRangeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const lowHandleRef = useRef<HTMLDivElement>(null);
  const highHandleRef = useRef<HTMLDivElement>(null);

  // Keep everything in refs to avoid stale closure issues
  const stateRef = useRef({ min, max, low, high, onChange });
  useEffect(() => {
    stateRef.current = { min, max, low, high, onChange };
  });

  // Attach drag logic once on mount
  useEffect(() => {
    const lowHandle = lowHandleRef.current;
    const highHandle = highHandleRef.current;
    const track = trackRef.current;
    if (!lowHandle || !highHandle || !track) return;

    let activeHandle: 'low' | 'high' | null = null;

    const getVal = (clientX: number) => {
      const { min, max } = stateRef.current;
      const rect = track.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return Math.round(min + pct * (max - min));
    };

    const onMove = (clientX: number) => {
      if (!activeHandle) return;
      const { min, max, low, high, onChange } = stateRef.current;
      const val = getVal(clientX);
      if (activeHandle === 'low') {
        const next = Math.max(min, Math.min(val, high - 1));
        if (next !== low) onChange(next, high);
      } else {
        const next = Math.min(max, Math.max(val, low + 1));
        if (next !== high) onChange(low, next);
      }
    };

    const onMouseMove = (e: MouseEvent) => onMove(e.clientX);
    const onTouchMove = (e: TouchEvent) => { e.preventDefault(); onMove(e.touches[0].clientX); };

    const onUp = () => {
      activeHandle = null;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onUp);
    };

    const startDrag = (handle: 'low' | 'high') => (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      activeHandle = handle;
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onUp);
      document.addEventListener('touchmove', onTouchMove, { passive: false });
      document.addEventListener('touchend', onUp);
    };

    const onTrackDown = (e: MouseEvent) => {
      if (activeHandle !== null) return;
      const val = getVal(e.clientX);
      const { low, high, min, max, onChange } = stateRef.current;
      const distLow = Math.abs(val - low);
      const distHigh = Math.abs(val - high);
      if (distLow <= distHigh) {
        const next = Math.max(min, Math.min(val, high - 1));
        activeHandle = 'low';
        onChange(next, high);
      } else {
        const next = Math.min(max, Math.max(val, low + 1));
        activeHandle = 'high';
        onChange(low, next);
      }
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onUp);
    };

    const lowDrag = startDrag('low');
    const highDrag = startDrag('high');

    lowHandle.addEventListener('mousedown', lowDrag);
    lowHandle.addEventListener('touchstart', lowDrag, { passive: false });
    highHandle.addEventListener('mousedown', highDrag);
    highHandle.addEventListener('touchstart', highDrag, { passive: false });
    track.addEventListener('mousedown', onTrackDown);

    return () => {
      lowHandle.removeEventListener('mousedown', lowDrag);
      lowHandle.removeEventListener('touchstart', lowDrag);
      highHandle.removeEventListener('mousedown', highDrag);
      highHandle.removeEventListener('touchstart', highDrag);
      track.removeEventListener('mousedown', onTrackDown);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onUp);
    };
  }, []); // only once

  const range = max - min || 1;
  const lowPct = ((low - min) / range) * 100;
  const highPct = ((high - min) / range) * 100;

  return (
    <div className="select-none py-2">
      {/* Value Labels */}
      <div className="flex justify-between mb-4 text-xs font-black tabular-nums text-surface-500 dark:text-surface-400">
        <span>₺{low.toLocaleString()}</span>
        <span>₺{high.toLocaleString()}</span>
      </div>

      {/* Track */}
      <div
        ref={trackRef}
        className="relative h-6 flex items-center cursor-pointer"
      >
        {/* Base rail */}
        <div className="absolute inset-x-0 h-[3px] bg-surface-100 dark:bg-surface-800 rounded-full pointer-events-none" />

        {/* Active range fill */}
        <div
          className="absolute h-[3px] bg-brand-500 rounded-full pointer-events-none"
          style={{ left: `${lowPct}%`, right: `${100 - highPct}%` }}
        />

        {/* Low handle */}
        <div
          ref={lowHandleRef}
          className="absolute w-5 h-5 -translate-x-1/2 rounded-full bg-white border-2 border-brand-500 shadow-md cursor-grab hover:scale-110 transition-transform"
          style={{ left: `${lowPct}%`, zIndex: 10 }}
        />

        {/* High handle */}
        <div
          ref={highHandleRef}
          className="absolute w-5 h-5 -translate-x-1/2 rounded-full bg-white border-2 border-brand-500 shadow-md cursor-grab hover:scale-110 transition-transform"
          style={{ left: `${highPct}%`, zIndex: 10 }}
        />
      </div>
    </div>
  );
}
