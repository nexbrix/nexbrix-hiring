"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";

export default function JobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchJobs = async () => {
    try {
      const res = await axios.get("/api/jobs");
      setJobs(res.data.jobs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const filteredJobs = jobs.filter((job) => {
    const term = search.toLowerCase();
    return (
      job.title.toLowerCase().includes(term) ||
      (job.department && job.department.toLowerCase().includes(term)) ||
      (job.location && job.location.toLowerCase().includes(term)) ||
      job.organization?.name?.toLowerCase().includes(term)
    );
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        <div className="text-lg text-zinc-400">Loading job postings...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-white font-sans">
      <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto w-full">
        <Link href="/" className="text-xl font-bold bg-gradient-to-r from-teal-400 to-emerald-500 bg-clip-text text-transparent">
          NexBrix Careers
        </Link>
        <Link
          href="/dashboard"
          className="rounded-lg bg-zinc-900 px-4 py-1.5 text-xs font-semibold text-zinc-200 border border-zinc-800 hover:bg-zinc-800 transition-colors"
        >
          Recruiter Portal
        </Link>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
            Explore Open Opportunities
          </h1>
          <p className="mt-3 text-zinc-400 text-sm">
            Apply to positions at our member companies with fully custom application pipelines.
          </p>
        </div>

        <div className="mb-8">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-zinc-200 placeholder-zinc-500 focus:border-teal-500 focus:outline-hidden"
            placeholder="Search by title, company, department, or location..."
          />
        </div>

        {filteredJobs.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20 text-zinc-500">
            No active positions found.
          </div>
        ) : (
          <div className="space-y-6">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 hover:border-zinc-700 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-teal-400 bg-teal-950/40 px-2 py-0.5 rounded-full border border-teal-900">
                      {job.type}
                    </span>
                    {job.organization?.name && (
                      <span className="text-xs text-zinc-400 font-bold">{job.organization.name}</span>
                    )}
                  </div>
                  <h3 className="text-2xl font-bold mt-2">{job.title}</h3>
                  <div className="text-sm text-zinc-400 mt-1 flex flex-wrap gap-x-4">
                    {job.department && <span>Department: {job.department}</span>}
                    {job.location && <span>Location: {job.location}</span>}
                  </div>
                  <p className="text-sm text-zinc-400 mt-3 line-clamp-2">{job.description}</p>
                </div>
                <Link
                  href={`/jobs/${job.id}/apply`}
                  className="rounded-lg bg-teal-500 hover:opacity-90 px-6 py-2.5 text-xs font-bold text-black transition-opacity self-stretch sm:self-auto text-center"
                >
                  Apply Now
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
