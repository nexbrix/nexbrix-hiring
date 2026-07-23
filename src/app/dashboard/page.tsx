"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useHiringStore } from "@/store/useHiringStore";
import Link from "next/link";

// ─── Types ──────────────────────────────────────────────────────────────────

interface CustomFieldConfig {
  name: string;
  label: string;
  type: string;
  required: boolean;
  options: string[];
  rawOptions?: string;
}

type NavTab = "overview" | "jobs" | "applications" | "create-job";

const APPLICATION_STATUSES = [
  "APPLIED",
  "SCREENING",
  "INTERVIEWING",
  "OFFERED",
  "HIRED",
  "REJECTED",
] as const;

type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

const STATUS_CONFIG: Record<
  ApplicationStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  APPLIED: {
    label: "Applied",
    color: "#6e6e6e",
    bg: "#f5f5f5",
    border: "#dddddd",
  },
  SCREENING: {
    label: "Screening",
    color: "#4949ce",
    bg: "#ededfa",
    border: "#c5c5f0",
  },
  INTERVIEWING: {
    label: "Interviewing",
    color: "#b45309",
    bg: "#fef3c7",
    border: "#fcd34d",
  },
  OFFERED: {
    label: "Offered",
    color: "#0c830c",
    bg: "#dcfce7",
    border: "#86efac",
  },
  HIRED: {
    label: "Hired",
    color: "#0a2924",
    bg: "#baebce",
    border: "#6ee7a0",
  },
  REJECTED: {
    label: "Rejected",
    color: "#f44444",
    bg: "#fff0f0",
    border: "#fca5a5",
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function avatarBg(name: string) {
  const colors = [
    "#baebce",
    "#c4ccca",
    "#dbeafe",
    "#fef9c3",
    "#fce7f3",
    "#ede9fe",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + hash * 31;
  return colors[Math.abs(hash) % colors.length];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as ApplicationStatus] ?? {
    label: status,
    color: "#6e6e6e",
    bg: "#f5f5f5",
    border: "#dddddd",
  };
  return (
    <span
      style={{
        color: cfg.color,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
      }}
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
    >
      {cfg.label}
    </span>
  );
}

function CopyEmailButton({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      title={copied ? "Copied!" : `Copy ${email}`}
      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all cursor-pointer"
      style={{
        color: copied ? "#0c830c" : "#6e6e6e",
        background: copied ? "#dcfce7" : "#f5f5f5",
        border: `1px solid ${copied ? "#86efac" : "#dddddd"}`,
      }}
    >
      {copied ? (
        <>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Copied
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect x="4" y="1" width="7" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" />
            <path d="M1 4h3v7h5v-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          Copy
        </>
      )}
    </button>
  );
}

function StatCard({
  icon,
  label,
  value,
  delta,
  positive,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  delta?: string;
  positive?: boolean;
}) {
  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-3"
      style={{ background: "#fff", border: "1px solid #dddddd" }}
    >
      <div className="flex items-center justify-between">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: "#f0f4f3", color: "#0a2924" }}
        >
          {icon}
        </div>
        {delta && (
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{
              color: positive ? "#0c830c" : "#f44444",
              background: positive ? "#dcfce7" : "#fff0f0",
            }}
          >
            {delta}
          </span>
        )}
      </div>
      <div>
        <div
          className="text-2xl font-bold tracking-tight"
          style={{ color: "#101010" }}
        >
          {value}
        </div>
        <div className="text-xs mt-0.5" style={{ color: "#949494" }}>
          {label}
        </div>
      </div>
    </div>
  );
}

function PipelineBar({
  label,
  count,
  max,
}: {
  label: string;
  count: number;
  max: number;
}) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
      <div
        className="text-xs font-semibold"
        style={{ color: "#101010" }}
      >
        {count}
      </div>
      <div
        className="w-full rounded-full overflow-hidden"
        style={{ height: 80, background: "#f0f4f3", display: "flex", alignItems: "flex-end" }}
      >
        <div
          style={{
            width: "100%",
            height: `${Math.max(pct, 4)}%`,
            background: "linear-gradient(180deg, #1a4a42 0%, #0a2924 100%)",
            borderRadius: "4px 4px 0 0",
            transition: "height 0.6s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        />
      </div>
      <div
        className="text-xs text-center leading-tight"
        style={{ color: "#6e6e6e" }}
      >
        {label}
      </div>
    </div>
  );
}

// ─── Custom Field Form Section ────────────────────────────────────────────────

function CustomFieldSection({
  fields,
  isEdit,
  onAdd,
  onUpdate,
  onRemove,
}: {
  fields: CustomFieldConfig[];
  isEdit: boolean;
  onAdd: () => void;
  onUpdate: (i: number, k: keyof CustomFieldConfig, v: any) => void;
  onRemove: (i: number) => void;
}) {
  return (
    <div
      className="rounded-xl p-5"
      style={{ border: "1px solid #dddddd", background: "#fafafa" }}
    >
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3
            className="text-sm font-semibold"
            style={{ color: "#101010" }}
          >
            Custom Questions
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "#949494" }}>
            Fields applicants must fill out for this role.
          </p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          style={{
            background: "#0a2924",
            color: "#fff",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          Add Field
        </button>
      </div>

      {fields.length === 0 && (
        <div
          className="text-center py-6 text-xs rounded-lg"
          style={{ color: "#b5b5b5", border: "1px dashed #dddddd" }}
        >
          No custom questions yet. Add one above.
        </div>
      )}

      <div className="space-y-3">
        {fields.map((field, index) => (
          <div
            key={index}
            className="rounded-lg p-4 relative"
            style={{ background: "#fff", border: "1px solid #dddddd" }}
          >
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="absolute top-3 right-3 text-xs font-medium cursor-pointer"
              style={{ color: "#f44444" }}
            >
              Remove
            </button>
            <div className="grid gap-3 sm:grid-cols-3 pr-16">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "#6e6e6e" }}>
                  Question Label
                </label>
                <input
                  type="text"
                  required
                  value={field.label}
                  onChange={(e) => onUpdate(index, "label", e.target.value)}
                  className="block w-full rounded-lg px-3 py-1.5 text-sm focus:outline-none"
                  style={{ border: "1px solid #dddddd", color: "#101010", background: "#fafafa" }}
                  placeholder="e.g. GitHub URL"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "#6e6e6e" }}>
                  Response Type
                </label>
                <select
                  value={field.type}
                  onChange={(e) => onUpdate(index, "type", e.target.value)}
                  className="block w-full rounded-lg px-3 py-1.5 text-sm focus:outline-none cursor-pointer"
                  style={{ border: "1px solid #dddddd", color: "#101010", background: "#fafafa" }}
                >
                  <option value="TEXT">Short Text</option>
                  <option value="TEXTAREA">Paragraph</option>
                  <option value="NUMBER">Number</option>
                  <option value="BOOLEAN">Yes / No</option>
                  <option value="SELECT">Single Choice</option>
                  <option value="MULTI_SELECT">Multiple Choice</option>
                  <option value="FILE">File Upload</option>
                </select>
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: "#6e6e6e" }}>
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => onUpdate(index, "required", e.target.checked)}
                    className="rounded cursor-pointer"
                  />
                  Required
                </label>
              </div>
            </div>

            {(field.type === "SELECT" || field.type === "MULTI_SELECT") && (
              <div className="mt-3 max-w-sm">
                <label className="block text-xs font-semibold mb-1" style={{ color: "#6e6e6e" }}>
                  Options (comma-separated)
                </label>
                <input
                  type="text"
                  required
                  value={field.rawOptions || ""}
                  onChange={(e) => onUpdate(index, "rawOptions", e.target.value)}
                  className="block w-full rounded-lg px-3 py-1.5 text-sm focus:outline-none"
                  style={{ border: "1px solid #dddddd", color: "#101010", background: "#fafafa" }}
                  placeholder="Option A, Option B, Option C"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

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
    updateJob,
    updateApplicationStatus,
  } = useHiringStore();

  const [activeTab, setActiveTab] = useState<NavTab>("overview");
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [isEditingJob, setIsEditingJob] = useState(false);

  // Org creation
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [orgError, setOrgError] = useState("");

  // Job creation
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jobType, setJobType] = useState("Full-time");
  const [jobLocation, setJobLocation] = useState("");
  const [jobDepartment, setJobDepartment] = useState("");
  const [jobCustomFields, setJobCustomFields] = useState<CustomFieldConfig[]>([]);
  const [jobError, setJobError] = useState("");

  // Job editing
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editType, setEditType] = useState("Full-time");
  const [editLocation, setEditLocation] = useState("");
  const [editDepartment, setEditDepartment] = useState("");
  const [editCustomFields, setEditCustomFields] = useState<CustomFieldConfig[]>([]);
  const [editError, setEditError] = useState("");

  // Application status toast
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!isPending && !session) router.push("/auth");
  }, [session, isPending, router]);

  useEffect(() => {
    if (session) fetchOrganizations();
  }, [session, fetchOrganizations]);

  useEffect(() => {
    if (selectedOrg) {
      fetchOrgData();
      setSelectedJob(null);
      setIsEditingJob(false);
    }
  }, [selectedOrg, fetchOrgData]);

  useEffect(() => {
    if (selectedJob && jobs.length > 0) {
      const refreshed = jobs.find((j) => j.id === selectedJob.id);
      if (refreshed) setSelectedJob(refreshed);
    }
  }, [jobs]);

  // ── Handlers ──

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

  const handleAddCustomField = (isEdit: boolean) => {
    const newField: CustomFieldConfig = { name: "", label: "", type: "TEXT", required: false, options: [], rawOptions: "" };
    if (isEdit) setEditCustomFields((p) => [...p, newField]);
    else setJobCustomFields((p) => [...p, newField]);
  };

  const handleUpdateCustomField = (i: number, k: keyof CustomFieldConfig, v: any, isEdit: boolean) => {
    const update = (prev: CustomFieldConfig[]) => {
      const next = [...prev];
      if (k === "rawOptions") {
        next[i].rawOptions = v;
        next[i].options = v.split(",").map((s: string) => s.trim()).filter(Boolean);
      } else {
        next[i][k] = v as never;
      }
      return next;
    };
    if (isEdit) setEditCustomFields(update);
    else setJobCustomFields(update);
  };

  const handleRemoveCustomField = (i: number, isEdit: boolean) => {
    if (isEdit) setEditCustomFields((p) => p.filter((_, idx) => idx !== i));
    else setJobCustomFields((p) => p.filter((_, idx) => idx !== i));
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
      setJobTitle(""); setJobDescription(""); setJobLocation(""); setJobDepartment(""); setJobCustomFields([]);
      setActiveTab("jobs");
      showToast("Job posted successfully!");
    } catch (err: any) {
      setJobError(err.message || "Failed to create job posting");
    }
  };

  const startEditing = () => {
    if (!selectedJob) return;
    setEditTitle(selectedJob.title);
    setEditDescription(selectedJob.description);
    setEditType(selectedJob.type);
    setEditLocation(selectedJob.location || "");
    setEditDepartment(selectedJob.department || "");
    const formattedFields = (selectedJob.customFields || []).map((f: any) => ({
      name: f.name, label: f.label, type: f.type, required: f.required,
      options: f.options || [], rawOptions: (f.options || []).join(", "),
    }));
    setEditCustomFields(formattedFields);
    setEditError("");
    setIsEditingJob(true);
  };

  const handleUpdateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError("");
    try {
      const fields = editCustomFields.map((f) => ({
        name: f.name || f.label.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_"),
        label: f.label, type: f.type, required: f.required, options: f.options,
      }));
      await updateJob(selectedJob.id, {
        title: editTitle, description: editDescription, type: editType,
        location: editLocation || null, department: editDepartment || null,
        status: "ACTIVE", customFields: fields,
      });
      setIsEditingJob(false);
      showToast("Job updated successfully!");
    } catch (err: any) {
      setEditError(err.message || "Failed to update job posting");
    }
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/auth");
  };

  const handleStatusChange = async (appId: string, newStatus: string) => {
    try {
      await updateApplicationStatus(appId, newStatus);
      showToast("Status updated");
    } catch {
      showToast("Failed to update status", false);
    }
  };

  // ── Derived data ──

  const jobApplications = selectedJob
    ? applications.filter((a) => a.jobId === selectedJob.id)
    : [];

  // Pipeline counts
  const pipeline = {
    APPLIED: applications.filter((a) => a.status === "APPLIED").length,
    SCREENING: applications.filter((a) => a.status === "SCREENING").length,
    INTERVIEWING: applications.filter((a) => a.status === "INTERVIEWING").length,
    OFFERED: applications.filter((a) => a.status === "OFFERED").length,
    HIRED: applications.filter((a) => a.status === "HIRED").length,
    REJECTED: applications.filter((a) => a.status === "REJECTED").length,
  };
  const pipelineMax = Math.max(...Object.values(pipeline), 1);
  const recentApps = [...applications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 6);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  // ── Loading state ──

  if (isPending || !session) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: "#f8faf9" }}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "#0a2924", borderTopColor: "transparent" }}
          />
          <span className="text-sm" style={{ color: "#6e6e6e" }}>
            Loading workspace…
          </span>
        </div>
      </div>
    );
  }

  // ─── Sidebar nav items ────────────────────────────────────────────────────

  const navItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    {
      id: "overview",
      label: "Dashboard",
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.4" />
          <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.4" />
          <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.4" />
          <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      ),
    },
    {
      id: "jobs",
      label: "Jobs",
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="2" y="4" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
          <path d="M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M2 8h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: "applications",
      label: "Applications",
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 2h12v12H2z" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
          <path d="M5 6h6M5 9h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: "create-job",
      label: "Post a Job",
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      ),
    },
  ];

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      className="flex min-h-screen font-sans"
      style={{ background: "#f8faf9", color: "#101010" }}
    >
      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg animate-fade-in flex items-center gap-2"
          style={{
            background: toast.ok ? "#dcfce7" : "#fff0f0",
            color: toast.ok ? "#0c830c" : "#f44444",
            border: `1px solid ${toast.ok ? "#86efac" : "#fca5a5"}`,
          }}
        >
          {toast.ok ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          )}
          {toast.msg}
        </div>
      )}

      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      <aside
        className="w-56 flex-shrink-0 flex flex-col justify-between sticky top-0 h-screen"
        style={{ background: "#fff", borderRight: "1px solid #dddddd" }}
      >
        <div className="p-5">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-7">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black"
              style={{ background: "#0a2924", color: "#baebce" }}
            >
              H
            </div>
            <span className="font-bold text-base" style={{ color: "#0a2924" }}>
              HireFlow
            </span>
          </div>

          {/* Org selector */}
          {organizations.length > 0 && (
            <div className="mb-5">
              <select
                value={selectedOrg?.id || ""}
                onChange={(e) =>
                  setSelectedOrg(organizations.find((o) => o.id === e.target.value))
                }
                className="w-full rounded-lg px-3 py-2 text-xs font-medium cursor-pointer focus:outline-none"
                style={{ border: "1px solid #dddddd", color: "#101010", background: "#f8faf9" }}
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Nav */}
          {selectedOrg && (
            <nav className="flex flex-col gap-0.5">
              {navItems.map((item) => {
                const isActive =
                  activeTab === item.id &&
                  (item.id !== "jobs" || !selectedJob);
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      if (item.id !== "jobs") {
                        setSelectedJob(null);
                        setIsEditingJob(false);
                      }
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left cursor-pointer"
                    style={{
                      background: isActive ? "#e7eae9" : "transparent",
                      color: isActive ? "#0a2924" : "#6e6e6e",
                    }}
                  >
                    {item.icon}
                    {item.label}
                    {item.id === "applications" && applications.length > 0 && (
                      <span
                        className="ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: "#baebce", color: "#0a2924" }}
                      >
                        {applications.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          )}
        </div>

        {/* User */}
        <div
          className="p-4 border-t"
          style={{ borderColor: "#dddddd" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: "#baebce", color: "#0a2924" }}
            >
              {getInitials(session.user.name || session.user.email)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold truncate" style={{ color: "#101010" }}>
                {session.user.name || "User"}
              </div>
              <div className="text-xs truncate" style={{ color: "#949494" }}>
                Hiring Manager
              </div>
            </div>
            <button
              onClick={handleSignOut}
              title="Sign out"
              className="cursor-pointer"
              style={{ color: "#b5b5b5" }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        {/* No org state */}
        {organizations.length === 0 && (
          <div className="max-w-md mx-auto mt-24 p-8 rounded-2xl" style={{ background: "#fff", border: "1px solid #dddddd" }}>
            <h2 className="text-xl font-bold mb-1" style={{ color: "#101010" }}>
              Set up your workspace
            </h2>
            <p className="text-sm mb-6" style={{ color: "#949494" }}>
              Create an organization to start posting jobs and reviewing applications.
            </p>
            {(orgError || error) && (
              <div className="mb-4 text-xs p-3 rounded-lg" style={{ color: "#f44444", background: "#fff0f0", border: "1px solid #fca5a5" }}>
                {orgError || error}
              </div>
            )}
            <form onSubmit={handleCreateOrg} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "#6e6e6e" }}>
                  Organization Name
                </label>
                <input
                  type="text" required value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="block w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={{ border: "1px solid #dddddd", color: "#101010", background: "#fafafa" }}
                  placeholder="Acme Corp"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "#6e6e6e" }}>
                  Unique Slug
                </label>
                <input
                  type="text" required value={orgSlug}
                  onChange={(e) => setOrgSlug(e.target.value)}
                  className="block w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={{ border: "1px solid #dddddd", color: "#101010", background: "#fafafa" }}
                  placeholder="acme-corp"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-lg py-2.5 text-sm font-bold transition-opacity hover:opacity-90 cursor-pointer"
                style={{ background: "#0a2924", color: "#baebce" }}
              >
                Create Organization
              </button>
            </form>
          </div>
        )}

        {/* ── OVERVIEW TAB ─────────────────────────────────────────────── */}
        {selectedOrg && activeTab === "overview" && (
          <div className="p-8 max-w-6xl">
            {/* Header */}
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#949494" }}>
                Overview
              </p>
              <h1 className="text-2xl font-bold" style={{ color: "#101010" }}>
                {greeting()}, {session.user.name?.split(" ")[0] || "there"} 👋
              </h1>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                label="Total Applicants"
                value={applications.length}
                delta={`+${Math.max(applications.length, 0)}`}
                positive
                icon={
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <circle cx="7" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M1 15c0-3.314 2.686-5 6-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M13 10v6M10 13h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                }
              />
              <StatCard
                label="Open Positions"
                value={jobs.filter((j) => j.status === "ACTIVE").length}
                delta={`+${jobs.length}`}
                positive
                icon={
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <rect x="2" y="5" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M6 5V4a1 1 0 011-1h4a1 1 0 011 1v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M2 9h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                }
              />
              <StatCard
                label="Screening"
                value={pipeline.SCREENING}
                icon={
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M9 5v4l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                }
              />
              <StatCard
                label="Hired"
                value={pipeline.HIRED}
                delta={pipeline.HIRED > 0 ? `+${pipeline.HIRED}` : undefined}
                positive
                icon={
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M3 10l4 4 8-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                }
              />
            </div>

            {/* Charts row */}
            <div className="grid lg:grid-cols-5 gap-6 mb-8">
              {/* Pipeline */}
              <div
                className="lg:col-span-3 rounded-xl p-6"
                style={{ background: "#fff", border: "1px solid #dddddd" }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-sm font-semibold" style={{ color: "#101010" }}>
                    Hiring Pipeline
                  </h2>
                  <span className="text-xs" style={{ color: "#949494" }}>
                    {applications.length} total
                  </span>
                </div>
                <div className="flex items-end gap-3 h-28">
                  {[
                    { label: "Applied", count: pipeline.APPLIED },
                    { label: "Screening", count: pipeline.SCREENING },
                    { label: "Interview", count: pipeline.INTERVIEWING },
                    { label: "Offered", count: pipeline.OFFERED },
                    { label: "Hired", count: pipeline.HIRED },
                    { label: "Rejected", count: pipeline.REJECTED },
                  ].map((s) => (
                    <PipelineBar key={s.label} label={s.label} count={s.count} max={pipelineMax} />
                  ))}
                </div>
              </div>

              {/* Applications trend (sparkline) */}
              <div
                className="lg:col-span-2 rounded-xl p-6 flex flex-col"
                style={{ background: "#fff", border: "1px solid #dddddd" }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold" style={{ color: "#101010" }}>
                    Applications
                  </h2>
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: "#dcfce7", color: "#0c830c" }}
                  >
                    {applications.length > 0 ? `+${applications.length}` : "0"}
                  </span>
                </div>
                <div className="flex-1 flex items-end">
                  {/* Simple SVG sparkline */}
                  <svg viewBox="0 0 160 60" className="w-full" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#baebce" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#baebce" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0 55 C20 50 40 40 60 35 C80 30 100 20 120 15 C140 10 155 8 160 5"
                      fill="none"
                      stroke="#0a2924"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M0 55 C20 50 40 40 60 35 C80 30 100 20 120 15 C140 10 155 8 160 5 L160 60 L0 60 Z"
                      fill="url(#sparkGrad)"
                    />
                  </svg>
                </div>
                <div className="flex justify-between mt-3">
                  {["W1", "W2", "W3", "W4"].map((w) => (
                    <span key={w} className="text-xs" style={{ color: "#b5b5b5" }}>{w}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent applications */}
            <div
              className="rounded-xl"
              style={{ background: "#fff", border: "1px solid #dddddd" }}
            >
              <div
                className="flex items-center justify-between px-6 py-4"
                style={{ borderBottom: "1px solid #dddddd" }}
              >
                <h2 className="text-sm font-semibold" style={{ color: "#101010" }}>
                  Recent Applications
                </h2>
                <button
                  onClick={() => setActiveTab("applications")}
                  className="text-xs font-medium cursor-pointer flex items-center gap-1"
                  style={{ color: "#0a2924" }}
                >
                  View all
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
              {recentApps.length === 0 ? (
                <div className="py-16 text-center text-sm" style={{ color: "#b5b5b5" }}>
                  No applications yet. Share a job link to get started.
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: "#f0f0f0" }}>
                  {recentApps.map((app) => (
                    <div
                      key={app.id}
                      className="flex items-center gap-4 px-6 py-4"
                    >
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{
                          background: avatarBg(app.candidateName),
                          color: "#0a2924",
                        }}
                      >
                        {getInitials(app.candidateName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate" style={{ color: "#101010" }}>
                          {app.candidateName}
                        </div>
                        <div className="text-xs truncate" style={{ color: "#949494" }}>
                          {app.job?.title || "—"}
                        </div>
                      </div>
                      <StatusBadge status={app.status} />
                      <div className="text-xs w-14 text-right flex-shrink-0" style={{ color: "#b5b5b5" }}>
                        {timeAgo(app.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── JOBS TAB ──────────────────────────────────────────────────── */}
        {selectedOrg && activeTab === "jobs" && !selectedJob && (
          <div className="p-8 max-w-6xl">
            <div className="flex items-center justify-between mb-7">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#949494" }}>
                  Jobs
                </p>
                <h1 className="text-2xl font-bold" style={{ color: "#101010" }}>
                  Job Openings
                </h1>
              </div>
              <button
                onClick={() => setActiveTab("create-job")}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 cursor-pointer"
                style={{ background: "#0a2924", color: "#baebce" }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                Post a Job
              </button>
            </div>

            {jobs.length === 0 ? (
              <div
                className="rounded-xl py-20 text-center"
                style={{ border: "2px dashed #dddddd" }}
              >
                <div className="text-sm mb-3" style={{ color: "#b5b5b5" }}>
                  No job listings yet.
                </div>
                <button
                  onClick={() => setActiveTab("create-job")}
                  className="text-sm font-semibold cursor-pointer"
                  style={{ color: "#0a2924" }}
                >
                  Post your first job →
                </button>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {jobs.map((job) => {
                  const appCount = applications.filter((a) => a.jobId === job.id).length;
                  return (
                    <div
                      key={job.id}
                      onClick={() => { setSelectedJob(job); setIsEditingJob(false); }}
                      className="rounded-xl p-5 flex flex-col justify-between cursor-pointer transition-all hover:-translate-y-0.5"
                      style={{
                        background: "#fff",
                        border: "1px solid #dddddd",
                        boxShadow: "0 1px 3px rgba(10,41,36,0.04)",
                      }}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span
                            className="text-xs font-semibold px-2.5 py-1 rounded-full"
                            style={{ background: "#e7eae9", color: "#0a2924" }}
                          >
                            {job.type}
                          </span>
                          <span
                            className="text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{
                              background: job.status === "ACTIVE" ? "#dcfce7" : "#f5f5f5",
                              color: job.status === "ACTIVE" ? "#0c830c" : "#6e6e6e",
                            }}
                          >
                            {job.status}
                          </span>
                        </div>
                        <h3 className="font-bold text-base mb-1" style={{ color: "#101010" }}>
                          {job.title}
                        </h3>
                        <p className="text-xs mb-3" style={{ color: "#949494" }}>
                          {job.department || "General"} · {job.location || "Remote"}
                        </p>
                        <p className="text-xs line-clamp-2 leading-relaxed" style={{ color: "#6e6e6e" }}>
                          {job.description}
                        </p>
                      </div>
                      <div
                        className="mt-5 pt-4 flex items-center justify-between"
                        style={{ borderTop: "1px solid #f0f0f0" }}
                      >
                        <span className="text-xs" style={{ color: "#949494" }}>
                          {appCount} applicant{appCount !== 1 ? "s" : ""}
                        </span>
                        <span className="text-xs font-semibold" style={{ color: "#0a2924" }}>
                          View details →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── JOB DETAIL ────────────────────────────────────────────────── */}
        {selectedOrg && activeTab === "jobs" && selectedJob && !isEditingJob && (
          <div className="p-8 max-w-5xl">
            <button
              onClick={() => setSelectedJob(null)}
              className="flex items-center gap-2 text-sm font-medium mb-6 cursor-pointer"
              style={{ color: "#6e6e6e" }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back to Jobs
            </button>

            {/* Job header card */}
            <div
              className="rounded-xl p-6 mb-6"
              style={{ background: "#fff", border: "1px solid #dddddd" }}
            >
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
                <div>
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: "#e7eae9", color: "#0a2924" }}
                  >
                    {selectedJob.type}
                  </span>
                  <h1 className="text-2xl font-bold mt-2 mb-1" style={{ color: "#101010" }}>
                    {selectedJob.title}
                  </h1>
                  <p className="text-sm" style={{ color: "#949494" }}>
                    {selectedJob.department || "General"} · {selectedJob.location || "Remote"}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={startEditing}
                    className="px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-colors"
                    style={{ border: "1px solid #dddddd", color: "#101010", background: "#fafafa" }}
                  >
                    Edit Job
                  </button>
                  <Link
                    href={`/jobs/${selectedJob.id}/apply`}
                    target="_blank"
                    className="px-4 py-2 rounded-lg text-sm font-bold text-center"
                    style={{ background: "#0a2924", color: "#baebce" }}
                  >
                    Share Form ↗
                  </Link>
                </div>
              </div>
              <p
                className="mt-4 text-sm leading-relaxed whitespace-pre-wrap"
                style={{ color: "#6e6e6e", borderTop: "1px solid #f0f0f0", paddingTop: "16px" }}
              >
                {selectedJob.description}
              </p>
            </div>

            {/* Applications for this job */}
            <div>
              <h2 className="text-base font-bold mb-4" style={{ color: "#101010" }}>
                Candidate Applications ({jobApplications.length})
              </h2>
              {jobApplications.length === 0 ? (
                <div
                  className="rounded-xl py-16 text-center text-sm"
                  style={{ border: "2px dashed #dddddd", color: "#b5b5b5" }}
                >
                  No applications yet. Share the job link to collect applications.
                </div>
              ) : (
                <div className="space-y-4">
                  {jobApplications.map((app) => (
                    <div
                      key={app.id}
                      className="rounded-xl p-5"
                      style={{ background: "#fff", border: "1px solid #dddddd" }}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                            style={{ background: avatarBg(app.candidateName), color: "#0a2924" }}
                          >
                            {getInitials(app.candidateName)}
                          </div>
                          <div>
                            <div className="font-semibold" style={{ color: "#101010" }}>
                              {app.candidateName}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs" style={{ color: "#949494" }}>
                                {app.candidateEmail}
                              </span>
                              <CopyEmailButton email={app.candidateEmail} />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {/* Status selector */}
                          <select
                            value={app.status}
                            onChange={(e) => handleStatusChange(app.id, e.target.value)}
                            className="rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer focus:outline-none"
                            style={{
                              border: `1px solid ${STATUS_CONFIG[app.status as ApplicationStatus]?.border ?? "#dddddd"}`,
                              color: STATUS_CONFIG[app.status as ApplicationStatus]?.color ?? "#6e6e6e",
                              background: STATUS_CONFIG[app.status as ApplicationStatus]?.bg ?? "#f5f5f5",
                            }}
                          >
                            {APPLICATION_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {STATUS_CONFIG[s].label}
                              </option>
                            ))}
                          </select>
                          {app.resumeUrl ? (
                            <a
                              href={app.resumeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                              style={{ background: "#e7eae9", color: "#0a2924" }}
                            >
                              Resume ↗
                            </a>
                          ) : (
                            <span className="text-xs" style={{ color: "#b5b5b5" }}>No resume</span>
                          )}
                        </div>
                      </div>

                      {app.coverLetter && (
                        <div
                          className="text-sm p-3 rounded-lg mb-3 whitespace-pre-wrap"
                          style={{ background: "#fafafa", color: "#6e6e6e", border: "1px solid #f0f0f0" }}
                        >
                          <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#b5b5b5" }}>
                            Cover Letter
                          </div>
                          {app.coverLetter}
                        </div>
                      )}

                      {app.customAnswers && Object.keys(app.customAnswers).length > 0 && (
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#b5b5b5" }}>
                            Custom Answers
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {Object.entries(app.customAnswers).map(([key, value]) => (
                              <div
                                key={key}
                                className="rounded-lg p-3"
                                style={{ background: "#fafafa", border: "1px solid #f0f0f0" }}
                              >
                                <div className="text-xs font-medium mb-1" style={{ color: "#949494" }}>
                                  {key.replace(/_/g, " ")}
                                </div>
                                <div className="text-sm font-semibold" style={{ color: "#101010" }}>
                                  {typeof value === "boolean"
                                    ? value ? "Yes" : "No"
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
          </div>
        )}

        {/* ── JOB EDIT FORM ─────────────────────────────────────────────── */}
        {selectedOrg && activeTab === "jobs" && selectedJob && isEditingJob && (
          <div className="p-8 max-w-3xl">
            <button
              onClick={() => setIsEditingJob(false)}
              className="flex items-center gap-2 text-sm font-medium mb-6 cursor-pointer"
              style={{ color: "#6e6e6e" }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back to Job
            </button>

            <h1 className="text-xl font-bold mb-6" style={{ color: "#101010" }}>Edit Job Posting</h1>

            {(editError || error) && (
              <div className="mb-5 text-xs p-3 rounded-lg" style={{ color: "#f44444", background: "#fff0f0", border: "1px solid #fca5a5" }}>
                {editError || error}
              </div>
            )}

            <form onSubmit={handleUpdateJob} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                {[
                  { label: "Job Title", value: editTitle, onChange: setEditTitle, placeholder: "Software Engineer" },
                  { label: "Department", value: editDepartment, onChange: setEditDepartment, placeholder: "Engineering" },
                  { label: "Location", value: editLocation, onChange: setEditLocation, placeholder: "Remote" },
                ].map(({ label, value, onChange, placeholder }) => (
                  <div key={label}>
                    <label className="block text-xs font-semibold mb-1" style={{ color: "#6e6e6e" }}>
                      {label}
                    </label>
                    <input
                      type="text"
                      required={label === "Job Title"}
                      value={value}
                      onChange={(e) => onChange(e.target.value)}
                      className="block w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                      style={{ border: "1px solid #dddddd", color: "#101010", background: "#fafafa" }}
                      placeholder={placeholder}
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#6e6e6e" }}>Job Type</label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value)}
                    className="block w-full rounded-lg px-3 py-2 text-sm focus:outline-none cursor-pointer"
                    style={{ border: "1px solid #dddddd", color: "#101010", background: "#fafafa" }}
                  >
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Contract</option>
                    <option>Internship</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "#6e6e6e" }}>Description</label>
                <textarea
                  required rows={5} value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="block w-full rounded-lg px-3 py-2 text-sm focus:outline-none resize-none"
                  style={{ border: "1px solid #dddddd", color: "#101010", background: "#fafafa" }}
                  placeholder="Describe the role, requirements, and expectations…"
                />
              </div>

              <CustomFieldSection
                fields={editCustomFields}
                isEdit
                onAdd={() => handleAddCustomField(true)}
                onUpdate={(i, k, v) => handleUpdateCustomField(i, k, v, true)}
                onRemove={(i) => handleRemoveCustomField(i, true)}
              />

              <button
                type="submit"
                className="w-full rounded-lg py-2.5 text-sm font-bold transition-opacity hover:opacity-90 cursor-pointer"
                style={{ background: "#0a2924", color: "#baebce" }}
              >
                Save Changes
              </button>
            </form>
          </div>
        )}

        {/* ── CREATE JOB TAB ────────────────────────────────────────────── */}
        {selectedOrg && activeTab === "create-job" && (
          <div className="p-8 max-w-3xl">
            <div className="mb-7">
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#949494" }}>
                Jobs
              </p>
              <h1 className="text-2xl font-bold" style={{ color: "#101010" }}>Post a New Job</h1>
            </div>

            {(jobError || error) && (
              <div className="mb-5 text-xs p-3 rounded-lg" style={{ color: "#f44444", background: "#fff0f0", border: "1px solid #fca5a5" }}>
                {jobError || error}
              </div>
            )}

            <form onSubmit={handleCreateJob} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#6e6e6e" }}>Job Title *</label>
                  <input
                    type="text" required value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="block w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={{ border: "1px solid #dddddd", color: "#101010", background: "#fafafa" }}
                    placeholder="Software Engineer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#6e6e6e" }}>Job Type</label>
                  <select
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value)}
                    className="block w-full rounded-lg px-3 py-2 text-sm focus:outline-none cursor-pointer"
                    style={{ border: "1px solid #dddddd", color: "#101010", background: "#fafafa" }}
                  >
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Contract</option>
                    <option>Internship</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#6e6e6e" }}>Department</label>
                  <input
                    type="text" value={jobDepartment}
                    onChange={(e) => setJobDepartment(e.target.value)}
                    className="block w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={{ border: "1px solid #dddddd", color: "#101010", background: "#fafafa" }}
                    placeholder="Engineering"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#6e6e6e" }}>Location</label>
                  <input
                    type="text" value={jobLocation}
                    onChange={(e) => setJobLocation(e.target.value)}
                    className="block w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={{ border: "1px solid #dddddd", color: "#101010", background: "#fafafa" }}
                    placeholder="Remote"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "#6e6e6e" }}>Job Description *</label>
                <textarea
                  required rows={6} value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="block w-full rounded-lg px-3 py-2 text-sm focus:outline-none resize-none"
                  style={{ border: "1px solid #dddddd", color: "#101010", background: "#fafafa" }}
                  placeholder="Describe the role, requirements, responsibilities, and what great looks like…"
                />
              </div>

              <CustomFieldSection
                fields={jobCustomFields}
                isEdit={false}
                onAdd={() => handleAddCustomField(false)}
                onUpdate={(i, k, v) => handleUpdateCustomField(i, k, v, false)}
                onRemove={(i) => handleRemoveCustomField(i, false)}
              />

              <button
                type="submit"
                className="w-full rounded-lg py-2.5 text-sm font-bold transition-opacity hover:opacity-90 cursor-pointer"
                style={{ background: "#0a2924", color: "#baebce" }}
              >
                Publish Job Listing
              </button>
            </form>
          </div>
        )}

        {/* ── APPLICATIONS TAB ─────────────────────────────────────────── */}
        {selectedOrg && activeTab === "applications" && (
          <div className="p-8 max-w-6xl">
            <div className="mb-7">
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#949494" }}>
                Applications
              </p>
              <h1 className="text-2xl font-bold" style={{ color: "#101010" }}>
                All Applications
              </h1>
            </div>

            {applications.length === 0 ? (
              <div
                className="rounded-xl py-20 text-center text-sm"
                style={{ border: "2px dashed #dddddd", color: "#b5b5b5" }}
              >
                No applications received yet.
              </div>
            ) : (
              <div
                className="rounded-xl overflow-hidden"
                style={{ border: "1px solid #dddddd", background: "#fff" }}
              >
                {/* Table header */}
                <div
                  className="grid px-5 py-3 text-xs font-semibold uppercase tracking-wider"
                  style={{
                    gridTemplateColumns: "2fr 1.5fr 1fr 1.2fr auto",
                    color: "#949494",
                    borderBottom: "1px solid #f0f0f0",
                    background: "#fafafa",
                  }}
                >
                  <span>Candidate</span>
                  <span>Job</span>
                  <span>Applied</span>
                  <span>Status</span>
                  <span>Actions</span>
                </div>

                {/* Table rows */}
                <div className="divide-y" style={{ borderColor: "#f0f0f0" }}>
                  {applications.map((app) => (
                    <div
                      key={app.id}
                      className="grid items-center px-5 py-3.5 hover:bg-gray-50 transition-colors"
                      style={{ gridTemplateColumns: "2fr 1.5fr 1fr 1.2fr auto" }}
                    >
                      {/* Candidate */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ background: avatarBg(app.candidateName), color: "#0a2924" }}
                        >
                          {getInitials(app.candidateName)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold truncate" style={{ color: "#101010" }}>
                            {app.candidateName}
                          </div>
                          <div className="text-xs truncate" style={{ color: "#949494" }}>
                            {app.candidateEmail}
                          </div>
                        </div>
                      </div>

                      {/* Job */}
                      <div className="text-sm truncate pr-4" style={{ color: "#6e6e6e" }}>
                        {app.job?.title || "—"}
                      </div>

                      {/* Date */}
                      <div className="text-xs" style={{ color: "#949494" }}>
                        {timeAgo(app.createdAt)}
                      </div>

                      {/* Status */}
                      <div>
                        <select
                          value={app.status}
                          onChange={(e) => handleStatusChange(app.id, e.target.value)}
                          className="rounded-lg px-2.5 py-1 text-xs font-semibold cursor-pointer focus:outline-none"
                          style={{
                            border: `1px solid ${STATUS_CONFIG[app.status as ApplicationStatus]?.border ?? "#dddddd"}`,
                            color: STATUS_CONFIG[app.status as ApplicationStatus]?.color ?? "#6e6e6e",
                            background: STATUS_CONFIG[app.status as ApplicationStatus]?.bg ?? "#f5f5f5",
                          }}
                        >
                          {APPLICATION_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {STATUS_CONFIG[s].label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pl-3">
                        <CopyEmailButton email={app.candidateEmail} />
                        {app.resumeUrl && (
                          <a
                            href={app.resumeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium"
                            style={{ color: "#0a2924", background: "#e7eae9", border: "1px solid #c4ccca" }}
                          >
                            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                              <path d="M2 9l7-7M4 2h5v5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            CV
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
