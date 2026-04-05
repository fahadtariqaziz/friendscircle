import React from "react";

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  fullWidth = false,
  className = "",
  children,
}: ButtonProps) {
  const baseClasses =
    "font-semibold rounded-button transition-all duration-200 active:scale-95 flex items-center justify-center gap-2";

  const variantClasses = {
    primary: "bg-primary text-white hover:bg-primary-dark shadow-glow",
    secondary: "bg-surface-light text-text-primary hover:bg-surface",
    outline: "border border-primary text-primary hover:bg-primary/10",
    ghost: "text-text-secondary hover:text-text-primary hover:bg-surface-light",
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-5 py-2.5 text-base",
    lg: "px-7 py-3.5 text-lg",
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${
    fullWidth ? "w-full" : ""
  } ${disabled || loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${className}`;

  return (
    <button
      className={classes}
      onClick={onPress}
      disabled={disabled || loading}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children || title}
    </button>
  );
}
