import React from "react";

interface BadgeProps {
  label: string;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  size?: "sm" | "md";
  className?: string;
}

const variantClasses = {
  default: "bg-surface-light text-text-secondary",
  success: "bg-accent-teal/20 text-accent-teal",
  warning: "bg-accent-amber/20 text-accent-amber",
  danger: "bg-accent-coral/20 text-accent-coral",
  info: "bg-primary/20 text-primary-light",
};

export function Badge({ label, variant = "default", size = "sm", className = "" }: BadgeProps) {
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";

  return (
    <span
      className={`inline-flex items-center rounded-pill font-medium ${variantClasses[variant]} ${sizeClasses} ${className}`}
    >
      {label}
    </span>
  );
}
