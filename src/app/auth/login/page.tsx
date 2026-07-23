"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await authClient.signIn.email({ email, password });
      if (res?.error) {
        setError(res.error.message || "Invalid email or password");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex font-sans"
      style={{ background: "#f9f9f9", color: "#101010" }}
    >
      <div
        className="hidden lg:flex lg:w-2/5 flex-col justify-start gap-10 p-10"
        style={{ background: "#101010" }}
      >
        <Link href="/" className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-black"
            style={{ background: "#fff", color: "#101010" }}
          >
            H
          </div>
          <span className="font-bold text-base" style={{ color: "#fff" }}>
            HireFlow
          </span>
        </Link>

        <div>
          <blockquote
            className="text-2xl font-semibold leading-snug mb-4"
            style={{ color: "#fff" }}
          >
            The fastest way to build custom hiring pipelines for every role.
          </blockquote>
          <p className="text-sm" style={{ color: "#6e6e6e" }}>
            Trusted by hiring teams who move fast.
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <Link href="/" className="flex items-center gap-2 mb-10 lg:hidden">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-black"
            style={{ background: "#101010", color: "#fff" }}
          >
            H
          </div>
          <span className="font-bold text-base" style={{ color: "#101010" }}>
            HireFlow
          </span>
        </Link>

        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1
              className="text-2xl font-bold mb-1"
              style={{ color: "#101010" }}
            >
              Welcome back
            </h1>
            <p className="text-sm" style={{ color: "#949494" }}>
              Sign in to your hiring dashboard
            </p>
          </div>

          {error && (
            <div
              className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl text-sm"
              style={{
                background: "#fff0f0",
                border: "1px solid #fca5a5",
                color: "#b91c1c",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="shrink-0 mt-0.5"
              >
                <circle
                  cx="8"
                  cy="8"
                  r="7"
                  stroke="currentColor"
                  strokeWidth="1.4"
                />
                <path
                  d="M8 5v3M8 10.5v.5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-semibold mb-1.5"
                style={{ color: "#6e6e6e" }}
              >
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
                style={{
                  border: "1.5px solid #dddddd",
                  background: "#fff",
                  color: "#101010",
                }}
                placeholder="you@company.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold"
                  style={{ color: "#6e6e6e" }}
                >
                  Password
                </label>
                <button
                  type="button"
                  className="text-xs font-medium cursor-pointer"
                  style={{ color: "#0a2924" }}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl px-4 py-2.5 pr-11 text-sm focus:outline-none transition-colors"
                  style={{
                    border: "1.5px solid #dddddd",
                    background: "#fff",
                    color: "#101010",
                  }}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer"
                  style={{ color: "#949494" }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    // Eye-off
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path
                        d="M2 2l14 14"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                      <path
                        d="M7.5 4.5A8 8 0 0116 9s-1.5 3-5 4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                      <path
                        d="M3 6.5C1.7 7.5 1 9 1 9s3 5 8 5a7 7 0 002.5-.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  ) : (
                    // Eye
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path
                        d="M1 9s3-5 8-5 8 5 8 5-3 5-8 5-8-5-8-5z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                      <circle
                        cx="9"
                        cy="9"
                        r="2.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl py-2.5 text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-60 cursor-pointer mt-2"
              style={{ background: "#101010", color: "#fff" }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin"
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                  >
                    <circle
                      cx="7"
                      cy="7"
                      r="5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeOpacity="0.3"
                    />
                    <path
                      d="M7 2a5 5 0 015 5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                  Signing in…
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: "#949494" }}>
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/signup"
              className="font-semibold"
              style={{ color: "#101010" }}
            >
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
