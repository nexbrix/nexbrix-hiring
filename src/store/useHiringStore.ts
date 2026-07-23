import { create } from "zustand";
import axios from "axios";

interface HiringState {
  organizations: any[];
  selectedOrg: any | null;
  jobs: any[];
  applications: any[];
  loadingOrgs: boolean;
  loadingData: boolean;
  error: string;
  setOrganizations: (orgs: any[]) => void;
  setSelectedOrg: (org: any) => void;
  fetchOrganizations: () => Promise<void>;
  createOrganization: (name: string, slug: string) => Promise<any>;
  fetchOrgData: () => Promise<void>;
  createJob: (jobData: any) => Promise<void>;
  updateJob: (jobId: string, jobData: any) => Promise<void>;
  updateApplicationStatus: (appId: string, status: string) => Promise<void>;
}

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
      const res = await axios.get("/api/organizations");
      const orgs = res.data.organizations || [];
      set({ organizations: orgs, loadingOrgs: false });
      if (orgs.length > 0 && !get().selectedOrg) {
        set({ selectedOrg: orgs[0] });
      }
    } catch (err: any) {
      set({
        error: err.response?.data?.error || "Failed to load organizations",
        loadingOrgs: false,
      });
    }
  },

  createOrganization: async (name, slug) => {
    set({ error: "" });
    try {
      const res = await axios.post("/api/organizations", { name, slug });
      const org = res.data.organization;
      await get().fetchOrganizations();
      set({ selectedOrg: org });
      return org;
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error || "Failed to create organization";
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
        axios.get(`/api/jobs?organizationId=${org.id}`),
        axios.get(`/api/applications?organizationId=${org.id}`),
      ]);
      set({
        jobs: jobsRes.data.jobs || [],
        applications: appsRes.data.applications || [],
        loadingData: false,
      });
    } catch (err: any) {
      set({
        error: err.response?.data?.error || "Failed to fetch dashboard data",
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
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || "Failed to publish job";
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
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || "Failed to update job";
      set({ error: errorMsg });
      throw new Error(errorMsg);
    }
  },

  updateApplicationStatus: async (appId, status) => {
    // Optimistic update
    set((state) => ({
      applications: state.applications.map((app) =>
        app.id === appId ? { ...app, status } : app
      ),
    }));
    try {
      await axios.patch(`/api/applications/${appId}`, { status });
    } catch (err: any) {
      // Revert on failure
      await get().fetchOrgData();
      const errorMsg =
        err.response?.data?.error || "Failed to update application status";
      set({ error: errorMsg });
      throw new Error(errorMsg);
    }
  },
}));
