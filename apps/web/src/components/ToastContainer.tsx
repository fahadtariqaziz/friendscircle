"use client";

import { useToastStore } from "@/store/toast";
import { CheckCircle, XCircle, Info, X } from "lucide-react";

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
};

const COLORS = {
  success: "bg-accent-teal/20 border-accent-teal/40 text-accent-teal",
  error: "bg-accent-coral/20 border-accent-coral/40 text-accent-coral",
  info: "bg-primary/20 border-primary/40 text-primary-light",
};

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-sm px-4">
      {toasts.map((toast) => {
        const Icon = ICONS[toast.type];
        return (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-lg shadow-lg animate-slide-down ${COLORS[toast.type]}`}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium flex-1 text-text-primary">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-0.5 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-3.5 h-3.5 text-text-muted" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
