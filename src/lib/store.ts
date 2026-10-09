import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  emailFromPerson,
  extractEmails,
  findEmail,
  isEmailShape,
  parseFindUpload,
  searchDomain,
  uid,
  verifyEmail,
} from "./engine";
import { COMPANY_BY_ID, listMemberIds, parseLeadQuery, resultIds } from "./leads-data";
import { asPlanId, PLAN_BY_ID, type Plan, type PlanId } from "./plans";
import type {
  ApiKey,
  BulkJob,
  DomainSearchResult,
  FindIntake,
  FindResult,
  Invoice,
  LeadFilters,
  LeadKind,
  ResultKind,
  SavedSearch,
  TeamMember,
  TeamRole,
  UsagePoint,
  VerifyResult,
} from "./types";

const T0 = Date.parse("2026-09-02T12:00:00+05:30");
const jobTickCache = new Map<string, (batch: number) => void>();

function seedHistory(): VerifyResult[] {
  return [
    verifyEmail("satya.nadella@microsoft.com", "ui", T0 - 3600000),
    verifyEmail("kumar@warewe.ai", "ui", T0 - 7200000),
    verifyEmail("john.smith@acme.com", "ui", T0 - 86400000),
  ];
}

function seedFinds(): FindResult[] {
  return [
    findEmail("John Smith", "Acme Corporation", T0 - 86400000),
    findEmail("Amelia Chen", "Northstar Labs", T0 - 86400000 * 2, true),
  ];
}

function seedDomains(): DomainSearchResult[] {
  return [searchDomain("acme.com", T0 - 86400000 * 3)];
}

function seedJobs(): BulkJob[] {
  const mk = (
    id: string,
    name: string,
    createdAt: number,
    counts: BulkJob["counts"],
    total: number,
  ): BulkJob => ({
    id,
    name,
    type: "verify",
    status: "completed",
    total,
    processed: total,
    counts,
    createdAt,
    finishedAt: createdAt + 180000,
    results: [
      verifyEmail("kumar@warewe.ai", "bulk", createdAt),
      verifyEmail("john.smith@acme.com", "bulk", createdAt),
      verifyEmail("info@harborandco.com", "bulk", createdAt),
      verifyEmail("temp@mailinator.com", "bulk", createdAt),
      verifyEmail("maya@papertrail.health", "bulk", createdAt),
    ],
  });
  return [
    mk("job_aug21", "Outbound Q3", Date.parse("2026-08-21T11:49:00+05:30"), { safe: 78, invalid: 9, valid: 13 }, 100),
    mk("job_aug17b", "Webinar signups", Date.parse("2026-08-17T22:42:00+05:30"), { safe: 77, invalid: 7, valid: 14, unknown: 2 }, 100),
    mk("job_aug17a", "Trial users", Date.parse("2026-08-17T16:39:00+05:30"), { safe: 76, invalid: 9, valid: 14, unknown: 1 }, 100),
    {
      id: "job_find_sep",
      name: "SDR accounts",
      type: "find",
      status: "completed",
      total: 6,
      processed: 6,
      found: 5,
      counts: {},
      createdAt: Date.parse("2026-09-02T11:20:00+05:30"),
      finishedAt: Date.parse("2026-09-02T11:22:00+05:30"),
      intake: { uploaded: 8, unique: 6, duplicates: 2, skipped: 0, mapped: "Name and company" },
      results: [
        findEmail("Amelia Chen", "Northstar Labs", Date.parse("2026-09-02T11:20:00+05:30")),
        findEmail("John Smith", "Acme Corporation", Date.parse("2026-09-02T11:20:30+05:30")),
        findEmail("Kumar Manaswi", "Warewe", Date.parse("2026-09-02T11:20:50+05:30")),
        findEmail("Leila Hassan", "Voltmesh", Date.parse("2026-09-02T11:21:20+05:30")),
        findEmail("Maya Okoro", "Papertrail Health", Date.parse("2026-09-02T11:21:40+05:30")),
        findEmail("Noah Park", "Voltmesh", Date.parse("2026-09-02T11:22:00+05:30")),
      ],
    },
    {
      id: "job_find_conf",
      name: "Conference contacts",
      type: "find",
      status: "completed",
      total: 6,
      processed: 6,
      found: 4,
      counts: {},
      createdAt: Date.parse("2026-08-28T15:10:00+05:30"),
      finishedAt: Date.parse("2026-08-28T15:12:00+05:30"),
      intake: { uploaded: 7, unique: 6, duplicates: 0, skipped: 1, mapped: "Name and company, LinkedIn profile" },
      results: [
        findEmail("Amelia Chen", "Northstar Labs", Date.parse("2026-08-28T15:10:00+05:30")),
        findEmail("John Smith", "Acme Corporation", Date.parse("2026-08-28T15:10:20+05:30")),
        findEmail("Leila Hassan", "Voltmesh", Date.parse("2026-08-28T15:10:40+05:30")),
        findEmail("Maya Okoro", "Papertrail Health", Date.parse("2026-08-28T15:11:00+05:30")),
        findEmail("Noah Park", "Voltmesh", Date.parse("2026-08-28T15:11:20+05:30")),
        findEmail("Kumar Manaswi", "Warewe", Date.parse("2026-08-28T15:11:40+05:30")),
      ],
    },
  ];
}

function seedKeys(): ApiKey[] {
  return [
    {
      id: "key_1",
      name: "Production",
      prefix: "ev_8f21",
      key: "ev_8f21b0c94a7d2e6f1c3a9b5d8e0f2a4c",
      createdAt: Date.parse("2025-09-23T10:00:00Z"),
      lastUsedAt: T0,
      requests: 1280,
      status: "active",
    },
  ];
}

function seedUsage(): UsagePoint[] {
  const days: UsagePoint[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(T0 - i * 86400000);
    const date = d.toISOString().slice(0, 10);
    days.push({ date, verify: 40 + (i % 7) * 8, find: 6 + (i % 5), api: 12 + (i % 4) * 3 });
  }
  return days;
}

function seedMembers(): TeamMember[] {
  return [
    {
      id: "m_you",
      name: "Kumar Manaswi",
      email: "kumar@warewe.ai",
      role: "admin",
      status: "active",
      you: true,
      joinedAt: Date.parse("2025-09-23T10:00:00Z"),
    },
    {
      id: "m_priya",
      name: "Priya Shah",
      email: "priya@warewe.ai",
      role: "member",
      status: "active",
      joinedAt: Date.parse("2026-01-12T10:00:00Z"),
    },
  ];
}

export function seedSavedSearches(): SavedSearch[] {
  const personQuery = "VPs of Engineering at companies with 50–200 employees";
  const companyQuery = "Series B companies";
  const localQuery = "San Francisco";
  return [
    {
      id: "ss_person",
      name: "Eng VPs, mid-market",
      query: personQuery,
      kind: "person",
      createdAt: T0 - 86400000 * 3,
      updatedAt: T0 - 86400000 * 3,
      memberIds: resultIds("person", parseLeadQuery(personQuery)),
    },
    {
      id: "ss_company",
      name: "Series B companies",
      query: companyQuery,
      kind: "company",
      createdAt: T0 - 86400000 * 2,
      updatedAt: T0 - 86400000 * 2,
      memberIds: resultIds("company", parseLeadQuery(companyQuery)),
    },
    {
      id: "ss_local",
      name: "San Francisco",
      query: localQuery,
      kind: "local",
      createdAt: T0 - 86400000,
      updatedAt: T0 - 86400000,
      memberIds: resultIds("local", parseLeadQuery(localQuery)),
    },
  ];
}

const FREE_INBOX = new Set(["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com"]);

type State = {
  credits: number;
  planCredits: number;
  planId: PlanId;
  history: VerifyResult[];
  finds: FindResult[];
  domains: DomainSearchResult[];
  jobs: BulkJob[];
  keys: ApiKey[];
  revealed: Record<string, string>;
  savedSearches: SavedSearch[];
  recentLeadQueries: string[];
  usage: UsagePoint[];
  invoices: Invoice[];
  workspaceName: string;
  members: TeamMember[];
  followed: string[];
  hydrated: boolean;
  onboarded: boolean;
  setHydrated: (v: boolean) => void;
  completeOnboarding: () => void;
  spend: (n: number) => boolean;
  runVerify: (email: string, source?: VerifyResult["source"]) => VerifyResult | null;
  runFind: (name: string, company: string, enrich?: boolean) => FindResult;
  runDomain: (q: string) => DomainSearchResult;
  clearHistory: () => void;
  clearFinds: () => void;
  startVerifyJob: (name: string, emails: string[]) => string;
  startFindJob: (name: string, rows: { name: string; company: string }[], intake?: FindIntake) => string;
  removeJob: (id: string) => void;
  tickJob: (id: string, batch?: number) => void;
  createKey: (name: string) => ApiKey | null;
  revokeKey: (id: string) => void;
  touchKey: (key: string) => void;
  revealLead: (id: string, first: string, last: string, companyId: string) => string | null;
  spendCredits: (amount: number) => boolean;
  saveSearch: (name: string, query: string, kind: LeadKind, filters?: LeadFilters, memberIds?: string[]) => string;
  createList: (name: string, kind?: LeadKind) => string;
  addToList: (id: string, memberIds: string[]) => number;
  removeFromList: (id: string, memberIds: string[]) => void;
  renameSearch: (id: string, name: string) => void;
  deleteSearch: (id: string) => void;
  rememberLeadQuery: (q: string) => void;
  renameWorkspace: (name: string) => void;
  inviteMember: (email: string, role: TeamRole) => "ok" | "plan" | "bad_email" | "exists";
  removeMember: (id: string) => void;
  setMemberRole: (id: string, role: TeamRole) => boolean;
  toggleFollow: (domain: string) => void;
  buyCredits: (credits: number, price: number, label: string) => void;
  setPlan: (id: PlanId, monthlyCredits?: number) => void;
};

export const useAppStore = create<State>()(
  persist(
    (set, get) => ({
      credits: 12847,
      planCredits: 25000,
      planId: "subscription",
      history: seedHistory(),
      finds: seedFinds(),
      domains: seedDomains(),
      jobs: seedJobs(),
      keys: seedKeys(),
      revealed: {},
      savedSearches: seedSavedSearches(),
      recentLeadQueries: [],
      usage: seedUsage(),
      invoices: [
        {
          id: "inv_2041",
          date: Date.parse("2026-09-01T09:44:00"),
          amount: 45,
          description: "25,000 credits",
          status: "paid",
          credits: 25000,
          buyer: "Kumar Manaswi",
          method: "Card Payment",
          balanceAfter: 55000,
        },
        {
          id: "inv_1988",
          date: Date.parse("2026-08-01T11:02:00"),
          amount: 45,
          description: "25,000 credits",
          status: "paid",
          credits: 25000,
          buyer: "Kumar Manaswi",
          method: "Card Payment",
          balanceAfter: 30000,
        },
        {
          id: "inv_1902",
          date: Date.parse("2026-07-12T15:14:00"),
          amount: 9,
          description: "5,000 credits",
          status: "paid",
          credits: 5000,
          buyer: "Kumar Manaswi",
          method: "Card Payment",
          balanceAfter: 5000,
        },
      ],
      workspaceName: "Warewe",
      members: seedMembers(),
      followed: [],
      hydrated: false,
      onboarded: false,
      setHydrated: (v) => set({ hydrated: v }),
      completeOnboarding: () => set({ onboarded: true }),

      spend: (n) => {
        if (n <= 0) return true;
        if (get().credits < n) return false;
        set((s) => ({ credits: s.credits - n }));
        return true;
      },

      runVerify: (email, source = "ui") => {
        if (get().credits < 1) return null;
        const result = verifyEmail(email, source);
        set((s) => ({
          credits: s.credits - 1,
          history: [result, ...s.history].slice(0, 80),
        }));
        return result;
      },

      runFind: (name, company, enrich = false) => {
        const preview = findEmail(name, company, Date.now(), enrich);
        const cost = preview.creditsCharged;
        if (cost > 0 && get().credits < cost) {
          return { ...preview, found: false, reason: "insufficient_credits", creditsCharged: 0, email: undefined };
        }
        if (cost > 0) set((s) => ({ credits: s.credits - cost }));
        set((s) => ({ finds: [preview, ...s.finds].slice(0, 40) }));
        return preview;
      },

      runDomain: (q) => {
        const result = searchDomain(q);
        if (result.creditsCharged > 0 && get().credits < result.creditsCharged) {
          return { ...result, found: false, creditsCharged: 0 };
        }
        if (result.creditsCharged > 0) set((s) => ({ credits: s.credits - result.creditsCharged }));
        set((s) => ({ domains: [result, ...s.domains].slice(0, 40) }));
        return result;
      },

      clearHistory: () => set({ history: [] }),
      clearFinds: () => set({ finds: [] }),

      startVerifyJob: (name, emails) => {
        const id = uid("job");
        const unique = [...new Set(emails.map((e) => e.trim().toLowerCase()).filter(Boolean))];
        const job: BulkJob = {
          id,
          name,
          type: "verify",
          status: unique.length ? "processing" : "failed",
          total: unique.length,
          processed: 0,
          counts: {},
          createdAt: Date.now(),
          results: [],
        };
        set((s) => ({ jobs: [job, ...s.jobs] }));
        return id;
      },

      startFindJob: (name, rows, intake) => {
        const id = uid("job");
        const job: BulkJob = {
          id,
          name,
          type: "find",
          status: rows.length ? "processing" : "failed",
          total: rows.length,
          processed: 0,
          found: 0,
          counts: {},
          createdAt: Date.now(),
          results: [],
          intake,
        };
        set((s) => ({ jobs: [job, ...s.jobs] }));
        return id;
      },

      removeJob: (id) => set((s) => ({ jobs: s.jobs.filter((j) => j.id !== id) })),

      tickJob: (id, batch = 8) => {
        const job = get().jobs.find((j) => j.id === id);
        if (!job || job.status !== "processing") return;
        jobTickCache.get(id)?.(batch);
      },

      createKey: (name) => {
        const plan = PLAN_BY_ID[asPlanId(get().planId)];
        const active = get().keys.filter((k) => k.status === "active").length;
        if (active >= plan.maxKeys) return null;
        const prefix = `ev_${Math.random().toString(16).slice(2, 6)}`;
        const key: ApiKey = {
          id: uid("key"),
          name: name.trim() || "Untitled key",
          prefix,
          key: `${prefix}${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`.slice(0, 36),
          createdAt: Date.now(),
          lastUsedAt: null,
          requests: 0,
          status: "active",
        };
        set((s) => ({ keys: [key, ...s.keys] }));
        return key;
      },

      revokeKey: (id) =>
        set((s) => ({
          keys: s.keys.map((k) => (k.id === id ? { ...k, status: "revoked" as const } : k)),
        })),

      touchKey: (key) =>
        set((s) => ({
          keys: s.keys.map((k) =>
            k.key === key ? { ...k, lastUsedAt: Date.now(), requests: k.requests + 1 } : k,
          ),
        })),

      revealLead: (id, first, last, companyId) => {
        const existing = get().revealed[id];
        if (existing) return existing;
        const cost = 5;
        if (get().credits < cost) return null;
        const company = COMPANY_BY_ID[companyId];
        if (!company) return null;
        const email = emailFromPerson(first, last, company.domain);
        set((s) => ({
          credits: s.credits - cost,
          revealed: { ...s.revealed, [id]: email },
        }));
        return email;
      },

      spendCredits: (amount) => {
        if (amount <= 0) return true;
        if (get().credits < amount) return false;
        set((s) => ({ credits: s.credits - amount }));
        return true;
      },

      saveSearch: (name, query, kind, filters, memberIds) => {
        const id = uid("list");
        const item: SavedSearch = {
          id,
          name: name.trim() || "Untitled list",
          query,
          kind,
          filters,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          memberIds: memberIds ?? listMemberIds({ kind, query, filters }),
        };
        set((s) => ({ savedSearches: [item, ...s.savedSearches] }));
        return id;
      },

      createList: (name, kind = "person") => {
        const id = uid("list");
        const item: SavedSearch = {
          id,
          name: name.trim() || "Untitled list",
          query: "",
          kind,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          memberIds: [],
        };
        set((s) => ({ savedSearches: [item, ...s.savedSearches] }));
        return id;
      },

      addToList: (id, memberIds) => {
        const list = get().savedSearches.find((x) => x.id === id);
        if (!list) return 0;
        const have = new Set(list.memberIds ?? []);
        const next = memberIds.filter((m) => !have.has(m));
        if (!next.length) return 0;
        set((s) => ({
          savedSearches: s.savedSearches.map((item) =>
            item.id === id
              ? { ...item, updatedAt: Date.now(), memberIds: [...(item.memberIds ?? []), ...next] }
              : item,
          ),
        }));
        return next.length;
      },

      removeFromList: (id, memberIds) => {
        const drop = new Set(memberIds);
        set((s) => ({
          savedSearches: s.savedSearches.map((item) =>
            item.id === id
              ? { ...item, updatedAt: Date.now(), memberIds: (item.memberIds ?? []).filter((m) => !drop.has(m)) }
              : item,
          ),
        }));
      },

      renameSearch: (id, name) =>
        set((s) => ({
          savedSearches: s.savedSearches.map((item) =>
            item.id === id ? { ...item, updatedAt: Date.now(), name: name.trim() || item.name } : item,
          ),
        })),

      deleteSearch: (id) => set((s) => ({ savedSearches: s.savedSearches.filter((x) => x.id !== id) })),

      rememberLeadQuery: (q) =>
        set((s) => ({
          recentLeadQueries: [q, ...s.recentLeadQueries.filter((x) => x !== q)].slice(0, 8),
        })),

      renameWorkspace: (name) => set({ workspaceName: name.trim() || get().workspaceName }),

      inviteMember: (email, role) => {
        const plan = PLAN_BY_ID[asPlanId(get().planId)];
        if (!plan.features.team) return "plan";
        const next = email.trim().toLowerCase();
        if (!isEmailShape(next)) return "bad_email";
        const domain = next.split("@")[1] ?? "";
        if (FREE_INBOX.has(domain)) return "bad_email";
        if (get().members.some((m) => m.email.toLowerCase() === next)) return "exists";
        const member: TeamMember = {
          id: uid("mem"),
          name: next.split("@")[0] ?? next,
          email: next,
          role,
          status: "invited",
          joinedAt: Date.now(),
        };
        set((s) => ({ members: [...s.members, member] }));
        return "ok";
      },

      removeMember: (id) => {
        const target = get().members.find((m) => m.id === id);
        if (!target || target.you) return;
        const admins = get().members.filter((m) => m.role === "admin" && m.status === "active");
        if (target.role === "admin" && admins.length <= 1) return;
        set((s) => ({ members: s.members.filter((m) => m.id !== id) }));
      },

      setMemberRole: (id, role) => {
        const target = get().members.find((m) => m.id === id);
        if (!target) return false;
        if (target.role === "admin" && role !== "admin") {
          const admins = get().members.filter((m) => m.role === "admin" && m.status === "active");
          if (admins.length <= 1) return false;
        }
        set((s) => ({
          members: s.members.map((m) => (m.id === id ? { ...m, role } : m)),
        }));
        return true;
      },

      toggleFollow: (domain) => {
        const d = domain.trim().toLowerCase();
        if (!d) return;
        set((s) => ({
          followed: s.followed.includes(d) ? s.followed.filter((x) => x !== d) : [d, ...s.followed],
        }));
      },

      buyCredits: (credits, price, label) =>
        set((s) => {
          const balanceAfter = s.credits + credits;
          const you = s.members.find((m) => m.you);
          return {
            credits: balanceAfter,
            invoices: [
              {
                id: uid("inv"),
                date: Date.now(),
                amount: price,
                description: label,
                status: "paid" as const,
                credits,
                buyer: you?.name ?? "Kumar Manaswi",
                method: "Card Payment",
                balanceAfter,
              },
              ...s.invoices,
            ],
          };
        }),

      setPlan: (id, monthlyCredits) => {
        const plan = PLAN_BY_ID[asPlanId(id)];
        set({
          planId: plan.id,
          planCredits: plan.id === "subscription" ? (monthlyCredits ?? plan.monthlyCredits) : 0,
        });
      },
    }),
    {
      name: "emailverifier.io",
      partialize: (s) => ({
        credits: s.credits,
        history: s.history,
        finds: s.finds,
        domains: s.domains,
        jobs: s.jobs.filter((j) => j.status !== "processing"),
        keys: s.keys,
        revealed: s.revealed,
        savedSearches: s.savedSearches,
        recentLeadQueries: s.recentLeadQueries,
        invoices: s.invoices,
        onboarded: s.onboarded,
        planId: s.planId,
        planCredits: s.planCredits,
        workspaceName: s.workspaceName,
        members: s.members,
        followed: s.followed,
      }),
      skipHydration: true,
    },
  ),
);

export function registerVerifyJob(id: string, emails: string[]) {
  jobTickCache.set(id, (batch: number) => {
    useAppStore.setState((s) => {
      const job = s.jobs.find((j) => j.id === id);
      if (!job || job.status !== "processing") return s;
      const start = job.processed;
      const slice = emails.slice(start, start + batch);
      const nextResults = [...(job.results as VerifyResult[])];
      const counts: Partial<Record<ResultKind, number>> = { ...job.counts };
      let spent = 0;
      let added = 0;
      for (const email of slice) {
        if (s.credits - spent < 1) break;
        const r = verifyEmail(email, "bulk");
        nextResults.push(r);
        counts[r.result] = (counts[r.result] ?? 0) + 1;
        spent += 1;
        added += 1;
      }
      const processed = start + added;
      const done = processed >= emails.length;
      return {
        credits: s.credits - spent,
        jobs: s.jobs.map((j) =>
          j.id === id
            ? {
                ...j,
                processed: Math.min(processed, emails.length),
                counts,
                results: nextResults,
                status: done ? ("completed" as const) : j.status,
                finishedAt: done ? Date.now() : undefined,
              }
            : j,
        ),
        history: [...nextResults.slice(start), ...s.history].slice(0, 80),
      };
    });
  });
}

export function registerFindJob(id: string, rows: { name: string; company: string }[]) {
  jobTickCache.set(id, (batch: number) => {
    useAppStore.setState((s) => {
      const job = s.jobs.find((j) => j.id === id);
      if (!job || job.status !== "processing") return s;
      const start = job.processed;
      const slice = rows.slice(start, start + batch);
      const nextResults = [...(job.results as FindResult[])];
      let spent = 0;
      let found = job.found ?? 0;
      let added = 0;
      for (const row of slice) {
        const r = findEmail(row.name, row.company);
        if (r.creditsCharged) {
          if (s.credits - spent < r.creditsCharged) break;
          spent += r.creditsCharged;
        }
        nextResults.push(r);
        if (r.found) found += 1;
        added += 1;
      }
      const processed = start + added;
      const done = processed >= rows.length;
      return {
        credits: s.credits - spent,
        jobs: s.jobs.map((j) =>
          j.id === id
            ? {
                ...j,
                processed: Math.min(processed, rows.length),
                found,
                results: nextResults,
                status: done ? ("completed" as const) : j.status,
                finishedAt: done ? Date.now() : undefined,
              }
            : j,
        ),
      };
    });
  });
}

export function parseVerifyFile(text: string) {
  return extractEmails(text);
}

export function parseFindFile(text: string) {
  return parseFindUpload(text);
}

export const USER = {
  name: "Kumar Manaswi",
  firstName: "Kumar",
  email: "kumar@warewe.ai",
  company: "Warewe",
};

export function usePlan(): Plan {
  const id = useAppStore((s) => s.planId);
  return PLAN_BY_ID[asPlanId(id)];
}
