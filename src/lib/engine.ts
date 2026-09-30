import type {
  DomainSearchResult,
  FindResult,
  ResultKind,
  VerifyResult,
} from "./types";
import { attachEnrich } from "./find-enrich";
import { isLinkedInProfile, lookupLinkedIn } from "./linkedin";

const FREE_DOMAINS = new Set([
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "icloud.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "zoho.com",
  "live.com",
  "msn.com",
  "me.com",
  "yandex.com",
  "mail.com",
  "gmx.com",
]);

const DISPOSABLE = new Set([
  "mailinator.com",
  "10minutemail.com",
  "guerrillamail.com",
  "tempmail.com",
  "yopmail.com",
  "trashmail.com",
  "getnada.com",
  "sharklasers.com",
  "discard.email",
  "temp-mail.org",
]);

const ROLE_LOCAL = new Set([
  "info",
  "admin",
  "support",
  "sales",
  "hello",
  "contact",
  "billing",
  "careers",
  "hr",
  "office",
  "team",
  "mail",
  "help",
  "noreply",
  "no-reply",
  "marketing",
  "press",
  "jobs",
  "webmaster",
  "abuse",
  "postmaster",
  "enquiries",
  "inquiry",
]);

const CATCH_ALL = new Set([
  "warewe.ai",
  "acme.com",
  "example.com",
  "example.org",
  "northstarlabs.io",
  "harborandco.com",
]);

const NO_MX = new Set(["notareal.invalid", "no-mx.test", "localhost", "example.invalid"]);

export const COMPANY_DOMAINS: Record<string, string> = {
  acme: "acme.com",
  "acme corporation": "acme.com",
  "acme corp": "acme.com",
  warewe: "warewe.ai",
  "warewe ai": "warewe.ai",
  google: "google.com",
  microsoft: "microsoft.com",
  stripe: "stripe.com",
  notion: "notion.so",
  "northstar labs": "northstarlabs.io",
  northstar: "northstarlabs.io",
  "harbor & co": "harborandco.com",
  harbor: "harborandco.com",
  voltmesh: "voltmesh.com",
  "papertrail health": "papertrail.health",
  papertrail: "papertrail.health",
  "helio systems": "heliosystems.io",
  helio: "heliosystems.io",
  brightline: "brightlinehq.com",
  "kite & anchor": "kiteanchor.com",
  "lumen field labs": "lumenfield.ai",
  lumenfield: "lumenfield.ai",
  "redwood payments": "redwoodpay.com",
  redwood: "redwoodpay.com",
  "oak & iron": "oakandiron.co",
  "driftwood media": "driftwood.tv",
  "nimbus cloud": "nimbuscloud.io",
  nimbus: "nimbuscloud.io",
  "fennel data": "fenneldata.com",
  fennel: "fenneldata.com",
  "sable insurance": "sableins.com",
  sable: "sableins.com",
  "quartz robotics": "quartzrobotics.com",
  quartz: "quartzrobotics.com",
  fieldnote: "fieldnote.app",
  "copperline bank": "copperline.bank",
  copperline: "copperline.bank",
  "ivy club": "ivyclub.co",
  ivy: "ivyclub.co",
};

const DOMAIN_PATTERN: Record<string, string> = {
  "gmail.com": "firstlast",
  "google.com": "first",
  "microsoft.com": "first.last",
  "acme.com": "first.last",
  "warewe.ai": "first",
  "northstarlabs.io": "first.last",
  "stripe.com": "first",
  "notion.so": "first",
  "voltmesh.com": "f.last",
  "papertrail.health": "first.last",
  "heliosystems.io": "first.last",
  "brightlinehq.com": "first",
  "lumenfield.ai": "first.last",
  "redwoodpay.com": "first.last",
  "nimbuscloud.io": "first.last",
  "fenneldata.com": "first",
  "fieldnote.app": "first",
  "copperline.bank": "first.last",
  "ivyclub.co": "first.last",
};

export function fnv(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

const EMAIL_RE =
  /^[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]{0,62}[a-zA-Z0-9])?@[a-zA-Z0-9](?:[a-zA-Z0-9.-]{0,250}[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/;

export function isEmailShape(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

export function splitEmail(email: string): { username: string; domain: string } {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.lastIndexOf("@");
  return { username: trimmed.slice(0, at), domain: trimmed.slice(at + 1) };
}

function dnsOk(domain: string): boolean {
  if (NO_MX.has(domain)) return false;
  if (domain.endsWith(".invalid") || domain.endsWith(".test")) return false;
  if (!domain.includes(".")) return false;
  const tld = domain.split(".").pop() ?? "";
  if (tld.length < 2) return false;
  return fnv(`mx:${domain}`) % 23 !== 0;
}

export function verifyEmail(
  raw: string,
  source: VerifyResult["source"] = "ui",
  now = Date.now(),
): VerifyResult {
  const email = raw.trim().toLowerCase();
  const id = uid("vr");

  if (!isEmailShape(email)) {
    return blankResult(id, email, now, source, {
      result: "invalid",
      status: "invalid",
      subresult: "invalid_syntax",
      score: 0,
      isDeliverable: false,
      mxAcceptsMail: false,
      hasMx: false,
    });
  }

  const { username, domain } = splitEmail(email);
  const isFree = FREE_DOMAINS.has(domain);
  const isDisposable = DISPOSABLE.has(domain);
  const isRole = ROLE_LOCAL.has(username.split("+")[0] ?? username);
  const hasTag = username.includes("+");
  const isNoReply = /no[-_]?reply/.test(username);
  const catchAllKnown = CATCH_ALL.has(domain);
  const hasMx = dnsOk(domain);

  // Curated fixtures so the product feels real on first try
  if (email === "kumar@warewe.ai") {
    return blankResult(id, email, now, source, {
      result: "catch_all",
      status: "valid",
      subresult: "catch_all_detected",
      score: 70,
      isDeliverable: true,
      isCatchAll: true,
      mxAcceptsMail: true,
      hasMx: true,
      hasSpf: true,
      hasDkim: true,
      hasDmarc: true,
    });
  }
  if (email === "john.smith@acme.com") {
    return blankResult(id, email, now, source, {
      result: "safe",
      status: "valid",
      subresult: "mailbox_verified",
      score: 95,
      isDeliverable: true,
      isSafeToSend: true,
      mxAcceptsMail: true,
      hasMx: true,
      hasSpf: true,
      hasDkim: true,
      hasDmarc: true,
    });
  }

  if (isDisposable) {
    return blankResult(id, email, now, source, {
      result: "disposable",
      status: "invalid",
      subresult: "disposable_domain",
      score: 8,
      isDisposable: true,
      isDeliverable: false,
      hasMx: true,
      mxAcceptsMail: true,
    });
  }

  if (!hasMx) {
    return blankResult(id, email, now, source, {
      result: "invalid",
      status: "invalid",
      subresult: "no_mx_records",
      score: 6,
      isDeliverable: false,
      hasMx: false,
      mxAcceptsMail: false,
    });
  }

  const bucket = fnv(email) % 100;
  const domainBucket = fnv(domain) % 100;
  const isCatchAll = catchAllKnown || (!isFree && domainBucket < 18);
  const mailboxExists = isCatchAll ? true : bucket > 12;

  let result: ResultKind;
  let subresult: string;
  let score: number;
  let isDeliverable = mailboxExists;
  let isSafeToSend = false;

  if (!mailboxExists) {
    result = "invalid";
    subresult = "mailbox_not_found";
    score = 10 + (bucket % 8);
    isDeliverable = false;
  } else if (isCatchAll && isRole) {
    result = "role";
    subresult = "role_based_catch_all";
    score = 62;
  } else if (isCatchAll) {
    result = "catch_all";
    subresult = "catch_all_detected";
    score = 68 + (bucket % 8);
  } else if (isRole) {
    result = "role";
    subresult = "role_based";
    score = 70;
  } else if (isFree) {
    result = "safe";
    subresult = "mailbox_verified";
    score = 94 + (bucket % 5);
    isSafeToSend = true;
  } else {
    result = "safe";
    subresult = "mailbox_verified";
    score = 90 + (bucket % 9);
    isSafeToSend = true;
  }

  const hasSpf = fnv(`spf:${domain}`) % 10 > 1;
  const hasDkim = fnv(`dkim:${domain}`) % 10 > 2;
  const hasDmarc = fnv(`dmarc:${domain}`) % 10 > 3;

  return blankResult(id, email, now, source, {
    result,
    status: result === "invalid" ? "invalid" : "valid",
    subresult,
    score,
    isDeliverable,
    isSafeToSend,
    isDisposable,
    isCatchAll,
    isRole,
    isFree,
    isNoReply,
    hasTag,
    mxAcceptsMail: hasMx,
    hasMx,
    hasSpf,
    hasDkim,
    hasDmarc,
  });
}

function blankResult(
  id: string,
  email: string,
  createdAt: number,
  source: VerifyResult["source"],
  patch: Partial<VerifyResult>,
): VerifyResult {
  const { username, domain } = email.includes("@")
    ? splitEmail(email)
    : { username: email, domain: "" };
  return {
    id,
    email,
    result: "unknown",
    status: "unknown",
    subresult: "unknown",
    score: 0,
    domain,
    username,
    isDeliverable: false,
    isSafeToSend: false,
    isDisposable: false,
    isCatchAll: false,
    isRole: false,
    isFree: false,
    isNoReply: false,
    hasTag: false,
    mxAcceptsMail: false,
    hasMx: false,
    hasSpf: false,
    hasDkim: false,
    hasDmarc: false,
    createdAt,
    source,
    ...patch,
  };
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export type VerifyStep = "syntax" | "mx" | "smtp" | "score";

export async function verifyEmailAnimated(
  raw: string,
  onStep: (step: VerifyStep) => void,
  source: VerifyResult["source"] = "ui",
): Promise<VerifyResult> {
  onStep("syntax");
  await sleep(220);
  onStep("mx");
  await sleep(320);
  onStep("smtp");
  await sleep(480);
  onStep("score");
  await sleep(180);
  return verifyEmail(raw, source);
}

export function resolveDomain(companyOrDomain: string): string | null {
  const raw = companyOrDomain.trim().toLowerCase();
  if (!raw) return null;
  if (raw.includes(" ") === false && raw.includes(".")) {
    return raw.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0] ?? raw;
  }
  if (COMPANY_DOMAINS[raw]) return COMPANY_DOMAINS[raw]!;
  // fuzzy contains
  for (const [name, domain] of Object.entries(COMPANY_DOMAINS)) {
    if (raw.includes(name) || name.includes(raw)) return domain;
  }
  // synthesize a plausible domain from the company name
  const slug = raw.replace(/[^a-z0-9]+/g, "").slice(0, 24);
  if (slug.length < 2) return null;
  return `${slug}.com`;
}

export function splitName(full: string): { firstName: string; lastName: string } {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0]!, lastName: "" };
  return { firstName: parts[0]!, lastName: parts.slice(1).join(" ") };
}

export function patternForDomain(domain: string): string {
  return DOMAIN_PATTERN[domain] ?? (fnv(domain) % 3 === 0 ? "first" : "first.last");
}

export function applyPattern(
  pattern: string,
  first: string,
  last: string,
  domain: string,
): string | null {
  const f = first.toLowerCase().replace(/[^a-z]/g, "");
  const l = last.toLowerCase().replace(/[^a-z]/g, "");
  if (!f) return null;
  switch (pattern) {
    case "first":
      return `${f}@${domain}`;
    case "firstlast":
      return `${f}${l}@${domain}`;
    case "first_last":
      return `${f}_${l}@${domain}`;
    case "f.last":
      return `${f[0]}${l ? "." + l : ""}@${domain}`;
    case "flast":
      return `${f[0]}${l}@${domain}`;
    case "first.last":
    default:
      return `${f}${l ? "." + l : ""}@${domain}`;
  }
}

export function findEmail(
  fullName: string,
  companyOrDomain: string,
  now = Date.now(),
  enrich = false,
): FindResult {
  const { firstName, lastName } = splitName(fullName);
  const domain = resolveDomain(companyOrDomain);
  const id = uid("fn");
  const company = companyOrDomain.trim();

  if (!firstName || !domain) {
    return {
      id,
      found: false,
      firstName,
      lastName,
      company,
      domain: domain ?? undefined,
      reason: "missing_input",
      createdAt: now,
      creditsCharged: 0,
    };
  }

  if (!dnsOk(domain) || NO_MX.has(domain)) {
    return {
      id,
      found: false,
      firstName,
      lastName,
      company,
      domain,
      reason: "no_mx",
      createdAt: now,
      creditsCharged: 0,
    };
  }

  const miss = fnv(`${firstName}.${lastName}@${domain}`) % 17 === 0 && lastName.length > 0;
  if (miss && lastName.length > 8) {
    return {
      id,
      found: false,
      firstName,
      lastName,
      company,
      domain,
      reason: "no_matching_pattern",
      createdAt: now,
      creditsCharged: 0,
    };
  }

  const pattern = patternForDomain(domain);
  const email = applyPattern(pattern, firstName, lastName, domain);
  if (!email) {
    return {
      id,
      found: false,
      firstName,
      lastName,
      company,
      domain,
      reason: "no_matching_pattern",
      createdAt: now,
      creditsCharged: 0,
    };
  }

  const status = verifyEmail(email, "find", now);
  const verified = status.result === "safe" && !status.isCatchAll;
  const confidence = status.isCatchAll
    ? Math.min(status.score, 78)
    : Math.max(status.score - 2, 70);

  const result: FindResult = {
    id,
    found: true,
    email,
    verified,
    confidence,
    pattern,
    firstName,
    lastName,
    domain,
    company,
    status,
    createdAt: now,
    creditsCharged: 5,
  };
  return enrich ? attachEnrich(result) : result;
}

export function searchDomain(
  companyOrDomain: string,
  now = Date.now(),
): DomainSearchResult {
  const domain = resolveDomain(companyOrDomain);
  const id = uid("dm");
  if (!domain || !dnsOk(domain)) {
    return {
      id,
      domain: domain ?? companyOrDomain.trim().toLowerCase(),
      found: false,
      otherPatterns: [],
      samples: [],
      createdAt: now,
      creditsCharged: 0,
    };
  }
  const pattern = patternForDomain(domain);
  const others = ["first.last", "first", "f.last", "firstlast"].filter((p) => p !== pattern);
  const samples = ["alex", "jordan", "sam"].map((n) => applyPattern(pattern, n, "lee", domain)!);
  return {
    id,
    domain,
    company: companyOrDomain.trim(),
    found: true,
    pattern,
    organization: companyOrDomain.trim(),
    otherPatterns: others.slice(0, 2),
    samples,
    createdAt: now,
    creditsCharged: 1,
  };
}

export function extractEmails(text: string): string[] {
  const re = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const found = text.match(re) ?? [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const e of found) {
    const n = e.toLowerCase();
    if (seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  return out;
}

function cells(line: string) {
  return line.split(/,|\t/).map((c) => c.replace(/^["']|["']$/g, "").trim());
}

export function parseFindRows(text: string): { name: string; company: string }[] {
  return parseFindUpload(text).rows;
}

export function parseFindUpload(text: string): {
  rows: { name: string; company: string }[];
  intake: { uploaded: number; unique: number; duplicates: number; skipped: number; mapped: string };
} {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) {
    return { rows: [], intake: { uploaded: 0, unique: 0, duplicates: 0, skipped: 0, mapped: "Name and company" } };
  }
  const head = cells(lines[0]!).map((c) => c.toLowerCase().replace(/\s+/g, "_"));
  const header = head.some(
    (c) =>
      c === "name" ||
      c === "full_name" ||
      c === "first_name" ||
      c === "company" ||
      c === "domain" ||
      c.includes("linkedin"),
  );
  const at = (names: string[]) => (header ? head.findIndex((c) => names.includes(c)) : -1);
  const iName = header ? at(["name", "full_name", "fullname"]) : 0;
  const iFirst = at(["first_name", "firstname", "first"]);
  const iLast = at(["last_name", "lastname", "last"]);
  const iCompany = header ? at(["company", "organization", "organisation"]) : 1;
  const iDomain = at(["domain", "company_domain", "website"]);
  const iLi = header ? head.findIndex((c) => c.includes("linkedin")) : -1;
  const usedName = iName >= 0 || iFirst >= 0;
  const usedCompany = iCompany >= 0 || iDomain >= 0;
  const usedLinkedIn = iLi >= 0;
  const mapped = [
    usedName && usedCompany ? "Name and company" : usedName ? "Name" : "",
    usedLinkedIn ? "LinkedIn profile" : "",
  ]
    .filter(Boolean)
    .join(", ");
  const rows: { name: string; company: string }[] = [];
  const seen = new Set<string>();
  let duplicates = 0;
  let skipped = 0;
  const body = lines.slice(header ? 1 : 0);

  for (const line of body) {
    const c = cells(line);
    let name = "";
    if (iFirst >= 0) name = [c[iFirst], iLast >= 0 ? c[iLast] : ""].filter(Boolean).join(" ");
    if (!name) name = (iName >= 0 ? c[iName] : c[0]) ?? "";
    let company = (iDomain >= 0 ? c[iDomain] : "") || (iCompany >= 0 ? c[iCompany] : "") || "";
    const li = iLi >= 0 ? (c[iLi] ?? "") : "";
    if (li && isLinkedInProfile(li)) {
      const person = lookupLinkedIn(li);
      if (person) {
        name = name || `${person.firstName} ${person.lastName}`.trim();
        company = company || person.domain;
      }
    }
    if (!name || !company) {
      skipped += 1;
      continue;
    }
    const key = `${name.toLowerCase()}|${company.toLowerCase()}`;
    if (seen.has(key)) {
      duplicates += 1;
      continue;
    }
    seen.add(key);
    rows.push({ name, company });
  }

  return {
    rows,
    intake: {
      uploaded: body.length,
      unique: rows.length,
      duplicates,
      skipped,
      mapped: mapped || "Name and company",
    },
  };
}

export function emailFromPerson(
  first: string,
  last: string,
  domain: string,
): string {
  const pattern = patternForDomain(domain);
  return applyPattern(pattern, first, last, domain) ?? `${first.toLowerCase()}@${domain}`;
}
