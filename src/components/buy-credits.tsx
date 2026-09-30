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
  { credits: 1000, price: 15, label: "1,000 credits", each: "1.5¢" },
  { credits: 5000, price: 60, label: "5,000 credits", each: "1.2¢", recommended: true },
  { credits: 25000, price: 250, label: "25,000 credits", each: "1.0¢" },
];

export function BuyCreditsDialog({
  open,
  onOpenChange,
  initialCredits,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialCredits?: number;
}) {
  const buy = useAppStore((s) => s.buyCredits);
  const [pick, setPick] = useState(initialCredits ?? CREDIT_PACKS[1]!.credits);
  const pack = CREDIT_PACKS.find((p) => p.credits === pick) ?? CREDIT_PACKS[1]!;

  useEffect(() => {
    if (!open) return;
    setPick(initialCredits ?? CREDIT_PACKS[1]!.credits);
  }, [open, initialCredits]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buy Credits</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">Credits never expire.</p>
        <div className="grid gap-2">
          {CREDIT_PACKS.map((p) => (
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
              <span className="text-sm font-semibold tabular-nums">${p.price}</span>
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
            Buy {pack.label} — ${pack.price}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
