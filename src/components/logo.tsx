import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8 text-primary", className)} aria-hidden="true">
      <circle cx="16" cy="16" r="12" fill="none" stroke="currentColor" strokeWidth="2" />
      <path
        d="M10.4 16.4 14.1 20.2 21.8 12.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ compact = false, invert = false }: { compact?: boolean; invert?: boolean }) {
  return (
    <span className={cn("flex items-center gap-2.5", invert ? "text-ink-foreground" : "text-foreground")}>
      <LogoMark />
      {compact ? null : <span className="text-[17px] font-semibold tracking-tight">Email Verifier</span>}
    </span>
  );
}
