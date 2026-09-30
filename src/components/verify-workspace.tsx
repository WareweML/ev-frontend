import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BarChart3, CircleHelp, Download, Folder, MoreHorizontal, MousePointerClick, ShieldCheck, Trash2, TriangleAlert, X } from "lucide-react";
import { toast } from "sonner";
import { Dropzone } from "@/components/dropzone";
import { HowItWorks } from "@/components/how-it-works";
import { downloadJob } from "@/components/job-row";
import { Page } from "@/components/page";
import { Segmented } from "@/components/segmented";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { VerifyResultCard } from "@/components/verify-result-card";
import { isEmailShape, verifyEmailAnimated, type VerifyStep } from "@/lib/engine";
import { SAMPLE_EMAILS } from "@/lib/samples";
import { formatDate, formatNumber } from "@/lib/format";
import { parseVerifyFile, registerVerifyJob, useAppStore } from "@/lib/store";
import { useJobs } from "@/lib/use-jobs";
import type { BulkJob, VerifyResult } from "@/lib/types";
import { cn } from "@/lib/utils";

const STEPS: { id: VerifyStep; label: string }[] = [
  { id: "syntax", label: "Syntax" },
  { id: "mx", label: "MX" },
  { id: "smtp", label: "Mailbox" },
  { id: "score", label: "Result" },
];

const TRY_EMAIL = "satya.nadella@microsoft.com";

const CLOUD = [
  { id: "drive", name: "Google Drive", logo: "/logos/googledrive.svg", files: ["Webinar signups.xlsx", "Newsletter.csv"] },
  { id: "onedrive", name: "Microsoft OneDrive", logo: "/logos/onedrive.svg", files: ["Trial users.xlsx"] },
  { id: "dropbox", name: "Dropbox", logo: "/logos/dropbox.svg", files: ["Outbound Q3.csv", "Partners.xlsx"] },
  { id: "airtable", name: "Airtable", logo: "/logos/airtable.svg", files: ["Customers.csv"] },
] as const;

export function VerifyWorkspace({ mode }: { mode?: "one" | "list" }) {
  const [tab, setTab] = useState<"file" | "one">(mode === "one" ? "one" : "file");

  useEffect(() => {
    if (mode === "one") setTab("one");
    if (mode === "list") setTab("file");
  }, [mode]);

  return (
    <Page>
      <ListEmail tab={tab} onTab={setTab} />
    </Page>
  );
}

function ListEmail({ tab, onTab }: { tab: "file" | "one"; onTab: (t: "file" | "one") => void }) {
  const jobs = useJobs("verify");
  const startVerifyJob = useAppStore((s) => s.startVerifyJob);
  const removeJob = useAppStore((s) => s.removeJob);
  const [open, setOpen] = useState<BulkJob | null>(null);
  const tryRef = useRef<(() => void) | null>(null);
  const [cloud, setCloud] = useState<(typeof CLOUD)[number] | null>(null);

  const live = useMemo(
    () => (open ? jobs.find((j) => j.id === open.id) ?? open : null),
    [jobs, open],
  );

  const start = useCallback(
    (name: string, emails: string[]) => {
      if (!emails.length) {
        toast.error("No emails in that file");
        return;
      }
      const id = startVerifyJob(name, emails);
      registerVerifyJob(id, emails);
      toast.success(`${emails.length} queued`);
    },
    [startVerifyJob],
  );

  const onFile = useCallback(
    (name: string, text: string) => start(name, parseVerifyFile(text)),
    [start],
  );

  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-card p-5 text-card-foreground shadow-border sm:p-6">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-h-12 items-center gap-3">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {tab === "file" ? "Bulk Verify" : "Single Email"}
            </h2>
            {tab === "file" ? <HowItWorks /> : null}
          </div>
          <Segmented
            value={tab}
            onChange={onTab}
            className="w-full lg:w-auto"
            options={[
              { value: "file", label: "Bulk Verify" },
              { value: "one", label: "Single Email" },
            ]}
          />
        </div>

        {tab === "file" ? (
          <>
            <Dropzone
              onText={onFile}
              accept=".csv,.xls,.xlsx"
              hint="CSV, XLS, or XLSX · 1 credit each"
              title="Drop a CSV of emails"
              cta="Upload list"
            />
            <div className="mt-5">
              <p className="text-sm font-medium">Import from</p>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {CLOUD.map((source) => (
                  <button
                    key={source.id}
                    type="button"
                    onClick={() => setCloud(source)}
                    className="flex min-h-28 flex-col items-center justify-center gap-3 rounded-xl bg-background px-3 text-sm shadow-border hover:bg-muted/50"
                  >
                    <img src={source.logo} alt="" className="size-10 object-contain" />
                    {source.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-2">
              <Button variant="ghost" size="sm" asChild>
                <a href="/samples/emails.csv" download>
                  <Download />
                  Template
                </a>
              </Button>
            </div>
          </>
        ) : (
          <OneEmail tryRef={tryRef} />
        )}
      </section>

      {tab === "one" ? (
        <button
          type="button"
          onClick={() => tryRef.current?.()}
          className="w-full bg-muted px-4 py-4 text-center text-sm text-muted-foreground hover:text-foreground"
        >
          Give it a try with <span className="font-medium text-primary">{TRY_EMAIL}</span>.
        </button>
      ) : null}

      <section className="rounded-xl bg-card px-5 shadow-border">
        <div className="py-4 text-sm font-semibold">Bulk Verify Tasks</div>
        {jobs.length === 0 ? (
          <p className="pb-8 text-center text-sm text-muted-foreground">No tasks yet</p>
        ) : (
          <div className="-mx-5 overflow-x-auto px-5">
            <table className="w-full min-w-[52rem] table-fixed border-separate border-spacing-0">
              <colgroup>
                <col className="w-[24%]" />
                <col className="w-[32%]" />
                <col className="w-[14%]" />
                <col className="w-[12%]" />
                <col className="w-[18%]" />
              </colgroup>
              <thead>
                <tr className="text-xs text-muted-foreground">
                  <th className="border-b border-border py-2 text-left font-normal">Task</th>
                  <th className="border-b border-border py-2 text-left font-normal">Emails</th>
                  <th className="border-b border-border py-2 text-left font-normal">Status</th>
                  <th className="border-b border-border py-2 text-left font-normal">Created</th>
                  <th className="border-b border-border py-2 text-right font-normal">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <VerifyListRow
                    key={job.id}
                    job={job}
                    onOpen={() => setOpen(job)}
                    onDelete={() => {
                      removeJob(job.id);
                      if (open?.id === job.id) setOpen(null);
                      toast.success("Task deleted");
                    }}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Dialog open={!!cloud} onOpenChange={(v) => !v && setCloud(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{cloud?.name}</DialogTitle>
          </DialogHeader>
          <ul className="divide-y divide-border">
            {cloud?.files.map((file) => (
              <li key={file}>
                <button
                  type="button"
                  className="flex min-h-12 w-full items-center text-left text-sm"
                  onClick={() => {
                    start(file, SAMPLE_EMAILS);
                    setCloud(null);
                  }}
                >
                  {file}
                </button>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>

      <Dialog open={!!live} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="truncate">{live?.name}</DialogTitle>
          </DialogHeader>
          {live ? <ProjectStats job={live} /> : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OneEmail({ tryRef }: { tryRef: { current: (() => void) | null } }) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<VerifyStep | null>(null);
  const history = useAppStore((s) => s.history);
  const [current, setCurrent] = useState<VerifyResult | null>(null);
  const runVerify = useAppStore((s) => s.runVerify);
  const clearHistory = useAppStore((s) => s.clearHistory);
  const credits = useAppStore((s) => s.credits);

  const recent = useMemo(() => {
    const seen = new Set<string>();
    const rows: VerifyResult[] = [];
    for (const item of history) {
      if (seen.has(item.email)) continue;
      seen.add(item.email);
      rows.push(item);
      if (rows.length === 6) break;
    }
    return rows;
  }, [history]);

  tryRef.current = () => void run(TRY_EMAIL);

  async function run(email: string) {
    const next = email.trim();
    if (!next || busy) return;
    if (credits < 1) {
      toast.error("Not enough credits");
      return;
    }
    setValue(next);
    setBusy(true);
    const animated = await verifyEmailAnimated(next, setStep, "ui");
    const stored = runVerify(animated.email, "ui");
    setCurrent(stored ?? animated);
    setBusy(false);
    setStep(null);
    if (!isEmailShape(next)) toast.message("No credit used");
  }

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void run(value);
        }}
        className="flex flex-col gap-2 sm:flex-row"
      >
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="name@company.com"
          aria-label="Email address"
          autoComplete="off"
          spellCheck={false}
          className="font-mono sm:flex-1"
        />
        <Button type="submit" size="lg" disabled={busy || !value.trim()} className="sm:min-w-40">
          {busy ? "Verifying" : "Verify"}
        </Button>
      </form>
      {busy ? (
        <div className="mt-3 flex gap-4 px-1">
          {STEPS.map((s, i) => {
            const idx = STEPS.findIndex((x) => x.id === step);
            const on = i <= idx;
            return (
              <span
                key={s.id}
                className={cn("text-xs font-medium", on ? "text-foreground" : "text-muted-foreground", s.id === step && "text-shimmer")}
              >
                {s.label}
              </span>
            );
          })}
        </div>
      ) : null}

      {current ? (
        <div className="mt-4">
          <VerifyResultCard result={current} />
        </div>
      ) : null}

      {recent.length ? (
        <div className="mt-6 flex items-center gap-3">
          <p className="shrink-0 text-sm font-medium">Recent</p>
          <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto">
            {recent.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setValue(item.email);
                  setCurrent(item);
                }}
                className="inline-flex h-12 shrink-0 items-center gap-2 rounded-lg bg-background px-3 text-sm shadow-border hover:bg-muted/40"
              >
                <span className="flex size-6 items-center justify-center rounded bg-muted text-[10px] font-semibold uppercase">
                  {item.email.slice(0, 1)}
                </span>
                <span className="max-w-40 truncate font-mono text-xs">{item.email}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              clearHistory();
              setCurrent(null);
            }}
            className="shrink-0 text-sm text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
        </div>
      ) : null}
    </div>
  );
}

function verifyParts(job: BulkJob) {
  const c = job.counts;
  const risky = (c.valid ?? 0) + (c.catch_all ?? 0) + (c.role ?? 0);
  const invalid = (c.invalid ?? 0) + (c.disposable ?? 0);
  return [
    { label: "Safe", n: c.safe ?? 0, bar: "bg-safe" },
    { label: "Invalid", n: invalid, bar: "bg-invalid" },
    { label: "Risky", n: risky, bar: "bg-risk" },
    { label: "Unknown", n: c.unknown ?? 0, bar: "bg-muted-foreground" },
  ].filter((part) => part.n > 0);
}

function ProjectStats({ job }: { job: BulkJob }) {
  const c = job.counts;
  const risky = (c.valid ?? 0) + (c.catch_all ?? 0) + (c.role ?? 0);
  const invalid = (c.invalid ?? 0) + (c.disposable ?? 0);
  const cards = [
    { label: "Total", n: job.total, icon: BarChart3, text: "text-primary", ring: "shadow-border" },
    { label: "Safe", n: c.safe ?? 0, icon: ShieldCheck, text: "text-safe", ring: "ring-1 ring-safe/40" },
    { label: "Invalid", n: invalid, icon: X, text: "text-invalid", ring: "ring-1 ring-invalid/40" },
    { label: "Risky", n: risky, icon: TriangleAlert, text: "text-risk", ring: "ring-1 ring-risk/50" },
    { label: "Unknown", n: c.unknown ?? 0, icon: CircleHelp, text: "text-muted-foreground", ring: "shadow-border" },
  ];

  return (
    <div>
      <h3 className="text-sm font-semibold">Task statistics</h3>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={cn("rounded-xl bg-card p-3", card.ring)}>
              <div className={cn("flex items-center justify-between text-xs font-medium", card.text)}>
                {card.label}
                <Icon className="size-3.5" />
              </div>
              <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">{formatNumber(card.n)}</p>
            </div>
          );
        })}
      </div>
      {job.status === "processing" ? (
        <p className="mt-3 text-sm text-muted-foreground">Still running. Download the file when it finishes.</p>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">Download the file for every address.</p>
      )}
    </div>
  );
}

function VerifyListRow({ job, onOpen, onDelete }: { job: BulkJob; onOpen: () => void; onDelete: () => void }) {
  const status = job.status === "processing" ? "Running" : job.status === "failed" ? "Failed" : "Completed";
  const parts = job.status === "processing" ? [] : verifyParts(job);
  const total = parts.reduce((n, part) => n + part.n, 0) || job.total || 1;
  const tone =
    status === "Completed"
      ? "bg-safe-soft text-safe"
      : status === "Failed"
        ? "bg-invalid-soft text-invalid"
        : "bg-unknown-soft text-unknown";

  return (
    <tr>
      <td className="border-b border-border py-3 pr-3">
        <button type="button" onClick={onOpen} className="flex min-w-0 items-center gap-3 text-left">
          <span className="relative flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Folder className="size-4" />
            <MousePointerClick className="absolute bottom-1 right-1 size-3 text-foreground" />
          </span>
          <span className="truncate text-sm font-medium">{job.name}</span>
        </button>
      </td>
      <td className="border-b border-border py-3 pr-3">
        <p className="text-sm font-medium tabular-nums">{formatNumber(job.total)} emails</p>
        {parts.length ? (
          <>
            <div className="mt-1.5 flex h-1.5 overflow-hidden rounded-full bg-muted">
              {parts.map((part) => (
                <div key={part.label} className={part.bar} style={{ width: `${(part.n / total) * 100}%` }} />
              ))}
            </div>
            <p className="mt-1.5 flex flex-wrap gap-x-2 text-[11px] tabular-nums text-muted-foreground">
              {parts.map((part) => (
                <span key={part.label} className="inline-flex items-center gap-1">
                  <span className={cn("size-1.5 rounded-full", part.bar)} />
                  {Math.round((part.n / total) * 100)}% {part.label}
                </span>
              ))}
            </p>
          </>
        ) : null}
      </td>
      <td className="border-b border-border py-3 pr-3 align-middle">
        <span className={cn("inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-medium", tone)}>
          {status}
        </span>
      </td>
      <td className="border-b border-border py-3 pr-3 text-xs text-muted-foreground">{formatDate(job.createdAt)}</td>
      <td className="border-b border-border py-3">
        <div className="flex items-center justify-end gap-1">
          <Button type="button" size="sm" disabled={status === "Running"} onClick={() => downloadJob(job)}>
            <Download />
            Download
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="icon-sm" aria-label={`More for ${job.name}`}>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => downloadJob(job, "valid")}>
                <Download className="size-4" />
                Download valid only
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => downloadJob(job)}>
                <Download className="size-4" />
                Download all
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={onDelete}>
                <Trash2 className="size-4" />
                Delete task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
    </tr>
  );
}
