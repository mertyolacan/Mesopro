import React, { useState, useEffect } from 'react';

export const Countdown = ({ endDate }: { endDate: string }) => {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    if (!endDate) return;
    const end = new Date(endDate).getTime();
    if (isNaN(end)) return;
    
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft(null);
        clearInterval(timer);
      } else {
        setTimeLeft({
          d: Math.floor(diff / (1000 * 60 * 60 * 24)),
          h: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          m: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          s: Math.floor((diff % (1000 * 60)) / 1000),
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  if (!timeLeft) return null;

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className="flex gap-1.5 items-center bg-red-500/10 dark:bg-red-500/20 px-3 py-1.5 rounded-xl border border-red-500/20 backdrop-blur-sm">
      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shrink-0" />
      <div className="flex gap-1 font-black text-[10px] text-red-600 dark:text-red-400 tracking-tighter tabular-nums">
        {timeLeft.d > 0 && <span>{timeLeft.d}g</span>}
        <span>{pad(timeLeft.h)}:{pad(timeLeft.m)}:{pad(timeLeft.s)}</span>
      </div>
    </div>
  );
};

export const Badge = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <span className={`px-2 py-1 text-[8px] sm:text-[9px] font-black uppercase tracking-widest rounded-full leading-none flex items-center justify-center w-fit ${className}`}>
    {children}
  </span>
);
