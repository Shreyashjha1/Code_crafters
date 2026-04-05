import { useEffect, useMemo, useState, type ComponentType, type FormEvent } from "react";
import { motion } from "framer-motion";
import {
  FiArrowRight,
  FiAward,
  FiBriefcase,
  FiCheckCircle,
  FiClock,
  FiTarget,
  FiUploadCloud,
  FiXCircle,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { ChatbotPanel } from "@/components/chat/chatbot-panel";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { api, ApiError } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { Job, ResumeAnalysisResponse } from "@/types/api";

const ALLOWED_FILE_EXTENSIONS = [".pdf", ".docx", ".txt"];

export function JobSeekerPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<ResumeAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    void loadJobs();
  }, []);

  useEffect(() => {
    setAnalysis(null);
    setHasApplied(false);
  }, [
    selectedJobId,
    selectedFile?.name,
    selectedFile?.size,
    selectedFile?.lastModified,
  ]);

  async function loadJobs() {
    setIsLoading(true);
    try {
      const response = await api.getJobs();
      setJobs(response.jobs);
      setSelectedJobId((current) =>
        response.jobs.some((job) => job.id === current) ? current : response.jobs[0]?.id ?? null,
      );
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Unable to load jobs.";
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

  async function handleAnalyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedJobId) {
      toast.error("Choose a job first.");
      return;
    }

    if (!selectedFile) {
      toast.error("Upload a resume file first.");
      return;
    }

    const lowerName = selectedFile.name.toLowerCase();
    const isSupported = ALLOWED_FILE_EXTENSIONS.some((extension) =>
      lowerName.endsWith(extension),
    );
    if (!isSupported) {
      toast.error("Only PDF, DOCX, and TXT files are supported.");
      return;
    }

    const formData = new FormData();
    formData.append("job_id", String(selectedJobId));
    formData.append("resume", selectedFile);

    setIsAnalyzing(true);
    try {
      const response = await api.analyzeResume(formData);
      setAnalysis(response);
      setHasApplied(false);
      toast.success("Resume analyzed successfully.");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Unable to analyze the resume.";
      toast.error(message);
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleApply() {
    if (!analysis) {
      toast.error("Analyze your resume before applying.");
      return;
    }

    setIsApplying(true);
    try {
      const response = await api.applyForJob();
      setHasApplied(true);
      toast.success(response.message);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Unable to submit the application.";
      toast.error(message);
    } finally {
      setIsApplying(false);
    }
  }

  const selectedJob = useMemo(
    () => jobs.find((job) => job.id === selectedJobId) ?? null,
    [jobs, selectedJobId],
  );

  const selectedSkills = useMemo(
    () =>
      selectedJob?.skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean) ?? [],
    [selectedJob],
  );

  return (
    <>
      <AppShell
        badge="Job Seeker"
        title="Analyze your resume before you apply."
        subtitle="Choose an active role, upload your resume, review the score and skill gaps, then submit your application once the match is strong enough."
        userName={user?.name}
        onLogout={() => {
          void handleLogout();
        }}
      >
        <section className="mb-6 grid gap-4 md:grid-cols-3">
          <MetricCard label="Active roles" value={String(jobs.length)} tone="cyan" icon={FiBriefcase} />
          <MetricCard
            label="Selected role"
            value={selectedJob?.role ?? "No selection"}
            tone="amber"
            icon={FiTarget}
          />
          <MetricCard
            label="Latest score"
            value={analysis ? `${analysis.result.score}%` : "Not analyzed"}
            tone="emerald"
            icon={FiAward}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-display text-3xl text-slate-950 dark:text-white">Active Jobs</h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Pick a role first so the app can compare your resume against the right skills.
                </p>
              </div>
              <Button variant="outline" onClick={() => void loadJobs()}>
                Refresh Jobs
              </Button>
            </div>

            {isLoading ? (
              <Card className="text-sm text-slate-600 dark:text-slate-300">
                Fetching active jobs from the server...
              </Card>
            ) : jobs.length === 0 ? (
              <Card className="text-sm text-slate-600 dark:text-slate-300">
                There are no active jobs right now. Check back after a recruiter posts a new role.
              </Card>
            ) : (
              jobs.map((job, index) => (
                <motion.button
                  key={job.id}
                  type="button"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  onClick={() => setSelectedJobId(job.id)}
                  className="block w-full text-left"
                >
                  <Card
                    className={
                      selectedJobId === job.id
                        ? "border-sky-300/70 bg-sky-50/55 ring-1 ring-sky-200 dark:border-sky-400/30 dark:bg-sky-500/08 dark:ring-sky-400/15"
                        : "hover:-translate-y-0.5"
                    }
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="rounded-2xl bg-slate-200 p-3 text-slate-700 dark:bg-slate-700 dark:text-slate-100">
                            <FiBriefcase className="size-5" />
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-slate-950 dark:text-white">
                              {job.role}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              {job.company}
                            </p>
                          </div>
                        </div>

                        <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                          {job.description}
                        </p>

                        <div className="flex flex-wrap gap-2">
                          {job.skills.split(",").map((skill) => (
                            <Badge key={`${job.id}-${skill}`}>{skill.trim()}</Badge>
                          ))}
                        </div>
                      </div>

                      <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/80 px-4 py-2 text-sm text-slate-600 dark:text-slate-300">
                        <FiClock className="size-4 text-rose-500" />
                        Apply by {formatDate(job.expiryDate)}
                      </div>
                    </div>
                  </Card>
                </motion.button>
              ))
            )}
          </div>

          <div className="space-y-6 xl:sticky xl:top-6">
            <Card className="space-y-5">
              <div className="space-y-2">
                <h2 className="font-display text-3xl text-slate-950 dark:text-white">
                  Upload and Analyze
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Upload your resume, compare it with the selected role, and get a clear read on
                  your fit before you apply.
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleAnalyze}>
                <div className="rounded-[28px] border border-dashed border-border bg-muted/60 p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-2xl bg-primary/85 p-3 text-primary-foreground">
                      <FiUploadCloud className="size-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-950 dark:text-white">
                        {selectedJob ? `${selectedJob.company} - ${selectedJob.role}` : "No role selected"}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {selectedSkills.length
                          ? selectedSkills.join(" | ")
                          : "Choose a role to see the target skills."}
                      </p>
                    </div>
                  </div>

                  <input
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                    className="block w-full rounded-2xl border border-border/80 bg-background/85 px-4 py-3 text-sm text-foreground"
                  />

                  <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                    Supported formats: PDF, DOCX, and TXT.
                  </p>
                </div>

                <Button className="w-full" size="lg" disabled={isAnalyzing || !selectedJobId}>
                  {isAnalyzing ? "Analyzing resume..." : "Upload and Match"}
                  <FiArrowRight className="size-4" />
                </Button>
              </form>
            </Card>

            {analysis ? (
              <Card className="space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                      Match Result
                    </p>
                    <h3 className="font-display text-4xl text-slate-950 dark:text-white">
                      {analysis.result.score}%
                    </h3>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                      Based on {analysis.job.role} at {analysis.job.company}
                    </p>
                  </div>

                  <Badge
                    className={
                      analysis.result.canApply
                        ? "border-emerald-200/80 bg-emerald-50/65 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100"
                        : "border-amber-200/80 bg-amber-50/65 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100"
                    }
                  >
                    {analysis.result.canApply ? "Ready to apply" : "Improve before applying"}
                  </Badge>
                </div>

                <Progress value={analysis.result.score} />

                <div className="grid gap-4 md:grid-cols-2">
                  <ResultList
                    title="Matched Skills"
                    icon={FiCheckCircle}
                    tone="emerald"
                    items={analysis.result.matched}
                    emptyText="No matched skills detected yet."
                  />
                  <ResultList
                    title="Missing Skills"
                    icon={FiXCircle}
                    tone="rose"
                    items={analysis.result.missing}
                    emptyText="No gaps found for this role."
                  />
                </div>

                <ResultList
                  title="Suggestions"
                  icon={FiAward}
                  tone="cyan"
                  items={analysis.result.suggestions}
                  emptyText="No suggestions needed right now."
                />

                <Button
                  className="w-full"
                  size="lg"
                  disabled={!analysis.result.canApply || isApplying || hasApplied}
                  onClick={() => void handleApply()}
                >
                  {hasApplied
                    ? "Application submitted"
                    : isApplying
                      ? "Submitting application..."
                      : "Apply for this job"}
                  <FiArrowRight className="size-4" />
                </Button>
              </Card>
            ) : (
              <Card className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  Match preview
                </p>
                <h3 className="font-display text-2xl text-slate-950 dark:text-white">
                  Your score will appear here after analysis.
                </h3>
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Once you upload a resume for the selected role, the app will show your score,
                  missing skills, and next-step suggestions in this panel.
                </p>
              </Card>
            )}
          </div>
        </section>
      </AppShell>

      <ChatbotPanel />
    </>
  );
}

function MetricCard({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  tone: "cyan" | "amber" | "emerald";
  icon: ComponentType<{ className?: string }>;
}) {
  const toneClass =
    tone === "cyan"
      ? "from-sky-400/10 to-cyan-400/8 dark:from-sky-400/12 dark:to-cyan-400/4"
      : tone === "amber"
        ? "from-amber-300/12 to-orange-300/8 dark:from-amber-300/12 dark:to-orange-300/4"
        : "from-emerald-300/12 to-teal-300/8 dark:from-emerald-300/12 dark:to-teal-300/4";

  return (
    <Card className={`bg-gradient-to-br ${toneClass}`}>
      <div className="flex items-start justify-between gap-4">
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

function ResultList({
  title,
  icon: Icon,
  tone,
  items,
  emptyText,
}: {
  title: string;
  icon: ComponentType<{ className?: string }>;
  tone: "emerald" | "rose" | "cyan";
  items: string[];
  emptyText: string;
}) {
  const toneClass =
    tone === "emerald"
      ? "border-emerald-100/80 bg-emerald-50/55 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100"
      : tone === "rose"
        ? "border-rose-100/80 bg-rose-50/55 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-100"
        : "border-sky-100/80 bg-sky-50/55 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-100";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-slate-500 dark:text-slate-400" />
        <h4 className="font-semibold text-slate-900 dark:text-white">{title}</h4>
      </div>
      <div className="space-y-2">
        {items.length ? (
          items.map((item) => (
            <div key={`${title}-${item}`} className={`rounded-2xl border px-4 py-3 text-sm ${toneClass}`}>
              {item}
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-border bg-muted px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
            {emptyText}
          </div>
        )}
      </div>
    </div>
  );
}
