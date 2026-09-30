import { RESULT_META, type ResultKind } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const toneVariant = {
  safe: "safe",
  risk: "risk",
  invalid: "invalid",
  unknown: "unknown",
} as const;

export function StatusBadge({ result, className }: { result: ResultKind; className?: string }) {
  const meta = RESULT_META[result];
  return (
    <Badge variant={toneVariant[meta.tone]} className={cn("normal-case tracking-normal", className)}>
      {meta.label}
    </Badge>
  );
}
