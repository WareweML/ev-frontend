import { cn } from "@/lib/utils";

export function ScoreMeter({ score, className }: { score: number; className?: string }) {
  const clamped = Math.max(0, Math.min(100, score));
  return (
    <div className={cn("relative", className)}>
      <div className="h-1.5 overflow-hidden rounded-full bg-gradient-to-r from-invalid via-risk to-safe" />
      <div
        className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-card shadow-border ring-2 ring-foreground"
        style={{ left: `${clamped}%` }}
      />
      <div className="mt-2 flex justify-between text-[10px] tabular-nums text-muted-foreground">
        <span>0</span>
        <span>40</span>
        <span>70</span>
        <span>100</span>
      </div>
    </div>
  );
}
