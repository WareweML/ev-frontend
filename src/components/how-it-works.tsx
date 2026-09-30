import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const VERIFY_STEPS = [
  {
    n: "1",
    title: "Give us the list",
    body: "Drop a CSV, XLS, or XLSX, or import one from Drive, OneDrive, Dropbox, or Airtable.",
  },
  {
    n: "2",
    title: "Get the result file",
    body: "Deliverable, catch-all, or bounce. Download when the list is done.",
  },
] as const;

export type HowStep = { n: string; title: string; body: string };

export function HowItWorks({
  invert = false,
  steps = VERIFY_STEPS,
  title = "Two steps",
}: {
  invert?: boolean;
  steps?: readonly HowStep[];
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "min-h-12 text-sm underline-offset-4 hover:underline",
          invert ? "text-ink-muted hover:text-ink-foreground" : "text-muted-foreground hover:text-foreground",
        )}
      >
        How it works
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <ol className="space-y-4">
            {steps.map((s) => (
              <li key={s.n} className="flex gap-3">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-semibold">
                  {s.n}
                </span>
                <span>
                  <span className="block text-sm font-semibold">{s.title}</span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">{s.body}</span>
                </span>
              </li>
            ))}
          </ol>
          <Button className="mt-2 w-full" onClick={() => setOpen(false)}>
            Got it
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
