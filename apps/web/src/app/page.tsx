"use client";

import { useAuthStore } from "@/store/auth";
import { useAppStore } from "@/store/app";
import { BottomNav } from "@/components/BottomNav";
import { HomeTab } from "@/components/tabs/HomeTab";
import { ExploreTab } from "@/components/tabs/ExploreTab";
import { CreatePostSheet } from "@/components/CreatePostSheet";
import { ThreadsTab } from "@/components/tabs/ThreadsTab";
import { ProfileTab } from "@/components/tabs/ProfileTab";
import { AuthScreen } from "@/components/AuthScreen";
import { ProfileSetup } from "@/components/ProfileSetup";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useEffect, useState } from "react";
import { onAuthStateChange, getSession, getProfile } from "@friendscircle/supabase";

export default function Home() {
  const { user, profile, setUser, setProfile, setLoading, isLoading } = useAuthStore();
  const { activeTab } = useAppStore();
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    // Check existing session
    getSession().then(async ({ data }) => {
      if (data.session?.user) {
        const u = data.session.user;
        setUser({ id: u.id, email: u.email || "" });
        const { data: profileData } = await getProfile(u.id);
        if (profileData) setProfile(profileData as any);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = onAuthStateChange((event, session: any) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email || "" });
        getProfile(session.user.id).then(({ data: profile }) => {
          if (profile) setProfile(profile as any);
        });
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, setProfile, setLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full gradient-primary animate-pulse" />
          <h1 className="text-2xl font-bold text-gradient">FriendsCircle</h1>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  // Show profile setup if user hasn't completed their profile
  const needsSetup = !profile?.full_name || !profile?.university_id;
  if (needsSetup) {
    return <ProfileSetup />;
  }

  return (
    <div className="min-h-screen bg-surface-dark flex flex-col max-w-lg mx-auto relative">
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <ErrorBoundary>
          {activeTab === "home" && <HomeTab />}
          {activeTab === "explore" && <ExploreTab />}
          {activeTab === "threads" && <ThreadsTab />}
          {activeTab === "profile" && <ProfileTab />}
        </ErrorBoundary>
      </main>

      {/* Create Post Sheet */}
      {showCreate && <CreatePostSheet onClose={() => setShowCreate(false)} />}

      {/* Bottom Navigation */}
      <BottomNav onCreatePress={() => setShowCreate(true)} />
    </div>
  );
}
