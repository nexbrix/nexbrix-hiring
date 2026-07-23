import Link from "next/link";

export default function Home() {
  return (
    <div
      className="flex min-h-screen flex-col font-sans"
      style={{ background: "#ffffff", color: "#101010" }}
    >
      <header
        className="sticky top-0 z-50 w-full"
        style={{
          background: "rgba(255,255,255,0.92)",
          borderBottom: "1px solid #dddddd",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-black"
              style={{ background: "#101010", color: "#fff" }}
            >
              H
            </div>
            <span
              className="font-bold text-base tracking-tight"
              style={{ color: "#101010" }}
            >
              HireFlow
            </span>
          </Link>

          <nav className="flex items-center gap-2">
            <Link
              href="/auth/login"
              className="px-4 py-1.5 text-sm font-medium transition-colors rounded-lg"
              style={{ color: "#6e6e6e" }}
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="px-4 py-1.5 text-sm font-semibold rounded-lg transition-opacity hover:opacity-90"
              style={{ background: "#101010", color: "#fff" }}
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 flex flex-col">
        <section className="flex-1 flex flex-col items-center justify-center text-center px-6 pt-20 pb-24 max-w-5xl mx-auto w-full">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-8"
            style={{
              background: "#f5f5f5",
              color: "#6e6e6e",
              border: "1px solid #e0e0e0",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "#0c830c" }}
            />
            Hiring infrastructure for modern teams
          </div>

          <h1
            className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] mb-6"
            style={{ color: "#101010" }}
          >
            Hire smarter,
            <br />
            <span style={{ color: "#0a2924" }}>not harder.</span>
          </h1>

          <p
            className="text-lg sm:text-xl max-w-2xl leading-relaxed mb-10"
            style={{ color: "#6e6e6e" }}
          >
            Create custom application forms, configure role-specific pipelines,
            and manage candidates — all in one clean workspace.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl text-sm font-bold transition-opacity hover:opacity-90"
              style={{ background: "#101010", color: "#fff" }}
            >
              Start hiring free
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M2 7h10M8 3l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center px-7 py-3 rounded-xl text-sm font-semibold transition-all hover:bg-gray-50"
              style={{ border: "1px solid #dddddd", color: "#101010" }}
            >
              Sign in to dashboard
            </Link>
          </div>
        </section>

        <section
          className="border-t"
          style={{ borderColor: "#eeeeee", background: "#fafafa" }}
        >
          <div className="max-w-6xl mx-auto px-6 py-16">
            <div className="grid sm:grid-cols-3 gap-10">
              {[
                {
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <rect
                        x="2"
                        y="3"
                        width="16"
                        height="14"
                        rx="2"
                        stroke="currentColor"
                        strokeWidth="1.6"
                      />
                      <path
                        d="M6 8h8M6 11h5"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                    </svg>
                  ),
                  title: "Custom Application Forms",
                  desc: "Build role-specific forms with dynamic fields — text, dropdowns, file uploads, and more.",
                },
                {
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <circle
                        cx="10"
                        cy="10"
                        r="7"
                        stroke="currentColor"
                        strokeWidth="1.6"
                      />
                      <path
                        d="M10 6v4l3 2"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                    </svg>
                  ),
                  title: "Pipeline Management",
                  desc: "Move candidates through Applied → Screening → Interview → Offer → Hired in one click.",
                },
                {
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path
                        d="M4 10a6 6 0 1012 0A6 6 0 004 10z"
                        stroke="currentColor"
                        strokeWidth="1.6"
                      />
                      <path
                        d="M10 7v3l2 2"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                    </svg>
                  ),
                  title: "One-Link Applications",
                  desc: "Share a unique URL per job. Candidates apply directly — no account needed.",
                },
              ].map(({ icon, title, desc }) => (
                <div key={title}>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: "#f0f0f0", color: "#101010" }}
                  >
                    {icon}
                  </div>
                  <h3
                    className="font-semibold mb-2 text-sm"
                    style={{ color: "#101010" }}
                  >
                    {title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "#6e6e6e" }}
                  >
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t" style={{ borderColor: "#eeeeee" }}>
          <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-sm" style={{ color: "#101010" }}>
                Ready to streamline your hiring?
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#949494" }}>
                Set up your first job posting in under 2 minutes.
              </p>
            </div>
            <Link
              href="/auth/signup"
              className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 whitespace-nowrap"
              style={{ background: "#101010", color: "#fff" }}
            >
              Create free account →
            </Link>
          </div>
        </section>

        <footer
          className="border-t px-6 py-6"
          style={{ borderColor: "#eeeeee" }}
        >
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <span className="text-xs" style={{ color: "#b5b5b5" }}>
              © {new Date().getFullYear()} HireFlow. Built for modern teams.
            </span>
            <div className="flex gap-5">
              <Link
                href="/auth/login"
                className="text-xs"
                style={{ color: "#b5b5b5" }}
              >
                Sign In
              </Link>
              <Link
                href="/dashboard"
                className="text-xs"
                style={{ color: "#b5b5b5" }}
              >
                Dashboard
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
