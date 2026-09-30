import { useMemo, useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Download,
  FileUp,
  Folder,
  MailSearch,
  MoreHorizontal,
  Trash2,
  Users,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { BuyCreditsDialog, CREDIT_PACKS } from "@/components/buy-credits";
import { downloadJob } from "@/components/job-row";
import { Page } from "@/components/page";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate, formatNumber } from "@/lib/format";
import { downloadList } from "@/lib/export-list";
import { listMemberIds, resultUnit } from "@/lib/leads-data";
import { useAppStore, usePlan } from "@/lib/store";
import { useJobs } from "@/lib/use-jobs";
import { asLeadKind, type BulkJob } from "@/lib/types";
import { cn } from "@/lib/utils";

type ProjectTab = "verify" | "find" | "leads";

export const Route = createFileRoute("/_app/")({
  component: Dashboard,
});

function Dashboard() {
  const [tab, setTab] = useState<ProjectTab>("verify");
  const plan = usePlan();

  return (
    <Page className="max-w-[88rem]">
      <div className="space-y-6">
        <CreditsBanner />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:items-stretch">
          <ActionCard
            title="Verify Emails"
            body="Clean a list before you send, so more emails land."
            icon={FileUp}
            to="/verify"
            cta="Verify emails"
          />
          <ActionCard
            title="Find Emails"
            body="A name and company, or a LinkedIn profile."
            icon={MailSearch}
            to="/find"
            cta="Find emails"
          />
          <ActionCard
            title="Search Leads"
            body="Find people to contact, then save them as a list."
            icon={Users}
            to="/leads"
            cta={plan.features.leads ? "Search leads" : "On Subscription"}
          />
        </div>
        <Projects tab={tab} onTab={setTab} />
      </div>
    </Page>
  );
}

function CreditsBanner() {
  const credits = useAppStore((s) => s.credits);
  const usage = useAppStore((s) => s.usage);
  const [buy, setBuy] = useState<number | null>(null);
  const used = usage.reduce((n, day) => n + day.verify + day.find * 5 + day.api, 0);

  return (
    <>
      <section className="flex flex-col gap-5 rounded-xl bg-card p-5 shadow-border lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Credits Overview</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight">
            {formatNumber(credits)}
            <span className="ml-2 text-base font-normal text-muted-foreground">credits</span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{formatNumber(used)} credits used so far.</p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <p className="text-xs font-medium">Buy credits</p>
          <div className="flex flex-wrap gap-2">
            {CREDIT_PACKS.map((pack) => (
              <Button
                key={pack.credits}
                type="button"
                variant={pack.recommended ? "default" : "outline"}
                onClick={() => setBuy(pack.credits)}
              >
                {formatNumber(pack.credits)} · ${pack.price}
              </Button>
            ))}
          </div>
        </div>
      </section>
      <BuyCreditsDialog
        open={buy !== null}
        initialCredits={buy ?? undefined}
        onOpenChange={(v) => {
          if (!v) setBuy(null);
        }}
      />
    </>
  );
}

function ActionCard({
  title,
  body,
  icon: Icon,
  to,
  cta,
}: {
  title: string;
  body: string;
  icon: LucideIcon;
  to: "/verify" | "/find" | "/leads";
  cta: string;
}) {
  return (
    <section className="flex h-full flex-col rounded-xl bg-card p-5 shadow-border">
      <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="size-4" />
      </div>
      <h2 className="mt-4 text-base font-semibold tracking-tight">{title}</h2>
      <p className="mt-1.5 flex-1 text-sm text-muted-foreground">{body}</p>
      <Button asChild className="mt-5 w-full">
        <Link to={to}>{cta}</Link>
      </Button>
    </section>
  );
}

function Projects({ tab, onTab }: { tab: ProjectTab; onTab: (t: ProjectTab) => void }) {
  const verifyJobs = useJobs("verify");
  const findJobs = useJobs("find");
  const saved = useAppStore((s) => s.savedSearches);
  const removeJob = useAppStore((s) => s.removeJob);
  const deleteSearch = useAppStore((s) => s.deleteSearch);

  const verifyRows = useMemo(
    () => [...verifyJobs].sort((a, b) => b.createdAt - a.createdAt),
    [verifyJobs],
  );
  const findRows = useMemo(
    () => [...findJobs].sort((a, b) => b.createdAt - a.createdAt),
    [findJobs],
  );
  const leadRows = useMemo(
    () => [...saved].sort((a, b) => (b.updatedAt ?? b.createdAt) - (a.updatedAt ?? a.createdAt)),
    [saved],
  );

  const tabs: { value: ProjectTab; label: string; icon: LucideIcon; count: number }[] = [
    { value: "verify", label: "Verify Emails", icon: FileUp, count: verifyRows.length },
    { value: "find", label: "Find Emails", icon: MailSearch, count: findRows.length },
    { value: "leads", label: "Search Leads", icon: Users, count: saved.length },
  ];

  const empty =
    tab === "verify" && verifyRows.length === 0
      ? { to: "/verify" as const, cta: "Verify a list", label: "No email lists yet" }
      : tab === "find" && findRows.length === 0
        ? { to: "/find" as const, cta: "Find emails", label: "No finder lists yet", search: { mode: "list" as const } }
        : tab === "leads" && saved.length === 0
          ? { to: "/leads" as const, cta: "Search leads", label: "No lead lists yet" }
          : null;

  return (
    <section className="rounded-xl bg-card px-5 shadow-border">
      <div className="flex flex-col gap-3 py-4 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="text-sm font-semibold">Recent Projects</h2>
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1" role="tablist">
          {tabs.map((item) => {
            const Icon = item.icon;
            const on = tab === item.value;
            return (
              <button
                key={item.value}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => onTab(item.value)}
                className={cn(
                  "flex min-h-12 items-center justify-center gap-2 rounded-lg px-2 text-sm font-medium",
                  on ? "bg-card text-foreground shadow-border" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="truncate">{item.label}</span>
                <span className={cn("tabular-nums text-xs", on ? "text-muted-foreground" : "text-muted-foreground/80")}>
                  {item.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {empty ? (
        <Empty to={empty.to} cta={empty.cta} search={"search" in empty ? empty.search : undefined}>
          {empty.label}
        </Empty>
      ) : (
        <div className="-mx-5 overflow-x-auto px-5">
          <div className="min-w-[46rem]">
            <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(11rem,1.2fr)_6.5rem_6.5rem_auto] gap-3 border-b border-border py-2 text-xs text-muted-foreground">
              <span>Project</span>
              <span>{tab === "leads" ? "Count" : "Emails"}</span>
              <span>Status</span>
              <span>Created</span>
              <span className="text-right">Actions</span>
            </div>
            <ul className="divide-y divide-border">
              {tab === "verify"
                ? verifyRows.map((job) => (
                    <ProjectTableRow
                      key={job.id}
                      name={job.name}
                      to="/verify"
                      date={job.createdAt}
                      status={jobStatus(job)}
                      count={job.total}
                      unit="emails"
                      parts={verifyParts(job)}
                      onDownload={() => downloadJob(job)}
                      onDownloadValid={() => downloadJob(job, "valid")}
                      onDelete={() => {
                        removeJob(job.id);
                        toast.success("Project deleted");
                      }}
                    />
                  ))
                : null}
              {tab === "find"
                ? findRows.map((job) => (
                    <ProjectTableRow
                      key={job.id}
                      name={job.name}
                      to="/find"
                      search={{ mode: "list" }}
                      date={job.createdAt}
                      status={jobStatus(job)}
                      count={job.total}
                      unit="people"
                      note="Name, company, or LinkedIn"
                      parts={findParts(job)}
                      onDownload={() => downloadJob(job)}
                      onDownloadValid={() => downloadJob(job, "valid")}
                      onDelete={() => {
                        removeJob(job.id);
                        toast.success("Project deleted");
                      }}
                    />
                  ))
                : null}
              {tab === "leads"
                ? leadRows.map((item) => {
                    const kind = asLeadKind(item.kind);
                    const n = listMemberIds(item).length;
                    return (
                      <ProjectTableRow
                        key={item.id}
                        name={item.name}
                        to="/leads"
                        search={{ list: item.id }}
                        date={item.createdAt}
                        status="Saved"
                        count={n}
                        unit={resultUnit(kind, n)}
                        onDownload={() => downloadList(item)}
                        onDelete={() => {
                          deleteSearch(item.id);
                          toast.success("Project deleted");
                        }}
                      />
                    );
                  })
                : null}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}

function jobStatus(job: BulkJob) {
  if (job.status === "processing") return "Running";
  if (job.status === "failed") return "Failed";
  return "Completed";
}

function verifyParts(job: BulkJob): { label: string; n: number; bar: string }[] {
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

function findParts(job: BulkJob): { label: string; n: number; bar: string }[] {
  const found = job.found ?? 0;
  const missed = Math.max(0, job.total - found);
  return [
    { label: "Found", n: found, bar: "bg-safe" },
    { label: "Not found", n: missed, bar: "bg-muted-foreground" },
  ].filter((part) => part.n > 0);
}

function ProjectTableRow({
  name,
  to,
  search,
  date,
  status,
  count,
  unit,
  note,
  parts,
  onDownload,
  onDownloadValid,
  onDelete,
}: {
  name: string;
  to: "/verify" | "/find" | "/leads";
  search?: { mode?: "list"; list?: string };
  date: number;
  status: string;
  count: number;
  unit: string;
  note?: string;
  parts?: { label: string; n: number; bar: string }[];
  onDownload: () => void;
  onDownloadValid?: () => void;
  onDelete: () => void;
}) {
  const total = parts?.reduce((n, part) => n + part.n, 0) || count || 1;
  return (
    <li className="grid grid-cols-[minmax(0,1.4fr)_minmax(11rem,1.2fr)_6.5rem_6.5rem_auto] items-center gap-3 py-3">
      <Link to={to} search={search as never} className="flex min-w-0 items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Folder className="size-4" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium">{name}</span>
          {note ? <span className="block truncate text-xs text-muted-foreground">{note}</span> : null}
        </span>
      </Link>
      <div className="min-w-0">
        <p className="text-sm font-medium tabular-nums">
          {formatNumber(count)} {unit}
        </p>
        {parts?.length ? (
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
      </div>
      <StatusPill status={status} />
      <span className="text-xs text-muted-foreground">{formatDate(date)}</span>
      <div className="flex items-center justify-end gap-1">
        <Button type="button" size="sm" disabled={status === "Running"} onClick={onDownload}>
          <Download />
          Download
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="icon-sm" aria-label={`More for ${name}`}>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onDownloadValid ? (
              <DropdownMenuItem onSelect={onDownloadValid}>
                <Download className="size-4" />
                Download valid only
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem onSelect={onDownload}>
              <Download className="size-4" />
              Download all
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onDelete}>
              <Trash2 className="size-4" />
              Delete project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "Completed" || status === "Saved"
      ? "bg-safe-soft text-safe"
      : status === "Failed"
        ? "bg-invalid-soft text-invalid"
        : "bg-unknown-soft text-unknown";
  return (
    <span className={cn("inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-medium", tone)}>
      {status}
    </span>
  );
}

function Empty({
  children,
  to,
  cta,
  search,
}: {
  children: ReactNode;
  to: "/verify" | "/find" | "/leads";
  cta: string;
  search?: { mode?: "list" };
}) {
  return (
    <div className="flex flex-col items-start gap-3 py-6">
      <p className="text-sm text-muted-foreground">{children}</p>
      <Button asChild variant="outline">
        <Link to={to} search={search as never}>
          {cta}
        </Link>
      </Button>
    </div>
  );
}
