import { useState } from "react";
import { Check, ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/format";
import { PLAN_BY_ID, type PlanId } from "@/lib/plans";
import { useAppStore, usePlan } from "@/lib/store";
import { cn } from "@/lib/utils";

const PAYG_STEPS = [
  { credits: 10000, price: 20, label: "10,000 credits" },
  { credits: 25000, price: 45, label: "25,000 credits" },
  { credits: 50000, price: 80, label: "50,000 credits" },
  { credits: 100000, price: 140, label: "100,000 credits" },
  { credits: 250000, price: 300, label: "250,000 credits" },
  { credits: 500000, price: 500, label: "500,000 credits" },
  { credits: 1000000, price: 800, label: "1,000,000 credits" },
  { credits: 2500000, price: 1750, label: "2,500,000 credits" },
  { credits: 5000000, price: 3000, label: "5,000,000 credits" },
  { credits: 10000000, price: 5000, label: "10,000,000 credits" },
];

const OUTREACH_STEPS = [
  { credits: 10000, price: 16 },
  { credits: 25000, price: 36 },
  { credits: 50000, price: 64 },
  { credits: 100000, price: 112 },
  { credits: 250000, price: 240 },
  { credits: 500000, price: 400 },
  { credits: 1000000, price: 640 },
  { credits: 2500000, price: 1400 },
  { credits: 5000000, price: 2400 },
  { credits: 10000000, price: 4000 },
];

const STEP_BADGE: Record<number, string> = {
  25000: "Most popular",
  100000: "Most value",
};

const SLIDER_MARKS = [25000, 50000, 100000, 500000, 1000000, 10000000];

function money(amount: number) {
  return `$${formatNumber(amount)}`;
}

function tickLabel(credits: number) {
  if (credits >= 1_000_000) return `${credits / 1_000_000}M`;
  return `${credits / 1000}k`;
}

function dollarEach(price: number, credits: number) {
  const each = price / credits;
  const digits = each >= 0.01 ? 2 : 5;
  const text = each.toFixed(digits).replace(/0+$/, "").replace(/\.$/, "");
  return `$${text}`;
}

function baseTotal(credits: number) {
  return credits * 0.002;
}

function offBase(price: number, credits: number) {
  return Math.round((1 - price / baseTotal(credits)) * 100);
}

function indexFor(credits: number) {
  const found = PAYG_STEPS.findIndex((step) => step.credits === credits);
  return found >= 0 ? found : PAYG_STEPS.findIndex((step) => step.credits === 25000);
}

export function CreditsPurchase({ initialCredits = 25000, onDone }: { initialCredits?: number; onDone?: () => void }) {
  const planCredits = useAppStore((s) => s.planCredits);
  const setPlan = useAppStore((s) => s.setPlan);
  const buyCredits = useAppStore((s) => s.buyCredits);
  const plan = usePlan();
  const [view, setView] = useState<PlanId>("payg");
  const [rawIndex, setAmountIndex] = useState(() => indexFor(initialCredits));
  const amountIndex = Math.min(rawIndex, PAYG_STEPS.length - 1);

  function switchTo(id: PlanId, monthlyCredits?: number) {
    const same = id === plan.id && (id !== "subscription" || monthlyCredits === planCredits);
    if (same) return;
    setPlan(id, monthlyCredits);
    toast.success(id === "subscription" ? "You're on Outreach" : "You're on Pay as you go");
    onDone?.();
  }

  const outreach = PLAN_BY_ID.subscription;
  const payg = PLAN_BY_ID.payg;
  const outreachStep = OUTREACH_STEPS[amountIndex]!;
  const paygStep = PAYG_STEPS[amountIndex]!;
  const onThisOutreach = plan.id === "subscription" && planCredits === outreachStep.credits;

  return view === "subscription" ? (
    <PlanPanel
      current={onThisOutreach}
      period="/mo"
      detail="Unused credits roll over."
      compare={{
        was: money(paygStep.price),
        save: `${Math.round((1 - outreachStep.price / paygStep.price) * 100)}%`,
      }}
      points={outreach.included.map((item) =>
        item.endsWith("credits each month") ? `${formatNumber(outreachStep.credits)} credits each month` : item,
      )}
      locked={outreach.locked}
      action={onThisOutreach ? "Your plan" : `Buy for ${money(outreachStep.price)}/mo`}
      onAction={() => switchTo("subscription", outreachStep.credits)}
      steps={OUTREACH_STEPS}
      index={amountIndex}
      onIndex={setAmountIndex}
      amountLabel="Credits each month"
      view={view}
      onView={setView}
    />
  ) : (
    <PlanPanel
      current={false}
      period=""
      detail="Credits never expire."
      compare={
        offBase(paygStep.price, paygStep.credits) > 0
          ? { was: money(baseTotal(paygStep.credits)), save: `${offBase(paygStep.price, paygStep.credits)}%` }
          : undefined
      }
      points={payg.included}
      locked={payg.locked}
      action={`Buy for ${money(paygStep.price)}`}
      onAction={() => {
        buyCredits(paygStep.credits, paygStep.price, paygStep.label);
        toast.success(`${formatNumber(paygStep.credits)} credits added`);
        onDone?.();
      }}
      steps={PAYG_STEPS}
      index={amountIndex}
      onIndex={setAmountIndex}
      amountLabel="Credits"
      view={view}
      onView={setView}
    />
  );
}

function PlanToggle({ value, onChange }: { value: PlanId; onChange: (id: PlanId) => void }) {
  const payg = value === "payg";
  return (
    <div className="flex h-6 items-center gap-3">
      <button
        type="button"
        onClick={() => onChange("payg")}
        className={cn("text-sm", payg ? "font-semibold text-foreground" : "text-muted-foreground")}
      >
        Pay as you go
      </button>
      <button
        type="button"
        role="switch"
        aria-checked={!payg}
        aria-label="Switch plan"
        onClick={() => onChange(payg ? "subscription" : "payg")}
        className="relative h-6 w-11 shrink-0 rounded-full bg-primary"
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform",
            payg ? "left-0.5" : "left-5",
          )}
        />
      </button>
      <button
        type="button"
        onClick={() => onChange("subscription")}
        className={cn("text-sm", payg ? "text-muted-foreground" : "font-semibold text-foreground")}
      >
        Outreach
      </button>
    </div>
  );
}

function PlanPanel({
  current,
  period,
  detail,
  compare,
  points,
  locked,
  action,
  onAction,
  steps,
  index,
  onIndex,
  amountLabel,
  view,
  onView,
}: {
  current: boolean;
  period: string;
  detail: string;
  compare?: { was: string; save: string };
  points: string[];
  locked: string[];
  action: string;
  onAction: () => void;
  steps: { credits: number; price: number }[];
  index: number;
  onIndex: (i: number) => void;
  amountLabel: string;
  view: PlanId;
  onView: (id: PlanId) => void;
}) {
  const step = steps[index]!;
  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-4 pr-8">
        <h2 className="text-xl font-semibold tracking-tight">Buy Credits</h2>
        <PlanToggle value={view} onChange={onView} />
      </div>
      <section className={cn("relative overflow-visible rounded-xl bg-card shadow-border", current && "ring-2 ring-ring")}>
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-2 lg:items-start">
          <div>
            <p>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold tracking-wide text-primary uppercase">
                {view === "payg" ? "Pay as you go" : "Outreach subscription"}
              </span>
            </p>
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                aria-label="Fewer credits"
                disabled={index === 0}
                onClick={() => onIndex(index - 1)}
                className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-background text-lg shadow-border disabled:opacity-40"
              >
                −
              </button>
              <div
                aria-label={amountLabel}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-background shadow-border"
              >
                <span className="text-lg font-semibold tabular-nums">{formatNumber(step.credits)}</span>
                <span className="text-sm text-muted-foreground">credits</span>
              </div>
              <button
                type="button"
                aria-label="More credits"
                disabled={index === steps.length - 1}
                onClick={() => onIndex(index + 1)}
                className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-background text-lg shadow-border disabled:opacity-40"
              >
                +
              </button>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                aria-label="Fewer credits"
                disabled={index === 0}
                onClick={() => onIndex(index - 1)}
                className="flex size-11 shrink-0 items-center justify-center rounded-full bg-background shadow-border disabled:opacity-40"
              >
                <ChevronLeft className="size-4" />
              </button>
              <input
                type="range"
                min={0}
                max={steps.length - 1}
                step={1}
                value={index}
                aria-label="Credits"
                onChange={(e) => onIndex(Number(e.target.value))}
                className="credit-slider w-full"
                style={{ ["--fill" as string]: `${(index / (steps.length - 1)) * 100}%` }}
              />
              <button
                type="button"
                aria-label="More credits"
                disabled={index === steps.length - 1}
                onClick={() => onIndex(index + 1)}
                className="flex size-11 shrink-0 items-center justify-center rounded-full bg-background shadow-border disabled:opacity-40"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
            <div className="mt-3 flex justify-between gap-2" style={{ marginLeft: "3.5rem", marginRight: "3.5rem" }}>
              {SLIDER_MARKS.map((credits) => {
                const markIndex = steps.findIndex((item) => item.credits === credits);
                return (
                  <div key={credits} className="flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() => onIndex(markIndex)}
                      className={cn(
                        "flex h-14 shrink-0 flex-col items-center justify-center rounded-lg px-3 text-xs font-medium uppercase",
                        credits === 100000 ? "min-w-24" : "min-w-14",
                        markIndex === index
                          ? "bg-primary/10 text-primary shadow-[0_0_0_1px_var(--color-primary)]"
                          : "bg-background text-foreground shadow-border",
                      )}
                    >
                      {tickLabel(credits)}
                      {credits === 100000 ? (
                        <span className="mt-0.5 text-[10px] font-semibold tracking-wide text-primary">Most value</span>
                      ) : null}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:border-l lg:border-border lg:pl-8">
            {STEP_BADGE[step.credits] ? (
              <span className="mb-3 inline-flex rounded-full bg-[#e8eeff] px-3 py-1 text-xs font-semibold tracking-wide text-primary uppercase">
                {STEP_BADGE[step.credits]}
              </span>
            ) : null}
            <p className="text-3xl font-semibold tracking-tight">
              {money(step.price)}
              {period ? <span className="text-lg font-normal text-muted-foreground">{period}</span> : null}
            </p>
            {compare ? (
              <p className="mt-2 text-sm text-muted-foreground">
                <span className="line-through">{compare.was}</span>
                <span className="ml-2">Save {compare.save}</span>
              </p>
            ) : null}
            <p className={cn("text-sm text-muted-foreground", compare ? "mt-1" : "mt-2")}>
              {dollarEach(step.price, step.credits)} per email verification. {detail}
            </p>
            <Button className="mt-6 h-12 w-full text-base" variant={current ? "outline" : "default"} disabled={current} onClick={onAction}>
              {action}
            </Button>
          </div>
        </div>

        <div className="grid gap-x-8 gap-y-3 border-t border-border px-6 py-6 sm:grid-cols-2 sm:px-8">
          {points.map((item) => (
            <div key={item} className="flex items-center gap-2 text-sm">
              <Check className="size-4 shrink-0 text-safe" />
              {item}
            </div>
          ))}
          {locked.map((item) => (
            <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="size-4 shrink-0" />
              {item}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
