import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Folder, MoreHorizontal, MousePointerClick, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { CompanySearchResults } from "@/components/company-search";
import { Dropzone } from "@/components/dropzone";
import { FindResultCard } from "@/components/find-result-card";
import { HowItWorks } from "@/components/how-it-works";
import { downloadJob } from "@/components/job-row";
import { Page } from "@/components/page";
import { Segmented } from "@/components/segmented";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FIRST_FIND } from "@/lib/samples";
import { formatDate, formatNumber } from "@/lib/format";
import { buildCompanySearch, type CompanySearchView } from "@/lib/company-search";
import { isLinkedInCompany, isLinkedInProfile, lookupLinkedIn } from "@/lib/linkedin";
import { parseFindFile, registerFindJob, useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useJobs } from "@/lib/use-jobs";
import type { BulkJob, FindResult } from "@/lib/types";

type Mode = "person" | "domain" | "list";

const FIND_SOURCES = [
  { id: "drive", name: "Google Drive", logo: "/logos/googledrive.svg", file: "Prospects.xlsx" },
  { id: "onedrive", name: "Microsoft OneDrive", logo: "/logos/onedrive.svg", file: "Conference.csv" },
  { id: "dropbox", name: "Dropbox", logo: "/logos/dropbox.svg", file: "Outbound.csv" },
  { id: "airtable", name: "Airtable", logo: "/logos/airtable.svg", file: "People.csv" },
] as const;

const FIND_EMAIL_STEPS = [
  {
    n: "1",
    title: "Tell us who",
    body: "Use a name and company, or a LinkedIn profile.",
  },
  {
    n: "2",
    title: "Get the work email",
    body: "5 credits if we find it. 10 with enriched details. Free if we don't.",
  },
] as const;

const BULK_FIND_STEPS = [
  {
    n: "1",
    title: "Give us the list",
    body: "Drop a CSV, XLS, or XLSX, or import one from Drive, OneDrive, Dropbox, or Airtable. Each row is a name and company, or a LinkedIn URL.",
  },
  {
    n: "2",
    title: "Get the result file",
    body: "We look up a work email for every row. Download it when the list is done. 5 credits for each email found.",
  },
] as const;

const FIND_TEMPLATE = `full_name,company,linkedin_url
Jane Cooper,acme.com,
Amelia Chen,Northstar Labs,
,,https://www.linkedin.com/in/kumar-manaswi
`;

export const Route = createFileRoute("/_app/find")({
  validateSearch: (s: Record<string, unknown>): { mode?: Mode; q?: string } => {
    const out: { mode?: Mode; q?: string } = {};
    if (s.mode === "domain" || s.mode === "list" || s.mode === "person") out.mode = s.mode;
    if (typeof s.q === "string") out.q = s.q;
    return out;
  },
  component: FindPage,
});

function FindPage() {
  const { mode: searchMode = "person" } = Route.useSearch();
  const navigate = Route.useNavigate();
  const mode: "person" | "list" = searchMode === "list" ? "list" : "person";
  const setMode = (m: "person" | "list") => void navigate({ search: (prev) => ({ ...prev, mode: m }) });
  const title = mode === "list" ? "Bulk Find" : "Find Email";

  return (
    <Page className="max-w-7xl">
      <div className="space-y-6">
        {mode === "list" ? (
          <ListFind title={title} mode={mode} onMode={setMode} />
        ) : (
          <PersonFind title={title} mode={mode} onMode={setMode} />
        )}
        <FindTaskList />
      </div>
    </Page>
  );
}

function FindShell({
  title,
  mode,
  onMode,
  children,
  below,
}: {
  title: string;
  mode: "person" | "list";
  onMode: (m: "person" | "list") => void;
  children: ReactNode;
  below?: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-card p-5 text-card-foreground shadow-border sm:p-6">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-h-12 items-center gap-3">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
            <HowItWorks steps={mode === "list" ? BULK_FIND_STEPS : FIND_EMAIL_STEPS} />
          </div>
          <Segmented
            value={mode}
            onChange={onMode}
            className="w-full lg:w-auto"
            options={[
              { value: "person", label: "Find Email" },
              { value: "list", label: "Bulk Find" },
            ]}
          />
        </div>
        {children}
      </section>
      {below}
    </div>
  );
}

function PersonFind({ title, mode, onMode }: { title: string; mode: "person" | "list"; onMode: (m: "person" | "list") => void }) {
  const [via, setVia] = useState<"name" | "linkedin">("name");
  const [name, setName] = useState(FIRST_FIND.name);
  const [company, setCompany] = useState(FIRST_FIND.company);
  const [linkedin, setLinkedin] = useState("");
  const [enrich, setEnrich] = useState(false);
  const [busy, setBusy] = useState(false);
  const finds = useAppStore((s) => s.finds);
  const clearFinds = useAppStore((s) => s.clearFinds);
  const [current, setCurrent] = useState<FindResult | null>(null);
  const runFind = useAppStore((s) => s.runFind);

  function takeName(v: string) {
    if (isLinkedInProfile(v)) {
      setLinkedin(v.trim());
      setVia("linkedin");
      return;
    }
    setName(v);
  }

  async function submit(enrich: boolean) {
    if (busy) return;
    let first = name;
    let companyOrDomain = company;
    if (via === "linkedin") {
      if (isLinkedInCompany(linkedin)) {
        toast.error("Need a profile, not a company page");
        return;
      }
      const person = lookupLinkedIn(linkedin);
      if (!person) {
        toast.error("Need a LinkedIn profile");
        return;
      }
      first = `${person.firstName} ${person.lastName}`.trim();
      companyOrDomain = person.domain;
    } else if (!name.trim() || !company.trim()) {
      return;
    }
    setBusy(true);
    await new Promise((r) => setTimeout(r, 500));
    const result = runFind(first, companyOrDomain, enrich);
    if (result.reason === "insufficient_credits") toast.error("Not enough credits");
    setCurrent(result);
    setBusy(false);
  }

  async function trySatya() {
    if (busy) return;
    setVia("name");
    setName("Satya Nadella");
    setCompany("microsoft.com");
    setEnrich(true);
    setBusy(true);
    await new Promise((r) => setTimeout(r, 500));
    const result = runFind("Satya Nadella", "microsoft.com", true);
    if (result.reason === "insufficient_credits") toast.error("Not enough credits");
    setCurrent(result);
    setBusy(false);
  }

  const recent = finds
    .filter(
      (item, i) =>
        finds.findIndex((x) => x.firstName === item.firstName && x.lastName === item.lastName && x.company === item.company) === i,
    )
    .slice(0, 6);

  return (
    <FindShell
      title={title}
      mode={mode}
      onMode={onMode}
      below={
        busy ? null : (
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 bg-muted px-4 py-4 text-center text-sm text-muted-foreground">
            <button type="button" onClick={() => void trySatya()} className="hover:text-foreground">
              Give it a try with <span className="font-medium text-primary">Satya Nadella</span> at microsoft.com.
            </button>
            <span>or</span>
            <button
              type="button"
              onClick={() => onMode("list")}
              className="inline-flex items-center gap-2 hover:text-foreground"
            >
              <Upload className="size-4" />
              Upload a list of names and domains to find
            </button>
          </div>
        )
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit(enrich);
        }}
      >
        <div
          className="mb-4 inline-flex overflow-hidden rounded-lg border border-foreground/20 bg-background"
          role="tablist"
          aria-label="Find with"
        >
          {(
            [
              ["name", "Name and company"],
              ["linkedin", "LinkedIn"],
            ] as const
          ).map(([k, label], i) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={via === k}
              onClick={() => setVia(k)}
              className={cn(
                "min-h-11 px-4 text-sm font-medium",
                i > 0 && "border-l border-foreground/20",
                via === k ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {via === "name" ? (
          <div>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
              <div className="grid flex-1 gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
                <div>
                  <Label htmlFor="full-name">Name</Label>
                  <Input
                    id="full-name"
                    value={name}
                    onChange={(e) => takeName(e.target.value)}
                    placeholder="Jane Cooper"
                    className="mt-1.5"
                  />
                </div>
                <div className="hidden h-12 items-center justify-center text-muted-foreground sm:flex">@</div>
                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="acme.com"
                    className="mt-1.5"
                  />
                </div>
              </div>
              <Button type="submit" size="lg" disabled={busy} className="w-full lg:w-auto">
                {busy ? "Finding" : "Find email"}
              </Button>
            </div>
            <FindChoice enrich={enrich} onEnrich={setEnrich} />
          </div>
        ) : (
          <div>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
              <div className="flex-1">
                <Label htmlFor="linkedin-url">LinkedIn profile</Label>
                <Input
                  id="linkedin-url"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="linkedin.com/in/amelia-chen"
                  className="mt-1.5"
                />
              </div>
              <Button type="submit" size="lg" disabled={busy} className="w-full lg:w-auto">
                {busy ? "Finding" : "Find email"}
              </Button>
            </div>
            <FindChoice enrich={enrich} onEnrich={setEnrich} />
          </div>
        )}
      </form>
      {current ? (
        <div className="mt-4">
          <FindResultCard result={current} />
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
                  setVia("name");
                  setName(`${item.firstName} ${item.lastName}`.trim());
                  setCompany(item.domain ?? item.company);
                  setEnrich(!!item.enriched);
                  setCurrent(item);
                }}
                className="inline-flex h-12 shrink-0 items-center gap-2 rounded-lg bg-background px-3 text-sm shadow-border hover:bg-muted/40"
              >
                <span className="flex size-6 items-center justify-center rounded bg-muted text-[10px] font-semibold uppercase">
                  {item.firstName.slice(0, 1)}
                </span>
                <span className="max-w-40 truncate text-xs">
                  {item.firstName} {item.lastName}
                </span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              clearFinds();
              setCurrent(null);
            }}
            className="shrink-0 text-sm text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
        </div>
      ) : null}
    </FindShell>
  );
}

function FindChoice({ enrich, onEnrich }: { enrich: boolean; onEnrich: (v: boolean) => void }) {
  return (
    <div className="mt-3 flex flex-col gap-1 lg:items-end">
      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <Checkbox
          checked={enrich}
          onCheckedChange={(v) => onEnrich(v === true)}
          aria-label="Include enriched details"
        />
        Include enriched details
        <span className="text-muted-foreground">{enrich ? "· 10 credits" : "· 5 credits"}</span>
      </label>
      <p className="text-xs text-muted-foreground">Free if no email is found.</p>
    </div>
  );
}

function DomainFind({ title, mode, onMode }: { title: string; mode: Mode; onMode: (m: Mode) => void }) {
  const { q } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [value, setValue] = useState(q ?? "northstarlabs.io");
  const [busy, setBusy] = useState(false);
  const domains = useAppStore((s) => s.domains);
  const runDomain = useAppStore((s) => s.runDomain);
  const [view, setView] = useState<CompanySearchView | null>(() => {
    const seed = q ?? domains[0]?.domain;
    return seed ? buildCompanySearch(seed) : null;
  });

  useEffect(() => {
    if (!q) return;
    setValue(q);
    const built = buildCompanySearch(q);
    if (!built.found) {
      setView(built);
      return;
    }
    const r = runDomain(q);
    if (!r.found) {
      toast.error("Not enough credits");
      return;
    }
    setView(built);
  }, [q, runDomain]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await go(value);
  }

  async function go(input: string) {
    const next = input.trim();
    if (!next || busy) return;
    setBusy(true);
    await new Promise((r) => setTimeout(r, 400));
    const built = buildCompanySearch(next);
    if (!built.found) {
      setView(built);
      setBusy(false);
      return;
    }
    const r = runDomain(next);
    if (!r.found) {
      toast.error("Not enough credits");
      setBusy(false);
      return;
    }
    setView(built);
    void navigate({ search: (prev) => ({ ...prev, mode: "domain", q: built.domain }) });
    setBusy(false);
  }

  const results = view?.found ? (
    <CompanySearchResults view={view} onSearchDomain={(d) => void go(d)} />
  ) : view && !view.found ? (
    <div className="rounded-xl bg-card p-6 shadow-border">
      <p className="text-sm font-medium">No people for {view.domain || "that company"}</p>
      <p className="mt-1 text-sm text-muted-foreground">No credit used</p>
    </div>
  ) : null;

  return (
    <FindShell
      title={title}
      mode={mode === "list" ? "list" : "person"}
      onMode={onMode}
      below={results}
    >
      <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Label htmlFor="domain">Company or domain</Label>
          <Input
            id="domain"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="acme.com"
            className="mt-1.5"
          />
        </div>
        <Button type="submit" size="lg" disabled={busy} className="sm:min-w-44">
          {busy ? "Searching" : "Find people"}
        </Button>
      </form>
    </FindShell>
  );
}

function ListFind({ title, mode, onMode }: { title: string; mode: "person" | "list"; onMode: (m: "person" | "list") => void }) {
  const startFindJob = useAppStore((s) => s.startFindJob);
  const [cloud, setCloud] = useState<(typeof FIND_SOURCES)[number] | null>(null);

  const start = useCallback(
    (name: string, parsed: ReturnType<typeof parseFindFile>) => {
      if (!parsed.rows.length) {
        toast.error("Need a name and company, or a LinkedIn URL");
        return;
      }
      const id = startFindJob(name, parsed.rows, parsed.intake);
      registerFindJob(id, parsed.rows);
      toast.success(`${parsed.rows.length} queued`);
    },
    [startFindJob],
  );

  const onFile = useCallback(
    (name: string, text: string) => start(name, parseFindFile(text)),
    [start],
  );

  return (
    <FindShell title={title} mode={mode} onMode={onMode}>
      <Dropzone
        onText={onFile}
        accept=".csv,.xls,.xlsx"
        hint="CSV, XLS, or XLSX · full name and company, or a LinkedIn URL"
        title="Drop a list of people"
        cta="Upload list"
      />
      <div className="mt-5">
        <p className="text-sm font-medium">Import from</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {FIND_SOURCES.map((source) => (
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
          <a href="/samples/people.csv" download>
            <Download />
            Template
          </a>
        </Button>
      </div>
      <Dialog open={!!cloud} onOpenChange={(v) => !v && setCloud(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{cloud?.name}</DialogTitle>
          </DialogHeader>
          {cloud ? (
            <button
              type="button"
              className="flex min-h-12 w-full items-center text-left text-sm"
              onClick={() => {
                start(cloud.file, parseFindFile(FIND_TEMPLATE));
                setCloud(null);
              }}
            >
              {cloud.file}
            </button>
          ) : null}
        </DialogContent>
      </Dialog>
    </FindShell>
  );
}

function FindTaskList() {
  const jobs = useJobs("find", 3, 280);
  const removeJob = useAppStore((s) => s.removeJob);
  const [open, setOpen] = useState<BulkJob | null>(null);
  const live = open ? (jobs.find((job) => job.id === open.id) ?? open) : null;

  return (
    <section className="rounded-xl bg-card px-5 shadow-border">
      <div className="py-4 text-sm font-semibold">Bulk Find Email Tasks</div>
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
                <FindTaskRow
                  key={job.id}
                  job={job}
                  onOpen={() => setOpen(job)}
                  onDelete={() => {
                    removeJob(job.id);
                    toast.success("Task deleted");
                  }}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{live?.name}</DialogTitle>
          </DialogHeader>
          {live ? <FindUploadSummary job={live} /> : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function findSendParts(job: BulkJob) {
  const rows = job.results as FindResult[];
  const found = rows.filter((row) => row.found);
  const safe = found.filter((row) => row.verified).length;
  const risky = found.length - safe;
  return [
    { label: "Safe to send", n: safe, bar: "bg-safe" },
    { label: "Risky to send", n: risky, bar: "bg-risk" },
  ].filter((part) => part.n > 0);
}

function FindTaskRow({ job, onOpen, onDelete }: { job: BulkJob; onOpen: () => void; onDelete: () => void }) {
  const status = job.status === "processing" ? "Running" : job.status === "failed" ? "Failed" : "Completed";
  const parts = job.status === "processing" ? [] : findSendParts(job);
  const found = (job.results as FindResult[]).filter((row) => row.found).length || job.found || 0;
  const total = parts.reduce((n, part) => n + part.n, 0) || 1;
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
        <p className="text-sm font-medium tabular-nums">{formatNumber(found)} Found</p>
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
      <td className="border-b border-border py-3 pr-3">
        <span className={cn("inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-medium", tone)}>{status}</span>
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
              <DropdownMenuItem onSelect={() => downloadJob(job, "safe")}>
                <Download className="size-4" />
                Download safe to send
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => downloadJob(job, "valid")}>
                <Download className="size-4" />
                Download found
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

function FindUploadSummary({ job }: { job: BulkJob }) {
  const intake = job.intake ?? {
    uploaded: job.total,
    unique: job.total,
    duplicates: 0,
    skipped: 0,
    mapped: "Name and company",
  };
  const rows = [
    ["Unique profiles", formatNumber(intake.unique)],
    ["Uploaded", formatNumber(intake.uploaded)],
    ["Duplicates removed", formatNumber(intake.duplicates)],
    ["Skipped", formatNumber(intake.skipped)],
    ["Mapped columns", intake.mapped],
  ] as const;

  return (
    <div>
      <dl className="divide-y divide-border overflow-hidden rounded-xl shadow-border">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4 px-4 py-3">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="text-right text-sm font-medium">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-sm text-muted-foreground">Download the file for every result.</p>
    </div>
  );
}
