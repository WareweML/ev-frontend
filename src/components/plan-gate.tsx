import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PlanGate({ title }: { title: string }) {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center rounded-xl bg-card px-6 py-12 text-center shadow-border">
      <span className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Lock className="size-7" />
      </span>
      <h2 className="mt-5 text-xl font-semibold tracking-tight">{title} is on Subscription</h2>
      <Button asChild className="mt-6 min-w-44">
        <Link to="/billing">See plans</Link>
      </Button>
    </div>
  );
}
