import React from "react";

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-lg",
  xl: "w-20 h-20 text-2xl",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getColorFromName(name: string): string {
  const colors = [
    "bg-primary",
    "bg-accent-teal",
    "bg-accent-coral",
    "bg-accent-amber",
    "bg-accent-mint",
    "bg-primary-dark",
    "bg-primary-light",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({ src, name, size = "md", className = "" }: AvatarProps) {
  const sizeClasses = sizeMap[size];

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizeClasses} rounded-full object-cover border-2 border-border ${className}`}
      />
    );
  }

  const bgColor = getColorFromName(name);

  return (
    <div
      className={`${sizeClasses} ${bgColor} rounded-full flex items-center justify-center text-white font-semibold border-2 border-border ${className}`}
    >
      {getInitials(name)}
    </div>
  );
}
