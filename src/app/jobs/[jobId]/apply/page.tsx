"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import { useApplyStore } from "@/store/useApplyStore";
import { applicationSchema } from "@/lib/validations";

export default function ApplyPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = use(params);

  const {
    job,
    loading,
    submitLoading,
    uploading,
    uploadSuccess,
    error,
    success,
    resumeUrl,
    candidateName,
    candidateEmail,
    candidatePhone,
    coverLetter,
    customAnswers,
    setCandidateName,
    setCandidateEmail,
    setCandidatePhone,
    setCoverLetter,
    setResumeUrl,
    setCustomAnswer,
    fetchJob,
    uploadResume,
    uploadCustomFile,
    submitApplication,
    setError,
    reset,
  } = useApplyStore();

  useEffect(() => {
    fetchJob(jobId);
    return () => {
      reset();
    };
  }, [jobId, fetchJob, reset]);

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadResume(file);
    }
  };

  const handleCustomFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: string
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadCustomFile(file, fieldName);
    }
  };

  const handleCustomAnswerChange = (fieldName: string, value: any) => {
    setCustomAnswer(fieldName, value);
  };

  const handleMultiSelectChange = (
    fieldName: string,
    option: string,
    checked: boolean
  ) => {
    const current = customAnswers[fieldName] || [];
    let updated;
    if (checked) {
      updated = [...current, option];
    } else {
      updated = current.filter((o: string) => o !== option);
    }
    setCustomAnswer(fieldName, updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resumeUrl) {
      setError("Please upload your resume to apply.");
      return;
    }

    const payload = {
      candidateName,
      candidateEmail,
      candidatePhone: candidatePhone || null,
      resumeUrl,
      coverLetter: coverLetter || null,
      customAnswers,
    };

    const parsed = applicationSchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    await submitApplication(jobId);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        <div className="text-lg text-zinc-400">Loading application form...</div>
      </div>
    );
  }

  if (error && !job) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white px-6 text-center">
        <div>
          <div className="text-red-400 text-lg mb-4">{error}</div>
          <Link href="/jobs" className="text-teal-400 hover:underline">
            Back to Careers
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white px-6 text-center">
        <div className="max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8">
          <h2 className="text-3xl font-extrabold text-teal-400 mb-2">Application Submitted!</h2>
          <p className="text-zinc-400 text-sm mb-6">
            Thank you for applying to the {job.title} position at {job.organization?.name}. The hiring team will review your application soon.
          </p>
          <Link
            href="/jobs"
            className="rounded-lg bg-teal-500 hover:opacity-90 px-6 py-2.5 text-xs font-bold text-black transition-opacity"
          >
            Explore Other Roles
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-white font-sans">
      <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto w-full">
        <Link href="/jobs" className="text-xl font-bold bg-gradient-to-r from-teal-400 to-emerald-500 bg-clip-text text-transparent">
          Careers Portal
        </Link>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
        <div className="border-b border-zinc-900 pb-8 mb-8">
          <span className="text-xs font-medium text-teal-400 bg-teal-950/40 px-2.5 py-1 rounded-full border border-teal-900">
            {job.type}
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight mt-4">{job.title}</h1>
          <p className="text-sm text-zinc-400 mt-2">
            {job.organization?.name} • {job.department || "Engineering"} • {job.location || "Remote"}
          </p>
          <div className="mt-6 text-sm text-zinc-300 whitespace-pre-wrap">{job.description}</div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-6">Submit your Application</h2>
          {error && <div className="mb-6 text-xs text-red-400 bg-red-950/20 border border-red-900 rounded-lg p-3">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">Full Name *</label>
                <input
                  type="text"
                  required
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-200 focus:outline-hidden"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">Email Address *</label>
                <input
                  type="email"
                  required
                  value={candidateEmail}
                  onChange={(e) => setCandidateEmail(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-200 focus:outline-hidden"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">Phone Number</label>
                <input
                  type="text"
                  value={candidatePhone}
                  onChange={(e) => setCandidatePhone(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-200 focus:outline-hidden"
                  placeholder="+1 555-0000"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">Resume File *</label>
                <input
                  type="file"
                  required={!resumeUrl}
                  accept=".pdf,.doc,.docx"
                  onChange={handleResumeUpload}
                  className="mt-1 block w-full text-xs text-zinc-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-zinc-200 hover:file:bg-zinc-700 cursor-pointer"
                />
                {uploading && <div className="text-xs text-teal-400 mt-1">Uploading resume to S3...</div>}
                {uploadSuccess && <div className="text-xs text-emerald-400 mt-1">✓ Resume uploaded successfully.</div>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">Cover Letter</label>
              <textarea
                rows={4}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-200 focus:outline-hidden"
                placeholder="Pitch why you're a great fit for this position..."
              />
            </div>

            {job.customFields && job.customFields.length > 0 && (
              <div className="border-t border-zinc-900 pt-6">
                <h3 className="text-lg font-bold mb-4">Position Questions</h3>
                <div className="space-y-6">
                  {job.customFields.map((field: any) => (
                    <div key={field.id}>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                        {field.label} {field.required && "*"}
                      </label>

                      {field.type === "TEXT" && (
                        <input
                          type="text"
                          required={field.required}
                          value={customAnswers[field.name] || ""}
                          onChange={(e) => handleCustomAnswerChange(field.name, e.target.value)}
                          className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-200 focus:outline-hidden"
                          placeholder={field.placeholder || ""}
                        />
                      )}

                      {field.type === "TEXTAREA" && (
                        <textarea
                          rows={3}
                          required={field.required}
                          value={customAnswers[field.name] || ""}
                          onChange={(e) => handleCustomAnswerChange(field.name, e.target.value)}
                          className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-200 focus:outline-hidden"
                          placeholder={field.placeholder || ""}
                        />
                      )}

                      {field.type === "NUMBER" && (
                        <input
                          type="number"
                          required={field.required}
                          value={customAnswers[field.name] || ""}
                          onChange={(e) => handleCustomAnswerChange(field.name, e.target.value)}
                          className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-200 focus:outline-hidden"
                          placeholder={field.placeholder || ""}
                        />
                      )}

                      {field.type === "BOOLEAN" && (
                        <div className="mt-2 flex gap-4">
                          <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                            <input
                              type="radio"
                              name={field.name}
                              required={field.required}
                              checked={customAnswers[field.name] === true}
                              onChange={() => handleCustomAnswerChange(field.name, true)}
                              className="border-zinc-800 bg-zinc-900 text-teal-500 focus:ring-0 cursor-pointer"
                            />
                            Yes
                          </label>
                          <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                            <input
                              type="radio"
                              name={field.name}
                              required={field.required}
                              checked={customAnswers[field.name] === false}
                              onChange={() => handleCustomAnswerChange(field.name, false)}
                              className="border-zinc-800 bg-zinc-900 text-teal-500 focus:ring-0 cursor-pointer"
                            />
                            No
                          </label>
                        </div>
                      )}

                      {field.type === "SELECT" && (
                        <select
                          required={field.required}
                          value={customAnswers[field.name] || ""}
                          onChange={(e) => handleCustomAnswerChange(field.name, e.target.value)}
                          className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 focus:outline-hidden"
                        >
                          <option value="">Choose an option</option>
                          {field.options.map((opt: string) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      )}

                      {field.type === "MULTI_SELECT" && (
                        <div className="mt-2 space-y-2">
                          {field.options.map((opt: string) => (
                            <label key={opt} className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={(customAnswers[field.name] || []).includes(opt)}
                                onChange={(e) => handleMultiSelectChange(field.name, opt, e.target.checked)}
                                className="rounded border-zinc-800 bg-zinc-900 text-teal-500 focus:ring-0 cursor-pointer"
                              />
                              {opt}
                            </label>
                          ))}
                        </div>
                      )}

                      {field.type === "FILE" && (
                        <div className="mt-1">
                          <input
                            type="file"
                            required={field.required}
                            onChange={(e) => handleCustomFileChange(e, field.name)}
                            className="block w-full text-xs text-zinc-400 file:mr-4 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-zinc-200 hover:file:bg-zinc-700 cursor-pointer"
                          />
                          {customAnswers[field.name] && (
                            <div className="text-xs text-emerald-400 mt-1">✓ File uploaded successfully.</div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitLoading || uploading}
              className="w-full rounded-lg bg-gradient-to-r from-teal-500 to-emerald-500 py-3 text-sm font-bold text-black hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
            >
              {submitLoading ? "Submitting application..." : "Submit Application"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
