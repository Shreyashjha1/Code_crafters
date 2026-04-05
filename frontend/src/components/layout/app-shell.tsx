import type { ReactNode } from "react";
import { FiLogOut } from "react-icons/fi";
import { Link } from "react-router-dom";

import { SiteLogo } from "@/components/layout/site-logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";

interface AppShellProps {
  badge: string;
  title: string;
  subtitle: string;
  userName?: string;
  onLogout: () => void;
  children: ReactNode;
}

export function AppShell({
  badge,
  title,
  subtitle,
  userName,
  onLogout,
  children,
}: AppShellProps) {
  return (
    <div className="relative z-10 min-h-screen px-4 py-6 sm:px-6 lg:px-10">
      <header className="mx-auto mb-8 w-full max-w-7xl rounded-[32px] border border-border/70 bg-card/78 p-5 shadow-glow backdrop-blur-xl dark:bg-card/60">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <Link to="/" className="w-fit">
                <SiteLogo compact />
              </Link>
              <div className="inline-flex items-center rounded-full border border-sky-200/80 bg-sky-100/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-sky-900 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-200">
                {badge} Workspace
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button asChild variant="outline">
                <Link to="/">Back to Home</Link>
              </Button>
              <ThemeToggle />
              <div className="rounded-full border border-border/80 bg-card/80 px-4 py-2 text-sm text-muted-foreground">
                Signed in as <span className="font-semibold text-foreground">{userName ?? "User"}</span>
              </div>
              <Button variant="outline" onClick={onLogout}>
                <FiLogOut className="size-4" />
                Logout
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
              {title}
            </h1>
            <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
              {subtitle}
            </p>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl">{children}</main>
    </div>
  );
}
