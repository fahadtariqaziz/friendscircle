import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glass?: boolean;
  onClick?: () => void;
  padding?: "none" | "sm" | "md" | "lg";
}

export function Card({
  children,
  className = "",
  glass = true,
  onClick,
  padding = "md",
}: CardProps) {
  const paddingClasses = {
    none: "",
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
  };

  const baseClasses = `rounded-card ${paddingClasses[padding]} ${
    onClick ? "cursor-pointer active:scale-[0.98] transition-transform" : ""
  }`;

  const glassClasses = glass
    ? "bg-surface/80 backdrop-blur-glass border border-border/50 shadow-card"
    : "bg-surface border border-border";

  return (
    <div
      className={`${baseClasses} ${glassClasses} ${className}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
    >
      {children}
    </div>
  );
}
