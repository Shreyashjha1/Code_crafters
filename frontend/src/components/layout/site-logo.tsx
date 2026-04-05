import { cn } from "@/lib/utils";

interface SiteLogoProps {
  className?: string;
  compact?: boolean;
}

export function SiteLogo({ className, compact = false }: SiteLogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 via-cyan-400 to-teal-300 text-sm font-black text-slate-900 shadow-lg shadow-cyan-500/10">
        AI
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold uppercase tracking-[0.24em] text-sky-800 dark:text-sky-300">
          Resume Analyzer
        </p>
        {!compact ? (
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Match resumes, jobs, and hiring decisions faster.
          </p>
        ) : null}
      </div>
    </div>
  );
}
