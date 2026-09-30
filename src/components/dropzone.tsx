import { useCallback, useState } from "react";
import { FileUp } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function readFile(file: File) {
  return new Promise<{ name: string; text: string }>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        name: file.name,
        text: typeof reader.result === "string" ? reader.result : "",
      });
    };
    reader.readAsText(file);
  });
}

export function Dropzone({
  onText,
  accept = ".csv,.txt,.tsv",
  hint = "CSV, TSV, or TXT",
  title = "Drop a list",
  cta = "Upload list",
  size = "hero",
  tone = "paper",
  className,
}: {
  onText: (fileName: string, text: string) => void;
  accept?: string;
  hint?: string;
  title?: string;
  cta?: string;
  size?: "hero" | "compact";
  tone?: "paper" | "ink";
  className?: string;
}) {
  const [over, setOver] = useState(false);
  const ink = tone === "ink";

  const take = useCallback(
    async (list: FileList | File[]) => {
      const files = Array.from(list).filter(Boolean);
      if (!files.length) return;
      const parts = await Promise.all(files.map(readFile));
      const name = parts.length === 1 ? parts[0]!.name : `${parts.length}-files.csv`;
      onText(name, parts.map((p) => p.text).join("\n"));
    },
    [onText],
  );

  return (
    <label
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-3 border border-dashed px-6 text-center transition-[border-color,background-color,box-shadow] duration-150",
        size === "hero" ? "min-h-44 rounded-lg py-7 sm:min-h-52 sm:py-8" : "min-h-36 rounded-lg py-6",
        ink
          ? over
            ? "border-ink-foreground/50 bg-ink-active"
            : "border-ink-foreground/20 bg-ink-hover hover:border-ink-foreground/40"
          : over
            ? "border-primary bg-primary/5 shadow-border"
            : "border-border bg-card hover:border-foreground/30 hover:shadow-border",
        className,
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (e.dataTransfer.files.length) void take(e.dataTransfer.files);
      }}
    >
      <span
        className={cn(
          "flex items-center justify-center rounded-md",
          size === "hero" ? "size-12" : "size-10",
          ink ? "bg-ink-active text-ink-foreground" : "bg-primary/10 text-primary",
        )}
      >
        <FileUp className={size === "hero" ? "size-5" : "size-4"} />
      </span>
      <span>
        <span className={cn("block text-base font-semibold tracking-tight", ink && "text-ink-foreground")}>
          {title}
        </span>
        <span className={cn("mt-1 block text-sm", ink ? "text-ink-muted" : "text-muted-foreground")}>{hint}</span>
      </span>
      <span
        className={cn(
          buttonVariants({ size: "lg", variant: ink ? "inverse" : "default" }),
          "pointer-events-none",
        )}
      >
        {cta}
      </span>
      <input
        type="file"
        accept={accept}
        multiple
        className="sr-only"
        suppressHydrationWarning
        onChange={(e) => {
          if (e.target.files?.length) void take(e.target.files);
          e.currentTarget.value = "";
        }}
      />
    </label>
  );
}
