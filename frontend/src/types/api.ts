export type UserRole = "jobseeker" | "recruiter";

export interface AuthUser {
  id: number;
  name: string;
  email?: string;
  role: UserRole;
}

export interface SessionResponse {
  authenticated: boolean;
  user: AuthUser | null;
}

export interface Job {
  id: number;
  company: string;
  role: string;
  skills: string;
  description: string;
  expiryDate: string | null;
}

export interface RecruiterJob extends Job {
  applicationCount: number;
}

export interface ResumeRecord {
  id: number;
  name: string;
  skills: string;
  score: number;
  uploadedAt: string | null;
  fileName: string | null;
}

export interface ApplicationRecord {
  name: string;
  resume: string;
  score: number;
  role: string;
  company: string;
  jobId: number;
}

export interface JobApplicationSummary {
  name: string;
  resume: string;
  score: number;
}

export interface ResumeAnalysis {
  score: number;
  matched: string[];
  missing: string[];
  suggestions: string[];
  canApply: boolean;
}

export interface ResumeAnalysisResponse {
  message: string;
  job: Job;
  result: ResumeAnalysis;
  resume: ResumeRecord;
}
