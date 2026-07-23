
export interface CustomField {
  id?: string;
  name: string;
  label: string;
  type: string;
  required: boolean;
  options: string[];
  placeholder?: string | null;
  order?: number;
}


export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  type: string;
  location?: string | null;
  department?: string | null;
  status: string;
  organizationId: string;
  customFields: CustomField[];
  createdAt: string;
  organization?: Pick<Organization, "id" | "name">;
}

export type ApplicationStatus =
  | "APPLIED"
  | "SCREENING"
  | "INTERVIEWING"
  | "OFFERED"
  | "HIRED"
  | "REJECTED";

export interface Application {
  id: string;
  jobId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string | null;
  resumeUrl?: string | null;
  coverLetter?: string | null;
  customAnswers: Record<string, string | boolean | string[]>;
  status: ApplicationStatus;
  createdAt: string;
  job?: Pick<Job, "id" | "title">;
}

export interface JobFormData {
  title: string;
  description: string;
  type: string;
  location: string | null;
  department: string | null;
  status: string;
  customFields: Omit<CustomField, "id">[];
}
