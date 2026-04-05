import type {
  ApplicationRecord,
  AuthUser,
  Job,
  JobApplicationSummary,
  RecruiterJob,
  ResumeAnalysisResponse,
  ResumeRecord,
  SessionResponse,
  UserRole,
} from "@/types/api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function notifyAuthRequired() {
  window.dispatchEvent(new Event("resume-ai:auth-required"));
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    ...init,
    headers: {
      ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...init?.headers,
    },
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    if (response.status === 401) {
      notifyAuthRequired();
    }
    throw new ApiError(payload?.error ?? "Request failed.", response.status);
  }

  return payload as T;
}

export const api = {
  getSession() {
    return request<SessionResponse>("/auth/me");
  },
  register(payload: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  }) {
    return request<{ message: string; user: AuthUser }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  login(payload: { email: string; password: string }) {
    return request<{ message: string; user: AuthUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  logout() {
    return request<{ message: string }>("/auth/logout", { method: "POST" });
  },
  getJobs() {
    return request<{ jobs: Job[] }>("/jobs");
  },
  getRecruiterJobs() {
    return request<{ jobs: RecruiterJob[] }>("/recruiter/jobs");
  },
  createJob(payload: {
    company: string;
    role: string;
    skills: string;
    description: string;
    expiryDate: string;
  }) {
    return request<{ message: string; job: RecruiterJob; topMatches: Array<{ name: string; score: number }> }>(
      "/jobs",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );
  },
  analyzeResume(formData: FormData) {
    return request<ResumeAnalysisResponse>("/resumes/analyze", {
      method: "POST",
      body: formData,
    });
  },
  applyForJob() {
    return request<{ message: string }>("/applications", { method: "POST" });
  },
  getResumes() {
    return request<{ resumes: ResumeRecord[] }>("/resumes");
  },
  deleteResume(id: number) {
    return request<{ message: string; deletedId: number }>(`/resumes/${id}`, {
      method: "DELETE",
    });
  },
  undoDeleteResume() {
    return request<{ message: string }>("/resumes/undo-delete", {
      method: "POST",
    });
  },
  getApplications() {
    return request<{ applications: ApplicationRecord[] }>("/applications");
  },
  getJobApplications(jobId: number) {
    return request<{ applications: JobApplicationSummary[] }>(`/jobs/${jobId}/applications`);
  },
  deleteApplication(fileName: string) {
    return request<{ message: string }>(
      `/applications/${encodeURIComponent(fileName)}`,
      {
        method: "DELETE",
      },
    );
  },
  askChatbot(message: string) {
    return request<{ response: string }>("/chatbot", {
      method: "POST",
      body: JSON.stringify({ message }),
    });
  },
  buildDownloadUrl(path: string) {
    return `${API_BASE_URL}${path}`;
  },
};
