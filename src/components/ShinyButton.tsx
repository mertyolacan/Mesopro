import React from 'react';

export const ShinyButton = ({ 
  children, 
  onClick, 
  className = "", 
  variant = "primary",
  disabled = false,
  type = "button"
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  className?: string;
  variant?: "primary" | "outline";
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}) => {
  const baseStyles = "relative px-5 py-2.5 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 overflow-hidden group active:scale-95 disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    primary: "bg-brand-600 dark:bg-brand-500 text-white shadow-xl shadow-brand-600/20 dark:shadow-brand-500/10",
    outline: "bg-white dark:bg-surface-900 text-surface-900 dark:text-white border border-surface-200 dark:border-surface-800 shadow-lg"
  };

  return (
    <button 
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      <span className="relative z-10 flex items-center gap-2">
        {children}
      </span>
    </button>
  );
};
