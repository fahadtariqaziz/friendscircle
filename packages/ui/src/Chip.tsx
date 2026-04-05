import React from "react";

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  className?: string;
}

export function Chip({ label, selected = false, onPress, className = "" }: ChipProps) {
  return (
    <button
      className={`px-4 py-2 rounded-pill text-sm font-medium transition-all duration-200 ${
        selected
          ? "bg-primary text-white shadow-glow"
          : "bg-surface-light text-text-secondary hover:bg-surface hover:text-text-primary border border-border"
      } ${className}`}
      onClick={onPress}
    >
      {label}
    </button>
  );
}
