import { create } from "zustand";
import axios from "axios";

interface ApplyState {
  job: any | null;
  loading: boolean;
  submitLoading: boolean;
  uploading: boolean;
  uploadSuccess: boolean;
  error: string;
  success: boolean;
  resumeUrl: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  coverLetter: string;
  customAnswers: Record<string, any>;

  setCandidateName: (name: string) => void;
  setCandidateEmail: (email: string) => void;
  setCandidatePhone: (phone: string) => void;
  setCoverLetter: (letter: string) => void;
  setResumeUrl: (url: string) => void;
  setCustomAnswers: (answers: Record<string, any>) => void;
  setCustomAnswer: (fieldName: string, value: any) => void;

  fetchJob: (jobId: string) => Promise<void>;
  uploadResume: (file: File) => Promise<void>;
  uploadCustomFile: (file: File, fieldName: string) => Promise<void>;
  submitApplication: (jobId: string) => Promise<void>;
  setError: (msg: string) => void;
  reset: () => void;
}

export const useApplyStore = create<ApplyState>((set, get) => ({
  job: null,
  loading: true,
  submitLoading: false,
  uploading: false,
  uploadSuccess: false,
  error: "",
  success: false,
  resumeUrl: "",
  candidateName: "",
  candidateEmail: "",
  candidatePhone: "",
  coverLetter: "",
  customAnswers: {},

  setCandidateName: (candidateName) => set({ candidateName }),
  setCandidateEmail: (candidateEmail) => set({ candidateEmail }),
  setCandidatePhone: (candidatePhone) => set({ candidatePhone }),
  setCoverLetter: (coverLetter) => set({ coverLetter }),
  setResumeUrl: (resumeUrl) => set({ resumeUrl }),
  setCustomAnswers: (customAnswers) => set({ customAnswers }),
  setCustomAnswer: (fieldName, value) =>
    set((state) => ({
      customAnswers: { ...state.customAnswers, [fieldName]: value },
    })),
  setError: (error) => set({ error }),

  fetchJob: async (jobId) => {
    set({ loading: true, error: "" });
    try {
      const res = await axios.get(`/api/jobs/${jobId}`);
      set({ job: res.data.job, loading: false });
    } catch (err: any) {
      set({
        error: err.response?.data?.error || "Failed to load job details",
        loading: false,
      });
    }
  },

  uploadResume: async (file) => {
    set({ uploading: true, uploadSuccess: false, error: "" });
    try {
      const presignedRes = await axios.post("/api/upload/presigned-url", {
        fileName: file.name,
        fileType: file.type,
      });
      const { uploadUrl, fileUrl } = presignedRes.data;
      await axios.put(uploadUrl, file, {
        headers: { "Content-Type": file.type },
      });
      set({ resumeUrl: fileUrl, uploadSuccess: true, uploading: false });
    } catch (err) {
      set({ error: "Failed to upload resume.", uploading: false });
    }
  },

  uploadCustomFile: async (file, fieldName) => {
    try {
      const presignedRes = await axios.post("/api/upload/presigned-url", {
        fileName: file.name,
        fileType: file.type,
      });
      const { uploadUrl, fileUrl } = presignedRes.data;
      await axios.put(uploadUrl, file, {
        headers: { "Content-Type": file.type },
      });
      get().setCustomAnswer(fieldName, fileUrl);
    } catch (err) {
      console.error(err);
      alert("Failed to upload custom field file.");
    }
  },

  submitApplication: async (jobId) => {
    set({ submitLoading: true, error: "" });
    try {
      const {
        candidateName,
        candidateEmail,
        candidatePhone,
        resumeUrl,
        coverLetter,
        customAnswers,
      } = get();
      await axios.post(`/api/jobs/${jobId}/apply`, {
        candidateName,
        candidateEmail,
        candidatePhone: candidatePhone || null,
        resumeUrl,
        coverLetter: coverLetter || null,
        customAnswers,
      });
      set({ success: true, submitLoading: false });
    } catch (err: any) {
      set({
        error: err.response?.data?.error || "Failed to submit application",
        submitLoading: false,
      });
    }
  },

  reset: () =>
    set({
      job: null,
      loading: true,
      submitLoading: false,
      uploading: false,
      uploadSuccess: false,
      error: "",
      success: false,
      resumeUrl: "",
      candidateName: "",
      candidateEmail: "",
      candidatePhone: "",
      coverLetter: "",
      customAnswers: {},
    }),
}));
