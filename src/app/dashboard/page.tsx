"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useHiringStore } from "@/store/useHiringStore";
import Link from "next/link";

interface CustomFieldConfig {
  name: string;
  label: string;
  type: string;
  required: boolean;
  options: string[];
  rawOptions?: string;
}

export default function Dashboard() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  const {
    organizations,
    selectedOrg,
    jobs,
    applications,
    error,
    fetchOrganizations,
    setSelectedOrg,
    createOrganization,
    fetchOrgData,
    createJob,
  } = useHiringStore();

  const [activeTab, setActiveTab] = useState<"jobs" | "applications" | "create-job">("jobs");

  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [orgError, setOrgError] = useState("");

  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jobType, setJobType] = useState("Full-time");
  const [jobLocation, setJobLocation] = useState("");
  const [jobDepartment, setJobDepartment] = useState("");
  const [jobCustomFields, setJobCustomFields] = useState<CustomFieldConfig[]>([]);
  const [jobError, setJobError] = useState("");

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/auth");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session) {
      fetchOrganizations();
    }
  }, [session, fetchOrganizations]);

  useEffect(() => {
    if (selectedOrg) {
      fetchOrgData();
    }
  }, [selectedOrg, fetchOrgData]);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrgError("");
    try {
      await createOrganization(orgName, orgSlug);
      setOrgName("");
      setOrgSlug("");
    } catch (err: any) {
      setOrgError(err.message || "Failed to create organization");
    }
  };

  const handleAddCustomField = () => {
    setJobCustomFields([
      ...jobCustomFields,
      { name: "", label: "", type: "TEXT", required: false, options: [], rawOptions: "" },
    ]);
  };

  const handleUpdateCustomField = (index: number, key: keyof CustomFieldConfig, value: any) => {
    const updated = [...jobCustomFields];
    if (key === "rawOptions") {
      updated[index].rawOptions = value;
      updated[index].options = value.split(",").map((s: string) => s.trim()).filter(Boolean);
    } else {
      updated[index][key] = value as never;
    }
    setJobCustomFields(updated);
  };

  const handleRemoveCustomField = (index: number) => {
    setJobCustomFields(jobCustomFields.filter((_, i) => i !== index));
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setJobError("");
    try {
      const fields = jobCustomFields.map((f) => ({
        name: f.name || f.label.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_"),
        label: f.label,
        type: f.type,
        required: f.required,
        options: f.options,
      }));

      await createJob({
        title: jobTitle,
        description: jobDescription,
        type: jobType,
        location: jobLocation || null,
        department: jobDepartment || null,
        status: "ACTIVE",
        customFields: fields,
      });

      setJobTitle("");
      setJobDescription("");
      setJobLocation("");
      setJobDepartment("");
      setJobCustomFields([]);
      setActiveTab("jobs");
    } catch (err: any) {
      setJobError(err.message || "Failed to create job posting");
    }
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/auth");
  };

  if (isPending || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        <div className="text-lg text-zinc-400">Loading your workspace...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white font-sans">
      <aside className="w-64 border-r border-zinc-900 bg-zinc-950/80 p-6 flex flex-col justify-between">
        <div>
          <span className="text-xl font-bold bg-gradient-to-r from-teal-400 to-emerald-500 bg-clip-text text-transparent block mb-8">
            Hiring Console
          </span>

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                Business Profile
              </label>
              {organizations.length > 0 ? (
                <select
                  value={selectedOrg?.id || ""}
                  onChange={(e) =>
                    setSelectedOrg(organizations.find((o) => o.id === e.target.value))
                  }
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 focus:outline-hidden"
                >
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-xs text-zinc-500 italic">No business set up yet.</div>
              )}
            </div>

            {selectedOrg && (
              <nav className="flex flex-col gap-2">
                <button
                  onClick={() => setActiveTab("jobs")}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === "jobs" ? "bg-zinc-900 text-teal-400" : "text-zinc-400 hover:bg-zinc-900/50 hover:text-white"
                  }`}
                >
                  Job Openings
                </button>
                <button
                  onClick={() => setActiveTab("applications")}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === "applications"
                      ? "bg-zinc-900 text-teal-400"
                      : "text-zinc-400 hover:bg-zinc-900/50 hover:text-white"
                  }`}
                >
                  Candidate Submissions
                </button>
                <button
                  onClick={() => setActiveTab("create-job")}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === "create-job"
                      ? "bg-zinc-900 text-teal-400"
                      : "text-zinc-400 hover:bg-zinc-900/50 hover:text-white"
                  }`}
                >
                  Configure New Job
                </button>
              </nav>
            )}
          </div>
        </div>

        <div className="border-t border-zinc-900 pt-6">
          <div className="text-xs text-zinc-400 truncate mb-2">{session.user.email}</div>
          <button
            onClick={handleSignOut}
            className="w-full text-left text-xs font-semibold uppercase tracking-wider text-red-400 hover:text-red-300 transition-colors cursor-pointer"
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 p-10 overflow-y-auto max-w-5xl">
        {organizations.length === 0 ? (
          <div className="max-w-md mx-auto mt-20 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8">
            <h2 className="text-2xl font-bold mb-2">Initialize your Business</h2>
            <p className="text-zinc-400 text-sm mb-6">
              Create a workspace for your company. Once established, you can post open jobs and customize applicant forms.
            </p>
            {(orgError || error) && (
              <div className="mb-4 text-xs text-red-400 bg-red-950/20 border border-red-900 rounded-lg p-3">
                {orgError || error}
              </div>
            )}
            <form onSubmit={handleCreateOrg} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Business Name
                </label>
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-200 focus:outline-hidden"
                  placeholder="Acme Corp"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Unique Slug
                </label>
                <input
                  type="text"
                  required
                  value={orgSlug}
                  onChange={(e) => setOrgSlug(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-200 focus:outline-hidden"
                  placeholder="acme-corp"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-gradient-to-r from-teal-500 to-emerald-500 py-2 text-sm font-semibold text-black hover:opacity-90 cursor-pointer"
              >
                Create Business
              </button>
            </form>
          </div>
        ) : (
          <div>
            {activeTab === "jobs" && (
              <div>
                <div className="flex justify-between items-center mb-8">
                  <h1 className="text-3xl font-extrabold tracking-tight">Active Job Openings</h1>
                  <button
                    onClick={() => setActiveTab("create-job")}
                    className="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-200 border border-zinc-800 hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    Add New Job
                  </button>
                </div>
                {jobs.length === 0 ? (
                  <div className="text-center py-20 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20">
                    <div className="text-zinc-500 mb-2">No job listings yet.</div>
                    <button
                      onClick={() => setActiveTab("create-job")}
                      className="text-teal-400 text-sm font-medium hover:text-teal-300 cursor-pointer"
                    >
                      Post your first job opening
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2">
                    {jobs.map((job) => (
                      <div key={job.id} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 flex flex-col justify-between">
                        <div>
                          <span className="text-xs font-medium text-teal-400 bg-teal-950/40 px-2 py-0.5 rounded-full border border-teal-900">
                            {job.type}
                          </span>
                          <h3 className="text-xl font-bold mt-3">{job.title}</h3>
                          <p className="text-xs text-zinc-400 mt-1">
                            {job.department || "No department"} • {job.location || "Remote"}
                          </p>
                          <p className="text-sm text-zinc-400 mt-3 line-clamp-2">{job.description}</p>
                        </div>
                        <div className="mt-6 border-t border-zinc-800/60 pt-4 flex items-center justify-between text-xs text-zinc-500">
                          <span>{job.customFields?.length || 0} custom questions</span>
                          <Link href={`/jobs/${job.id}/apply`} target="_blank" className="text-teal-400 hover:underline">
                            View public form
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "applications" && (
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight mb-8">Candidate Submissions</h1>
                {applications.length === 0 ? (
                  <div className="text-center py-20 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20 text-zinc-500">
                    No applications received yet.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {applications.map((app) => (
                      <div key={app.id} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/60 pb-4">
                          <div>
                            <h3 className="text-lg font-bold">{app.candidateName}</h3>
                            <div className="text-xs text-zinc-400 mt-0.5">
                              {app.candidateEmail} {app.candidatePhone && `• ${app.candidatePhone}`}
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-xs font-semibold text-zinc-400 bg-zinc-800 px-3 py-1 rounded-lg">
                              {app.job?.title}
                            </span>
                            <a
                              href={app.resumeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-lg bg-teal-500 hover:opacity-90 px-4 py-1.5 text-xs font-bold text-black transition-opacity"
                            >
                              Open Resume
                            </a>
                          </div>
                        </div>

                        {app.coverLetter && (
                          <div className="mt-4 text-sm text-zinc-300">
                            <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">Cover Letter</div>
                            <p className="whitespace-pre-wrap">{app.coverLetter}</p>
                          </div>
                        )}

                        {app.customAnswers && Object.keys(app.customAnswers).length > 0 && (
                          <div className="mt-6 border-t border-zinc-800/40 pt-4">
                            <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Custom Responses</div>
                            <div className="grid gap-4 sm:grid-cols-2">
                              {Object.entries(app.customAnswers).map(([key, value]) => (
                                <div key={key} className="rounded-lg bg-zinc-950 p-3 border border-zinc-900">
                                  <div className="text-xs text-zinc-400 font-semibold">{key.replace(/_/g, " ")}</div>
                                  <div className="text-sm font-bold text-white mt-1">
                                    {typeof value === "boolean"
                                      ? value
                                        ? "Yes"
                                        : "No"
                                      : Array.isArray(value)
                                      ? value.join(", ")
                                      : String(value)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "create-job" && (
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight mb-8">Configure New Job Opening</h1>
                {(jobError || error) && (
                  <div className="mb-6 text-xs text-red-400 bg-red-950/20 border border-red-900 rounded-lg p-3">
                    {jobError || error}
                  </div>
                )}
                <form onSubmit={handleCreateJob} className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">Job Title</label>
                      <input
                        type="text"
                        required
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-200 focus:outline-hidden"
                        placeholder="Software Engineer"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">Job Type</label>
                      <select
                        value={jobType}
                        onChange={(e) => setJobType(e.target.value)}
                        className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 focus:outline-hidden"
                      >
                        <option>Full-time</option>
                        <option>Part-time</option>
                        <option>Contract</option>
                        <option>Internship</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">Department</label>
                      <input
                        type="text"
                        value={jobDepartment}
                        onChange={(e) => setJobDepartment(e.target.value)}
                        className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-200 focus:outline-hidden"
                        placeholder="Engineering"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">Location</label>
                      <input
                        type="text"
                        value={jobLocation}
                        onChange={(e) => setJobLocation(e.target.value)}
                        className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-200 focus:outline-hidden"
                        placeholder="Remote"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">Job Description</label>
                    <textarea
                      required
                      rows={5}
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-200 focus:outline-hidden"
                      placeholder="Write standard details, expectations, and role description..."
                    />
                  </div>

                  <div className="border-t border-zinc-900 pt-6">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="text-lg font-bold">Dynamic Custom Questions</h3>
                        <p className="text-zinc-500 text-xs mt-0.5">
                          Define custom inputs that applicants must fill out for this specific job.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddCustomField}
                        className="rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-200 cursor-pointer"
                      >
                        Add Question
                      </button>
                    </div>

                    <div className="space-y-4">
                      {jobCustomFields.map((field, index) => (
                        <div key={index} className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-4 relative space-y-4">
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomField(index)}
                            className="absolute top-4 right-4 text-xs text-red-400 hover:text-red-300 font-semibold cursor-pointer"
                          >
                            Remove
                          </button>
                          <div className="grid gap-4 sm:grid-cols-3 pr-12">
                            <div>
                              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500">Question Label</label>
                              <input
                                type="text"
                                required
                                value={field.label}
                                onChange={(e) => handleUpdateCustomField(index, "label", e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200 focus:outline-hidden"
                                placeholder="GitHub URL"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500">Response Type</label>
                              <select
                                value={field.type}
                                onChange={(e) => handleUpdateCustomField(index, "type", e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200 focus:outline-hidden"
                              >
                                <option value="TEXT">Short Text</option>
                                <option value="TEXTAREA">Paragraph Text</option>
                                <option value="NUMBER">Number</option>
                                <option value="BOOLEAN">Yes / No Toggle</option>
                                <option value="SELECT">Single Choice Select</option>
                                <option value="MULTI_SELECT">Multiple Choice Select</option>
                                <option value="FILE">File Upload</option>
                              </select>
                            </div>
                            <div className="flex items-center mt-6">
                              <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={field.required}
                                  onChange={(e) => handleUpdateCustomField(index, "required", e.target.checked)}
                                  className="rounded border-zinc-800 bg-zinc-900 text-teal-500 focus:ring-0 cursor-pointer"
                                />
                                Mandatory Question
                              </label>
                            </div>
                          </div>

                          {(field.type === "SELECT" || field.type === "MULTI_SELECT") && (
                            <div className="max-w-md">
                              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500">Options (Comma separated)</label>
                              <input
                                type="text"
                                required
                                value={field.rawOptions || ""}
                                onChange={(e) => handleUpdateCustomField(index, "rawOptions", e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200 focus:outline-hidden"
                                placeholder="Option 1, Option 2, Option 3"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-lg bg-gradient-to-r from-teal-500 to-emerald-500 py-3 text-sm font-bold text-black hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    Publish Job Listing
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
