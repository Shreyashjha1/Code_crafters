import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-border/80 bg-card/80 px-3 py-1 text-xs font-semibold text-foreground/80 backdrop-blur",
        className,
      )}
      {...props}
    />
  );
}
