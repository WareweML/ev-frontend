import type { ReactNode } from "react";
import { ExternalLink } from "lucide-react";
import { RESULT_META, type DomainSearchResult, type FindCompanyInfo, type FindPersonInfo, type FindResult } from "@/lib/types";
import { CopyButton } from "@/components/copy-button";
import { StatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";

export function FindResultCard({ result }: { result: FindResult }) {
  if (!result.found) {
    return (
      <div className="rounded-xl bg-card p-6 shadow-border">
        <p className="text-sm font-medium">No email found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {result.domain ? `${result.domain} · no credit used` : "No credit used"}
        </p>
      </div>
    );
  }

  if (result.enriched && result.personInfo && result.companyInfo) {
    return <EnrichedResult result={result} person={result.personInfo} company={result.companyInfo} />;
  }

  const caution = !result.verified;
  const verdict = result.status ? RESULT_META[result.status.result].verdict : caution ? "Safe to store, risky to send cold." : RESULT_META.safe.verdict;
  return (
    <section className="overflow-hidden rounded-xl bg-card shadow-border">
      <h2 className="border-b border-border bg-muted px-5 py-3 text-sm font-semibold">Person</h2>
      <Row label="Name" value={`${result.firstName} ${result.lastName}`.trim()} />
      <Row
        label="Email"
        value={
          <span className="flex items-center justify-end gap-2">
            <span className="font-mono text-primary">{result.email}</span>
            {result.email ? <CopyButton value={result.email} size="icon-sm" /> : null}
          </span>
        }
      />
      <Row label="Status" value={result.status ? <StatusBadge result={result.status.result} /> : "—"} />
      <Row label="Confidence" value={result.confidence != null ? String(result.confidence) : "—"} />
      <Row label="Pattern" value={result.pattern ?? "—"} mono />
      <Row label="Domain" value={result.domain ?? "—"} mono />
      <p className="border-t border-border px-5 py-3 text-sm text-muted-foreground">{verdict}</p>
    </section>
  );
}

function EnrichedResult({
  result,
  person,
  company,
}: {
  result: FindResult;
  person: FindPersonInfo;
  company: FindCompanyInfo;
}) {
  const verdict = result.status ? RESULT_META[result.status.result].verdict : RESULT_META.safe.verdict;
  const fullName = `${result.firstName} ${result.lastName}`.trim();

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <section className="overflow-hidden rounded-xl bg-card shadow-border">
        <h2 className="border-b border-border bg-muted px-5 py-3 text-sm font-semibold">Person</h2>
        <Row label="Name" value={fullName} />
        <Row label="Title" value={person.title} />
        <Row
          label="Email"
          value={
            <span className="flex items-center justify-end gap-2">
              <span className="font-mono text-primary">{result.email}</span>
              {result.email ? <CopyButton value={result.email} size="icon-sm" /> : null}
            </span>
          }
        />
        <Row label="Status" value={result.status ? <StatusBadge result={result.status.result} /> : "—"} />
        <Row label="Confidence" value={result.confidence != null ? String(result.confidence) : "—"} />
        <Row label="Pattern" value={result.pattern ?? "—"} mono />
        <Row label="Domain" value={result.domain ?? company.domain} mono />
        {person.linkedin ? (
          <Row label="LinkedIn" value={<ExternalLinkText href={`https://${person.linkedin}`} label={person.linkedin} />} />
        ) : null}
        <p className="border-t border-border px-5 py-3 text-sm text-muted-foreground">{verdict}</p>
      </section>

      <section className="overflow-hidden rounded-xl bg-card shadow-border">
        <h2 className="border-b border-border bg-muted px-5 py-3 text-sm font-semibold">Company</h2>
        <Row label="Name" value={company.name} />
        <Row label="Size" value={company.size} />
        <Row label="Industry" value={company.industry} />
        <Row label="Location" value={company.location} />
        <Row label="Website" value={<ExternalLinkText href={`https://${company.website}`} label={company.website} />} />
        {company.linkedin ? (
          <Row label="LinkedIn" value={<ExternalLinkText href={`https://${company.linkedin}`} label={company.linkedin} />} />
        ) : null}
        {company.about ? <p className="border-t border-border px-5 py-3 text-sm text-muted-foreground">{company.about}</p> : null}
      </section>
    </div>
  );
}

function ExternalLinkText({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center justify-end gap-1 text-primary hover:underline">
      {label}
      <ExternalLink className="size-3.5 shrink-0" />
    </a>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-4 border-t border-border px-5 py-2.5">
      <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className={cn("min-w-0 text-right text-sm", mono && "font-mono")}>{value}</span>
    </div>
  );
}

export function DomainResultCard({ result }: { result: DomainSearchResult }) {
  if (!result.found) {
    return (
      <div className="rounded-xl bg-card p-6 shadow-border">
        <p className="text-sm font-medium">No pattern for {result.domain || "that company"}</p>
        <p className="mt-1 text-sm text-muted-foreground">No credit used</p>
      </div>
    );
  }
  return (
    <div className="rounded-xl bg-card p-5 shadow-border sm:p-6">
      <div className="font-mono text-sm text-muted-foreground">{result.domain}</div>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{result.pattern}</div>
      <p className="mt-1 text-sm text-muted-foreground">Most common pattern · 1 credit</p>
      {result.otherPatterns.length ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {result.otherPatterns.map((p) => (
            <span key={p} className="rounded-full bg-muted px-2.5 py-1 font-mono text-xs">
              {p}
            </span>
          ))}
        </div>
      ) : null}
      <div className="mt-4 space-y-1">
        {result.samples.map((s) => (
          <div key={s} className="font-mono text-sm text-muted-foreground">
            {s}
          </div>
        ))}
      </div>
    </div>
  );
}
