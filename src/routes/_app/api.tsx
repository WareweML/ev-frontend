import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { CopyButton } from "@/components/copy-button";
import { Page } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { verifyEmail } from "@/lib/engine";
import { formatDate, formatNumber } from "@/lib/format";
import { FIRST_EMAIL } from "@/lib/samples";
import { useAppStore, usePlan } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/api")({
  component: ApiPage,
});

const BASE = "https://api.emailverifier.io";

type Lang = "curl" | "node" | "python";
type GroupId = "verify" | "find" | "leads" | "account";

const GROUPS: { id: GroupId; label: string }[] = [
  { id: "verify", label: "Verify Email API" },
  { id: "find", label: "Find Email API" },
  { id: "leads", label: "Search Leads API" },
  { id: "account", label: "Account API" },
];

const LANGS: { id: Lang; label: string }[] = [
  { id: "curl", label: "cURL" },
  { id: "node", label: "Node.js" },
  { id: "python", label: "Python" },
];

const HTTP_ERRORS: [string, string][] = [
  ["400", "A field is missing, or the file has no email column."],
  ["401", "The key is missing or no longer valid."],
  ["402", "Not enough credits."],
  ["403", "This key cannot use that call."],
  ["429", "Over the rate limit. Wait, then try again."],
];

const VERIFY_RESULTS: [string, string][] = [
  ["safe", "The inbox exists. Fine to send."],
  ["valid", "It may work, but the company accepts every address. Risky."],
  ["invalid", "Do not send. The address does not take mail."],
  ["do_not_mail", "Do not send. A temporary inbox, or a shared one such as info@."],
  ["unknown", "No clear answer. Try again later."],
];

type Step = {
  n: string;
  title: string;
  method: "GET" | "POST";
  path: string;
  samples: Record<Lang, string>;
  response: string;
};

type Endpoint = {
  id: string;
  label: string;
  hint: string;
  title: string;
  summary: string;
  limits: { label: string; value: string }[];
  steps: Step[];
  fields: [string, string][];
  results?: [string, string][];
};

function ApiPage() {
  const keys = useAppStore((s) => s.keys);
  const createKey = useAppStore((s) => s.createKey);
  const revokeKey = useAppStore((s) => s.revokeKey);
  const plan = usePlan();
  const credits = useAppStore((s) => s.credits);
  const runVerify = useAppStore((s) => s.runVerify);
  const runFind = useAppStore((s) => s.runFind);
  const touchKey = useAppStore((s) => s.touchKey);
  const [createOpen, setCreateOpen] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [fresh, setFresh] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [group, setGroup] = useState<GroupId>("verify");
  const [endpointId, setEndpointId] = useState("single");
  const [lang, setLang] = useState<Lang>("curl");
  const [email, setEmail] = useState(FIRST_EMAIL);
  const [live, setLive] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const activeKey = keys.find((k) => k.status === "active")?.key ?? "YOUR_API_KEY";
  const endpoints = endpointsFor(group, activeKey, credits, plan.name);
  const endpoint = endpoints.find((item) => item.id === endpointId) ?? endpoints[0];

  function openGroup(next: GroupId) {
    setGroup(next);
    setEndpointId(endpointsFor(next, activeKey, credits, plan.name)[0].id);
    setLive(null);
  }

  return (
    <Page className="max-w-[88rem]">
      <section className="rounded-xl bg-card shadow-border">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">Manage your API keys for integrating with Emailverifier.io</h2>
          <Button
            size="sm"
            onClick={() => {
              if (keys.filter((k) => k.status === "active").length >= plan.maxKeys) {
                toast.message("Extra keys are on Subscription");
                return;
              }
              setCreateOpen(true);
            }}
          >
            <Plus />
            New key
          </Button>
        </div>
        {keys.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">No keys yet.</p>
        ) : (
          <ul>
            {keys.map((k) => (
              <li key={k.id} className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3 last:border-0">
                <div className="min-w-36">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{k.name}</span>
                    <Badge variant={k.status === "active" ? "safe" : "unknown"}>{k.status}</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatNumber(k.requests)} calls
                    {k.lastUsedAt ? ` · ${formatDate(k.lastUsedAt)}` : ""}
                  </p>
                </div>
                <code className="min-w-0 flex-1 truncate rounded-md bg-muted px-3 py-2 font-mono text-xs">
                  {revealed[k.id] ? k.key : `${k.prefix}${"•".repeat(18)}`}
                </code>
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label={revealed[k.id] ? "Hide key" : "Show key"}
                  onClick={() => setRevealed((s) => ({ ...s, [k.id]: !s[k.id] }))}
                >
                  {revealed[k.id] ? <EyeOff /> : <Eye />}
                </Button>
                <CopyButton value={k.key} size="icon-sm" />
                {k.status === "active" ? (
                  <Button variant="outline" size="sm" onClick={() => revokeKey(k.id)}>
                    <Trash2 />
                    Revoke
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-6 flex flex-wrap gap-1 rounded-xl bg-card p-1 shadow-border">
        {GROUPS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => openGroup(item.id)}
            className={cn(
              "h-10 rounded-lg px-4 text-sm font-medium",
              group === item.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-xl bg-card shadow-border lg:grid lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="flex gap-1 overflow-x-auto border-b border-border p-2 lg:block lg:border-b-0 lg:border-r lg:p-3">
          {endpoints.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setEndpointId(item.id);
                setLive(null);
              }}
              className={cn(
                "shrink-0 rounded-lg px-3 py-2 text-left lg:mb-1 lg:block lg:w-full",
                endpoint.id === item.id ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-muted",
              )}
            >
              <span className="block text-sm font-medium">{item.label}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{item.hint}</span>
            </button>
          ))}
        </aside>

        <div className="min-w-0 p-4 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold tracking-tight">{endpoint.title}</h3>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">{endpoint.summary}</p>
            </div>
          </div>

          <dl className="mt-4 grid overflow-hidden rounded-xl border border-border sm:grid-cols-3">
            {endpoint.limits.map((limit) => (
              <div key={limit.label} className="border-b border-border px-4 py-3 last:border-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
                <dt className="text-xs text-muted-foreground">{limit.label}</dt>
                <dd className="mt-1 text-sm font-medium">{limit.value}</dd>
              </div>
            ))}
          </dl>

          {endpoint.id === "single" && group === "verify" ? (
            <form
              className="mt-4 flex flex-col gap-2 sm:flex-row"
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                await new Promise((r) => setTimeout(r, 250));
                const result = runVerify(email, "api") ?? verifyEmail(email, "api");
                const key = keys.find((k) => k.status === "active");
                if (key) touchKey(key.key);
                setLive(
                  JSON.stringify(
                    {
                      email: result.email,
                      result: result.result,
                      score: result.score,
                      is_safe_to_send: result.isSafeToSend,
                    },
                    null,
                    2,
                  ),
                );
                setBusy(false);
              }}
            >
              <Input value={email} onChange={(e) => setEmail(e.target.value)} className="font-mono" aria-label="Email to try" />
              <Button type="submit" disabled={busy}>
                {busy ? "Checking" : "Try it"}
              </Button>
            </form>
          ) : null}

          <div className="mt-6 space-y-6">
            {endpoint.steps.map((step, index) => (
              <section key={step.path + step.n} className="rounded-xl border border-border">
                <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
                  <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {step.n}
                  </span>
                  <h4 className="text-sm font-semibold">{step.title}</h4>
                  <p className="ml-auto font-mono text-xs text-muted-foreground">
                    {step.method} {step.path}
                  </p>
                </div>
                <Playground lang={lang} onLang={setLang} code={step.samples[lang]} />
                <Example title={index === 0 && live ? "Your result" : "Example response"} code={index === 0 && live ? live : step.response} />
              </section>
            ))}
          </div>

          <Map title="Response" rows={endpoint.fields} />
          {endpoint.results ? <Map title="result" rows={endpoint.results} /> : null}
          <Map title="If the call fails" rows={HTTP_ERRORS} />
        </div>
      </div>

      <Dialog
        open={createOpen || !!fresh}
        onOpenChange={(open) => {
          if (!open) {
            setCreateOpen(false);
            setFresh(null);
            setKeyName("");
          }
        }}
      >
        <DialogContent>
          {fresh ? (
            <>
              <DialogHeader>
                <DialogTitle>Copy this key now</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">It will not be shown in full again.</p>
              <code className="block break-all rounded-md bg-muted px-3 py-2 font-mono text-xs">{fresh}</code>
              <DialogFooter>
                <CopyButton value={fresh} />
                <Button
                  onClick={() => {
                    setFresh(null);
                    setCreateOpen(false);
                  }}
                >
                  Done
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>New key</DialogTitle>
              </DialogHeader>
              <div>
                <Label htmlFor="key-name">Name</Label>
                <Input id="key-name" className="mt-1.5" value={keyName} placeholder="Production" onChange={(e) => setKeyName(e.target.value)} />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    const created = createKey(keyName || "Untitled key");
                    if (!created) {
                      toast.message("Extra keys are on Subscription");
                      return;
                    }
                    setFresh(created.key);
                    toast.success("Key created");
                  }}
                >
                  Create
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Page>
  );
}

function Playground({ lang, onLang, code }: { lang: Lang; onLang: (lang: Lang) => void; code: string }) {
  return (
    <div className="bg-ink">
      <div className="flex items-center gap-1 border-b border-white/10 px-2 py-2">
        {LANGS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onLang(item.id)}
            className={cn(
              "h-8 rounded-md px-3 text-xs font-medium",
              lang === item.id ? "bg-white/15 text-ink-foreground" : "text-ink-muted hover:text-ink-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
        <div className="ml-auto">
          <CopyButton value={code} size="sm" className="border-ink-active bg-transparent text-ink-foreground hover:bg-ink-hover" />
        </div>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[12px] leading-relaxed text-ink-foreground">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function Example({ title, code }: { title: string; code: string }) {
  return (
    <div className="border-t border-border">
      <div className="flex items-center justify-between px-4 py-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
        <CopyButton value={code} size="icon-sm" />
      </div>
      <pre className="overflow-x-auto bg-ink px-4 py-3 font-mono text-[12px] leading-relaxed text-ink-foreground">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function Map({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div className="mt-6">
      <h4 className="text-sm font-semibold">{title}</h4>
      <div className="mt-2 overflow-hidden rounded-xl border border-border">
        {rows.map(([name, detail]) => (
          <div key={name} className="grid grid-cols-1 gap-1 border-b border-border px-4 py-3 last:border-0 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-baseline">
            <code className="font-mono text-xs">{name}</code>
            <p className="text-sm text-muted-foreground">{detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function endpointsFor(group: GroupId, key: string, credits: number, planName: string): Endpoint[] {
  if (group === "find") return [findEndpoint(key)];
  if (group === "leads") return [leadsEndpoint(key)];
  if (group === "account") return [accountEndpoint(key, credits, planName)];
  return [singleVerify(key), batchVerify(key), bulkVerify(key)];
}

function singleVerify(key: string): Endpoint {
  const path = "/api/v1/verify";
  const body = { email: "user@example.com" };
  return {
    id: "single",
    label: "Single",
    hint: "One address",
    title: "Verify one email",
    summary: "Check whether an address is safe to send to.",
    limits: [
      { label: "Credits", value: "1 per email" },
      { label: "At once", value: "5 checks" },
      { label: "Timeout", value: "30 seconds" },
    ],
    steps: [
      {
        n: "1",
        title: "Verify the address",
        method: "POST",
        path,
        samples: samples({ key, method: "POST", path, json: body }),
        response: `{
  "email": "user@example.com",
  "result": "safe",
  "score": 98,
  "is_safe_to_send": true
}`,
      },
    ],
    fields: [
      ["result", "The decision. See the list below."],
      ["is_safe_to_send", "True only when result is safe."],
      ["score", "0 to 100. Higher is safer to send."],
    ],
    results: VERIFY_RESULTS,
  };
}

function batchVerify(key: string): Endpoint {
  const path = "/api/v1/verify/batch";
  const body = { emails: ["a@acme.com", "b@acme.com"] };
  return {
    id: "batch",
    label: "Batch",
    hint: "Up to 100",
    title: "Verify up to 100",
    summary: "Check a short list in one call. Each address comes back with the same fields as a single check.",
    limits: [
      { label: "Credits", value: "1 per email" },
      { label: "Per call", value: "100 addresses" },
      { label: "Rate limit", value: "5 calls a minute" },
    ],
    steps: [
      {
        n: "1",
        title: "Verify the list",
        method: "POST",
        path,
        samples: samples({ key, method: "POST", path, json: body }),
        response: `{
  "total": 2,
  "credits_used": 2,
  "results": [
    { "email": "a@acme.com", "result": "safe", "is_safe_to_send": true },
    { "email": "b@acme.com", "result": "invalid", "is_safe_to_send": false }
  ]
}`,
      },
    ],
    fields: [
      ["total", "How many addresses were in the call."],
      ["credits_used", "Credits taken for this call."],
      ["results", "One result per address."],
    ],
    results: VERIFY_RESULTS,
  };
}

function bulkVerify(key: string): Endpoint {
  return {
    id: "bulk",
    label: "Bulk",
    hint: "A file",
    title: "Verify a file",
    summary: "Upload a CSV, XLS, or XLSX. Check the job until it is completed, then download the spreadsheet.",
    limits: [
      { label: "Credits", value: "1 per unique email" },
      { label: "File", value: "CSV, XLS, XLSX" },
      { label: "Results kept", value: "30 days" },
    ],
    steps: [
      {
        n: "1",
        title: "Upload the file",
        method: "POST",
        path: "/api/v1/bulk",
        samples: fileSamples(key),
        response: `{
  "projectId": "b1f2c3d4",
  "emailCount": 1840
}`,
      },
      {
        n: "2",
        title: "Check the job",
        method: "GET",
        path: "/api/v1/bulk/{projectId}",
        samples: samples({ key, method: "GET", path: "/api/v1/bulk/PROJECT_ID" }),
        response: `{
  "projectId": "b1f2c3d4",
  "status": "processing",
  "emailCount": 1840
}`,
      },
      {
        n: "3",
        title: "Download the results",
        method: "GET",
        path: "/api/v1/bulk/{projectId}/download",
        samples: downloadSamples(key),
        response: "results.xlsx",
      },
    ],
    fields: [
      ["projectId", "Use this to check the job and download the file."],
      ["status", "processing, completed, or failed."],
      ["emailCount", "Unique addresses charged."],
    ],
    results: VERIFY_RESULTS,
  };
}

function findEndpoint(key: string): Endpoint {
  const path = "/api/v1/find";
  const body = { full_name: "John Smith", domain: "acme.com" };
  return {
    id: "single",
    label: "Single",
    hint: "Name, company, or LinkedIn",
    title: "Find an email",
    summary: "Find a work email from a name and a company, or from a LinkedIn profile. A miss is free.",
    limits: [
      { label: "Email found", value: "5 credits" },
      { label: "With details", value: "10 credits" },
      { label: "Nothing found", value: "Free" },
    ],
    steps: [
      {
        n: "1",
        title: "Find the email",
        method: "POST",
        path,
        samples: samples({ key, method: "POST", path, json: body }),
        response: `{
  "found": true,
  "email": "john.smith@acme.com",
  "verified": true,
  "creditsCharged": 5
}`,
      },
    ],
    fields: [
      ["full_name", "First and last name. Leave it out to search the company only."],
      ["domain", "Company domain, such as acme.com. Send this or company."],
      ["company", "Company name, if you do not have the domain."],
      ["linkedin_url", "A LinkedIn profile. The name and company are read from it."],
      ["enrich", "true also returns the person and their company. 10 credits when found."],
      ["verified", "True means the inbox exists. False is the likely address, and risky to send to."],
      ["creditsCharged", "5, 10, or 0."],
    ],
  };
}

function leadsEndpoint(key: string): Endpoint {
  const path = "/api/v1/leads/search";
  const body = { query: "Finance directors in California", kind: "person" };
  return {
    id: "search",
    label: "Search",
    hint: "People and companies",
    title: "Search leads",
    summary: "Find people and companies from a plain description. Revealing an email is a separate cost.",
    limits: [
      { label: "Search", value: "Free" },
      { label: "Reveal an email", value: "5 credits" },
      { label: "Page size", value: "50" },
    ],
    steps: [
      {
        n: "1",
        title: "Run the search",
        method: "POST",
        path,
        samples: samples({ key, method: "POST", path, json: body }),
        response: `{
  "total": 240,
  "page": 1,
  "results": [
    {
      "name": "Priya Shah",
      "title": "Finance Director",
      "company": "Northwind",
      "location": "California, United States"
    }
  ]
}`,
      },
    ],
    fields: [
      ["query", "Who you are looking for, in plain language."],
      ["kind", "person, company, or local. Defaults to person."],
      ["page", "Which page. 50 results each."],
      ["total", "How many matches."],
    ],
  };
}

function accountEndpoint(key: string, credits: number, planName: string): Endpoint {
  const path = "/api/v1/account";
  return {
    id: "account",
    label: "Account",
    hint: "Credits and plan",
    title: "Credits and plan",
    summary: "See the plan on this key and how many credits are left.",
    limits: [
      { label: "Credits", value: "Free to read" },
      { label: "Plan", value: planName },
      { label: "Left", value: formatNumber(credits) },
    ],
    steps: [
      {
        n: "1",
        title: "Read the account",
        method: "GET",
        path,
        samples: samples({ key, method: "GET", path }),
        response: JSON.stringify({ plan: planName, credits }, null, 2),
      },
    ],
    fields: [
      ["plan", "Pay as you go or Subscription."],
      ["credits", "Credits left on this account."],
    ],
  };
}

function samples({
  key,
  method,
  path,
  json,
}: {
  key: string;
  method: "GET" | "POST";
  path: string;
  json?: object;
}): Record<Lang, string> {
  const url = `${BASE}${path}`;
  const payload = json ? JSON.stringify(json) : "";
  const curl = [
    `curl -X ${method} "${url}" \\`,
    `  -H "X-API-Key: ${key}"${json ? " \\" : ""}`,
    json ? `  -H "Content-Type: application/json" \\` : "",
    json ? `  -d '${payload}'` : "",
  ]
    .filter(Boolean)
    .join("\n");
  const node = json
    ? `const res = await fetch("${url}", {
  method: "${method}",
  headers: {
    "X-API-Key": "${key}",
    "Content-Type": "application/json",
  },
  body: JSON.stringify(${JSON.stringify(json, null, 2).replace(/\n/g, "\n  ")}),
});
console.log(await res.json());`
    : `const res = await fetch("${url}", {
  headers: { "X-API-Key": "${key}" },
});
console.log(await res.json());`;
  const python = json
    ? `import requests

response = requests.${method === "GET" ? "get" : "post"}(
    "${url}",
    headers={"X-API-Key": "${key}"},
    json=${JSON.stringify(json, null, 4).replace(/\n/g, "\n    ")},
)
print(response.json())`
    : `import requests

response = requests.get(
    "${url}",
    headers={"X-API-Key": "${key}"},
)
print(response.json())`;
  return { curl, node, python };
}

function fileSamples(key: string): Record<Lang, string> {
  const url = `${BASE}/api/v1/bulk`;
  return {
    curl: `curl -X POST "${url}" \\
  -H "X-API-Key: ${key}" \\
  -F "file=@contacts.csv" \\
  -F "targetColumn=Email"`,
    node: `const form = new FormData();
form.append("file", file);
form.append("targetColumn", "Email");

const res = await fetch("${url}", {
  method: "POST",
  headers: { "X-API-Key": "${key}" },
  body: form,
});
console.log(await res.json());`,
    python: `import requests

response = requests.post(
    "${url}",
    headers={"X-API-Key": "${key}"},
    files={"file": open("contacts.csv", "rb")},
    data={"targetColumn": "Email"},
)
print(response.json())`,
  };
}

function downloadSamples(key: string): Record<Lang, string> {
  const url = `${BASE}/api/v1/bulk/PROJECT_ID/download?validOnly=true`;
  return {
    curl: `curl -X GET "${url}" \\
  -H "X-API-Key: ${key}" \\
  --output "./results.xlsx"`,
    node: `import { writeFile } from "node:fs/promises";

const res = await fetch("${url}", {
  headers: { "X-API-Key": "${key}" },
});
await writeFile("results.xlsx", Buffer.from(await res.arrayBuffer()));`,
    python: `import requests

response = requests.get(
    "${url}",
    headers={"X-API-Key": "${key}"},
)
open("results.xlsx", "wb").write(response.content)`,
  };
}
