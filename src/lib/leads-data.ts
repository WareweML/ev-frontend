import type { Company, LeadFilterFacets, LeadFilters, LeadKind, Person } from "./types";
import { LEAD_KIND_META } from "./types";
import { HEADCOUNT_RANGES, LOCATION_ALIASES } from "./filter-options";

export const COMPANIES: Company[] = [
  { id: "c1", name: "Northstar Labs", domain: "northstarlabs.io", industry: "SaaS", sizeMin: 51, sizeMax: 200, sizeLabel: "51–200", revenue: "$10–50M", funding: "Series B", location: "San Francisco, US", city: "San Francisco", country: "US", tech: ["React", "AWS", "Postgres"], naics: "5112" },
  { id: "c2", name: "Harbor & Co", domain: "harborandco.com", industry: "Consulting", sizeMin: 201, sizeMax: 500, sizeLabel: "201–500", revenue: "$50–100M", funding: "Bootstrapped", location: "London, UK", city: "London", country: "UK", tech: ["Salesforce", "Excel"], naics: "5416" },
  { id: "c3", name: "Voltmesh", domain: "voltmesh.com", industry: "Fintech", sizeMin: 51, sizeMax: 200, sizeLabel: "51–200", revenue: "$10–50M", funding: "Series A", location: "New York, US", city: "New York", country: "US", tech: ["Go", "Kafka", "AWS"], naics: "5223" },
  { id: "c4", name: "Papertrail Health", domain: "papertrail.health", industry: "Health", sizeMin: 51, sizeMax: 200, sizeLabel: "51–200", revenue: "$1–10M", funding: "Seed", location: "Boston, US", city: "Boston", country: "US", tech: ["Python", "React", "GCP"], naics: "6211" },
  { id: "c5", name: "Helio Systems", domain: "heliosystems.io", industry: "Cybersecurity", sizeMin: 201, sizeMax: 500, sizeLabel: "201–500", revenue: "$50–100M", funding: "Series C", location: "Austin, US", city: "Austin", country: "US", tech: ["Go", "Kubernetes", "AWS"], naics: "5415" },
  { id: "c6", name: "Brightline", domain: "brightlinehq.com", industry: "HR tech", sizeMin: 11, sizeMax: 50, sizeLabel: "11–50", revenue: "$1–10M", funding: "Series A", location: "Denver, US", city: "Denver", country: "US", tech: ["React", "Postgres"], naics: "5613" },
  { id: "c7", name: "Kite & Anchor", domain: "kiteanchor.com", industry: "Logistics", sizeMin: 501, sizeMax: 1000, sizeLabel: "501–1,000", revenue: "$100–500M", funding: "Private", location: "Chicago, US", city: "Chicago", country: "US", tech: ["SAP", "Oracle"], naics: "4889" },
  { id: "c8", name: "Lumen Field Labs", domain: "lumenfield.ai", industry: "AI", sizeMin: 11, sizeMax: 50, sizeLabel: "11–50", revenue: "$1–10M", funding: "Seed", location: "Bengaluru, IN", city: "Bengaluru", country: "IN", tech: ["Python", "PyTorch", "GCP"], naics: "5112" },
  { id: "c9", name: "Redwood Payments", domain: "redwoodpay.com", industry: "Fintech", sizeMin: 51, sizeMax: 200, sizeLabel: "51–200", revenue: "$10–50M", funding: "Series B", location: "Toronto, CA", city: "Toronto", country: "CA", tech: ["Java", "Kafka", "AWS"], naics: "5223" },
  { id: "c10", name: "Oak & Iron", domain: "oakandiron.co", industry: "Manufacturing", sizeMin: 1001, sizeMax: 5000, sizeLabel: "1,001–5,000", revenue: "$500M+", funding: "Public", location: "Stuttgart, DE", city: "Stuttgart", country: "DE", tech: ["SAP", "Siemens"], naics: "3330" },
  { id: "c11", name: "Driftwood Media", domain: "driftwood.tv", industry: "Media", sizeMin: 51, sizeMax: 200, sizeLabel: "51–200", revenue: "$10–50M", funding: "Bootstrapped", location: "Los Angeles, US", city: "Los Angeles", country: "US", tech: ["React", "AWS"], naics: "5121" },
  { id: "c12", name: "Nimbus Cloud", domain: "nimbuscloud.io", industry: "Cloud", sizeMin: 501, sizeMax: 1000, sizeLabel: "501–1,000", revenue: "$100–500M", funding: "Series D", location: "Seattle, US", city: "Seattle", country: "US", tech: ["Kubernetes", "Go", "AWS"], naics: "5182" },
  { id: "c13", name: "Fennel Data", domain: "fenneldata.com", industry: "Data", sizeMin: 51, sizeMax: 200, sizeLabel: "51–200", revenue: "$10–50M", funding: "Series A", location: "Berlin, DE", city: "Berlin", country: "DE", tech: ["Python", "Spark", "Snowflake"], naics: "5112" },
  { id: "c14", name: "Sable Insurance", domain: "sableins.com", industry: "Insurance", sizeMin: 201, sizeMax: 500, sizeLabel: "201–500", revenue: "$50–100M", funding: "Private", location: "Mumbai, IN", city: "Mumbai", country: "IN", tech: ["Java", "Salesforce"], naics: "5241" },
  { id: "c15", name: "Quartz Robotics", domain: "quartzrobotics.com", industry: "Robotics", sizeMin: 51, sizeMax: 200, sizeLabel: "51–200", revenue: "$10–50M", funding: "Series B", location: "Munich, DE", city: "Munich", country: "DE", tech: ["C++", "ROS", "Python"], naics: "3345" },
  { id: "c16", name: "Fieldnote", domain: "fieldnote.app", industry: "SaaS", sizeMin: 11, sizeMax: 50, sizeLabel: "11–50", revenue: "$1–10M", funding: "Seed", location: "Remote", city: "Remote", country: "Remote", tech: ["React", "Node", "Postgres"], naics: "5112" },
  { id: "c17", name: "Copperline Bank", domain: "copperline.bank", industry: "Banking", sizeMin: 5001, sizeMax: 20000, sizeLabel: "5,000+", revenue: "$500M+", funding: "Public", location: "New York, US", city: "New York", country: "US", tech: ["Java", "Oracle", "Salesforce"], naics: "5221" },
  { id: "c18", name: "Ivy Club", domain: "ivyclub.co", industry: "Consumer", sizeMin: 11, sizeMax: 50, sizeLabel: "11–50", revenue: "$1–10M", funding: "Series A", location: "Paris, FR", city: "Paris", country: "FR", tech: ["React", "Shopify"], naics: "4541" },
];

export const PEOPLE: Person[] = [
  { id: "p1", firstName: "Amelia", lastName: "Chen", title: "VP of Engineering", seniority: "vp", department: "engineering", companyId: "c1", location: "San Francisco, US", city: "San Francisco" },
  { id: "p2", firstName: "Jonah", lastName: "Reed", title: "CTO", seniority: "c_suite", department: "engineering", companyId: "c1", location: "San Francisco, US", city: "San Francisco" },
  { id: "p3", firstName: "Priya", lastName: "Nair", title: "Staff Engineer", seniority: "ic", department: "engineering", companyId: "c1", location: "San Francisco, US", city: "San Francisco" },
  { id: "p4", firstName: "Marcus", lastName: "Hale", title: "Head of Sales", seniority: "head", department: "sales", companyId: "c1", location: "Austin, US", city: "Austin" },
  { id: "p5", firstName: "Elena", lastName: "Voss", title: "Managing Partner", seniority: "founder", department: "operations", companyId: "c2", location: "London, UK", city: "London" },
  { id: "p6", firstName: "Tom", lastName: "Whitaker", title: "Director of Consulting", seniority: "director", department: "operations", companyId: "c2", location: "London, UK", city: "London" },
  { id: "p7", firstName: "Sofia", lastName: "Almeida", title: "VP of People", seniority: "vp", department: "hr", companyId: "c2", location: "Lisbon, PT", city: "Lisbon" },
  { id: "p8", firstName: "Noah", lastName: "Park", title: "CTO", seniority: "c_suite", department: "engineering", companyId: "c3", location: "New York, US", city: "New York" },
  { id: "p9", firstName: "Leila", lastName: "Hassan", title: "VP of Engineering", seniority: "vp", department: "engineering", companyId: "c3", location: "New York, US", city: "New York" },
  { id: "p10", firstName: "Chris", lastName: "Dalton", title: "Head of Risk", seniority: "head", department: "finance", companyId: "c3", location: "New York, US", city: "New York" },
  { id: "p11", firstName: "Maya", lastName: "Okoro", title: "Founder & CEO", seniority: "founder", department: "product", companyId: "c4", location: "Boston, US", city: "Boston" },
  { id: "p12", firstName: "Ben", lastName: "Adler", title: "VP of Product", seniority: "vp", department: "product", companyId: "c4", location: "Boston, US", city: "Boston" },
  { id: "p13", firstName: "Hana", lastName: "Kim", title: "Director of Engineering", seniority: "director", department: "engineering", companyId: "c4", location: "Boston, US", city: "Boston" },
  { id: "p14", firstName: "Derek", lastName: "Sloan", title: "CISO", seniority: "c_suite", department: "engineering", companyId: "c5", location: "Austin, US", city: "Austin" },
  { id: "p15", firstName: "Anita", lastName: "Rao", title: "VP of Engineering", seniority: "vp", department: "engineering", companyId: "c5", location: "Austin, US", city: "Austin" },
  { id: "p16", firstName: "Luis", lastName: "Ortega", title: "Director of Sales", seniority: "director", department: "sales", companyId: "c5", location: "Austin, US", city: "Austin" },
  { id: "p17", firstName: "Greta", lastName: "Lindholm", title: "CEO", seniority: "founder", department: "product", companyId: "c6", location: "Denver, US", city: "Denver" },
  { id: "p18", firstName: "Owen", lastName: "Brooks", title: "Head of Product", seniority: "head", department: "product", companyId: "c6", location: "Denver, US", city: "Denver" },
  { id: "p19", firstName: "Yara", lastName: "Mensah", title: "COO", seniority: "c_suite", department: "operations", companyId: "c7", location: "Chicago, US", city: "Chicago" },
  { id: "p20", firstName: "Peter", lastName: "Lang", title: "VP of Operations", seniority: "vp", department: "operations", companyId: "c7", location: "Chicago, US", city: "Chicago" },
  { id: "p21", firstName: "Aditi", lastName: "Sharma", title: "Founder & CTO", seniority: "founder", department: "engineering", companyId: "c8", location: "Bengaluru, IN", city: "Bengaluru" },
  { id: "p22", firstName: "Ravi", lastName: "Iyer", title: "VP of Engineering", seniority: "vp", department: "engineering", companyId: "c8", location: "Bengaluru, IN", city: "Bengaluru" },
  { id: "p23", firstName: "Claire", lastName: "Dupont", title: "Head of Research", seniority: "head", department: "data", companyId: "c8", location: "Bengaluru, IN", city: "Bengaluru" },
  { id: "p24", firstName: "Samuel", lastName: "Okafor", title: "CTO", seniority: "c_suite", department: "engineering", companyId: "c9", location: "Toronto, CA", city: "Toronto" },
  { id: "p25", firstName: "Isabelle", lastName: "Nguyen", title: "VP of Engineering", seniority: "vp", department: "engineering", companyId: "c9", location: "Toronto, CA", city: "Toronto" },
  { id: "p26", firstName: "Karl", lastName: "Meier", title: "Head of Manufacturing", seniority: "head", department: "operations", companyId: "c10", location: "Stuttgart, DE", city: "Stuttgart" },
  { id: "p27", firstName: "Lena", lastName: "Vogel", title: "CFO", seniority: "c_suite", department: "finance", companyId: "c10", location: "Stuttgart, DE", city: "Stuttgart" },
  { id: "p28", firstName: "Diego", lastName: "Ruiz", title: "Head of Content", seniority: "head", department: "marketing", companyId: "c11", location: "Los Angeles, US", city: "Los Angeles" },
  { id: "p29", firstName: "Nina", lastName: "Patel", title: "VP of Marketing", seniority: "vp", department: "marketing", companyId: "c11", location: "Los Angeles, US", city: "Los Angeles" },
  { id: "p30", firstName: "Hannah", lastName: "Cho", title: "VP of Engineering", seniority: "vp", department: "engineering", companyId: "c12", location: "Seattle, US", city: "Seattle" },
  { id: "p31", firstName: "Miles", lastName: "Grant", title: "CTO", seniority: "c_suite", department: "engineering", companyId: "c12", location: "Seattle, US", city: "Seattle" },
  { id: "p32", firstName: "Freya", lastName: "Berg", title: "Head of Data", seniority: "head", department: "data", companyId: "c13", location: "Berlin, DE", city: "Berlin" },
  { id: "p33", firstName: "Jonas", lastName: "Keller", title: "VP of Engineering", seniority: "vp", department: "engineering", companyId: "c13", location: "Berlin, DE", city: "Berlin" },
  { id: "p34", firstName: "Ananya", lastName: "Desai", title: "Chief Actuary", seniority: "c_suite", department: "finance", companyId: "c14", location: "Mumbai, IN", city: "Mumbai" },
  { id: "p35", firstName: "Vikram", lastName: "Shah", title: "VP of Sales", seniority: "vp", department: "sales", companyId: "c14", location: "Mumbai, IN", city: "Mumbai" },
  { id: "p36", firstName: "Greta", lastName: "Hofmann", title: "CTO", seniority: "c_suite", department: "engineering", companyId: "c15", location: "Munich, DE", city: "Munich" },
  { id: "p37", firstName: "Felix", lastName: "Braun", title: "VP of Engineering", seniority: "vp", department: "engineering", companyId: "c15", location: "Munich, DE", city: "Munich" },
  { id: "p38", firstName: "Sasha", lastName: "Quinn", title: "Founder & CEO", seniority: "founder", department: "product", companyId: "c16", location: "Remote", city: "Remote" },
  { id: "p39", firstName: "Leo", lastName: "Martinez", title: "Head of Design", seniority: "head", department: "design", companyId: "c16", location: "Remote", city: "Remote" },
  { id: "p40", firstName: "Catherine", lastName: "Ward", title: "Head of Digital", seniority: "head", department: "product", companyId: "c17", location: "New York, US", city: "New York" },
  { id: "p41", firstName: "James", lastName: "O'Neill", title: "CISO", seniority: "c_suite", department: "engineering", companyId: "c17", location: "New York, US", city: "New York" },
  { id: "p42", firstName: "Camille", lastName: "Laurent", title: "Founder", seniority: "founder", department: "marketing", companyId: "c18", location: "Paris, FR", city: "Paris" },
  { id: "p43", firstName: "Hugo", lastName: "Bernard", title: "Head of Growth", seniority: "head", department: "marketing", companyId: "c18", location: "Paris, FR", city: "Paris" },
  { id: "p44", firstName: "Tara", lastName: "Singh", title: "Director of Engineering", seniority: "director", department: "engineering", companyId: "c1", location: "Seattle, US", city: "Seattle" },
  { id: "p45", firstName: "Omar", lastName: "Farouk", title: "VP of Sales", seniority: "vp", department: "sales", companyId: "c9", location: "Toronto, CA", city: "Toronto" },
  { id: "p46", firstName: "Ines", lastName: "Moreau", title: "Product Manager", seniority: "ic", department: "product", companyId: "c12", location: "Seattle, US", city: "Seattle" },
  { id: "p47", firstName: "Kenji", lastName: "Mori", title: "Staff Engineer", seniority: "ic", department: "engineering", companyId: "c5", location: "Austin, US", city: "Austin" },
  { id: "p48", firstName: "Aisha", lastName: "Rahman", title: "Head of Customer Success", seniority: "head", department: "support", companyId: "c6", location: "Denver, US", city: "Denver" },
];

export const COMPANY_BY_ID = Object.fromEntries(COMPANIES.map((c) => [c.id, c])) as Record<string, Company>;
export const PERSON_BY_ID = Object.fromEntries(PEOPLE.map((p) => [p.id, p])) as Record<string, Person>;

export const SIZE_BUCKETS = [
  { label: "1–10", min: 1, max: 10 },
  { label: "11–50", min: 11, max: 50 },
  { label: "51–200", min: 51, max: 200 },
  { label: "201–500", min: 201, max: 500 },
  { label: "501–1,000", min: 501, max: 1000 },
  { label: "1,001–5,000", min: 1001, max: 5000 },
  { label: "5,000+", min: 5001, max: 999999 },
] as const;

export const INDUSTRIES = [...new Set(COMPANIES.map((c) => c.industry))].sort();
export const FUNDING = [...new Set(COMPANIES.map((c) => c.funding))];
export const REVENUE = [...new Set(COMPANIES.map((c) => c.revenue))];
export const TECH = [...new Set(COMPANIES.flatMap((c) => c.tech))].sort();
export const CITIES = [...new Set([...COMPANIES.map((c) => c.city), ...PEOPLE.map((p) => p.city)])].sort();
export const COUNTRIES = [...new Set(COMPANIES.map((c) => c.country))].sort();

export const SENIORITY_LABEL: Record<Person["seniority"], string> = {
  founder: "Founder",
  c_suite: "C-Suite",
  vp: "VP",
  head: "Head",
  director: "Director",
  manager: "Manager",
  ic: "Individual contributor",
};

export const DEPT_LABEL: Record<Person["department"], string> = {
  engineering: "Engineering",
  sales: "Sales",
  marketing: "Marketing",
  product: "Product",
  design: "Design",
  finance: "Finance",
  hr: "People",
  operations: "Operations",
  data: "Data",
  support: "Support",
};

const TITLE_ALIASES: [RegExp, string][] = [
  [/\bvps?\b|vice presidents?/, "vp"],
  [/\bctos?\b/, "cto"],
  [/\bceos?\b/, "ceo"],
  [/\bcisos?\b/, "ciso"],
  [/\bcfos?\b/, "cfo"],
  [/\bfounders?\b/, "founder"],
  [/\bheads?\b/, "head"],
  [/\bdirectors?\b/, "director"],
  [/\bmanagers?\b/, "manager"],
  [/\bengineers?\b/, "engineer"],
];

export type LocalPlace = {
  id: string;
  city: string;
  country: string;
  location: string;
  people: Person[];
  companies: Company[];
};

export function parseLeadQuery(q: string): LeadFilters {
  const s = q.toLowerCase();
  const filters: LeadFilters = {};

  const size = s.match(/(\d+)\s*[-–to]+\s*(\d+)/);
  if (size) {
    filters.sizeMin = Number(size[1]);
    filters.sizeMax = Number(size[2]);
  } else if (/\b(startup|early[- ]stage|small)\b/.test(s)) {
    filters.sizeMin = 1;
    filters.sizeMax = 50;
  } else if (/\benterprise\b/.test(s)) {
    filters.sizeMin = 1001;
  }

  const seniority: Person["seniority"][] = [];
  if (/\b(vp|vice president)/.test(s)) seniority.push("vp");
  if (/\b(c[- ]?suite|cto|ceo|cfo|ciso|coo)\b/.test(s)) seniority.push("c_suite");
  if (/\bfounder/.test(s)) seniority.push("founder");
  if (/\bhead of\b|\bheads\b/.test(s)) seniority.push("head");
  if (/\bdirector/.test(s)) seniority.push("director");
  if (seniority.length) filters.seniority = seniority;

  const department: Person["department"][] = [];
  if (/engineer|engineering|dev team/.test(s)) department.push("engineering");
  if (/\bsales\b/.test(s)) department.push("sales");
  if (/market/.test(s)) department.push("marketing");
  if (/product/.test(s)) department.push("product");
  if (/design/.test(s)) department.push("design");
  if (/finance|risk|actuary/.test(s)) department.push("finance");
  if (/\bdata\b|research/.test(s)) department.push("data");
  if (department.length) filters.department = department;

  const titles: string[] = [];
  for (const [re, alias] of TITLE_ALIASES) {
    if (re.test(s)) titles.push(alias);
  }
  if (titles.length) filters.titles = titles;

  const industries: string[] = [];
  for (const ind of INDUSTRIES) {
    if (s.includes(ind.toLowerCase())) industries.push(ind);
  }
  if (/fintech|payments|bank/.test(s) && !industries.includes("Fintech")) {
    industries.push("Fintech", "Banking");
  }
  if (industries.length) filters.industry = industries;

  const cities = [
    "san francisco",
    "new york",
    "london",
    "austin",
    "boston",
    "berlin",
    "munich",
    "paris",
    "bengaluru",
    "bangalore",
    "mumbai",
    "seattle",
    "toronto",
    "chicago",
    "denver",
    "stuttgart",
    "lisbon",
    "los angeles",
    "remote",
  ];
  for (const city of cities) {
    if (s.includes(city)) {
      filters.location = city === "bangalore" ? "bengaluru" : city;
      break;
    }
  }
  if (/\bindia\b/.test(s)) filters.location = filters.location ?? "IN";
  if (/\bgermany\b/.test(s)) filters.location = filters.location ?? "DE";
  if (/\bfrance\b/.test(s)) filters.location = filters.location ?? "FR";
  if (/\bcanada\b/.test(s)) filters.location = filters.location ?? "CA";
  if (/\bunited kingdom\b|\buk\b/.test(s)) filters.location = filters.location ?? "UK";

  const techHits = TECH.filter((t) => s.includes(t.toLowerCase()));
  if (techHits.length) filters.tech = techHits;

  const fundingHits = FUNDING.filter((f) => s.includes(f.toLowerCase()));
  if (/\bseed\b/.test(s) && !fundingHits.includes("Seed")) fundingHits.push("Seed");
  if (fundingHits.length) filters.funding = fundingHits;

  const named = s.match(/\b(?:named|called)\s+([a-z]+)\s+([a-z]+)\b/);
  if (named) {
    filters.firstName = named[1];
    filters.lastName = named[2];
  }

  return filters;
}

export function inferLeadKind(q: string, filters: LeadFilters): LeadKind {
  const s = q.toLowerCase();
  const personSignals = !!(
    filters.seniority?.length ||
    filters.department?.length ||
    filters.titles?.length ||
    filters.firstName ||
    filters.lastName ||
    filters.titleQuery ||
    /\b(people|person|profiles?|emails?)\b/.test(s)
  );
  if (personSignals) return "person";
  const localSignals =
    /\b(in|near|around|city|cities|region|local|places?)\b/.test(s) ||
    (!!filters.location && !filters.companyQuery && !filters.industry?.length);
  if (localSignals && !/\b(compan(y|ies)|firms?|orgs?|startups?)\b/.test(s)) return "local";
  if (
    /\b(compan(y|ies)|firms?|orgs?|startups?|saas|agenc(y|ies))\b/.test(s) ||
    (filters.industry?.length && !filters.seniority?.length)
  ) {
    return "company";
  }
  if (filters.location && !filters.companyQuery) return "local";
  return "person";
}

function blobHas(haystack: string, needle: string) {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

function facetOn(filters: LeadFilters, key: keyof LeadFilterFacets) {
  const f = filters.facets?.[key];
  if (!f?.include?.length && !f?.exclude?.length) return null;
  return f;
}

function passes(includeHit: boolean, excludeHit: boolean, include?: string[], exclude?: string[]) {
  if (include?.length && !includeHit) return false;
  if (exclude?.length && excludeHit) return false;
  return true;
}

function loose(a: string, b: string) {
  const x = a.toLowerCase();
  const y = b.toLowerCase();
  return x === y || x.includes(y) || y.includes(x);
}

function locationHit(blob: string, selected: string) {
  const aliases = LOCATION_ALIASES[selected.toLowerCase()] ?? [];
  return [selected, ...aliases].some((term) => blob.toLowerCase().includes(term.toLowerCase()));
}

function industryHit(industry: string, selected: string) {
  return loose(industry, selected);
}

function headcountHit(c: Company, label: string) {
  const bucket = HEADCOUNT_RANGES.find((b) => b.label === label);
  if (!bucket) return loose(c.sizeLabel, label);
  return c.sizeMax >= bucket.min && c.sizeMin <= bucket.max;
}

const SENIORITY_TERMS: Record<Person["seniority"], string[]> = {
  founder: ["founder", "owner", "partner"],
  c_suite: ["c-suite", "cxo", "chief"],
  vp: ["vp", "vice president"],
  head: ["head"],
  director: ["director"],
  manager: ["manager"],
  ic: ["individual contributor", "entry", "senior", "ic"],
};

const DEPT_TERMS: Record<Person["department"], string[]> = {
  engineering: ["engineering", "information technology"],
  sales: ["sales", "business development"],
  marketing: ["marketing", "media and communication"],
  product: ["product", "product management"],
  design: ["design", "arts and design"],
  finance: ["finance", "accounting"],
  hr: ["human resources", "people", "hr"],
  operations: ["operations"],
  data: ["data", "research"],
  support: ["support", "customer success"],
};

function termHit(terms: string[], selected: string) {
  const q = selected.toLowerCase();
  return terms.some((t) => t === q || t.includes(q) || q.includes(t));
}

function matchCompany(c: Company, filters: LeadFilters): boolean {
  const companyFacet = facetOn(filters, "company");
  if (companyFacet) {
    const blob = `${c.name} ${c.domain}`;
    const inc = companyFacet.include?.some((s) => blobHas(blob, s)) ?? false;
    const exc = companyFacet.exclude?.some((s) => blobHas(blob, s)) ?? false;
    if (!passes(inc, exc, companyFacet.include, companyFacet.exclude)) return false;
  } else if (filters.companyQuery) {
    const q = filters.companyQuery.toLowerCase();
    if (!c.name.toLowerCase().includes(q) && !c.domain.includes(q)) return false;
  }

  const domainFacet = facetOn(filters, "domain");
  if (domainFacet) {
    const hit = (s: string) => c.domain.toLowerCase().includes(s.toLowerCase());
    const inc = domainFacet.include?.some(hit) ?? false;
    const exc = domainFacet.exclude?.some(hit) ?? false;
    if (!passes(inc, exc, domainFacet.include, domainFacet.exclude)) return false;
  }

  const headcountFacet = facetOn(filters, "headcount");
  if (headcountFacet) {
    const inc = headcountFacet.include?.some((s) => headcountHit(c, s)) ?? false;
    const exc = headcountFacet.exclude?.some((s) => headcountHit(c, s)) ?? false;
    if (!passes(inc, exc, headcountFacet.include, headcountFacet.exclude)) return false;
  } else {
    if (filters.sizeMin != null && c.sizeMax < filters.sizeMin) return false;
    if (filters.sizeMax != null && c.sizeMin > filters.sizeMax) return false;
  }

  const revenueFacet = facetOn(filters, "revenue");
  if (revenueFacet) {
    const inc = revenueFacet.include?.some((s) => loose(c.revenue, s)) ?? false;
    const exc = revenueFacet.exclude?.some((s) => loose(c.revenue, s)) ?? false;
    if (!passes(inc, exc, revenueFacet.include, revenueFacet.exclude)) return false;
  } else if (filters.revenue?.length && !filters.revenue.includes(c.revenue)) return false;

  const fundingFacet = facetOn(filters, "funding");
  if (fundingFacet) {
    const inc = fundingFacet.include?.some((s) => loose(c.funding, s)) ?? false;
    const exc = fundingFacet.exclude?.some((s) => loose(c.funding, s)) ?? false;
    if (!passes(inc, exc, fundingFacet.include, fundingFacet.exclude)) return false;
  } else if (filters.funding?.length && !filters.funding.includes(c.funding)) return false;

  const industryFacet = facetOn(filters, "industry");
  if (industryFacet) {
    const inc = industryFacet.include?.some((s) => industryHit(c.industry, s)) ?? false;
    const exc = industryFacet.exclude?.some((s) => industryHit(c.industry, s)) ?? false;
    if (!passes(inc, exc, industryFacet.include, industryFacet.exclude)) return false;
  } else if (filters.industry?.length && !filters.industry.includes(c.industry)) return false;

  const locationFacet = facetOn(filters, "location");
  if (locationFacet) {
    const blob = `${c.location} ${c.city} ${c.country}`;
    const inc = locationFacet.include?.some((s) => locationHit(blob, s)) ?? false;
    const exc = locationFacet.exclude?.some((s) => locationHit(blob, s)) ?? false;
    if (!passes(inc, exc, locationFacet.include, locationFacet.exclude)) return false;
  } else if (filters.location) {
    const loc = filters.location.toLowerCase();
    if (!blobHas(`${c.location} ${c.city} ${c.country}`, loc)) return false;
  }

  const skillsFacet = facetOn(filters, "skills");
  if (skillsFacet) {
    const blob = c.tech.join(" ");
    const hit = (s: string) => c.tech.some((t) => loose(t, s)) || blobHas(blob, s);
    const inc = skillsFacet.include?.some(hit) ?? false;
    const exc = skillsFacet.exclude?.some(hit) ?? false;
    if (!passes(inc, exc, skillsFacet.include, skillsFacet.exclude)) return false;
  } else if (filters.tech?.length && !filters.tech.some((t) => c.tech.includes(t))) return false;

  if (filters.keywords) {
    const blob = `${c.name} ${c.domain} ${c.industry} ${c.tech.join(" ")} ${c.funding} ${c.location}`;
    if (!blobHas(blob, filters.keywords)) return false;
  }
  const keywordFacet = facetOn(filters, "keywords");
  if (keywordFacet) {
    const blob = `${c.name} ${c.domain} ${c.industry} ${c.tech.join(" ")} ${c.funding} ${c.location}`;
    const inc = keywordFacet.include?.some((s) => blobHas(blob, s)) ?? false;
    const exc = keywordFacet.exclude?.some((s) => blobHas(blob, s)) ?? false;
    if (!passes(inc, exc, keywordFacet.include, keywordFacet.exclude)) return false;
  }
  const companyType = c.funding === "Public" ? "Public Company" : c.funding === "Bootstrapped" ? "Self Owned" : "Privately Held";
  const businessType = /consumer/i.test(c.industry) ? "B2C" : /non-?profit/i.test(c.industry) ? "Nonprofit" : "B2B";
  const revenueStream = /saas|cloud|\bai\b|hr tech/i.test(c.industry)
    ? "Subscriptions/Recurring"
    : /consult/i.test(c.industry)
      ? "Professional Services"
      : /fintech|bank|insurance/i.test(c.industry)
        ? "Transaction Fees"
        : /media/i.test(c.industry)
          ? "Advertising"
          : "Professional Services";
  const typeFacet = facetOn(filters, "companyType");
  if (typeFacet && !passes(typeFacet.include?.includes(companyType) ?? false, typeFacet.exclude?.includes(companyType) ?? false, typeFacet.include, typeFacet.exclude)) {
    return false;
  }
  const bizFacet = facetOn(filters, "businessType");
  if (bizFacet && !passes(bizFacet.include?.includes(businessType) ?? false, bizFacet.exclude?.includes(businessType) ?? false, bizFacet.include, bizFacet.exclude)) {
    return false;
  }
  const streamFacet = facetOn(filters, "revenueStream");
  if (streamFacet && !passes(streamFacet.include?.includes(revenueStream) ?? false, streamFacet.exclude?.includes(revenueStream) ?? false, streamFacet.include, streamFacet.exclude)) {
    return false;
  }
  return true;
}

export function applyLeadFilters(filters: LeadFilters): Person[] {
  return PEOPLE.filter((p) => {
    const c = COMPANY_BY_ID[p.companyId];
    if (!c) return false;
    const companySide: LeadFilters = {
      ...filters,
      keywords: undefined,
      location: undefined,
      facets: filters.facets ? { ...filters.facets, location: undefined } : undefined,
    };
    if (!matchCompany(c, companySide)) return false;
    if (filters.personName) {
      const q = filters.personName.toLowerCase();
      const name = `${p.firstName} ${p.lastName}`.toLowerCase();
      if (!name.includes(q)) return false;
    }
    if (filters.firstName && !blobHas(p.firstName, filters.firstName)) return false;
    if (filters.lastName && !blobHas(p.lastName, filters.lastName)) return false;

    const titleFacet = facetOn(filters, "title");
    if (titleFacet) {
      const hit = (s: string) => {
        const t = p.title.toLowerCase();
        const q = s.toLowerCase();
        return t.includes(q) || (q === "vp" && t.includes("vice president")) || (q.includes("vice president") && t.includes("vp"));
      };
      const inc = titleFacet.include?.some(hit) ?? false;
      const exc = titleFacet.exclude?.some(hit) ?? false;
      if (!passes(inc, exc, titleFacet.include, titleFacet.exclude)) return false;
    } else {
      if (filters.titleQuery && !blobHas(p.title, filters.titleQuery)) return false;
      if (filters.titles?.length) {
        const t = p.title.toLowerCase();
        const hit = filters.titles.some(
          (alias) => t.includes(alias) || (alias === "vp" && t.includes("vice president")),
        );
        if (!hit) return false;
      }
    }

    const locationFacet = facetOn(filters, "location");
    if (locationFacet) {
      const blob = `${c.location} ${c.city} ${c.country} ${p.location} ${p.city}`;
      const inc = locationFacet.include?.some((s) => locationHit(blob, s)) ?? false;
      const exc = locationFacet.exclude?.some((s) => locationHit(blob, s)) ?? false;
      if (!passes(inc, exc, locationFacet.include, locationFacet.exclude)) return false;
    } else if (filters.location) {
      const loc = filters.location.toLowerCase();
      const blob = `${c.location} ${c.city} ${c.country} ${p.location} ${p.city}`.toLowerCase();
      if (!blob.includes(loc)) return false;
    }
    if (filters.personLocation) {
      const loc = filters.personLocation.toLowerCase();
      if (!`${p.location} ${p.city}`.toLowerCase().includes(loc)) return false;
    }

    const seniorityFacet = facetOn(filters, "seniority");
    if (seniorityFacet) {
      const hit = (s: string) => termHit(SENIORITY_TERMS[p.seniority], s);
      const inc = seniorityFacet.include?.some(hit) ?? false;
      const exc = seniorityFacet.exclude?.some(hit) ?? false;
      if (!passes(inc, exc, seniorityFacet.include, seniorityFacet.exclude)) return false;
    } else if (filters.seniority?.length && !filters.seniority.includes(p.seniority)) return false;

    const departmentFacet = facetOn(filters, "department");
    if (departmentFacet) {
      const hit = (s: string) => termHit(DEPT_TERMS[p.department], s);
      const inc = departmentFacet.include?.some(hit) ?? false;
      const exc = departmentFacet.exclude?.some(hit) ?? false;
      if (!passes(inc, exc, departmentFacet.include, departmentFacet.exclude)) return false;
    } else if (filters.department?.length && !filters.department.includes(p.department)) return false;

    if (filters.keywords) {
      const blob = `${p.firstName} ${p.lastName} ${p.title} ${c.name} ${c.industry} ${c.tech.join(" ")} ${p.city}`;
      if (!blobHas(blob, filters.keywords)) return false;
    }
    const about = `${p.title} ${c.name} ${c.industry} ${c.tech.join(" ")} ${p.city}`;
    for (const key of ["experience", "language", "certification", "education", "skills"] as const) {
      const facet = facetOn(filters, key);
      if (!facet) continue;
      const inc = facet.include?.some((s) => blobHas(about, s)) ?? false;
      const exc = facet.exclude?.some((s) => blobHas(about, s)) ?? false;
      if (!passes(inc, exc, facet.include, facet.exclude)) return false;
    }
    const blob = `${p.firstName} ${p.lastName} ${p.title} ${c.name} ${c.domain} ${c.industry} ${p.city}`;
    for (const pin of Object.values(filters.keywordPins ?? {})) {
      const inc = pin.include?.some((s) => blobHas(blob, s)) ?? false;
      const exc = pin.exclude?.some((s) => blobHas(blob, s)) ?? false;
      if (!passes(inc, exc, pin.include, pin.exclude)) return false;
    }
    return true;
  });
}

export function applyCompanyFilters(filters: LeadFilters): Company[] {
  return COMPANIES.filter((c) => matchCompany(c, filters));
}

function placeId(city: string) {
  return city.toLowerCase().replace(/\s+/g, "-");
}

export function applyLocalFilters(filters: LeadFilters): LocalPlace[] {
  const people = applyLeadFilters(filters);
  const companies = applyCompanyFilters(filters);
  const map = new Map<string, LocalPlace>();

  const take = (city: string, country: string, location: string) => {
    const id = placeId(city);
    let row = map.get(id);
    if (!row) {
      row = { id, city, country, location, people: [], companies: [] };
      map.set(id, row);
    }
    return row;
  };

  for (const p of people) {
    const c = COMPANY_BY_ID[p.companyId];
    const country = (p.location.split(",")[1] || c?.country || "").trim();
    take(p.city, country, p.location).people.push(p);
  }
  for (const c of companies) {
    take(c.city, c.country, c.location).companies.push(c);
  }

  return [...map.values()].sort((a, b) => b.people.length + b.companies.length - (a.people.length + a.companies.length));
}

export function countLeadResults(kind: LeadKind, filters: LeadFilters): { count: number; singular: string; plural: string } {
  const meta = LEAD_KIND_META[kind];
  const count =
    kind === "company"
      ? applyCompanyFilters(filters).length
      : kind === "local"
        ? applyLocalFilters(filters).length
        : applyLeadFilters(filters).length;
  return { count, singular: meta.unit[0], plural: meta.unit[1] };
}

export function resultUnit(kind: LeadKind, count: number) {
  const [singular, plural] = LEAD_KIND_META[kind].unit;
  return count === 1 ? singular : plural;
}

export function hasActiveFilters(filters: LeadFilters): boolean {
  const { facets, keywordPins, ...rest } = filters;
  const restActive = Object.values(rest).some((v) => (Array.isArray(v) ? v.length > 0 : v != null && v !== ""));
  const facetActive = !!facets && Object.values(facets).some((f) => (f?.include?.length ?? 0) + (f?.exclude?.length ?? 0) > 0);
  const pinsActive =
    !!keywordPins && Object.values(keywordPins).some((f) => (f?.include?.length ?? 0) + (f?.exclude?.length ?? 0) > 0);
  return restActive || facetActive || pinsActive;
}

export function queryFromFilters(filters: LeadFilters, kind: LeadKind): string {
  const parts: string[] = [];
  const name = [filters.firstName, filters.lastName].filter(Boolean).join(" ");
  if (name) parts.push(name);
  if (filters.personName) parts.push(filters.personName);
  if (filters.titleQuery) parts.push(filters.titleQuery);
  if (filters.titles?.length) parts.push(filters.titles.join(" "));
  if (filters.seniority?.length) parts.push(filters.seniority.map((s) => SENIORITY_LABEL[s]).join(" "));
  if (filters.department?.length) parts.push(filters.department.map((d) => DEPT_LABEL[d]).join(" "));
  if (filters.companyQuery) parts.push(`at ${filters.companyQuery}`);
  if (filters.industry?.length) parts.push(filters.industry.join(", "));
  if (filters.funding?.length) parts.push(filters.funding.join(", "));
  if (filters.sizeMin != null || filters.sizeMax != null) {
    parts.push(`${filters.sizeMin ?? "1"}–${filters.sizeMax ?? "∞"} employees`);
  }
  if (filters.location) parts.push(`in ${filters.location}`);
  if (filters.tech?.length) parts.push(filters.tech.join(", "));
  if (filters.keywords) parts.push(filters.keywords);
  const facets = filters.facets;
  if (facets?.title?.include?.length) parts.push(facets.title.include.join(", "));
  if (facets?.seniority?.include?.length) parts.push(facets.seniority.include.join(", "));
  if (facets?.department?.include?.length) parts.push(facets.department.include.join(", "));
  if (facets?.company?.include?.length) parts.push(`at ${facets.company.include.join(", ")}`);
  if (facets?.industry?.include?.length) parts.push(facets.industry.include.join(", "));
  if (facets?.funding?.include?.length) parts.push(facets.funding.include.join(", "));
  if (facets?.headcount?.include?.length) parts.push(facets.headcount.include.join(", "));
  if (facets?.revenue?.include?.length) parts.push(facets.revenue.include.join(", "));
  if (facets?.location?.include?.length) parts.push(`in ${facets.location.include.join(", ")}`);
  if (facets?.skills?.include?.length) parts.push(facets.skills.include.join(", "));
  if (!parts.length) {
    if (kind === "company") return "All companies";
    if (kind === "local") return "All places";
    return "All people";
  }
  return parts.join(" · ");
}

export const SUGGESTED_SEARCHES = [
  "VPs of Engineering at companies with 50–200 people",
  "Heads of Sales at SaaS companies",
  "CTOs at fintech companies",
];

export const SUGGESTED_BY_KIND: Record<LeadKind, string[]> = {
  person: SUGGESTED_SEARCHES,
  company: ["Series B SaaS companies", "Fintech companies in New York", "Seed companies with 11–50 people"],
  local: ["Places in San Francisco", "Places in London", "Places in New York"],
};

export function resultIds(kind: LeadKind, filters: LeadFilters): string[] {
  if (kind === "company") return applyCompanyFilters(filters).map((c) => c.id);
  if (kind === "local") return applyLocalFilters(filters).map((p) => p.id);
  return applyLeadFilters(filters).map((p) => p.id);
}

export function listMemberIds(item: {
  kind: LeadKind;
  query: string;
  filters?: LeadFilters;
  memberIds?: string[];
}): string[] {
  if (item.memberIds) return item.memberIds;
  const kind = item.kind === "company" || item.kind === "local" ? item.kind : "person";
  return resultIds(kind, item.filters ?? parseLeadQuery(item.query));
}

export function peopleAtCompany(companyId: string): Person[] {
  return PEOPLE.filter((p) => p.companyId === companyId);
}
