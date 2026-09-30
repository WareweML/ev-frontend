import { cn } from "@/lib/utils";

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  tone = "paper",
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  className?: string;
  tone?: "paper" | "ink";
}) {
  const ink = tone === "ink";
  return (
    <div
      className={cn("inline-flex rounded-xl p-1", ink ? "bg-ink-active" : "bg-muted", className)}
      role="tablist"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "relative min-h-12 min-w-24 flex-1 rounded-lg px-4 text-sm font-medium transition-colors duration-150",
              ink
                ? active
                  ? "bg-ink-foreground text-ink"
                  : "text-ink-muted hover:text-ink-foreground"
                : active
                  ? "bg-card text-foreground shadow-border"
                  : "text-muted-foreground hover:text-foreground",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
