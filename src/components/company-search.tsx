import { useMemo, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  Bell,
  BellOff,
  Building2,
  ChevronDown,
  Cpu,
  Linkedin,
  Lock,
  Mail,
  Radio,
} from "lucide-react";
import { toast } from "sonner";
import { CopyButton } from "@/components/copy-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import {
  groupPeople,
  maskLocal,
  personLinkedIn,
  type CompanyPersonRow,
  type CompanySearchView,
} from "@/lib/company-search";
import { formatNumber } from "@/lib/format";
import { useAppStore, usePlan } from "@/lib/store";
import type { FindResult } from "@/lib/types";
import { cn } from "@/lib/utils";

type PeopleTab = "people" | "decision" | "generic";

export function CompanySearchResults({
  view,
  onSearchDomain,
}: {
  view: CompanySearchView;
  onSearchDomain: (domain: string) => void;
}) {
  const [tab, setTab] = useState<PeopleTab>("people");
  const [nameQ, setNameQ] = useState("");
  const [title, setTitle] = useState("all");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [revealed, setRevealed] = useState<Record<string, FindResult>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const runFind = useAppStore((s) => s.runFind);
  const finds = useAppStore((s) => s.finds);

  const hydrated = useMemo(() => {
    const next = { ...revealed };
    for (const p of view.people) {
      if (next[p.id]) continue;
      const hit = finds.find(
        (f) =>
          f.found &&
          f.domain === view.domain &&
          f.firstName.toLowerCase() === p.firstName.toLowerCase() &&
          f.lastName.toLowerCase() === p.lastName.toLowerCase(),
      );
      if (hit) next[p.id] = hit;
    }
    return next;
  }, [finds, revealed, view.domain, view.people]);

  const titles = useMemo(() => {
    const set = new Set(view.people.filter((p) => p.kind !== "generic").map((p) => p.title));
    return [...set].sort();
  }, [view.people]);

  const filtered = useMemo(() => {
    const q = nameQ.trim().toLowerCase();
    return view.people.filter((p) => {
      if (tab === "decision" && p.kind !== "decision") return false;
      if (tab === "generic" && p.kind !== "generic") return false;
      if (tab === "people" && p.kind === "generic") return false;
      if (title !== "all" && p.title !== title) return false;
      if (q) {
        const blob = `${p.firstName} ${p.lastName} ${p.title}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
  }, [nameQ, tab, title, view.people]);

  const groups = tab === "generic" ? [{ department: "support" as const, label: "Inboxes", people: filtered }] : groupPeople(filtered);
  const peopleN = view.people.filter((p) => p.kind !== "generic").length;
  const decisionN = view.people.filter((p) => p.kind === "decision").length;
  const genericN = view.people.filter((p) => p.kind === "generic").length;

  async function findOne(p: CompanyPersonRow) {
    if (hydrated[p.id] || busyId) return;
    setBusyId(p.id);
    await new Promise((r) => setTimeout(r, 350));
    const result = runFind(`${p.firstName} ${p.lastName}`.trim() || p.localPart, view.domain);
    if (result.reason === "insufficient_credits") toast.error("Not enough credits");
    else if (result.found) setRevealed((s) => ({ ...s, [p.id]: result }));
    else toast.error("No email found");
    setBusyId(null);
  }

  async function findPicked() {
    const rows = filtered.filter((p) => picked.has(p.id) && !hydrated[p.id]);
    for (const p of rows) await findOne(p);
    setPicked(new Set());
  }

  function toggle(id: string, on: boolean) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
      <section className="min-w-0 overflow-hidden rounded-xl bg-card shadow-border">
        <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold">
            {formatNumber(filtered.length)} {filtered.length === 1 ? "result" : "results"}
            <span className="font-normal text-muted-foreground"> · {view.domain}</span>
            {tab === "people" ? (
              <span className="font-normal text-muted-foreground"> · {formatNumber(peopleN)} people</span>
            ) : tab === "decision" ? (
              <span className="font-normal text-muted-foreground"> · {formatNumber(decisionN)} decision makers</span>
            ) : (
              <span className="font-normal text-muted-foreground"> · {formatNumber(genericN)} inboxes</span>
            )}
          </p>
          <Input
            value={nameQ}
            onChange={(e) => setNameQ(e.target.value)}
            placeholder="Name or title"
            aria-label="Filter by name or title"
            className="sm:max-w-64"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
          <label className="text-sm text-muted-foreground">
            Title
            <select
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="ml-2 h-10 max-w-[12rem] rounded-lg border border-input bg-card px-2 text-sm text-foreground"
            >
              <option value="all">All titles</option>
              {titles.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          {picked.size ? (
            <Button type="button" size="sm" onClick={() => void findPicked()} className="ml-auto">
              Find {picked.size} {picked.size === 1 ? "email" : "emails"}
            </Button>
          ) : null}
        </div>
        <div className="px-3 py-3 sm:px-4">
          <div className="flex rounded-xl bg-muted p-1" role="tablist">
            {(
              [
                ["people", "People", "People"],
                ["decision", "Leaders", "Decision makers"],
                ["generic", "Generic", "Generic"],
              ] as const
            ).map(([k, short, label]) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={tab === k}
                onClick={() => setTab(k)}
                className={cn(
                  "min-h-10 flex-1 rounded-lg px-2 text-xs font-medium sm:min-h-12 sm:px-3 sm:text-sm",
                  tab === k ? "bg-card text-foreground shadow-border" : "text-muted-foreground",
                )}
              >
                <span className="sm:hidden">{short}</span>
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="pb-2">
          {groups.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">No people match</p>
          ) : (
            groups.map((g) => (
              <DeptGroup
                key={g.department + g.label}
                label={g.label}
                count={g.people.length}
                defaultOpen
                people={g.people}
                domain={view.domain}
                revealed={hydrated}
                picked={picked}
                busyId={busyId}
                onToggle={toggle}
                onFind={(p) => void findOne(p)}
              />
            ))
          )}
        </div>
      </section>

      <aside className="space-y-3">
        <FollowCard view={view} />
        <CompanyCard view={view} />
        <TechCard view={view} />
        <SignalsCard view={view} />
        <SimilarCard view={view} onSearchDomain={onSearchDomain} />
      </aside>
    </div>
  );
}

function DeptGroup({
  label,
  count,
  defaultOpen,
  people,
  domain,
  revealed,
  picked,
  busyId,
  onToggle,
  onFind,
}: {
  label: string;
  count: number;
  defaultOpen: boolean;
  people: CompanyPersonRow[];
  domain: string;
  revealed: Record<string, FindResult>;
  picked: Set<string>;
  busyId: string | null;
  onToggle: (id: string, on: boolean) => void;
  onFind: (p: CompanyPersonRow) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex min-h-12 w-full items-center gap-2 px-4 text-left text-sm font-semibold"
        >
          <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", !open && "-rotate-90")} />
          {label}
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{count}</span>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul className="divide-y divide-border border-t border-border">
          {people.map((p) => (
            <PersonRow
              key={p.id}
              person={p}
              domain={domain}
              result={revealed[p.id]}
              checked={picked.has(p.id)}
              busy={busyId === p.id}
              onToggle={onToggle}
              onFind={onFind}
            />
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}

function PersonRow({
  person,
  domain,
  result,
  checked,
  busy,
  onToggle,
  onFind,
}: {
  person: CompanyPersonRow;
  domain: string;
  result?: FindResult;
  checked: boolean;
  busy: boolean;
  onToggle: (id: string, on: boolean) => void;
  onFind: (p: CompanyPersonRow) => void;
}) {
  const name = `${person.firstName} ${person.lastName}`.trim();
  const li = personLinkedIn(person);
  const email = result?.email;
  return (
    <li className="flex min-h-14 items-center gap-3 px-4 py-2">
      <Checkbox
        checked={checked}
        onCheckedChange={(v) => onToggle(person.id, v === true)}
        aria-label={name}
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">
          {name}
          <span className="ml-2 font-normal text-muted-foreground">{person.title}</span>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 font-mono text-xs text-muted-foreground">
          {email ? (
            <>
              <span className="text-foreground">{email}</span>
              <CopyButton value={email} size="icon-sm" />
            </>
          ) : (
            <span>{maskLocal(person.localPart, domain)}</span>
          )}
        </div>
      </div>
      {li ? (
        <a
          href={li}
          target="_blank"
          rel="noreferrer"
          className="hidden text-muted-foreground hover:text-foreground sm:inline-flex"
          aria-label={`${name} on LinkedIn`}
        >
          <Linkedin className="size-4" />
        </a>
      ) : null}
      {email ? (
        result?.verified ? (
          <Badge variant="safe" className="normal-case tracking-normal">
            Valid
          </Badge>
        ) : null
      ) : (
        <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => onFind(person)}>
          <Mail />
          {busy ? "Finding" : "Find"}
        </Button>
      )}
    </li>
  );
}

function SideCard({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: typeof Building2;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-xl bg-card shadow-border">
      <CollapsibleTrigger asChild>
        <button type="button" className="flex min-h-12 w-full items-center justify-between gap-2 px-4 text-left text-sm font-semibold">
          <span className="flex items-center gap-2">
            <Icon className="size-4 text-muted-foreground" />
            {title}
          </span>
          <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", !open && "-rotate-90")} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-t border-border px-4 py-4">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function FollowCard({ view }: { view: CompanySearchView }) {
  const followed = useAppStore((s) => s.followed);
  const toggleFollow = useAppStore((s) => s.toggleFollow);
  const on = followed.includes(view.domain);
  return (
    <div className="rounded-xl bg-card p-4 shadow-border">
      <p className="text-sm font-semibold">Follow {view.name}</p>
      <p className="mt-1 text-sm text-muted-foreground">Get a note when they hire, add inboxes, or change tech.</p>
      <Button
        type="button"
        variant={on ? "outline" : "default"}
        className="mt-3 w-full"
        onClick={() => {
          toggleFollow(view.domain);
          toast.success(on ? `Stopped following ${view.name}` : `Following ${view.name}`);
        }}
      >
        {on ? <BellOff /> : <Bell />}
        {on ? "Following" : "Follow this company"}
      </Button>
    </div>
  );
}

function CompanyCard({ view }: { view: CompanySearchView }) {
  return (
    <SideCard title="Company" icon={Building2}>
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-semibold">
          {view.name.slice(0, 2).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">{view.name}</p>
          <p className="mt-1 text-sm text-muted-foreground">{view.description}</p>
        </div>
      </div>
      <dl className="mt-4 space-y-2 text-sm">
        <Fact k="Industry" v={view.industry} />
        <Fact k="Headcount" v={view.size} />
        <Fact k="Location" v={view.location} />
        <Fact k="Type" v={view.type} />
        <Fact k="Pattern" v={view.pattern} mono />
        <Fact
          k="Website"
          v={
            <a href={`https://${view.website}`} target="_blank" rel="noreferrer" className="text-primary hover:underline">
              {view.website}
            </a>
          }
        />
      </dl>
    </SideCard>
  );
}

function TechCard({ view }: { view: CompanySearchView }) {
  const plan = usePlan();
  const n = view.tech.reduce((s, g) => s + g.items.length, 0);
  return (
    <SideCard title="Technologies" icon={Cpu}>
      <p className="text-sm text-muted-foreground">
        {n} {n === 1 ? "technology" : "technologies"} on {view.domain}
      </p>
      <div className="mt-3 space-y-3">
        {view.tech.map((g) => (
          <div key={g.group}>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{g.group}</p>
            <ul className="mt-1 space-y-1">
              {g.items.map((t) => (
                <li key={t} className="text-sm">
                  {t}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-lg bg-muted p-3 text-center">
        <p className="text-sm font-medium">Find companies using this tech</p>
        {plan.features.leads ? (
          <Button asChild variant="outline" size="sm" className="mt-2">
            <Link to="/leads" search={{ kind: "company", q: view.tech[0]?.items[0] ?? view.industry }}>
              Search companies
            </Link>
          </Button>
        ) : (
          <Button asChild variant="outline" size="sm" className="mt-2">
            <Link to="/billing">On Outreach</Link>
          </Button>
        )}
      </div>
    </SideCard>
  );
}

function SignalsCard({ view }: { view: CompanySearchView }) {
  return (
    <SideCard title="Signals" icon={Radio}>
      <div className="rounded-lg bg-muted p-3">
        <p className="text-sm font-semibold">Summary</p>
        <p className="mt-1 text-sm text-muted-foreground">{view.signalSummary}</p>
      </div>
      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {view.signals.length} updates
      </p>
      <ul className="mt-2 space-y-3">
        {view.signals.map((s) => (
          <li key={s.id} className="text-sm">
            <span className="font-medium">{s.title}</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {s.ago} · {s.kind === "contacts" ? "Contacts" : s.kind === "technology" ? "Technology" : "Hiring"}
            </span>
          </li>
        ))}
      </ul>
    </SideCard>
  );
}

function SimilarCard({
  view,
  onSearchDomain,
}: {
  view: CompanySearchView;
  onSearchDomain: (domain: string) => void;
}) {
  const plan = usePlan();
  return (
    <SideCard title="Similar companies" icon={Building2} defaultOpen>
      {plan.features.leads ? (
        <ul className="divide-y divide-border">
          {view.similar.map((c) => (
            <li key={c.domain}>
              <button
                type="button"
                className="flex min-h-12 w-full items-center justify-between gap-2 py-2 text-left"
                onClick={() => onSearchDomain(c.domain)}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{c.name}</span>
                  <span className="block truncate font-mono text-xs text-muted-foreground">{c.domain}</span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">{c.size}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-lg bg-muted p-4 text-center">
          <Lock className="mx-auto size-5 text-muted-foreground" />
          <p className="mt-2 text-sm font-medium">
            {formatNumber(view.similar.length)} similar companies to {view.name}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">On Outreach</p>
          <Button asChild size="sm" className="mt-3">
            <Link to="/billing">See plans</Link>
          </Button>
        </div>
      )}
    </SideCard>
  );
}

function Fact({ k, v, mono }: { k: string; v: ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className={cn("text-right", mono && "font-mono")}>{v}</dd>
    </div>
  );
}
