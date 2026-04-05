import { useEffect, useMemo, useState, type ComponentType, type FormEvent } from "react";
import { motion } from "framer-motion";
import {
  FiArrowDown,
  FiBriefcase,
  FiCheckCircle,
  FiDownload,
  FiFileText,
  FiPlus,
  FiRotateCcw,
  FiSend,
  FiTrash2,
  FiUsers,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { ChatbotPanel } from "@/components/chat/chatbot-panel";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { api, ApiError } from "@/lib/api";
import { formatDate, getAverageScore } from "@/lib/utils";
import type {
  ApplicationRecord,
  JobApplicationSummary,
  RecruiterJob,
  ResumeRecord,
} from "@/types/api";

const initialJobForm = {
  company: "",
  role: "",
  skills: "",
  description: "",
  expiryDate: "",
};

export function RecruiterPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [resumes, setResumes] = useState<ResumeRecord[]>([]);
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [jobs, setJobs] = useState<RecruiterJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [jobApplicationsOpen, setJobApplicationsOpen] = useState(false);
  const [jobForm, setJobForm] = useState(initialJobForm);
  const [isSubmittingJob, setIsSubmittingJob] = useState(false);
  const [topMatches, setTopMatches] = useState<Array<{ name: string; score: number }>>([]);
  const [selectedJobApplications, setSelectedJobApplications] = useState<JobApplicationSummary[]>([]);
  const [selectedJobForApplications, setSelectedJobForApplications] = useState<RecruiterJob | null>(null);
  const [isLoadingJobApplications, setIsLoadingJobApplications] = useState(false);

  useEffect(() => {
    void loadDashboard();
  }, []);

  async function loadDashboard() {
    setIsLoading(true);
    try {
      const [resumeResponse, applicationResponse, jobResponse] = await Promise.all([
        api.getResumes(),
        api.getApplications(),
        api.getRecruiterJobs(),
      ]);

      setResumes(resumeResponse.resumes);
      setApplications(applicationResponse.applications);
      setJobs(jobResponse.jobs);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Unable to load the dashboard.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await api.logout();
    } finally {
      setUser(null);
      navigate("/auth");
    }
  }

  async function handlePostJob(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmittingJob(true);

    try {
      const response = await api.createJob(jobForm);
      toast.success(response.message);
      setTopMatches(response.topMatches);
      setJobForm(initialJobForm);
      setDialogOpen(false);
      await loadDashboard();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Unable to post the job.";
      toast.error(message);
    } finally {
      setIsSubmittingJob(false);
    }
  }

  async function handleDeleteResume(id: number) {
    try {
      const response = await api.deleteResume(id);
      toast.success(response.message);
      await loadDashboard();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Unable to delete the resume.";
      toast.error(message);
    }
  }

  async function handleUndoDelete() {
    try {
      const response = await api.undoDeleteResume();
      toast.success(response.message);
      await loadDashboard();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Nothing to restore right now.";
      toast.error(message);
    }
  }

  async function handleDeleteApplication(fileName: string) {
    try {
      const response = await api.deleteApplication(fileName);
      toast.success(response.message);
      await loadDashboard();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Unable to delete the application.";
      toast.error(message);
    }
  }

  async function handleViewJobApplications(job: RecruiterJob) {
    setSelectedJobForApplications(job);
    setJobApplicationsOpen(true);
    setIsLoadingJobApplications(true);

    try {
      const response = await api.getJobApplications(job.id);
      setSelectedJobApplications(response.applications);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Unable to load job applications right now.";
      toast.error(message);
      setSelectedJobApplications([]);
    } finally {
      setIsLoadingJobApplications(false);
    }
  }

  const averageScore = useMemo(
    () => getAverageScore(resumes.map((resume) => resume.score)),
    [resumes],
  );

  const minExpiryDate = useMemo(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().split("T")[0];
  }, []);

  return (
    <>
      <AppShell
        badge="Recruiter"
        title="Run hiring from one clear recruiter workspace."
        subtitle="Post roles, review analyzed resumes, download candidate files, and manage applications from a single dashboard built around the app's actual hiring flow."
        userName={user?.name}
        onLogout={() => {
          void handleLogout();
        }}
      >
        <section className="mb-6 grid gap-4 md:grid-cols-4">
          <OverviewCard label="Resumes" value={String(resumes.length)} icon={FiFileText} />
          <OverviewCard label="Applications" value={String(applications.length)} icon={FiUsers} />
          <OverviewCard label="Active jobs" value={String(jobs.length)} icon={FiBriefcase} />
          <OverviewCard label="Average score" value={`${averageScore}%`} icon={FiCheckCircle} />
        </section>

        <div className="mb-6 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="font-display text-3xl text-slate-950 dark:text-white">
              Recruiter Control Room
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Keep job postings active, review the resume queue, and move through applications
              without bouncing between screens.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() =>
                window.open(api.buildDownloadUrl("/resumes/download-all"), "_self")
              }
            >
              <FiDownload className="size-4" />
              Download All
            </Button>
            <Button variant="outline" onClick={() => void handleUndoDelete()}>
              <FiRotateCcw className="size-4" />
              Undo Delete
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <FiPlus className="size-4" />
                  Post Job
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Post a new role</DialogTitle>
                  <DialogDescription>
                    Add the role details here and the app will push the job into the recruiter
                    pipeline right away.
                  </DialogDescription>
                </DialogHeader>

                <form className="mt-6 space-y-4" onSubmit={handlePostJob}>
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      value={jobForm.company}
                      onChange={(event) =>
                        setJobForm((current) => ({ ...current, company: event.target.value }))
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Input
                      id="role"
                      value={jobForm.role}
                      onChange={(event) =>
                        setJobForm((current) => ({ ...current, role: event.target.value }))
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="skills">Skills</Label>
                    <Input
                      id="skills"
                      placeholder="Python, Flask, PostgreSQL"
                      value={jobForm.skills}
                      onChange={(event) =>
                        setJobForm((current) => ({ ...current, skills: event.target.value }))
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Add responsibilities, expectations, or hiring notes."
                      value={jobForm.description}
                      onChange={(event) =>
                        setJobForm((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expiryDate">Expiry Date</Label>
                    <Input
                      id="expiryDate"
                      type="date"
                      min={minExpiryDate}
                      value={jobForm.expiryDate}
                      onChange={(event) =>
                        setJobForm((current) => ({
                          ...current,
                          expiryDate: event.target.value,
                        }))
                      }
                      required
                    />
                  </div>

                  <Button className="w-full" size="lg" disabled={isSubmittingJob}>
                    {isSubmittingJob ? "Posting role..." : "Submit Job"}
                    <FiSend className="size-4" />
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {topMatches.length ? (
          <Card className="mb-6 border-emerald-200/70 bg-emerald-50/60 dark:border-emerald-500/20 dark:bg-emerald-500/08">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-200">
                  Fresh Match Preview
                </p>
                <h3 className="font-display text-2xl text-emerald-950 dark:text-white">
                  Top candidates for the latest job
                </h3>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              {topMatches.map((candidate) => (
                <div
                  key={`${candidate.name}-${candidate.score}`}
                  className="rounded-[24px] border border-emerald-200/70 bg-card/82 p-4 dark:border-emerald-500/20 dark:bg-card/62"
                >
                  <p className="text-sm text-emerald-700 dark:text-emerald-200">{candidate.name}</p>
                  <p className="mt-2 font-display text-3xl text-emerald-900 dark:text-white">
                    {candidate.score}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-6">
            <Card>
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="font-display text-2xl text-slate-950 dark:text-white">
                    Resume Queue
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Recently analyzed resumes from job seekers.
                  </p>
                </div>
                <Button variant="outline" onClick={() => void loadDashboard()}>
                  Refresh
                </Button>
              </div>

              {isLoading ? (
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Loading recruiter data...
                </p>
              ) : resumes.length === 0 ? (
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  No resumes have been analyzed yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {resumes.map((resume, index) => (
                    <motion.div
                      key={resume.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="rounded-[28px] border border-border/80 bg-card/75 p-4"
                    >
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-3">
                            <h4 className="text-lg font-semibold text-slate-950 dark:text-white">
                              {resume.name}
                            </h4>
                            <Badge className="border-cyan-100 bg-cyan-50 text-cyan-700 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-100">
                              {resume.score}%
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-300">
                            {resume.skills}
                          </p>
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                            Uploaded {formatDate(resume.uploadedAt)}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              window.open(
                                api.buildDownloadUrl(`/resumes/${resume.id}/download`),
                                "_self",
                              )
                            }
                          >
                            <FiArrowDown className="size-4" />
                            Download
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => void handleDeleteResume(resume.id)}
                          >
                            <FiTrash2 className="size-4" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <div className="mb-5">
                <h3 className="font-display text-2xl text-slate-950 dark:text-white">
                  Applications
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Ranked by score so strong matches rise to the top.
                </p>
              </div>

              {isLoading ? (
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Loading applications...
                </p>
              ) : applications.length === 0 ? (
                <p className="text-sm text-slate-600 dark:text-slate-300">No applications yet.</p>
              ) : (
                <div className="space-y-3">
                  {applications.map((application) => (
                    <div
                      key={`${application.jobId}-${application.resume}`}
                      className="rounded-[28px] border border-border/80 bg-card/75 p-4"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-3">
                            <h4 className="text-lg font-semibold text-slate-950 dark:text-white">
                              {application.name}
                            </h4>
                            <Badge className="border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100">
                              {application.score}%
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-300">
                            {application.company} - {application.role}
                          </p>
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                            Resume file: {application.resume}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              window.open(
                                api.buildDownloadUrl(
                                  `/applications/${encodeURIComponent(application.resume)}/download`,
                                ),
                                "_self",
                              )
                            }
                          >
                            <FiArrowDown className="size-4" />
                            Download
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => void handleDeleteApplication(application.resume)}
                          >
                            <FiTrash2 className="size-4" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-6">
            <Dialog open={jobApplicationsOpen} onOpenChange={setJobApplicationsOpen}>
              <Card>
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-2xl text-slate-950 dark:text-white">
                    Active Jobs
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Open roles with live application counts.
                  </p>
                </div>
              </div>

              {isLoading ? (
                <p className="text-sm text-slate-600 dark:text-slate-300">Loading jobs...</p>
              ) : jobs.length ? (
                <div className="space-y-3">
                  {jobs.map((job) => (
                    <div
                      key={job.id}
                      className="rounded-[28px] border border-border/80 bg-gradient-to-br from-card to-muted/70 p-4 dark:from-card/78 dark:to-muted/45"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="text-lg font-semibold text-slate-950 dark:text-white">
                            {job.role}
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-300">
                            {job.company}
                          </p>
                        </div>
                        <Badge className="border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100">
                          {job.applicationCount} apps
                        </Badge>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {job.description}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {job.skills.split(",").map((skill) => (
                          <Badge key={`${job.id}-${skill}`}>{skill.trim()}</Badge>
                        ))}
                      </div>
                      <p className="mt-4 text-xs uppercase tracking-[0.18em] text-slate-400">
                        Expires {formatDate(job.expiryDate)}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => void handleViewJobApplications(job)}
                        >
                          View Applicants
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-600 dark:text-slate-300">No active jobs yet.</p>
              )}
              </Card>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {selectedJobForApplications
                      ? `${selectedJobForApplications.role} applicants`
                      : "Job applicants"}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedJobForApplications
                      ? `Applications submitted for ${selectedJobForApplications.company}.`
                      : "Review applications for the selected role."}
                  </DialogDescription>
                </DialogHeader>

                {isLoadingJobApplications ? (
                  <p className="text-sm text-slate-600">Loading applicants...</p>
                ) : selectedJobApplications.length ? (
                  <div className="space-y-3">
                    {selectedJobApplications.map((application) => (
                      <div
                        key={`${application.resume}-${application.name}`}
                        className="rounded-[24px] border border-border/80 bg-card/80 p-4"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-base font-semibold text-slate-950">
                              {application.name}
                            </p>
                            <p className="text-sm text-slate-500">{application.resume}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className="border-emerald-100 bg-emerald-50 text-emerald-700">
                              {application.score}%
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                window.open(
                                  api.buildDownloadUrl(
                                    `/applications/${encodeURIComponent(application.resume)}/download`,
                                  ),
                                  "_self",
                                )
                              }
                            >
                              <FiArrowDown className="size-4" />
                              Download
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-600">
                    No applications have been submitted for this job yet.
                  </p>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </section>
      </AppShell>

      <ChatbotPanel />
    </>
  );
}

function OverviewCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="bg-gradient-to-br from-card via-card to-muted/70 dark:from-card/76 dark:via-card/72 dark:to-muted/45">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-3 font-display text-4xl text-slate-950 dark:text-white">{value}</p>
        </div>
        <div className="rounded-2xl bg-slate-200 p-3 text-slate-700 dark:bg-slate-700 dark:text-slate-100">
          <Icon className="size-5" />
        </div>
      </div>
    </Card>
  );
}
