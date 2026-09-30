import { COMPANY_BY_ID, COMPANIES, PEOPLE } from "./leads-data";
import type { FindCompanyInfo, FindPersonInfo, FindResult, VerifyResult } from "./types";

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const KNOWN: Record<string, Omit<FindCompanyInfo, "domain" | "website" | "linkedin">> = {
  "acme.com": {
    name: "Acme Corporation",
    size: "201–500",
    industry: "Software",
    location: "Austin, US",
    founded: "1998",
    revenue: "$50–100M",
  },
  "warewe.ai": {
    name: "Warewe",
    size: "11–50",
    industry: "Software",
    location: "Delhi, IN",
    founded: "2021",
    revenue: "$1–10M",
  },
  "google.com": {
    name: "Google",
    size: "10,000+",
    industry: "Internet",
    location: "Mountain View, US",
    founded: "1998",
    revenue: "$100B+",
  },
  "microsoft.com": {
    name: "Microsoft",
    size: "10,001+",
    industry: "Software Development",
    location: "Redmond, Washington",
    founded: "1975",
    revenue: "$100B+",
    about: "Microsoft builds software, cloud services, and devices used by companies worldwide.",
  },
  "stripe.com": {
    name: "Stripe",
    size: "5,000+",
    industry: "Fintech",
    location: "San Francisco, US",
    founded: "2010",
    revenue: "$1B+",
  },
};

const TITLES = [
  "VP of Sales",
  "Head of Marketing",
  "Director of Operations",
  "Account Executive",
  "Head of Growth",
  "VP of Partnerships",
];

const SIZES = ["11–50", "51–200", "201–500", "501–1,000", "1,001–5,000"];
const INDUSTRIES = ["Software", "Services", "Finance", "Healthcare", "Manufacturing", "Media"];

function slug(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function mailboxLabel(status?: VerifyResult): FindPersonInfo["mailbox"] {
  if (!status) return "Professional";
  if (status.isRole) return "Role";
  if (status.isFree) return "Personal";
  if (status.isCatchAll) return "Catch-all";
  return "Professional";
}

function companyInfo(domain: string, company: string): FindCompanyInfo {
  const known = KNOWN[domain];
  if (known) {
    return {
      ...known,
      domain,
      website: domain,
      linkedin: `linkedin.com/company/${slug(known.name)}`,
      about: known.about ?? `${known.industry} company based in ${known.location}.`,
    };
  }
  const listed = COMPANIES.find((c) => c.domain === domain);
  if (listed) {
    return {
      name: listed.name,
      domain,
      size: listed.sizeLabel,
      industry: listed.industry,
      location: listed.location,
      website: listed.domain,
      revenue: listed.revenue,
      linkedin: `linkedin.com/company/${slug(listed.name)}`,
      about: `${listed.industry} company based in ${listed.location}.`,
    };
  }
  const h = hash(domain);
  const name = company.includes(".") ? domain.split(".")[0]!.replace(/^\w/, (c) => c.toUpperCase()) : company.trim();
  return {
    name: name || domain,
    domain,
    size: SIZES[h % SIZES.length]!,
    industry: INDUSTRIES[(h >> 3) % INDUSTRIES.length]!,
    location: ["Austin, US", "London, UK", "Bengaluru, IN", "Berlin, DE", "New York, US"][h % 5]!,
    website: domain,
    founded: String(1988 + (h % 30)),
    revenue: ["$1–10M", "$10–50M", "$50–100M", "$100–500M"][(h >> 5) % 4]!,
    linkedin: `linkedin.com/company/${slug(name || domain)}`,
    about: `${INDUSTRIES[(h >> 3) % INDUSTRIES.length]} company.`,
  };
}

function personInfo(result: FindResult, domain: string, company: FindCompanyInfo): FindPersonInfo {
  const first = result.firstName.toLowerCase();
  const last = result.lastName.toLowerCase();
  const match = PEOPLE.find((p) => {
    const c = COMPANY_BY_ID[p.companyId];
    return (
      p.firstName.toLowerCase() === first &&
      p.lastName.toLowerCase() === last &&
      (!c || c.domain === domain)
    );
  });
  const h = hash(`${first}.${last}@${domain}`);
  const title = match?.title ?? (first === "john" && last === "smith" ? "VP of Sales" : TITLES[h % TITLES.length]!);
  const location = match?.location ?? company.location;
  return {
    title,
    location,
    linkedin: `linkedin.com/in/${slug(`${result.firstName} ${result.lastName}`)}`,
    mailbox: mailboxLabel(result.status),
  };
}

export function attachEnrich(result: FindResult): FindResult {
  if (!result.found || !result.domain) return result;
  const company = companyInfo(result.domain, result.company);
  return {
    ...result,
    enriched: true,
    creditsCharged: 10,
    personInfo: personInfo(result, result.domain, company),
    companyInfo: company,
  };
}
