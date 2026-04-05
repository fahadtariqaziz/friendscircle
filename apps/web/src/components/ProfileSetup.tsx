"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth";
import {
  getUniversities,
  getCampuses,
  updateProfile,
  getProfile,
} from "@friendscircle/supabase";
import { useToastStore } from "@/store/toast";
import { ChevronDown, Camera, Loader2 } from "lucide-react";

interface University {
  id: string;
  name: string;
  short_name: string;
}

interface Campus {
  id: string;
  name: string;
  university_id: string;
}

export function ProfileSetup() {
  const { user, setProfile } = useAuthStore();
  const { addToast } = useToastStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form state
  const [fullName, setFullName] = useState("");
  const [universities, setUniversities] = useState<University[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [selectedUni, setSelectedUni] = useState("");
  const [selectedCampus, setSelectedCampus] = useState("");
  const [year, setYear] = useState("");

  useEffect(() => {
    getUniversities().then(({ data }) => {
      if (data) setUniversities(data as University[]);
    });
  }, []);

  useEffect(() => {
    if (selectedUni) {
      getCampuses(selectedUni).then(({ data }) => {
        if (data) setCampuses(data as Campus[]);
        setSelectedCampus("");
      });
    }
  }, [selectedUni]);

  const handleSubmit = async () => {
    if (!user || !fullName.trim() || !selectedUni || !selectedCampus) return;

    setLoading(true);
    const { error } = await updateProfile(user.id, {
      full_name: fullName.trim(),
      university_id: selectedUni,
      campus_id: selectedCampus,
      year: year || null,
    });

    if (!error) {
      const { data: profile } = await getProfile(user.id);
      if (profile) setProfile(profile as any);
      addToast("Welcome to FriendsCircle!", "success");
    } else {
      addToast("Failed to save profile. Try again.", "error");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-dark p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full gradient-primary mx-auto mb-3 flex items-center justify-center">
            <span className="text-3xl">👥</span>
          </div>
          <h1 className="text-2xl font-bold text-gradient mb-1">
            Set Up Your Profile
          </h1>
          <p className="text-text-secondary text-sm">
            Tell us about yourself to get started
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                s <= step ? "bg-primary" : "bg-surface-light"
              }`}
            />
          ))}
        </div>

        <div className="glass rounded-card p-6">
          {step === 1 ? (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-text-primary mb-1">
                What's your name?
              </h2>

              {/* Avatar placeholder */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-surface-light flex items-center justify-center text-3xl font-bold text-primary">
                    {fullName ? fullName[0].toUpperCase() : "?"}
                  </div>
                </div>
              </div>

              <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoFocus
                className="w-full bg-surface-light border border-border rounded-button px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />

              <button
                onClick={() => setStep(2)}
                disabled={!fullName.trim()}
                className="w-full gradient-primary text-white font-semibold py-3 rounded-button shadow-glow hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-text-primary mb-1">
                Your University
              </h2>

              {/* University Select */}
              <div className="relative">
                <select
                  value={selectedUni}
                  onChange={(e) => setSelectedUni(e.target.value)}
                  className="w-full bg-surface-light border border-border rounded-button px-4 py-3 text-text-primary appearance-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                >
                  <option value="">Select University</option>
                  {universities.map((uni) => (
                    <option key={uni.id} value={uni.id}>
                      {uni.name} ({uni.short_name})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
              </div>

              {/* Campus Select */}
              {selectedUni && (
                <div className="relative">
                  <select
                    value={selectedCampus}
                    onChange={(e) => setSelectedCampus(e.target.value)}
                    className="w-full bg-surface-light border border-border rounded-button px-4 py-3 text-text-primary appearance-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  >
                    <option value="">Select Campus</option>
                    {campuses.map((campus) => (
                      <option key={campus.id} value={campus.id}>
                        {campus.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                </div>
              )}

              {/* Year */}
              <div className="relative">
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full bg-surface-light border border-border rounded-button px-4 py-3 text-text-primary appearance-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                >
                  <option value="">Year / Semester (optional)</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="5th Year">5th Year</option>
                  <option value="Masters">Masters</option>
                  <option value="PhD">PhD</option>
                  <option value="Alumni">Alumni</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 rounded-button border border-border text-text-secondary hover:bg-surface-light transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!selectedUni || !selectedCampus || loading}
                  className="flex-1 gradient-primary text-white font-semibold py-3 rounded-button shadow-glow hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Get Started"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
