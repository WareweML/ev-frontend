import { useMemo, useState, type ReactNode } from "react";
import { ClipboardPaste, Download } from "lucide-react";
import { Dropzone } from "@/components/dropzone";
import { Segmented } from "@/components/segmented";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

type Source = "file" | "paste";

export function BulkCard({
  title,
  dropTitle,
  hint,
  pastePlaceholder,
  pasteHint,
  pasteAriaLabel = "Paste list",
  countPaste,
  sampleLabel,
  sampleHref,
  actionLabel = "Verify",
  unit = "email",
  unitPlural = "emails",
  costHint = "1 credit each",
  cta = "Upload list",
  featured = false,
  actions,
  onFile,
  onPaste,
  onSample,
}: {
  title: string;
  dropTitle?: string;
  hint: string;
  pastePlaceholder: string;
  pasteHint: string;
  pasteAriaLabel?: string;
  countPaste: (text: string) => number;
  sampleLabel: string;
  sampleHref?: string;
  actionLabel?: string;
  unit?: string;
  unitPlural?: string;
  costHint?: string;
  cta?: string;
  featured?: boolean;
  actions?: ReactNode;
  onFile: (name: string, text: string) => void;
  onPaste: (text: string) => void;
  onSample: () => void;
}) {
  const [source, setSource] = useState<Source>("file");
  const [paste, setPaste] = useState(pastePlaceholder);
  const count = useMemo(() => (paste.trim() ? countPaste(paste) : 0), [paste, countPaste]);
  const tone = featured ? "ink" : "paper";
  const Heading = featured ? "h1" : "h2";

  return (
    <section
      className={cn(
        "rounded-xl p-5 sm:p-6",
        featured ? "bg-ink text-ink-foreground" : "bg-card text-card-foreground shadow-border",
      )}
    >
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-h-12 items-center gap-3">
          <Heading className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</Heading>
          {actions}
        </div>
        <Segmented
          tone={tone}
          value={source}
          onChange={setSource}
          className="w-full lg:w-auto"
          options={[
            { value: "file", label: "File" },
            { value: "paste", label: "Paste" },
          ]}
        />
      </div>

      {source === "file" ? (
        <Dropzone onText={onFile} hint={hint} title={dropTitle} cta={cta} tone={tone} />
      ) : (
        <div className="space-y-3">
          <Textarea
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            placeholder={pastePlaceholder}
            aria-label={pasteAriaLabel}
            spellCheck={false}
            className={cn(
              "min-h-40 font-mono text-xs leading-relaxed",
              featured && "border-ink-active bg-ink-hover text-ink-foreground placeholder:text-ink-muted",
            )}
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className={cn("text-xs", featured ? "text-ink-muted" : "text-muted-foreground")}>
              {count ? `${formatNumber(count)} detected · ${costHint}` : pasteHint}
            </p>
            <Button
              size="lg"
              disabled={!count}
              variant={featured ? "inverse" : "default"}
              onClick={() => {
                onPaste(paste);
                setPaste("");
              }}
            >
              <ClipboardPaste />
              {count
                ? `${actionLabel} ${formatNumber(count)} ${count === 1 ? unit : unitPlural}`
                : actionLabel}
            </Button>
          </div>
        </div>
      )}

      <Button
        size="lg"
        variant={featured ? "secondary" : "outline"}
        className={cn(
          "mt-3 w-full",
          featured && "bg-ink-foreground/10 text-ink-foreground hover:bg-ink-foreground/15",
        )}
        onClick={onSample}
      >
        {sampleLabel}
      </Button>

      {sampleHref ? (
        <div className="mt-1">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className={featured ? "text-ink-foreground/80 hover:bg-ink-hover hover:text-ink-foreground" : undefined}
          >
            <a href={sampleHref} download>
              <Download />
              Template
            </a>
          </Button>
        </div>
      ) : null}
    </section>
  );
}
