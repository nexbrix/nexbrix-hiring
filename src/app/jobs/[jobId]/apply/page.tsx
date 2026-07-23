"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import { useApplyStore } from "@/store/useApplyStore";
import { applicationSchema } from "@/lib/validations";
import type { CustomField } from "@/types/hiring";
import toast from "react-hot-toast";

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
    error,
    success,
    resumeFile,
    customFiles,
    candidateName,
    candidateEmail,
    candidatePhone,
    coverLetter,
    customAnswers,
    setCandidateName,
    setCandidateEmail,
    setCandidatePhone,
    setCoverLetter,
    setResumeFile,
    setCustomFile,
    setCustomAnswer,
    fetchJob,
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

  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setResumeFile(file ?? null);
  };

  const handleCustomFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: string,
  ) => {
    const file = e.target.files?.[0];
    if (file) setCustomFile(fieldName, file);
  };

  const handleCustomAnswerChange = (
    fieldName: string,
    value: string | boolean | string[] | number,
  ) => {
    setCustomAnswer(fieldName, value);
  };

  const handleMultiSelectChange = (
    fieldName: string,
    option: string,
    checked: boolean,
  ) => {
    const current = (customAnswers[fieldName] as string[]) || [];
    setCustomAnswer(
      fieldName,
      checked
        ? [...current, option]
        : current.filter((o: string) => o !== option),
    );
  };

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = applicationSchema.safeParse({
      candidateName,
      candidateEmail,
      candidatePhone: candidatePhone || null,
      resumeUrl: resumeFile ? "https://temp-upload-url-placeholder.com" : "",
      coverLetter: coverLetter || null,
      customAnswers,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    await submitApplication(jobId);
  };

  // ── Shared input style ─────────────────────────────────────────────────────
  const inputCls =
    "mt-1 block w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none transition-colors";
  const inputStyle = {
    border: "1.5px solid #dddddd",
    background: "#fafafa",
    color: "#101010",
  };
  const labelCls = "block text-xs font-semibold mb-0.5";
  const labelStyle = { color: "#6e6e6e" };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: "#f9f9f9" }}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-7 h-7 rounded-full border-2 animate-spin"
            style={{ borderColor: "#dddddd", borderTopColor: "#101010" }}
          />
          <span className="text-sm" style={{ color: "#6e6e6e" }}>
            Loading application form…
          </span>
        </div>
      </div>
    );
  }

  // ── Error (no job found) ───────────────────────────────────────────────────
  if (error && !job) {
    return (
      <div
        className="flex min-h-screen items-center justify-center px-6 text-center"
        style={{ background: "#f9f9f9" }}
      >
        <div>
          <p className="text-sm mb-4" style={{ color: "#f44444" }}>
            {error}
          </p>
          <Link
            href="/"
            className="text-sm font-semibold underline"
            style={{ color: "#101010" }}
          >
            Go home
          </Link>
        </div>
      </div>
    );
  }

  // ── Success ────────────────────────────────────────────────────────────────
  if (success) {
    return (
      <div
        className="flex min-h-screen items-center justify-center px-6 text-center"
        style={{ background: "#f9f9f9" }}
      >
        <div
          className="max-w-md w-full rounded-2xl p-10"
          style={{ background: "#fff", border: "1px solid #dddddd" }}
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: "#dcfce7" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 13l4 4L19 7"
                stroke="#0c830c"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: "#101010" }}>
            Application Submitted!
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: "#6e6e6e" }}>
            Thank you for applying to <strong>{job?.title}</strong> at{" "}
            <strong>{job?.organization?.name}</strong>. The hiring team will be
            in touch soon.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans" style={{ background: "#f9f9f9" }}>
      <header
        className="sticky top-0 z-50 w-full"
        style={{
          background: "rgba(255,255,255,0.92)",
          borderBottom: "1px solid #eeeeee",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-black"
              style={{ background: "#101010", color: "#fff" }}
            >
              H
            </div>
            <span className="font-bold text-sm" style={{ color: "#101010" }}>
              HireFlow
            </span>
          </Link>
          <span className="text-xs" style={{ color: "#949494" }}>
            Application Form
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Job info card */}
        <div
          className="rounded-2xl p-6 mb-8"
          style={{ background: "#fff", border: "1px solid #dddddd" }}
        >
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: "#f0f0f0", color: "#101010" }}
            >
              {job?.type}
            </span>
            {job?.department && (
              <span className="text-xs" style={{ color: "#949494" }}>
                {job.department}
              </span>
            )}
            {job?.location && (
              <span className="text-xs" style={{ color: "#949494" }}>
                · {job.location}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: "#101010" }}>
            {job?.title}
          </h1>
          <p className="text-sm mb-4" style={{ color: "#949494" }}>
            {job?.organization?.name}
          </p>
          <p
            className="text-sm leading-relaxed whitespace-pre-wrap"
            style={{ color: "#6e6e6e" }}
          >
            {job?.description}
          </p>
        </div>

        {/* Application form card */}
        <div
          className="rounded-2xl p-6"
          style={{ background: "#fff", border: "1px solid #dddddd" }}
        >
          <h2 className="text-base font-bold mb-5" style={{ color: "#101010" }}>
            Submit your Application
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Basic info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls} style={labelStyle}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  className={inputCls}
                  style={inputStyle}
                  placeholder="Jane Smith"
                />
              </div>
              <div>
                <label className={labelCls} style={labelStyle}>
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={candidateEmail}
                  onChange={(e) => setCandidateEmail(e.target.value)}
                  className={inputCls}
                  style={inputStyle}
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className={labelCls} style={labelStyle}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={candidatePhone}
                  onChange={(e) => setCandidatePhone(e.target.value)}
                  className={inputCls}
                  style={inputStyle}
                  placeholder="+91 98765 43210"
                />
              </div>
              <div>
                <label className={labelCls} style={labelStyle}>
                  Resume (PDF / DOC)
                </label>
                <div
                  className="mt-1 relative rounded-xl overflow-hidden"
                  style={{
                    border: "1.5px dashed #dddddd",
                    background: "#fafafa",
                  }}
                >
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleResumeChange}
                    className="block w-full text-xs px-3.5 py-2.5 cursor-pointer opacity-0 absolute inset-0"
                  />
                  <div className="flex items-center gap-2 px-3.5 py-2.5 pointer-events-none">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M7 1v8M4 6l3-3 3 3"
                        stroke="#949494"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M1 11h12"
                        stroke="#949494"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span
                      className="text-xs"
                      style={{ color: resumeFile ? "#0c830c" : "#949494" }}
                    >
                      {resumeFile
                        ? `✓ ${resumeFile.name}`
                        : "Choose file to upload"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cover Letter */}
            <div>
              <label className={labelCls} style={labelStyle}>
                Cover Letter
              </label>
              <textarea
                rows={4}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                className={`${inputCls} resize-none`}
                style={inputStyle}
                placeholder="Tell us why you're a great fit for this role…"
              />
            </div>

            {/* Custom Fields */}
            {job?.customFields && job.customFields.length > 0 && (
              <div
                className="rounded-xl p-5 space-y-5"
                style={{ background: "#fafafa", border: "1px solid #eeeeee" }}
              >
                <h3
                  className="text-sm font-semibold"
                  style={{ color: "#101010" }}
                >
                  Additional Questions
                </h3>
                {job.customFields.map((field: CustomField) => (
                  <div key={field.id}>
                    <label className={labelCls} style={labelStyle}>
                      {field.label}
                      {field.required && (
                        <span style={{ color: "#f44444" }}> *</span>
                      )}
                    </label>

                    {field.type === "TEXT" && (
                      <input
                        type="text"
                        required={field.required}
                        value={
                          (customAnswers[field.name] as string | number) ?? ""
                        }
                        onChange={(e) =>
                          handleCustomAnswerChange(field.name, e.target.value)
                        }
                        className={inputCls}
                        style={inputStyle}
                        placeholder={field.placeholder || ""}
                      />
                    )}

                    {field.type === "TEXTAREA" && (
                      <textarea
                        rows={3}
                        required={field.required}
                        value={(customAnswers[field.name] as string) ?? ""}
                        onChange={(e) =>
                          handleCustomAnswerChange(field.name, e.target.value)
                        }
                        className={`${inputCls} resize-none`}
                        style={inputStyle}
                        placeholder={field.placeholder || ""}
                      />
                    )}

                    {field.type === "NUMBER" && (
                      <input
                        type="number"
                        required={field.required}
                        value={
                          (customAnswers[field.name] as number | string) ?? ""
                        }
                        onChange={(e) =>
                          handleCustomAnswerChange(field.name, e.target.value)
                        }
                        className={inputCls}
                        style={inputStyle}
                        placeholder={field.placeholder || ""}
                      />
                    )}

                    {field.type === "BOOLEAN" && (
                      <div className="flex gap-4 mt-2">
                        {[true, false].map((val) => (
                          <label
                            key={String(val)}
                            className="flex items-center gap-2 text-sm cursor-pointer"
                            style={{ color: "#6e6e6e" }}
                          >
                            <input
                              type="radio"
                              name={field.name}
                              required={field.required}
                              checked={customAnswers[field.name] === val}
                              onChange={() =>
                                handleCustomAnswerChange(field.name, val)
                              }
                              className="cursor-pointer"
                            />
                            {val ? "Yes" : "No"}
                          </label>
                        ))}
                      </div>
                    )}

                    {field.type === "SELECT" && (
                      <select
                        required={field.required}
                        value={(customAnswers[field.name] as string) ?? ""}
                        onChange={(e) =>
                          handleCustomAnswerChange(field.name, e.target.value)
                        }
                        className={`${inputCls} cursor-pointer`}
                        style={inputStyle}
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
                          <label
                            key={opt}
                            className="flex items-center gap-2 text-sm cursor-pointer"
                            style={{ color: "#6e6e6e" }}
                          >
                            <input
                              type="checkbox"
                              checked={
                                Array.isArray(customAnswers[field.name])
                                  ? (
                                      customAnswers[field.name] as string[]
                                    ).includes(opt)
                                  : false
                              }
                              onChange={(e) =>
                                handleMultiSelectChange(
                                  field.name,
                                  opt,
                                  e.target.checked,
                                )
                              }
                              className="rounded cursor-pointer"
                            />
                            {opt}
                          </label>
                        ))}
                      </div>
                    )}

                    {field.type === "FILE" && (
                      <div
                        className="mt-1 relative rounded-xl overflow-hidden"
                        style={{
                          border: "1.5px dashed #dddddd",
                          background: "#fafafa",
                        }}
                      >
                        <input
                          type="file"
                          required={field.required}
                          onChange={(e) =>
                            handleCustomFileChange(e, field.name)
                          }
                          className="block w-full opacity-0 absolute inset-0 cursor-pointer"
                        />
                        <div className="flex items-center gap-2 px-3.5 py-2.5 pointer-events-none">
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 14 14"
                            fill="none"
                          >
                            <path
                              d="M7 1v8M4 6l3-3 3 3"
                              stroke="#949494"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M1 11h12"
                              stroke="#949494"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                            />
                          </svg>
                          <span
                            className="text-xs"
                            style={{
                              color: customFiles[field.name]
                                ? "#0c830c"
                                : "#949494",
                            }}
                          >
                            {customFiles[field.name]
                              ? `✓ ${customFiles[field.name].name}`
                              : "Choose file"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitLoading || uploading}
              className="w-full rounded-xl py-3 text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-60 cursor-pointer"
              style={{ background: "#101010", color: "#fff" }}
            >
              {submitLoading ? (
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
                  {uploading ? "Uploading files…" : "Submitting application…"}
                </span>
              ) : (
                "Submit Application"
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
