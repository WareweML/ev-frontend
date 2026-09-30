import { Download, Folder } from "lucide-react";
import type { BulkJob, ResultKind } from "@/lib/types";
import { formatDate, formatNumber } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const TONE: Partial<Record<ResultKind, string>> = {
  safe: "bg-safe",
  valid: "bg-risk",
  catch_all: "bg-risk",
  role: "bg-risk",
  invalid: "bg-invalid",
  disposable: "bg-invalid",
  unknown: "bg-unknown",
};

export function downloadJob(job: BulkJob, mode: "all" | "valid" | "safe" = "all") {
  let csv = "";
  if (job.type === "verify") {
    csv = "email,result,score,status\n";
    const rows = job.results as { email: string; result: string; score: number; status: string }[];
    if (rows.length) {
      for (const r of rows) {
        if (mode === "valid" && r.result !== "safe" && r.result !== "valid") continue;
        csv += `${r.email},${r.result},${r.score},${r.status}\n`;
      }
    } else {
      for (const [kind, n] of Object.entries(job.counts)) {
        if (mode === "valid" && kind !== "safe" && kind !== "valid") continue;
        for (let i = 0; i < (n ?? 0); i++) {
          csv += `user${i}@${kind}.example,${kind},${kind === "safe" ? 95 : 20},${kind === "invalid" ? "invalid" : "valid"}\n`;
        }
      }
    }
  } else {
    csv = "name,company,email,confidence,safe_to_send\n";
    const rows = job.results as {
      firstName: string;
      lastName: string;
      company: string;
      email?: string;
      found: boolean;
      verified?: boolean;
      confidence?: number;
    }[];
    if (rows.length) {
      for (const r of rows) {
        if (mode === "valid" && !r.found) continue;
        if (mode === "safe" && !(r.found && r.verified)) continue;
        const safe = r.found && r.verified ? "yes" : r.found ? "risky" : "";
        csv += `${r.firstName} ${r.lastName},${r.company},${r.email ?? ""},${r.confidence ?? ""},${safe}\n`;
      }
    }
  }
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const suffix =
    job.type === "find"
      ? mode === "safe"
        ? "-safe.csv"
        : mode === "valid"
          ? "-found.csv"
          : "-results.csv"
      : mode === "valid"
        ? "-valid.csv"
        : "-results.csv";
  a.download = job.name.replace(/\.\w+$/, "") + suffix;
  a.click();
  URL.revokeObjectURL(url);
}

export function JobRow({ job, onOpen }: { job: BulkJob; onOpen?: () => void }) {
  const total = job.total || 1;
  const parts = Object.entries(job.counts) as [ResultKind, number][];
  const pct = Math.round((job.processed / total) * 100);

  return (
    <div className="grid grid-cols-1 items-center gap-3 py-4 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto_auto] sm:gap-4">
      <button type="button" onClick={onOpen} className="flex min-w-0 items-center gap-3 text-left">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Folder className="size-4" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium">{job.name}</span>
          <span className="text-xs text-muted-foreground">
            {formatNumber(job.total)} {job.type === "verify" ? "emails" : "rows"}
            {job.type === "find" && job.found != null ? ` · ${job.found} found` : ""}
          </span>
        </span>
      </button>

      <div className="min-w-0">
        {job.status === "processing" ? (
          <div>
            <Progress value={pct} />
            <div className="mt-1 text-[11px] tabular-nums text-muted-foreground">{pct}%</div>
          </div>
        ) : (
          <div>
            <div className="flex h-1.5 overflow-hidden rounded-full bg-muted">
              {parts.map(([k, n]) => (
                <div
                  key={k}
                  className={TONE[k] ?? "bg-muted-foreground"}
                  style={{ width: `${(n / total) * 100}%` }}
                />
              ))}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-x-2 text-[11px] tabular-nums text-muted-foreground">
              {parts.map(([k, n]) => (
                <span key={k}>
                  {Math.round((n / total) * 100)}% {k.replace("_", " ")}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Badge variant={job.status === "completed" ? "safe" : job.status === "failed" ? "invalid" : "unknown"}>
          {job.status === "processing" ? "Running" : job.status === "completed" ? "Done" : "Failed"}
        </Badge>
        <span className="hidden text-xs text-muted-foreground lg:inline">{formatDate(job.createdAt)}</span>
      </div>

      <div className="flex justify-end">
        <Button
          variant="outline"
          disabled={job.status !== "completed"}
          onClick={() => downloadJob(job)}
        >
          <Download />
          Download results
        </Button>
      </div>
    </div>
  );
}
