import { create } from "zustand";
import axios, { AxiosError } from "axios";
import type { Job } from "@/types/hiring";

// ─── Types ────────────────────────────────────────────────────────────────────

type CustomAnswerValue = string | boolean | string[] | number;

interface PresignedUrlResponse {
  uploadUrl: string;
  fileUrl: string;
}

interface ApplyState {
  job: Job | null;
  loading: boolean;
  submitLoading: boolean;
  uploading: boolean;
  error: string;
  success: boolean;
  resumeUrl: string;
  resumeFile: File | null;
  customFiles: Record<string, File>;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  coverLetter: string;
  customAnswers: Record<string, CustomAnswerValue>;

  setCandidateName: (name: string) => void;
  setCandidateEmail: (email: string) => void;
  setCandidatePhone: (phone: string) => void;
  setCoverLetter: (letter: string) => void;
  setResumeFile: (file: File | null) => void;
  setCustomFile: (fieldName: string, file: File) => void;
  setCustomAnswer: (fieldName: string, value: CustomAnswerValue) => void;

  fetchJob: (jobId: string) => Promise<void>;
  submitApplication: (jobId: string) => Promise<void>;
  setError: (msg: string) => void;
  reset: () => void;
}

function extractError(err: unknown, fallback: string): string {
  if (err instanceof AxiosError) {
    return (err.response?.data as { error?: string })?.error ?? fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useApplyStore = create<ApplyState>((set, get) => ({
  job: null,
  loading: true,
  submitLoading: false,
  uploading: false,
  error: "",
  success: false,
  resumeUrl: "",
  resumeFile: null,
  customFiles: {},
  candidateName: "",
  candidateEmail: "",
  candidatePhone: "",
  coverLetter: "",
  customAnswers: {},

  setCandidateName: (candidateName) => set({ candidateName }),
  setCandidateEmail: (candidateEmail) => set({ candidateEmail }),
  setCandidatePhone: (candidatePhone) => set({ candidatePhone }),
  setCoverLetter: (coverLetter) => set({ coverLetter }),
  setResumeFile: (resumeFile) => set({ resumeFile }),
  setCustomFile: (fieldName, file) =>
    set((state) => ({
      customFiles: { ...state.customFiles, [fieldName]: file },
    })),
  setCustomAnswer: (fieldName, value) =>
    set((state) => ({
      customAnswers: { ...state.customAnswers, [fieldName]: value },
    })),
  setError: (error) => set({ error }),

  fetchJob: async (jobId) => {
    set({ loading: true, error: "" });
    try {
      const res = await axios.get<{ job: Job }>(`/api/jobs/${jobId}`);
      set({ job: res.data.job, loading: false });
    } catch (err) {
      set({
        error: extractError(err, "Failed to load job details"),
        loading: false,
      });
    }
  },

  submitApplication: async (jobId) => {
    set({ submitLoading: true, error: "" });
    try {
      let finalResumeUrl = get().resumeUrl;
      const resumeFile = get().resumeFile;

      if (resumeFile) {
        set({ uploading: true });
        const presignedRes = await axios.post<PresignedUrlResponse>("/api/upload/presigned-url", {
          fileName: resumeFile.name,
          fileType: resumeFile.type,
        });
        const { uploadUrl, fileUrl } = presignedRes.data;
        await axios.put(uploadUrl, resumeFile, {
          headers: { "Content-Type": resumeFile.type },
        });
        finalResumeUrl = fileUrl;
      }

      const customFiles = get().customFiles;
      const updatedCustomAnswers: Record<string, CustomAnswerValue> = { ...get().customAnswers };

      for (const [fieldName, file] of Object.entries(customFiles)) {
        const presignedRes = await axios.post<PresignedUrlResponse>("/api/upload/presigned-url", {
          fileName: file.name,
          fileType: file.type,
        });
        const { uploadUrl, fileUrl } = presignedRes.data;
        await axios.put(uploadUrl, file, {
          headers: { "Content-Type": file.type },
        });
        updatedCustomAnswers[fieldName] = fileUrl;
      }

      set({ uploading: false });

      const { candidateName, candidateEmail, candidatePhone, coverLetter } = get();
      await axios.post(`/api/jobs/${jobId}/apply`, {
        candidateName,
        candidateEmail,
        candidatePhone: candidatePhone || null,
        resumeUrl: finalResumeUrl || null,
        coverLetter: coverLetter || null,
        customAnswers: updatedCustomAnswers,
      });

      set({ success: true, submitLoading: false });
    } catch (err) {
      set({
        error: extractError(err, "Failed to submit application"),
        submitLoading: false,
        uploading: false,
      });
    }
  },

  reset: () =>
    set({
      job: null,
      loading: true,
      submitLoading: false,
      uploading: false,
      error: "",
      success: false,
      resumeUrl: "",
      resumeFile: null,
      customFiles: {},
      candidateName: "",
      candidateEmail: "",
      candidatePhone: "",
      coverLetter: "",
      customAnswers: {},
    }),
}));
