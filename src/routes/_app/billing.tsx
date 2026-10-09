import { createFileRoute } from "@tanstack/react-router";
import { Receipt, RefreshCw } from "lucide-react";
import { CreditsPurchase } from "@/components/credits-purchase";
import { Page } from "@/components/page";
import { formatNumber } from "@/lib/format";
import { useAppStore } from "@/lib/store";

export const Route = createFileRoute("/_app/billing")({
  component: BillingPage,
});

const inFmt = new Intl.NumberFormat("en-IN");

function purchaseDate(ts: number) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(ts);
}

function purchaseTime(ts: number) {
  return new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }).format(ts);
}

function BillingPage() {
  const invoices = useAppStore((s) => s.invoices);
  const you = useAppStore((s) => s.members.find((m) => m.you)?.name);

  return (
    <Page>
      <CreditsPurchase />

      <section className="mt-6 overflow-hidden rounded-xl bg-card shadow-border">
        <div className="flex items-start justify-between gap-4 px-5 py-4">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Receipt className="size-4" />
              Purchase history
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Credits added to your account.</p>
          </div>
          <button type="button" aria-label="Refresh" className="text-muted-foreground">
            <RefreshCw className="size-4" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-border bg-background text-left text-muted-foreground">
                <th className="px-5 py-2.5 font-medium">Date</th>
                <th className="px-3 py-2.5 font-medium">Credits</th>
                <th className="px-3 py-2.5 font-medium">Bought by</th>
                <th className="px-3 py-2.5 font-medium">Method</th>
                <th className="px-5 py-2.5 text-right font-medium">Balance after</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-4 whitespace-nowrap">
                    {purchaseDate(inv.date)} <span className="text-muted-foreground">{purchaseTime(inv.date)}</span>
                  </td>
                  <td className="px-3 py-4 font-semibold tabular-nums">+{formatNumber(inv.credits ?? 0)}</td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    {inv.buyer ?? you ?? "Kumar Manaswi"}
                    {inv.buyer === you || !inv.buyer ? (
                      <span className="ml-2 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-primary">
                        YOU
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">{inv.method ?? "Card Payment"}</td>
                  <td className="px-5 py-4 text-right tabular-nums">{inFmt.format(inv.balanceAfter ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </Page>
  );
}

