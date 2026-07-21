import { z } from "zod";

export const organizationSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(
      /^[a-z0-9-_]+$/,
      "Slug can only contain lowercase letters, numbers, hyphens, and underscores"
    ),
  logoUrl: z.string().url().optional().or(z.literal("")),
});

export const customFieldSchema = z.object({
  name: z.string().min(1, "Field name is required"),
  label: z.string().min(1, "Field label is required"),
  type: z.enum([
    "TEXT",
    "TEXTAREA",
    "NUMBER",
    "SELECT",
    "MULTI_SELECT",
    "BOOLEAN",
    "FILE",
  ]),
  required: z.boolean().default(false),
  options: z.array(z.string()).default([]),
  placeholder: z.string().nullable().optional(),
  order: z.number().default(0),
});

export const jobSchema = z.object({
  organizationId: z.string().uuid("Invalid organization ID"),
  title: z.string().min(1, "Job title is required"),
  description: z.string().min(1, "Job description is required"),
  department: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  type: z.string().min(1, "Job type is required"),
  status: z.enum(["DRAFT", "ACTIVE", "CLOSED"]).default("DRAFT"),
  customFields: z.array(customFieldSchema).default([]),
});

export const applicationSchema = z.object({
  candidateName: z.string().min(1, "Candidate name is required"),
  candidateEmail: z.string().email("Invalid email address format"),
  candidatePhone: z.string().nullable().optional(),
  resumeUrl: z.string().url("Invalid resume URL"),
  coverLetter: z.string().nullable().optional(),
  customAnswers: z.record(z.any()).default({}),
});
