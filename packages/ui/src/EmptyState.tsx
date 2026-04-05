import React from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  emoji?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  emoji = "📭",
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 ${className}`}>
      <span className="text-6xl mb-4">{emoji}</span>
      <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-sm text-text-secondary text-center max-w-sm mb-6">
        {description}
      </p>
      {action}
    </div>
  );
}
