import { CopyButton } from "@/components/copy-button";
import { cn } from "@/lib/utils";

export function CodeBlock({
  code,
  className,
}: {
  code: string;
  className?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden rounded-lg bg-ink", className)}>
      <CopyButton
        value={code}
        size="icon-sm"
        className="absolute right-2 top-2 border-ink-active bg-ink-hover text-ink-foreground hover:bg-ink-active"
      />
      <pre className="overflow-x-auto p-4 pr-12 font-mono text-[12px] leading-relaxed text-ink-foreground">
        <code>{code}</code>
      </pre>
    </div>
  );
}
