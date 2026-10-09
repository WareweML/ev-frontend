export type PlanId = "payg" | "subscription";

export type Plan = {
  id: PlanId;
  name: string;
  price: number;
  priceLabel: string;
  monthlyCredits: number;
  maxKeys: number;
  features: {
    leads: boolean;
    extraKeys: boolean;
    team: boolean;
  };
  included: string[];
  locked: string[];
};

export const PLANS: Plan[] = [
  {
    id: "payg",
    name: "Pay as you go",
    price: 0,
    priceLabel: "Credits only",
    monthlyCredits: 0,
    maxKeys: Number.POSITIVE_INFINITY,
    features: { leads: true, extraKeys: true, team: true },
    included: [
      "Verify Emails",
      "Find Emails",
      "API Access",
      "Unlimited API Keys",
      "Search Leads",
      "Lead lists",
      "Team",
      "Credits never expire",
    ],
    locked: [],
  },
  {
    id: "subscription",
    name: "Outreach",
    price: 149,
    priceLabel: "$149/mo",
    monthlyCredits: 25000,
    maxKeys: Number.POSITIVE_INFINITY,
    features: { leads: true, extraKeys: true, team: true },
    included: [
      "Verify Emails",
      "Find Emails",
      "Search Leads",
      "Lead lists",
      "Team",
      "API Access",
      "Unlimited API Keys",
      "25,000 credits each month",
    ],
    locked: [],
  },
];

export const PLAN_BY_ID = Object.fromEntries(PLANS.map((p) => [p.id, p])) as Record<PlanId, Plan>;

export function asPlanId(v: unknown): PlanId {
  return v === "payg" ? "payg" : "subscription";
}
