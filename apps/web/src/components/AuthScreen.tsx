"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUpSchema, signInSchema } from "@friendscircle/shared";
import type { SignUpInput, SignInInput } from "@friendscircle/shared";
import { signUp, signIn, signInWithGoogle } from "@friendscircle/supabase";
import { useToastStore } from "@/store/toast";

export function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToastStore();

  const signUpForm = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
  });

  const signInForm = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
  });

  const handleSignUp = async (data: SignUpInput) => {
    setError(null);
    setLoading(true);
    const { error } = await signUp(data.email, data.password);
    if (error) setError(error.message);
    setLoading(false);
  };

  const handleSignIn = async (data: SignInInput) => {
    setError(null);
    setLoading(true);
    const { error } = await signIn(data.email, data.password);
    if (error) setError(error.message);
    setLoading(false);
  };

  const handleGoogle = async () => {
    setError(null);
    const { error } = await signInWithGoogle();
    if (error) {
      setError(error.message);
      addToast(error.message, "error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-dark p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full gradient-primary mx-auto mb-4 flex items-center justify-center">
            <span className="text-4xl">👥</span>
          </div>
          <h1 className="text-3xl font-bold text-gradient mb-2">
            FriendsCircle
          </h1>
          <p className="text-text-secondary">
            Your Campus. Your Community. One App.
          </p>
        </div>

        {/* Auth Card */}
        <div className="glass rounded-card p-6">
          {/* Google Button */}
          <button
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-medium py-3 rounded-button hover:bg-gray-100 transition-colors mb-4"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-text-muted text-sm">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Email Form */}
          {isSignUp ? (
            <form
              onSubmit={signUpForm.handleSubmit(handleSignUp)}
              className="space-y-3"
            >
              <div>
                <input
                  {...signUpForm.register("email")}
                  type="email"
                  placeholder="Email"
                  className="w-full bg-surface-light border border-border rounded-button px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
                {signUpForm.formState.errors.email && (
                  <p className="text-accent-coral text-xs mt-1">
                    {signUpForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div>
                <input
                  {...signUpForm.register("password")}
                  type="password"
                  placeholder="Password (min 8 characters)"
                  className="w-full bg-surface-light border border-border rounded-button px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
                {signUpForm.formState.errors.password && (
                  <p className="text-accent-coral text-xs mt-1">
                    {signUpForm.formState.errors.password.message}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full gradient-primary text-white font-semibold py-3 rounded-button shadow-glow hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>
          ) : (
            <form
              onSubmit={signInForm.handleSubmit(handleSignIn)}
              className="space-y-3"
            >
              <div>
                <input
                  {...signInForm.register("email")}
                  type="email"
                  placeholder="Email"
                  className="w-full bg-surface-light border border-border rounded-button px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>
              <div>
                <input
                  {...signInForm.register("password")}
                  type="password"
                  placeholder="Password"
                  className="w-full bg-surface-light border border-border rounded-button px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full gradient-primary text-white font-semibold py-3 rounded-button shadow-glow hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          )}

          {error && (
            <p className="text-accent-coral text-sm text-center mt-3">
              {error}
            </p>
          )}

          <p className="text-text-secondary text-sm text-center mt-4">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="text-primary font-medium hover:underline"
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
