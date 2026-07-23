import { create } from "zustand";
import axios, { AxiosError } from "axios";
import type {
  Organization,
  Job,
  Application,
  ApplicationStatus,
  JobFormData,
} from "@/types/hiring";

// ─── Axios error helper ───────────────────────────────────────────────────────

function extractError(err: unknown, fallback: string): string {
  if (err instanceof AxiosError) {
    return (err.response?.data as { error?: string })?.error ?? fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

// ─── Store types ──────────────────────────────────────────────────────────────

interface HiringState {
  organizations: Organization[];
  selectedOrg: Organization | null;
  jobs: Job[];
  applications: Application[];
  loadingOrgs: boolean;
  loadingData: boolean;
  error: string;
  setOrganizations: (orgs: Organization[]) => void;
  setSelectedOrg: (org: Organization) => void;
  fetchOrganizations: () => Promise<void>;
  createOrganization: (name: string, slug: string) => Promise<Organization>;
  fetchOrgData: () => Promise<void>;
  createJob: (jobData: JobFormData) => Promise<void>;
  updateJob: (jobId: string, jobData: JobFormData) => Promise<void>;
  updateApplicationStatus: (appId: string, status: ApplicationStatus) => Promise<void>;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useHiringStore = create<HiringState>((set, get) => ({
  organizations: [],
  selectedOrg: null,
  jobs: [],
  applications: [],
  loadingOrgs: false,
  loadingData: false,
  error: "",

  setOrganizations: (organizations) => set({ organizations }),
  setSelectedOrg: (selectedOrg) => set({ selectedOrg }),

  fetchOrganizations: async () => {
    set({ loadingOrgs: true, error: "" });
    try {
      const res = await axios.get<{ organizations: Organization[] }>("/api/organizations");
      const orgs = res.data.organizations ?? [];
      set({ organizations: orgs, loadingOrgs: false });
      if (orgs.length > 0 && !get().selectedOrg) {
        set({ selectedOrg: orgs[0] });
      }
    } catch (err) {
      set({
        error: extractError(err, "Failed to load organizations"),
        loadingOrgs: false,
      });
    }
  },

  createOrganization: async (name, slug) => {
    set({ error: "" });
    try {
      const res = await axios.post<{ organization: Organization }>("/api/organizations", { name, slug });
      const org = res.data.organization;
      await get().fetchOrganizations();
      set({ selectedOrg: org });
      return org;
    } catch (err) {
      const errorMsg = extractError(err, "Failed to create organization");
      set({ error: errorMsg });
      throw new Error(errorMsg);
    }
  },

  fetchOrgData: async () => {
    const org = get().selectedOrg;
    if (!org) return;
    set({ loadingData: true, error: "" });
    try {
      const [jobsRes, appsRes] = await Promise.all([
        axios.get<{ jobs: Job[] }>(`/api/jobs?organizationId=${org.id}`),
        axios.get<{ applications: Application[] }>(`/api/applications?organizationId=${org.id}`),
      ]);
      set({
        jobs: jobsRes.data.jobs ?? [],
        applications: appsRes.data.applications ?? [],
        loadingData: false,
      });
    } catch (err) {
      set({
        error: extractError(err, "Failed to fetch dashboard data"),
        loadingData: false,
      });
    }
  },

  createJob: async (jobData) => {
    set({ error: "" });
    try {
      await axios.post("/api/jobs", {
        organizationId: get().selectedOrg?.id,
        ...jobData,
      });
      await get().fetchOrgData();
    } catch (err) {
      const errorMsg = extractError(err, "Failed to publish job");
      set({ error: errorMsg });
      throw new Error(errorMsg);
    }
  },

  updateJob: async (jobId, jobData) => {
    set({ error: "" });
    try {
      await axios.put(`/api/jobs/${jobId}`, {
        organizationId: get().selectedOrg?.id,
        ...jobData,
      });
      await get().fetchOrgData();
    } catch (err) {
      const errorMsg = extractError(err, "Failed to update job");
      set({ error: errorMsg });
      throw new Error(errorMsg);
    }
  },

  updateApplicationStatus: async (appId: string, status: ApplicationStatus) => {
    // Optimistic update
    set((state) => ({
      applications: state.applications.map((app) =>
        app.id === appId ? { ...app, status } : app
      ),
    }));
    try {
      await axios.patch(`/api/applications/${appId}`, { status });
    } catch (err) {
      // Revert on failure
      await get().fetchOrgData();
      const errorMsg = extractError(err, "Failed to update application status");
      set({ error: errorMsg });
      throw new Error(errorMsg);
    }
  },
}));
