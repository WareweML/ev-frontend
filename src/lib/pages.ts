export const PAGE_META: Record<string, { title: string; kicker: string }> = {
  "/": {
    title: "Dashboard",
    kicker: "Welcome back.",
  },
  "/verify": {
    title: "Verify Emails",
    kicker: "Validate a list or one email before you send.",
  },
  "/find": {
    title: "Find Emails",
    kicker: "Find a verified work email from a name and company, or a LinkedIn profile.",
  },
  "/leads": {
    title: "Search Leads",
    kicker: "Find the right contacts and companies for your business.",
  },
  "/api": {
    title: "API",
    kicker: "Verify, find, and enrich emails from your code and tools.",
  },
  "/billing": {
    title: "Billing",
    kicker: "Outreach, or pay as you go.",
  },
  "/profile": {
    title: "Profile",
    kicker: "Your account.",
  },
  "/workspace": {
    title: "Workspace",
    kicker: "People on this account.",
  },
  "/usage": {
    title: "Usage",
    kicker: "Recent Usage Summary and Activity Logs",
  },
};

export function pageMeta(pathname: string) {
  if (PAGE_META[pathname]) return PAGE_META[pathname]!;
  const match = Object.keys(PAGE_META)
    .filter((k) => k !== "/" && pathname.startsWith(k))
    .sort((a, b) => b.length - a.length)[0];
  return PAGE_META[match ?? "/"]!;
}
