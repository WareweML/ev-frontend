import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Lock } from "lucide-react";
import { toast } from "sonner";
import { BuyCreditsDialog } from "@/components/buy-credits";
import { Page } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatDate, formatNumber } from "@/lib/format";
import { PLANS, type PlanId } from "@/lib/plans";
import { useAppStore, usePlan } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/billing")({
  component: BillingPage,
});

function BillingPage() {
  const credits = useAppStore((s) => s.credits);
  const planCredits = useAppStore((s) => s.planCredits);
  const invoices = useAppStore((s) => s.invoices);
  const setPlan = useAppStore((s) => s.setPlan);
  const plan = usePlan();
  const [buy, setBuy] = useState(false);
  const pooled = plan.monthlyCredits > 0;
  const over = pooled && credits > planCredits;
  const used = pooled && !over ? Math.max(0, planCredits - credits) : 0;
  const pct = pooled && !over && planCredits > 0 ? Math.min(100, Math.round((used / planCredits) * 1000) / 10) : 0;

  function switchTo(id: PlanId) {
    if (id === plan.id) return;
    setPlan(id);
    toast.success(id === "subscription" ? "You're on Subscription" : "You're on Pay as you go");
  }

  return (
    <Page>
      <section className="rounded-xl bg-card p-5 shadow-border sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs text-muted-foreground">{plan.name}</div>
            <div className="mt-1 text-3xl font-semibold tabular-nums tracking-tight">
              {formatNumber(credits)}
              <span className="ml-2 text-base font-normal text-muted-foreground">credits</span>
            </div>
          </div>
          <Button onClick={() => setBuy(true)}>Buy Credits</Button>
        </div>
        {pooled && !over ? <Progress value={100 - pct} className="mt-4" /> : null}
        <p className="mt-3 text-sm text-muted-foreground">
          {pooled
            ? `${formatNumber(plan.monthlyCredits)} added each month. Unused credits roll over.`
            : "Credits never expire."}
        </p>
      </section>

      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        {PLANS.map((p) => {
          const current = p.id === plan.id;
          return (
            <div
              key={p.id}
              className={cn(
                "flex flex-col rounded-xl bg-card p-5 shadow-border",
                current && "ring-2 ring-ring",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-medium text-muted-foreground">{p.name}</div>
                {p.id === "subscription" ? <Badge variant="primary">Most popular</Badge> : null}
              </div>
              <div className="mt-2 text-3xl font-semibold tracking-tight">
                {p.price === 0 ? (
                  <>
                    $0
                    <span className="text-sm font-normal text-muted-foreground"> / mo</span>
                  </>
                ) : (
                  <>
                    ${p.price}
                    <span className="text-sm font-normal text-muted-foreground"> / mo</span>
                  </>
                )}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {p.monthlyCredits
                  ? `${formatNumber(p.monthlyCredits)} credits each month`
                  : "Pay only for the credits you use"}
              </div>
              <ul className="mt-4 flex-1 space-y-2">
                {p.included.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-safe" />
                    {f}
                  </li>
                ))}
                {p.locked.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Lock className="mt-0.5 size-4 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className="mt-5"
                variant={current ? "outline" : "default"}
                disabled={current}
                onClick={() => switchTo(p.id)}
              >
                {current ? "Your plan" : p.id === "subscription" ? "Subscribe — $149/mo" : "Switch to Pay as you go"}
              </Button>
            </div>
          );
        })}
      </div>

      <section className="mt-6 rounded-xl bg-card shadow-border">
        <div className="px-5 py-4 text-sm font-semibold">Invoices</div>
        <ul className="divide-y divide-border">
          {invoices.map((inv) => (
            <li key={inv.id} className="flex items-center justify-between px-5 py-3 text-sm">
              <span>
                <span className="font-medium">{inv.description}</span>
                <span className="ml-2 text-muted-foreground">{formatDate(inv.date)}</span>
              </span>
              <span className="tabular-nums">${inv.amount}</span>
            </li>
          ))}
        </ul>
      </section>

      <BuyCreditsDialog open={buy} onOpenChange={setBuy} />
    </Page>
  );
}
