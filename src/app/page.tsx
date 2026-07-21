import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-white font-sans">
      <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto w-full">
        <span className="text-xl font-bold bg-gradient-to-r from-teal-400 to-emerald-500 bg-clip-text text-transparent">
          NexBrix Hiring
        </span>
        <div className="flex gap-4">
          <Link
            href="/jobs"
            className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Explore Jobs
          </Link>
          <Link
            href="/auth"
            className="rounded-lg bg-zinc-900 px-4 py-1.5 text-xs font-semibold text-zinc-200 border border-zinc-800 hover:bg-zinc-800 transition-colors"
          >
            Employer Portal
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 max-w-3xl mx-auto">
        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-b from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
          The Premium Hiring Engine for Modern SaaS
        </h1>
        <p className="mt-6 text-lg text-zinc-400 max-w-2xl leading-relaxed">
          Create highly tailored hiring application forms, configure dynamic role-specific custom fields, and manage candidate pipelines. Built for speed and flexibility.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Link
            href="/jobs"
            className="rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 px-8 py-3.5 text-sm font-semibold text-black hover:opacity-90 transition-opacity shadow-lg shadow-teal-500/20"
          >
            Apply for Roles (Applicant POV)
          </Link>
          <Link
            href="/dashboard"
            className="rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/80 px-8 py-3.5 text-sm font-semibold text-zinc-200 hover:border-zinc-700 transition-all backdrop-blur-sm"
          >
            Recruit & Manage (Owner POV)
          </Link>
        </div>
      </main>
    </div>
  );
}
