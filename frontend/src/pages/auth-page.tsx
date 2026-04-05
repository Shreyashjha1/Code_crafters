import {
  startTransition,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { motion } from "framer-motion";
import {
  FiArrowRight,
  FiBriefcase,
  FiCheckCircle,
  FiFileText,
  FiShield,
  FiUser,
} from "react-icons/fi";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { SiteLogo } from "@/components/layout/site-logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/api";

type AuthMode = "login" | "signup";

const valueCards = [
  {
    title: "Resume analysis that stays practical",
    description: "See score, matched skills, missing skills, and suggestions before you apply.",
    icon: FiFileText,
  },
  {
    title: "Recruiter workflows that stay focused",
    description: "Post jobs, review resumes, and keep applications organized without extra clutter.",
    icon: FiBriefcase,
  },
  {
    title: "Role-based access and protected sessions",
    description: "Job seeker and recruiter actions stay separated, so the app behaves predictably.",
    icon: FiShield,
  },
];

const roleBenefits = [
  {
    role: "Job seeker",
    description: "Upload a resume, compare it to a live job, and apply only when the score is strong enough.",
  },
  {
    role: "Recruiter",
    description: "Post roles, review candidates, download resumes, and track ranked applications in one place.",
  },
];

export function AuthPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { refreshSession, setUser, user } = useAuth();
  const [mode, setMode] = useState<AuthMode>(
    searchParams.get("mode") === "signup" ? "signup" : "login",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "jobseeker" as UserRole,
  });

  const targetRoute = useMemo(() => {
    if (!user) return "/auth?mode=login";
    return user.role === "recruiter" ? "/recruiter" : "/job-seeker";
  }, [user]);

  useEffect(() => {
    const nextMode = searchParams.get("mode") === "signup" ? "signup" : "login";
    setMode(nextMode);
  }, [searchParams]);

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setSearchParams({ mode: nextMode }, { replace: true });
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await api.login(loginForm);
      const sessionUser = await refreshSession();
      const authenticatedUser = sessionUser ?? response.user;

      if (!authenticatedUser) {
        throw new ApiError("Unable to establish your session. Please try again.", 401);
      }

      setUser(authenticatedUser);
      toast.success("Welcome back. Your workspace is ready.");
      startTransition(() => {
        navigate(authenticatedUser.role === "recruiter" ? "/recruiter" : "/job-seeker");
      });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Unable to log in right now.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await api.register(signupForm);
      toast.success("Account created. You can sign in now.");
      switchMode("login");
      setLoginForm((current) => ({ ...current, email: signupForm.email }));
      setSignupForm({
        name: "",
        email: "",
        password: "",
        role: "jobseeker",
      });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Unable to create your account.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    if (!user) return;

    startTransition(() => {
      navigate(targetRoute);
    });
  }, [navigate, targetRoute, user]);

  return (
    <div className="relative z-10 min-h-screen px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-7xl flex-col gap-6">
        <header className="rounded-[32px] border border-border/70 bg-card/78 px-5 py-4 shadow-glow backdrop-blur-xl dark:bg-card/60">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Link to="/" className="w-fit">
              <SiteLogo compact />
            </Link>

            <div className="flex flex-wrap items-center gap-3">
              <ThemeToggle />
              <Button asChild variant="outline">
                <Link to="/">Back to Home</Link>
              </Button>
            </div>
          </div>
        </header>

        <div className="grid flex-1 gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="flex flex-col justify-between rounded-[40px] border border-sky-200/70 bg-[linear-gradient(160deg,rgba(239,246,255,0.96),rgba(255,251,235,0.92))] p-8 text-slate-900 shadow-2xl shadow-sky-100/70 sm:p-10"
          >
            <div>
              <div className="inline-flex items-center rounded-full border border-sky-200 bg-white/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-sky-800">
                Access the hiring workflow
              </div>

              <div className="mt-6 space-y-5">
                <h1 className="max-w-2xl font-display text-5xl leading-tight text-slate-950 sm:text-6xl">
                  Sign in to the workspace that fits your role.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                  AI Resume Analyzer supports both sides of the hiring process: resume matching for
                  candidates and job management for recruiters.
                </p>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {roleBenefits.map((item) => (
                  <div
                    key={item.role}
                    className="rounded-[28px] border border-sky-100 bg-white/70 p-5 backdrop-blur"
                  >
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-800">
                      {item.role}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 grid gap-4">
              {valueCards.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 * index }}
                  className="rounded-[28px] border border-sky-100 bg-white/72 p-5 backdrop-blur"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                      <item.icon className="size-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold">{item.title}</h2>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="flex items-center"
          >
            <Card className="w-full overflow-hidden rounded-[40px] border-border/70 bg-[linear-gradient(180deg,rgba(250,248,243,0.98),rgba(243,246,250,0.96))] p-0 shadow-[0_24px_80px_rgba(15,23,42,0.10)] dark:bg-card/68">
              <div className="border-b border-border/70 bg-[linear-gradient(180deg,rgba(239,244,248,0.86),rgba(250,248,243,0.96))] px-6 pt-6 dark:bg-transparent">
                <div className="grid grid-cols-2 rounded-full border border-slate-200 bg-white/90 p-1 shadow-sm dark:border-border dark:bg-muted">
                  {(["login", "signup"] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => switchMode(tab)}
                      className={cn(
                        "rounded-full px-4 py-3 text-sm font-semibold transition",
                        mode === tab
                          ? "bg-slate-700 text-white shadow-sm dark:bg-card dark:text-foreground"
                          : "text-slate-600 hover:text-slate-950 dark:text-muted-foreground dark:hover:text-foreground",
                      )}
                    >
                      {tab === "login" ? "Sign In" : "Create Account"}
                    </button>
                  ))}
                </div>

                <div className="px-1 pb-6 pt-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-800 dark:text-sky-300">
                    {mode === "login" ? "Welcome back" : "Create your access"}
                  </p>
                  <h2 className="mt-2 font-display text-3xl text-slate-950 dark:text-white">
                    {mode === "login"
                      ? "Continue where you left off."
                      : "Join the hiring workflow."}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
                    {mode === "login"
                      ? "Use your account to open the right workspace instantly."
                      : "Create an account and choose whether you are applying or recruiting."}
                  </p>
                </div>
              </div>

              <div className="bg-white/72 p-6 dark:bg-transparent sm:p-8">
                <AnimateMode mode={mode}>
                  {mode === "login" ? (
                    <form className="space-y-5" onSubmit={handleLogin}>
                      <div className="rounded-[24px] border border-sky-200/80 bg-sky-50/70 px-4 py-4 text-sm text-sky-900 shadow-sm dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-100">
                        Log in with your existing account and the app will open the correct
                        workspace based on your backend role.
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="login-email">Email</Label>
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="you@example.com"
                          value={loginForm.email}
                          onChange={(event) =>
                            setLoginForm((current) => ({ ...current, email: event.target.value }))
                          }
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="login-password">Password</Label>
                        <Input
                          id="login-password"
                          type="password"
                          placeholder="Enter your password"
                          value={loginForm.password}
                          onChange={(event) =>
                            setLoginForm((current) => ({
                              ...current,
                              password: event.target.value,
                            }))
                          }
                          required
                        />
                      </div>

                      <Button className="w-full" size="lg" disabled={isSubmitting}>
                        {isSubmitting ? "Signing you in..." : "Enter Workspace"}
                        <FiArrowRight className="size-4" />
                      </Button>
                    </form>
                  ) : (
                    <form className="space-y-5" onSubmit={handleSignup}>
                      <div className="rounded-[24px] border border-amber-200/80 bg-amber-50/70 px-4 py-4 text-sm text-amber-900 shadow-sm dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100">
                        Choose your role carefully. Recruiters see recruiter tools only, and job
                        seekers see the resume analysis and application flow only.
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-name">Full Name</Label>
                        <Input
                          id="signup-name"
                          placeholder="Your name"
                          value={signupForm.name}
                          onChange={(event) =>
                            setSignupForm((current) => ({ ...current, name: event.target.value }))
                          }
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="you@example.com"
                          value={signupForm.email}
                          onChange={(event) =>
                            setSignupForm((current) => ({ ...current, email: event.target.value }))
                          }
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="At least 6 characters"
                          value={signupForm.password}
                          onChange={(event) =>
                            setSignupForm((current) => ({
                              ...current,
                              password: event.target.value,
                            }))
                          }
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Role</Label>
                        <Select
                          value={signupForm.role}
                          onValueChange={(value) =>
                            setSignupForm((current) => ({
                              ...current,
                              role: value as UserRole,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose your role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="jobseeker">
                              <span className="inline-flex items-center gap-2">
                                <FiUser className="size-4" />
                                Job Seeker
                              </span>
                            </SelectItem>
                            <SelectItem value="recruiter">
                              <span className="inline-flex items-center gap-2">
                                <FiBriefcase className="size-4" />
                                Recruiter
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="rounded-[24px] border border-emerald-200/80 bg-emerald-50/65 px-4 py-4 text-sm text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100">
                        <div className="flex items-start gap-3">
                          <FiCheckCircle className="mt-0.5 size-4 shrink-0" />
                          <p>
                            Pick <span className="font-semibold">Job Seeker</span> if you want to
                            analyze and apply. Pick <span className="font-semibold">Recruiter</span>{" "}
                            if you want to post jobs and review candidates.
                          </p>
                        </div>
                      </div>

                      <Button className="w-full" size="lg" disabled={isSubmitting}>
                        {isSubmitting ? "Creating your account..." : "Create Account"}
                        <FiArrowRight className="size-4" />
                      </Button>
                    </form>
                  )}
                </AnimateMode>
              </div>
            </Card>
          </motion.section>
        </div>
      </div>
    </div>
  );
}

function AnimateMode({
  children,
  mode,
}: {
  children: ReactNode;
  mode: AuthMode;
}) {
  return (
    <motion.div
      key={mode}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}
