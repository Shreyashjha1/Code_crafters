import { motion } from "framer-motion";
import {
  FiArrowRight,
  FiBarChart2,
  FiBriefcase,
  FiCheckCircle,
  FiFileText,
  FiMessageSquare,
  FiShield,
  FiTarget,
  FiUsers,
  FiZap,
} from "react-icons/fi";
import { Link } from "react-router-dom";

import { SiteLogo } from "@/components/layout/site-logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

const featureCards = [
  {
    title: "Resume Match Scoring",
    description:
      "Upload a resume, compare it against a target role, and see matched skills, missing skills, and suggestions instantly.",
    icon: FiTarget,
  },
  {
    title: "Role-Based Workspaces",
    description:
      "Job seekers and recruiters each get a focused workflow designed for the tasks they actually need to finish.",
    icon: FiUsers,
  },
  {
    title: "Recruiter Control Room",
    description:
      "Post jobs, review resume queues, download files, and keep applications organized in one place.",
    icon: FiBarChart2,
  },
  {
    title: "Application Tracking",
    description:
      "Candidates can only apply after a strong enough score, which keeps application quality more consistent.",
    icon: FiCheckCircle,
  },
  {
    title: "Hiring Assistant",
    description:
      "Built-in chatbot guidance helps users understand resumes, scores, and next steps without leaving the app.",
    icon: FiMessageSquare,
  },
  {
    title: "Protected Sessions",
    description:
      "Authentication and role checks keep resume uploads, recruiter actions, and application flows separated safely.",
    icon: FiShield,
  },
];

const workflowSteps = [
  {
    title: "Create your account",
    description: "Choose whether you are a job seeker or recruiter and enter the workspace built for that role.",
  },
  {
    title: "Run the core workflow",
    description: "Job seekers analyze resumes against jobs, while recruiters post roles and monitor the hiring pipeline.",
  },
  {
    title: "Take action with confidence",
    description: "Apply with a qualified score, shortlist strong candidates, and download files when needed.",
  },
];

const rolePanels = [
  {
    title: "For job seekers",
    points: [
      "Browse active jobs before uploading a resume.",
      "See score, matched skills, missing skills, and suggestions.",
      "Apply only when your resume is strong enough for the role.",
    ],
    icon: FiFileText,
  },
  {
    title: "For recruiters",
    points: [
      "Post jobs with skills, description, and expiry date.",
      "Review analyzed resumes and ranked applications.",
      "Download resumes individually or in bulk when needed.",
    ],
    icon: FiBriefcase,
  },
];

export function LandingPage() {
  const { user } = useAuth();
  const workspaceHref = user
    ? user.role === "recruiter"
      ? "/recruiter"
      : "/job-seeker"
    : "/auth?mode=signup";

  return (
    <div className="relative z-10 min-h-screen px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="sticky top-4 z-30 rounded-[32px] border border-border/70 bg-card/78 px-5 py-4 shadow-glow backdrop-blur-xl transition-colors dark:bg-card/60">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Link to="/" className="w-fit">
              <SiteLogo compact />
            </Link>

            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
              <a href="#features" className="rounded-full px-3 py-2 transition hover:bg-black/5 dark:hover:bg-white/5">
                Features
              </a>
              <a href="#workflow" className="rounded-full px-3 py-2 transition hover:bg-black/5 dark:hover:bg-white/5">
                How It Works
              </a>
              <a href="#roles" className="rounded-full px-3 py-2 transition hover:bg-black/5 dark:hover:bg-white/5">
                Who It Helps
              </a>
              <ThemeToggle />
              {user ? (
                <Button asChild>
                  <Link to={workspaceHref}>
                    Open Workspace
                    <FiArrowRight className="size-4" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="outline" className="hidden sm:inline-flex">
                    <Link to="/auth?mode=login">Log In</Link>
                  </Button>
                  <Button asChild>
                    <Link to="/auth?mode=signup">
                      Create Account
                      <FiArrowRight className="size-4" />
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="rounded-[40px] border border-border/70 bg-card/76 p-8 shadow-glow backdrop-blur-xl dark:bg-card/60 sm:p-10"
          >
            <div className="inline-flex w-fit items-center rounded-full border border-sky-200/80 bg-sky-100/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-sky-900 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-200">
              Smarter hiring workflow
            </div>

            <div className="mt-6 space-y-5">
              <h1 className="max-w-3xl font-display text-5xl leading-tight text-slate-950 dark:text-white sm:text-6xl">
                Screen resumes, guide applicants, and manage hiring in one focused app.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">
                AI Resume Analyzer helps job seekers understand how well their resume fits a role
                and gives recruiters a cleaner way to post jobs, review resumes, and track
                applications.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {user ? (
                <>
                  <Button asChild size="lg">
                    <Link to={workspaceHref}>
                      Go To Dashboard
                      <FiArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <a href="#workflow">See how it works</a>
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild size="lg">
                    <Link to="/auth?mode=signup">
                      Create Account
                      <FiArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link to="/auth?mode=login">Log In</Link>
                  </Button>
                  <Button asChild variant="ghost" size="lg">
                    <a href="#workflow">See how it works</a>
                  </Button>
                </>
              )}
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <MetricPill label="Role-based access" value="2 workspaces" />
              <MetricPill label="Resume insights" value="Score + skills" />
              <MetricPill label="Recruiter actions" value="Jobs + downloads" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="grid gap-5"
          >
            <Card className="overflow-hidden rounded-[40px] border-sky-200/70 bg-[linear-gradient(160deg,rgba(239,246,255,0.96),rgba(236,253,245,0.92))] text-slate-900 shadow-[0_24px_70px_rgba(14,116,144,0.10)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.22em] text-cyan-700">
                    Job Seeker View
                  </p>
                  <h2 className="mt-3 font-display text-3xl">Match your resume before you apply</h2>
                </div>
                <div className="rounded-2xl bg-white/80 p-3 text-cyan-700 shadow-sm">
                  <FiZap className="size-5" />
                </div>
              </div>

              <div className="mt-8 grid gap-4">
                <PreviewRow label="Target role" value="Backend Developer" tone="cyan" />
                <PreviewRow label="Match score" value="78%" tone="emerald" />
                <PreviewRow label="Missing skills" value="Docker, CI/CD" tone="amber" />
              </div>
            </Card>

            <div className="grid gap-5 sm:grid-cols-2">
              <Card className="rounded-[32px] border-border/70 bg-card/88">
                <p className="text-sm uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                  Recruiter View
                </p>
                <h3 className="mt-3 font-display text-2xl text-slate-950 dark:text-white">
                  Spot strong candidates faster
                </h3>
                <div className="mt-6 space-y-3">
                  <MiniStat label="Active jobs" value="12" />
                  <MiniStat label="Top application" value="92%" />
                  <MiniStat label="Resume queue" value="Always sorted" />
                </div>
              </Card>

              <Card className="rounded-[32px] border-emerald-200/70 bg-emerald-50/60 dark:border-emerald-500/20 dark:bg-emerald-500/08">
                <p className="text-sm uppercase tracking-[0.22em] text-emerald-800 dark:text-emerald-200">
                  Built for action
                </p>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-emerald-900/85 dark:text-emerald-100">
                  <li>Resume uploads stay tied to job analysis.</li>
                  <li>Applications stay gated by score.</li>
                  <li>Recruiters keep full download access.</li>
                </ul>
              </Card>
            </div>
          </motion.div>
        </section>

        <section
          id="features"
          className="rounded-[40px] border border-border/70 bg-card/76 p-8 shadow-glow backdrop-blur-xl dark:bg-card/60 sm:p-10"
        >
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700 dark:text-cyan-300">
              Core features
            </p>
            <h2 className="mt-3 font-display text-4xl text-slate-950 dark:text-white">
              Everything in the app points back to the hiring workflow.
            </h2>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {featureCards.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: index * 0.04 }}
                className="rounded-[28px] border border-border/70 bg-card/82 p-5 dark:bg-card/64"
              >
                <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-100">
                  <item.icon className="size-5" />
                </div>
                <h3 className="text-xl font-semibold text-slate-950 dark:text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        <section id="workflow" className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="rounded-[40px] border-amber-200/70 bg-amber-50/55 dark:border-amber-500/20 dark:bg-amber-500/08">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-900 dark:text-amber-200">
              What makes it useful
            </p>
            <h2 className="mt-3 font-display text-4xl text-amber-950 dark:text-white">
              Candidates get clarity. Recruiters get signal.
            </h2>
            <p className="mt-5 text-sm leading-7 text-amber-900/85 dark:text-amber-100/90">
              The app is built around the real handoff between candidate and company: match the
              resume to the role, understand the gaps, then move into applications with cleaner
              recruiter visibility.
            </p>
          </Card>

          <div className="grid gap-4">
            {workflowSteps.map((step, index) => (
              <Card
                key={step.title}
                className="rounded-[30px] border-border/70 bg-card/82 dark:bg-card/64"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/85 text-sm font-bold text-primary-foreground">
                    0{index + 1}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-950 dark:text-white">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {step.description}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section id="roles" className="grid gap-6 lg:grid-cols-2">
          {rolePanels.map((panel) => (
            <Card
              key={panel.title}
              className="rounded-[36px] border-border/70 bg-card/82 dark:bg-card/64"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-teal-300 text-slate-900">
                  <panel.icon className="size-5" />
                </div>
                <h2 className="font-display text-3xl text-slate-950 dark:text-white">
                  {panel.title}
                </h2>
              </div>

              <div className="mt-6 space-y-3">
                {panel.points.map((point) => (
                  <div
                    key={point}
                    className="rounded-[24px] border border-border/70 bg-muted/70 px-4 py-4 text-sm text-slate-700 dark:bg-muted/55 dark:text-slate-200"
                  >
                    {point}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </section>

        <section className="rounded-[40px] border border-sky-200/70 bg-[linear-gradient(160deg,rgba(239,246,255,0.96),rgba(255,251,235,0.92))] p-8 text-slate-900 shadow-glow sm:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700">
                Ready to use the app
              </p>
              <h2 className="mt-3 font-display text-4xl">
                Start with the workflow that fits your role.
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                Sign in as a recruiter to post jobs and manage candidates, or as a job seeker to
                analyze your resume before applying.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {user ? (
                <Button asChild size="lg">
                  <Link to={workspaceHref}>
                    Open Workspace
                    <FiArrowRight className="size-4" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="lg">
                    <Link to="/auth?mode=signup">
                      Create Account
                      <FiArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="border-sky-200 bg-white/80 text-slate-900 hover:bg-white"
                  >
                    <Link to="/auth?mode=login">Log In</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </section>

        <footer className="rounded-[32px] border border-border/70 bg-card/78 px-6 py-6 text-sm text-slate-600 shadow-glow backdrop-blur-xl dark:bg-card/60 dark:text-slate-300">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <SiteLogo />

            <div className="flex flex-wrap items-center gap-3">
              <a href="#features" className="rounded-full px-3 py-2 transition hover:bg-black/5 dark:hover:bg-white/5">
                Features
              </a>
              <a href="#workflow" className="rounded-full px-3 py-2 transition hover:bg-black/5 dark:hover:bg-white/5">
                Workflow
              </a>
              <a href="#roles" className="rounded-full px-3 py-2 transition hover:bg-black/5 dark:hover:bg-white/5">
                Roles
              </a>
              <Link
                to="/auth?mode=login"
                className="rounded-full px-3 py-2 transition hover:bg-black/5 dark:hover:bg-white/5"
              >
                Log In
              </Link>
              <Link
                to="/auth?mode=signup"
                className="rounded-full px-3 py-2 transition hover:bg-black/5 dark:hover:bg-white/5"
              >
                Create Account
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

function MetricPill({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[26px] border border-border/70 bg-card/82 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">{value}</p>
    </div>
  );
}

function PreviewRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "cyan" | "emerald" | "amber";
}) {
  const toneClass =
    tone === "cyan"
      ? "border-sky-200/80 bg-sky-50/85 text-sky-800"
      : tone === "emerald"
        ? "border-emerald-200/80 bg-emerald-50/85 text-emerald-800"
        : "border-amber-200/80 bg-amber-50/85 text-amber-800";

  return (
    <div className={`rounded-[24px] border px-4 py-4 ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-75">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[22px] border border-border/70 bg-muted/62 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">{value}</p>
    </div>
  );
}
