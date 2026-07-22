"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        const res = await authClient.signUp.email({
          email,
          password,
          name,
        });
        if (res?.error) {
          setError(res.error.message || "Sign up failed");
        } else {
          router.push("/dashboard");
        }
      } else {
        const res = await authClient.signIn.email({
          email,
          password,
        });
        if (res?.error) {
          setError(res.error.message || "Sign in failed");
        } else {
          router.push("/dashboard");
        }
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12 text-white">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 shadow-2xl backdrop-blur-md">
        <h2 className="text-center text-3xl font-extrabold tracking-tight bg-gradient-to-r from-teal-400 to-emerald-500 bg-clip-text text-transparent">
          {isSignUp ? "Create an account" : "Welcome back"}
        </h2>
        <p className="mt-2 text-center text-sm text-zinc-400">
          {isSignUp
            ? "Sign up to recruit and manage candidates"
            : "Sign in to manage your hiring applications"}
        </p>

        {error && (
          <div className="mt-4 rounded-lg bg-red-950/50 border border-red-800 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-200 placeholder-zinc-600 focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                placeholder="John Doe"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-200 placeholder-zinc-600 focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-200 placeholder-zinc-600 focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gradient-to-r from-teal-500 to-emerald-500 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Processing..." : isSignUp ? "Sign Up" : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-teal-400 hover:text-teal-300 focus:outline-hidden cursor-pointer"
          >
            {isSignUp
              ? "Already have an account? Sign In"
              : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}
