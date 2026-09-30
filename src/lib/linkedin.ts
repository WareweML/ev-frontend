import { COMPANIES, COMPANY_BY_ID, PEOPLE } from "./leads-data";

export type LinkedInPerson = {
  firstName: string;
  lastName: string;
  company: string;
  domain: string;
  slug: string;
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const EXTRA: LinkedInPerson[] = [
  { firstName: "John", lastName: "Smith", company: "Acme Corporation", domain: "acme.com", slug: "john-smith" },
  { firstName: "Jane", lastName: "Cooper", company: "Northstar Labs", domain: "northstarlabs.io", slug: "jane-cooper" },
  { firstName: "Kumar", lastName: "Manaswi", company: "Warewe", domain: "warewe.ai", slug: "kumar-manaswi" },
];

export function isLinkedInProfile(raw: string) {
  return /linkedin\.com\/in\//i.test(raw.trim());
}

export function isLinkedInCompany(raw: string) {
  return /linkedin\.com\/company\//i.test(raw.trim());
}

export function parseLinkedInSlug(raw: string): string | null {
  const s = raw.trim();
  if (!s || isLinkedInCompany(s)) return null;
  const fromUrl = s.match(/linkedin\.com\/in\/([^/?#]+)/i);
  const slug = decodeURIComponent((fromUrl?.[1] ?? (/^[a-z0-9][a-z0-9_-]+$/i.test(s) && !s.includes(".") ? s : "")).replace(/\/+$/, ""));
  if (!slug || slug.length < 2) return null;
  return slug.toLowerCase();
}

export function lookupLinkedIn(raw: string): LinkedInPerson | null {
  const slug = parseLinkedInSlug(raw);
  if (!slug) return null;

  const listed: LinkedInPerson[] = PEOPLE.map((p) => {
    const c = COMPANY_BY_ID[p.companyId];
    return {
      firstName: p.firstName,
      lastName: p.lastName,
      company: c?.name ?? "",
      domain: c?.domain ?? "company.com",
      slug: slugify(`${p.firstName} ${p.lastName}`),
    };
  }).concat(EXTRA);

  const hit = listed.find((p) => slug === p.slug || slug.startsWith(`${p.slug}-`));
  if (hit) return { ...hit, slug };

  const tokens = slug.split("-").filter((t) => /[a-z]{2,}/i.test(t) && !/^\d+$/.test(t));
  if (!tokens.length) return null;
  const firstName = cap(tokens[0]!);
  const lastName = tokens.length > 1 ? cap(tokens[1]!) : "";
  const c = COMPANIES[hash(slug) % COMPANIES.length]!;
  return { firstName, lastName, company: c.name, domain: c.domain, slug };
}
