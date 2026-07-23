"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import toast from "react-hot-toast";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authClient.signUp.email({ email, password, name });
      if (res?.error) {
        toast.error(res.error.message ?? "Sign up failed. Please try again.");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const strength = (() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^a-zA-Z0-9]/.test(password)) s++;
    return s;
  })();

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = ["", "#f44444", "#ffc84b", "#4949ce", "#0c830c"][strength];

  return (
    <div
      className="min-h-screen flex font-sans"
      style={{ background: "#f9f9f9", color: "#101010" }}
    >
     <div
        className="hidden lg:flex lg:w-2/5 flex-col justify-between p-10"
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

        <div className="space-y-5">
          {[
            { icon: "✦", text: "Custom application forms per job role" },
            { icon: "✦", text: "Manage entire hiring pipeline in one place" },
            { icon: "✦", text: "Share one-click apply links with candidates" },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-start gap-3">
              <span className="text-xs mt-0.5 shrink-0" style={{ color: "#baebce" }}>
                {icon}
              </span>
              <span className="text-sm leading-relaxed" style={{ color: "#b5b5b5" }}>
                {text}
              </span>
            </div>
          ))}
        </div>

        <p className="text-xs" style={{ color: "#6e6e6e" }}>
          Join teams who hire with intention.
        </p>
      </div>

      {/* ── Right panel (form) ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <Link href="/" className="flex items-center gap-2 mb-10 lg:hidden">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-black"
            style={{ background: "#101010", color: "#fff" }}
          >
            H
          </div>
          <span className="font-bold text-base" style={{ color: "#101010" }}>HireFlow</span>
        </Link>

        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-1" style={{ color: "#101010" }}>
              Create your account
            </h1>
            <p className="text-sm" style={{ color: "#949494" }}>
              Free forever. No credit card required.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
          
            <div>
              <label
                htmlFor="signup-name"
                className="block text-xs font-semibold mb-1.5"
                style={{ color: "#6e6e6e" }}
              >
                Full name
              </label>
              <input
                id="signup-name"
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
                style={{
                  border: "1.5px solid #dddddd",
                  background: "#fff",
                  color: "#101010",
                }}
                placeholder="Jane Smith"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="signup-email"
                className="block text-xs font-semibold mb-1.5"
                style={{ color: "#6e6e6e" }}
              >
                Work email
              </label>
              <input
                id="signup-email"
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

            {/* Password with eye toggle */}
            <div>
              <label
                htmlFor="signup-password"
                className="block text-xs font-semibold mb-1.5"
                style={{ color: "#6e6e6e" }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl px-4 py-2.5 pr-11 text-sm focus:outline-none transition-colors"
                  style={{
                    border: "1.5px solid #dddddd",
                    background: "#fff",
                    color: "#101010",
                  }}
                  placeholder="Min. 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer"
                  style={{ color: "#949494" }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M2 2l14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      <path d="M7.5 4.5A8 8 0 0116 9s-1.5 3-5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      <path d="M3 6.5C1.7 7.5 1 9 1 9s3 5 8 5a7 7 0 002.5-.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M1 9s3-5 8-5 8 5 8 5-3 5-8 5-8-5-8-5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Password strength meter */}
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className="flex-1 h-1 rounded-full transition-all"
                        style={{
                          background: strength >= level ? strengthColor : "#e5e5e5",
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-xs font-medium" style={{ color: strengthColor }}>
                    {strengthLabel}
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl py-2.5 text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-60 cursor-pointer mt-2"
              style={{ background: "#101010", color: "#fff" }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.3" />
                    <path d="M7 2a5 5 0 015 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  Creating account…
                </span>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: "#949494" }}>
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="font-semibold"
              style={{ color: "#101010" }}
            >
              Sign in
            </Link>
          </p>

          <p className="mt-4 text-center text-xs" style={{ color: "#b5b5b5" }}>
            By creating an account, you agree to our{" "}
            <span className="underline cursor-pointer">Terms of Service</span>
            {" & "}
            <span className="underline cursor-pointer">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
