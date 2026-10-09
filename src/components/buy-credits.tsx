import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatNumber } from "@/lib/format";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const CREDIT_PACKS = [
  { credits: 10000, price: 20, label: "10,000 credits", each: "$0.002" },
  { credits: 25000, price: 45, label: "25,000 credits", each: "$0.0018", recommended: true, badge: "Most popular" },
  { credits: 100000, price: 140, label: "100,000 credits", each: "$0.0014", badge: "Most value" },
];

function packPrice(amount: number) {
  return Number.isInteger(amount) ? `$${formatNumber(amount)}` : `$${amount.toFixed(2)}`;
}

export function BuyCreditsDialog({
  open,
  onOpenChange,
  initialCredits,
  packs = CREDIT_PACKS,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialCredits?: number;
  packs?: { credits: number; price: number; label: string; each: string; recommended?: boolean; badge?: string }[];
}) {
  const buy = useAppStore((s) => s.buyCredits);
  const fallback = packs.find((pack) => pack.recommended) ?? packs[0]!;
  const [pick, setPick] = useState(initialCredits ?? fallback.credits);
  const pack = packs.find((p) => p.credits === pick) ?? fallback;

  useEffect(() => {
    if (!open) return;
    setPick(initialCredits ?? fallback.credits);
  }, [open, initialCredits, fallback.credits]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buy Credits</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">Credits never expire.</p>
        <div className="grid gap-2">
          {packs.map((p) => (
            <button
              type="button"
              key={p.credits}
              onClick={() => setPick(p.credits)}
              className={cn(
                "flex min-h-14 items-center justify-between rounded-lg px-4 py-3 text-left shadow-border transition-colors",
                pick === p.credits ? "bg-primary/5 ring-2 ring-ring" : "bg-card hover:bg-muted/60",
              )}
            >
              <span>
                <span className="block text-sm font-medium">{p.label}</span>
                <span className="text-xs text-muted-foreground">
                  {p.each} each{p.recommended ? " · most teams pick this" : ""}
                </span>
              </span>
              <span className="text-sm font-semibold tabular-nums">{packPrice(p.price)}</span>
            </button>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Not now
          </Button>
          <Button
            size="lg"
            onClick={() => {
              buy(pack.credits, pack.price, pack.label);
              toast.success(`${formatNumber(pack.credits)} credits added`);
              onOpenChange(false);
            }}
          >
            Buy {pack.label} — {packPrice(pack.price)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
