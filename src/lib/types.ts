export type ResultKind =
  | "safe"
  | "valid"
  | "invalid"
  | "catch_all"
  | "unknown"
  | "disposable"
  | "role";

export type VerifyResult = {
  id: string;
  email: string;
  result: ResultKind;
  status: "valid" | "invalid" | "unknown";
  subresult: string;
  score: number;
  domain: string;
  username: string;
  isDeliverable: boolean;
  isSafeToSend: boolean;
  isDisposable: boolean;
  isCatchAll: boolean;
  isRole: boolean;
  isFree: boolean;
  isNoReply: boolean;
  hasTag: boolean;
  mxAcceptsMail: boolean;
  hasMx: boolean;
  hasSpf: boolean;
  hasDkim: boolean;
  hasDmarc: boolean;
  createdAt: number;
  source: "ui" | "api" | "bulk" | "find";
};

export type FindPersonInfo = {
  title: string;
  location: string;
  linkedin?: string;
  mailbox: "Professional" | "Personal" | "Role" | "Catch-all";
};

export type FindCompanyInfo = {
  name: string;
  domain: string;
  size: string;
  industry: string;
  location: string;
  website: string;
  founded?: string;
  revenue?: string;
  linkedin?: string;
  about?: string;
};

export type FindResult = {
  id: string;
  found: boolean;
  email?: string;
  verified?: boolean;
  confidence?: number;
  pattern?: string;
  firstName: string;
  lastName: string;
  domain?: string;
  company: string;
  reason?: string;
  status?: VerifyResult;
  createdAt: number;
  creditsCharged: number;
  enriched?: boolean;
  personInfo?: FindPersonInfo;
  companyInfo?: FindCompanyInfo;
};

export type DomainSearchResult = {
  id: string;
  domain: string;
  company?: string;
  found: boolean;
  pattern?: string;
  organization?: string;
  otherPatterns: string[];
  samples: string[];
  createdAt: number;
  creditsCharged: number;
};

export type FindIntake = {
  uploaded: number;
  unique: number;
  duplicates: number;
  skipped: number;
  mapped: string;
};

export type BulkJob = {
  id: string;
  name: string;
  type: "verify" | "find";
  status: "processing" | "completed" | "failed";
  total: number;
  processed: number;
  found?: number;
  counts: Partial<Record<ResultKind, number>>;
  createdAt: number;
  finishedAt?: number;
  results: VerifyResult[] | FindResult[];
  intake?: FindIntake;
};

export type ApiKey = {
  id: string;
  name: string;
  prefix: string;
  key: string;
  createdAt: number;
  lastUsedAt: number | null;
  requests: number;
  status: "active" | "revoked";
};

export type LeadKind = "person" | "company" | "local";

export function asLeadKind(v: unknown): LeadKind {
  return v === "company" || v === "local" ? v : "person";
}

export type UsagePoint = {
  date: string;
  verify: number;
  find: number;
  api: number;
};

export type Invoice = {
  id: string;
  date: number;
  amount: number;
  description: string;
  status: "paid" | "open";
  credits: number;
  buyer: string;
  method: string;
  balanceAfter: number;
};

export type Company = {
  id: string;
  name: string;
  domain: string;
  industry: string;
  sizeMin: number;
  sizeMax: number;
  sizeLabel: string;
  revenue: string;
  funding: string;
  location: string;
  city: string;
  country: string;
  tech: string[];
  naics: string;
};

export type Person = {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  seniority: "c_suite" | "vp" | "head" | "director" | "manager" | "ic" | "founder";
  department:
    | "engineering"
    | "sales"
    | "marketing"
    | "product"
    | "design"
    | "finance"
    | "hr"
    | "operations"
    | "data"
    | "support";
  companyId: string;
  location: string;
  city: string;
};

export type FilterFacet = {
  include?: string[];
  exclude?: string[];
};

export type LeadFilterFacets = {
  title?: FilterFacet;
  location?: FilterFacet;
  seniority?: FilterFacet;
  industry?: FilterFacet;
  department?: FilterFacet;
  skills?: FilterFacet;
  company?: FilterFacet;
  domain?: FilterFacet;
  headcount?: FilterFacet;
  revenue?: FilterFacet;
  funding?: FilterFacet;
  companyType?: FilterFacet;
  businessType?: FilterFacet;
  revenueStream?: FilterFacet;
  experience?: FilterFacet;
  language?: FilterFacet;
  certification?: FilterFacet;
  education?: FilterFacet;
  keywords?: FilterFacet;
};

export type LeadFilters = {
  companyQuery?: string;
  sizeMin?: number;
  sizeMax?: number;
  revenue?: string[];
  funding?: string[];
  industry?: string[];
  location?: string;
  tech?: string[];
  personName?: string;
  personLocation?: string;
  titles?: string[];
  seniority?: Person["seniority"][];
  department?: Person["department"][];
  firstName?: string;
  lastName?: string;
  titleQuery?: string;
  keywords?: string;
  facets?: LeadFilterFacets;
  /** Free-typed text, kept on the filter it was typed into. */
  keywordPins?: Record<string, FilterFacet>;
};

export type SavedSearch = {
  id: string;
  name: string;
  query: string;
  kind: LeadKind;
  filters?: LeadFilters;
  createdAt: number;
  updatedAt?: number;
  /** People, companies, or places in this list. Missing = legacy saved search. */
  memberIds?: string[];
};

export type TeamRole = "admin" | "member";

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  status: "active" | "invited";
  you?: boolean;
  joinedAt: number;
};

export const RESULT_META: Record<
  ResultKind,
  { label: string; verdict: string; tone: "safe" | "risk" | "invalid" | "unknown" }
> = {
  safe: {
    label: "Safe",
    verdict: "Safe to send.",
    tone: "safe",
  },
  valid: {
    label: "Valid",
    verdict: "Deliverable, with caveats.",
    tone: "risk",
  },
  catch_all: {
    label: "Catch-all",
    verdict: "Inbox may not be theirs.",
    tone: "risk",
  },
  role: {
    label: "Role",
    verdict: "A shared inbox, not a person.",
    tone: "risk",
  },
  disposable: {
    label: "Disposable",
    verdict: "Throwaway address.",
    tone: "invalid",
  },
  invalid: {
    label: "Invalid",
    verdict: "Will bounce.",
    tone: "invalid",
  },
  unknown: {
    label: "Unknown",
    verdict: "Could not confirm.",
    tone: "unknown",
  },
};

export const LEAD_KIND_META: Record<LeadKind, { label: string; search: string; unit: [string, string] }> = {
  person: { label: "Person", search: "Search people", unit: ["person", "people"] },
  company: { label: "Company", search: "Search companies", unit: ["company", "companies"] },
  local: { label: "Local", search: "Search places", unit: ["place", "places"] },
};
