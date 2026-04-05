"use client";

import { useAppStore } from "@/store/app";
import { Home, Compass, Plus, MessageCircle, User } from "lucide-react";

type Tab = "home" | "explore" | "create" | "threads" | "profile";

const tabs: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "explore", label: "Explore", icon: Compass },
  { id: "create", label: "Post", icon: Plus },
  { id: "threads", label: "Threads", icon: MessageCircle },
  { id: "profile", label: "Me", icon: User },
];

interface BottomNavProps {
  onCreatePress: () => void;
}

export function BottomNav({ onCreatePress }: BottomNavProps) {
  const { activeTab, setActiveTab } = useAppStore();

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto glass border-t border-border/30 z-50">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const isCreate = tab.id === "create";
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          if (isCreate) {
            return (
              <button
                key={tab.id}
                onClick={onCreatePress}
                className="flex items-center justify-center w-12 h-12 rounded-full gradient-primary shadow-glow -mt-6 transition-transform active:scale-90 hover:scale-105"
              >
                <Plus className="w-6 h-6 text-white" />
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              <Icon
                className="w-5 h-5"
                strokeWidth={isActive ? 2.5 : 1.5}
              />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
