import { COMPANIES, DEPT_LABEL, PEOPLE } from "./leads-data";
import { fnv, patternForDomain, resolveDomain } from "./engine";
import type { Person } from "./types";

export type CompanyPersonRow = {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  seniority: Person["seniority"];
  department: Person["department"];
  location: string;
  kind: "person" | "decision" | "generic";
  localPart: string;
};

export type CompanySimilar = {
  name: string;
  domain: string;
  industry: string;
  size: string;
};

export type CompanySignal = {
  id: string;
  kind: "contacts" | "technology" | "hire";
  title: string;
  ago: string;
};

export type CompanySearchView = {
  found: boolean;
  domain: string;
  name: string;
  description: string;
  industry: string;
  size: string;
  location: string;
  funding: string;
  revenue: string;
  type: string;
  website: string;
  linkedin: string;
  pattern: string;
  people: CompanyPersonRow[];
  tech: { group: string; items: string[] }[];
  signals: CompanySignal[];
  signalSummary: string;
  similar: CompanySimilar[];
};

const DEAD = new Set(["notareal.invalid", "no-mx.test", "localhost", "example.invalid"]);

const KNOWN: Record<
  string,
  {
    name: string;
    industry: string;
    size: string;
    location: string;
    funding: string;
    revenue: string;
    type: string;
    description: string;
    tech: string[];
  }
> = {
  "acme.com": {
    name: "Acme Corporation",
    industry: "Software",
    size: "201–500",
    location: "Austin, US",
    funding: "Private",
    revenue: "$50–100M",
    type: "Privately held",
    description: "Acme Corporation builds software for operations and sales teams.",
    tech: ["React", "AWS", "Postgres", "Salesforce"],
  },
  "warewe.ai": {
    name: "Warewe",
    industry: "Software",
    size: "11–50",
    location: "Delhi, IN",
    funding: "Seed",
    revenue: "$1–10M",
    type: "Privately held",
    description: "Warewe helps teams verify emails and find the right people to contact.",
    tech: ["React", "Postgres", "AWS"],
  },
};

const POOL: Omit<CompanyPersonRow, "id" | "kind" | "localPart" | "location">[] = [
  { firstName: "Ravresh", lastName: "Kapoor", title: "Director of Engineering", seniority: "director", department: "engineering" },
  { firstName: "Vaibhav", lastName: "Kulkarni", title: "Technology Lead", seniority: "head", department: "engineering" },
  { firstName: "Siddhima", lastName: "Agarwal", title: "Salesforce Developer", seniority: "ic", department: "engineering" },
  { firstName: "Kripa", lastName: "Sharma", title: "Technology Solutions Lead", seniority: "head", department: "engineering" },
  { firstName: "Tripti", lastName: "Joshi", title: "Technology Lead", seniority: "head", department: "engineering" },
  { firstName: "Lavi", lastName: "Singh", title: "Quality Assurance Engineer", seniority: "ic", department: "engineering" },
  { firstName: "Amit", lastName: "Kumar", title: "Software Engineer", seniority: "ic", department: "engineering" },
  { firstName: "Khushi", lastName: "Arora", title: "Software Quality Engineer", seniority: "ic", department: "engineering" },
  { firstName: "Urmi", lastName: "Ghosh", title: "Quality Assurance Lead", seniority: "head", department: "operations" },
  { firstName: "Neel", lastName: "Desai", title: "Account Executive", seniority: "ic", department: "sales" },
  { firstName: "Maya", lastName: "Iyer", title: "Head of Marketing", seniority: "head", department: "marketing" },
  { firstName: "Omar", lastName: "Farouk", title: "VP of Sales", seniority: "vp", department: "sales" },
  { firstName: "Claire", lastName: "Nguyen", title: "Product Manager", seniority: "ic", department: "product" },
  { firstName: "Diego", lastName: "Ruiz", title: "Customer Success Lead", seniority: "head", department: "support" },
];

const TECH_GROUP: Record<string, string> = {
  React: "Frontend",
  Node: "Backend",
  Go: "Language",
  Python: "Language",
  Java: "Language",
  "C++": "Language",
  PHP: "Language",
  AWS: "Cloud",
  GCP: "Cloud",
  Kubernetes: "Cloud",
  Postgres: "Database",
  MySQL: "Database",
  Oracle: "Database",
  Kafka: "Data",
  Spark: "Data",
  Snowflake: "Data",
  Salesforce: "CRM",
  Excel: "Productivity",
  Shopify: "Commerce",
  PyTorch: "AI",
  ROS: "Robotics",
  Siemens: "Industrial",
  SAP: "ERP",
};

const DEPT_ORDER: Person["department"][] = [
  "engineering",
  "product",
  "data",
  "sales",
  "marketing",
  "design",
  "finance",
  "operations",
  "hr",
  "support",
];

const DECISION: Person["seniority"][] = ["founder", "c_suite", "vp", "head"];

function slug(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function localPart(first: string, last: string, domain: string) {
  const pattern = patternForDomain(domain);
  const f = first.toLowerCase().replace(/[^a-z]/g, "");
  const l = last.toLowerCase().replace(/[^a-z]/g, "");
  if (pattern === "first") return f;
  if (pattern === "firstlast") return `${f}${l}`;
  if (pattern === "f.last") return `${f[0] ?? ""}${l ? "." + l : ""}`;
  if (pattern === "flast") return `${f[0] ?? ""}${l}`;
  return `${f}${l ? "." + l : ""}`;
}

function isDecision(s: Person["seniority"]) {
  return DECISION.includes(s);
}

function row(
  domain: string,
  location: string,
  p: Omit<CompanyPersonRow, "id" | "kind" | "localPart" | "location"> & { kind?: CompanyPersonRow["kind"]; localPart?: string },
): CompanyPersonRow {
  const kind = p.kind ?? (isDecision(p.seniority) ? "decision" : "person");
  const local = p.localPart ?? localPart(p.firstName, p.lastName, domain);
  return {
    id: `cp_${domain}_${slug(`${p.firstName}-${p.lastName}-${p.title}`)}`,
    firstName: p.firstName,
    lastName: p.lastName,
    title: p.title,
    seniority: p.seniority,
    department: p.department,
    location,
    kind,
    localPart: local,
  };
}

function rosterFor(domain: string, location: string, listed: CompanyPersonRow[]): CompanyPersonRow[] {
  const seen = new Set(listed.map((p) => `${p.firstName} ${p.lastName}`.toLowerCase()));
  const start = fnv(domain) % POOL.length;
  const extra: CompanyPersonRow[] = [];
  for (let i = 0; extra.length < 10 && i < POOL.length; i++) {
    const p = POOL[(start + i) % POOL.length]!;
    const key = `${p.firstName} ${p.lastName}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    extra.push(row(domain, location, p));
  }
  const generic: CompanyPersonRow[] = [
    row(domain, location, {
      firstName: "Info",
      lastName: "",
      title: "General inbox",
      seniority: "ic",
      department: "support",
      kind: "generic",
      localPart: "info",
    }),
    row(domain, location, {
      firstName: "Careers",
      lastName: "",
      title: "Hiring",
      seniority: "ic",
      department: "hr",
      kind: "generic",
      localPart: "careers",
    }),
  ];
  return [...listed, ...extra, ...generic];
}

function groupTech(items: string[]) {
  const map = new Map<string, string[]>();
  for (const t of items) {
    const g = TECH_GROUP[t] ?? "Other";
    const list = map.get(g) ?? [];
    list.push(t);
    map.set(g, list);
  }
  return [...map.entries()].map(([group, groupItems]) => ({ group, items: groupItems }));
}

function empty(domain: string): CompanySearchView {
  return {
    found: false,
    domain,
    name: domain,
    description: "",
    industry: "",
    size: "",
    location: "",
    funding: "",
    revenue: "",
    type: "",
    website: domain,
    linkedin: "",
    pattern: "",
    people: [],
    tech: [],
    signals: [],
    signalSummary: "",
    similar: [],
  };
}

export function buildCompanySearch(input: string): CompanySearchView {
  const domain = resolveDomain(input);
  if (!domain || DEAD.has(domain)) return empty(domain ?? input.trim().toLowerCase());

  const listed = COMPANIES.find((c) => c.domain === domain);
  const known = KNOWN[domain];
  const name = listed?.name ?? known?.name ?? domain.split(".")[0]!.replace(/^\w/, (c) => c.toUpperCase());
  const industry = listed?.industry ?? known?.industry ?? "Software";
  const size = listed?.sizeLabel ?? known?.size ?? "51–200";
  const location = listed?.location ?? known?.location ?? "Remote";
  const funding = listed?.funding ?? known?.funding ?? "Private";
  const revenue = listed?.revenue ?? known?.revenue ?? "$10–50M";
  const type = known?.type ?? (funding === "Public" ? "Public" : "Privately held");
  const description =
    known?.description ??
    `${name} is a ${industry.toLowerCase()} company based in ${location}.`;
  const techItems = listed?.tech ?? known?.tech ?? ["React", "AWS"];

  const fromLeads = listed
    ? PEOPLE.filter((p) => p.companyId === listed.id).map((p) =>
        row(domain, p.location, {
          firstName: p.firstName,
          lastName: p.lastName,
          title: p.title,
          seniority: p.seniority,
          department: p.department,
        }),
      )
    : domain === "acme.com"
      ? [
          row(domain, "Austin, US", {
            firstName: "John",
            lastName: "Smith",
            title: "VP of Sales",
            seniority: "vp",
            department: "sales",
          }),
        ]
      : domain === "warewe.ai"
        ? [
            row(domain, "Delhi, IN", {
              firstName: "Kumar",
              lastName: "Manaswi",
              title: "Founder",
              seniority: "founder",
              department: "product",
            }),
          ]
        : [];

  const people = rosterFor(domain, location, fromLeads);
  const roles = people
    .filter((p) => p.kind !== "generic")
    .slice(0, 5)
    .map((p) => p.title.toLowerCase());
  const similar = COMPANIES.filter((c) => c.domain !== domain)
    .sort((a, b) => Number(b.industry === industry) - Number(a.industry === industry))
    .slice(0, 8)
    .map((c) => ({ name: c.name, domain: c.domain, industry: c.industry, size: c.sizeLabel }));

  return {
    found: true,
    domain,
    name,
    description,
    industry,
    size,
    location,
    funding,
    revenue,
    type,
    website: domain,
    linkedin: `linkedin.com/company/${slug(name)}`,
    pattern: patternForDomain(domain),
    people,
    tech: groupTech(techItems),
    signals: [
      {
        id: `${domain}-hire`,
        kind: "hire",
        title: `${name} hired a ${people[0]?.title ?? "new teammate"}`,
        ago: "3 months ago",
      },
      {
        id: `${domain}-tech`,
        kind: "technology",
        title: `${name} added new technologies`,
        ago: "7 months ago",
      },
      {
        id: `${domain}-mail`,
        kind: "contacts",
        title: `${name} has new email addresses`,
        ago: "8 months ago",
      },
    ],
    signalSummary: `${name} (${domain}) added new email addresses over the last year${
      roles.length ? `, including roles like ${roles.join(", ")}` : ""
    }.`,
    similar,
  };
}

export function maskLocal(local: string, domain: string) {
  const first = local[0] ?? "•";
  return `${first}••••••@${domain}`;
}

export function groupPeople(people: CompanyPersonRow[]) {
  const map = new Map<Person["department"], CompanyPersonRow[]>();
  for (const p of people) {
    const list = map.get(p.department) ?? [];
    list.push(p);
    map.set(p.department, list);
  }
  return DEPT_ORDER.filter((d) => map.has(d)).map((d) => ({
    department: d,
    label: DEPT_LABEL[d],
    people: map.get(d)!,
  }));
}

export function personLinkedIn(p: CompanyPersonRow) {
  if (p.kind === "generic") return null;
  return `https://www.linkedin.com/in/${slug(`${p.firstName} ${p.lastName}`)}`;
}
