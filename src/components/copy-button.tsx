import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CopyButton({
  value,
  className,
  label = "Copy",
  size = "default",
}: {
  value: string;
  className?: string;
  label?: string;
  size?: "default" | "sm" | "icon-sm" | "icon";
}) {
  const [done, setDone] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      className={cn(className)}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
        } catch {
          /* ignore */
        }
        setDone(true);
        window.setTimeout(() => setDone(false), 1200);
      }}
    >
      {done ? <Check /> : <Copy />}
      {size === "icon" || size === "icon-sm" ? (
        <span className="sr-only">{label}</span>
      ) : done ? (
        "Copied"
      ) : (
        label
      )}
    </Button>
  );
}
