import { RESULT_META, type VerifyResult } from "@/lib/types";
import { emailInitial } from "@/lib/format";
import { CopyButton } from "@/components/copy-button";
import { ScoreMeter } from "@/components/score-meter";
import { StatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";

function Flag({ label, on, warn }: { label: string; on: boolean; warn?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          "font-medium tabular-nums",
          on ? (warn ? "text-risk" : "text-foreground") : "text-muted-foreground",
        )}
      >
        {on ? "Yes" : "No"}
      </span>
    </div>
  );
}

export function VerifyResultRow({
  result,
  onOpen,
}: {
  result: VerifyResult;
  onOpen?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex min-h-14 w-full items-center gap-3 rounded-xl bg-card px-4 py-3 text-left shadow-border"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
        {emailInitial(result.email)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-mono text-sm font-medium">{result.email}</span>
        <span className="mt-1 flex flex-wrap items-center gap-1.5">
          <StatusBadge result={result.result} />
          <span className="text-xs text-muted-foreground">{RESULT_META[result.result].verdict}</span>
        </span>
      </span>
      <span className="text-right">
        <span className="block text-xl font-semibold tabular-nums tracking-tight">{result.score}</span>
      </span>
    </button>
  );
}

export function VerifyResultCard({ result }: { result: VerifyResult }) {
  const meta = RESULT_META[result.result];
  return (
    <div className="rounded-xl bg-card p-5 shadow-border sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {emailInitial(result.email)}
          </span>
          <div className="min-w-0">
            <div className="truncate font-mono text-sm font-medium sm:text-[15px]">{result.email}</div>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <StatusBadge result={result.result} />
              <span className="text-xs text-muted-foreground">{result.subresult.replaceAll("_", " ")}</span>
            </div>
          </div>
        </div>
        <div className="sm:text-right">
          <div className="text-3xl font-semibold tabular-nums tracking-tight">{result.score}</div>
        </div>
      </div>

      <ScoreMeter score={result.score} className="mt-5" />

      <p className="mt-4 text-sm font-medium">{meta.verdict}</p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg bg-muted/60 p-4">
          <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Mailbox</div>
          <Flag label="Deliverable" on={result.isDeliverable} />
          <Flag label="Safe to send" on={result.isSafeToSend} />
          <Flag label="MX accepts mail" on={result.mxAcceptsMail} />
          <div className="flex items-center justify-between py-1.5 text-sm">
            <span className="text-muted-foreground">Domain</span>
            <span className="font-mono text-xs">{result.domain || "—"}</span>
          </div>
        </div>
        <div className="rounded-lg bg-muted/60 p-4">
          <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Flags</div>
          <Flag label="Catch-all" on={result.isCatchAll} warn />
          <Flag label="Role" on={result.isRole} warn />
          <Flag label="Free" on={result.isFree} />
          <Flag label="Disposable" on={result.isDisposable} warn />
          <Flag label="No-reply" on={result.isNoReply} warn />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <CopyButton value={result.email} />
      </div>
    </div>
  );
}
