import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Minus, Plus, X } from "lucide-react";

export type IncludeExcludeValue = { include: string[]; exclude: string[] };

export function IncludeExcludeField({
  options,
  value,
  onChange,
  keywords = { include: [], exclude: [] },
  onKeyword,
  onRemoveKeyword,
  onClear,
  placeholder = "Type at least 3 characters",
}: {
  options: string[];
  value: IncludeExcludeValue;
  onChange: (next: IncludeExcludeValue) => void;
  keywords?: IncludeExcludeValue;
  onKeyword?: (item: string, mode: "include" | "exclude") => void;
  onRemoveKeyword?: (item: string) => void;
  onClear?: () => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [dismissed, setDismissed] = useState(false);
  const [box, setBox] = useState<{ top: number; left: number; width: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const q = query.trim();
  const open = !dismissed && q.length >= 3;
  const selected = new Set([...value.include, ...value.exclude, ...keywords.include, ...keywords.exclude]);
  const custom =
    q.length >= 3 && !options.some((o) => o.toLowerCase() === q.toLowerCase()) && !selected.has(q) ? q : null;
  const matches = open
    ? options.filter((o) => o.toLowerCase().includes(q.toLowerCase()) && !selected.has(o)).slice(0, 8)
    : [];
  const rows = custom ? [custom, ...matches.filter((m) => m.toLowerCase() !== custom.toLowerCase())] : matches;
  const count = selected.size;

  function place() {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = Math.max(rect.width, 360);
    let left = rect.left;
    if (left + width > window.innerWidth - 8) left = Math.max(8, window.innerWidth - width - 8);
    setBox({ top: rect.bottom + 4, left, width });
  }

  useEffect(() => {
    if (!open) return;
    place();
    const onScroll = () => place();
    window.addEventListener("resize", onScroll);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, query]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const target = e.target as Node;
      if (wrapRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setDismissed(true);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setDismissed(true);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function add(item: string, mode: "include" | "exclude") {
    if (item === custom && onKeyword) {
      onKeyword(item, mode);
      setQuery("");
      return;
    }
    const include = value.include.filter((v) => v !== item);
    const exclude = value.exclude.filter((v) => v !== item);
    if (mode === "include") include.push(item);
    else exclude.push(item);
    onChange({ include, exclude });
    setQuery("");
  }

  function remove(item: string) {
    onChange({
      include: value.include.filter((v) => v !== item),
      exclude: value.exclude.filter((v) => v !== item),
    });
  }

  return (
    <div ref={wrapRef} className="relative">
      <div className="flex min-h-10 flex-wrap items-center gap-1 rounded-lg border border-input bg-background px-2 py-1.5 focus-within:border-ring">
        {value.include.map((item) => (
          <Chip key={`in-${item}`} item={item} mode="include" onRemove={() => remove(item)} />
        ))}
        {value.exclude.map((item) => (
          <Chip key={`ex-${item}`} item={item} mode="exclude" onRemove={() => remove(item)} />
        ))}
        {keywords.include.map((item) => (
          <Chip key={`kin-${item}`} item={item} mode="include" onRemove={() => onRemoveKeyword?.(item)} />
        ))}
        {keywords.exclude.map((item) => (
          <Chip key={`kex-${item}`} item={item} mode="exclude" onRemove={() => onRemoveKeyword?.(item)} />
        ))}
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setDismissed(false);
          }}
          onFocus={() => setDismissed(false)}
          placeholder={count ? "" : placeholder}
          aria-label={placeholder}
          aria-expanded={open}
          aria-controls={listId}
          className="h-7 min-w-[8rem] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      {open && box
        ? createPortal(
            <div
              ref={panelRef}
              id={listId}
              style={{ top: box.top, left: box.left, width: box.width }}
              className="fixed z-[80] overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg"
            >
              <ul className="max-h-72 overflow-y-auto">
                {rows.length ? (
                  rows.map((item) => (
                    <li key={item} className="flex items-center gap-2 border-b border-border px-3 py-2 last:border-0 hover:bg-muted/60">
                      <span className="min-w-0 flex-1 truncate text-sm">{item}</span>
                      <button type="button" className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-emerald-600" onClick={() => add(item, "include")}>
                        <span className="inline-flex size-4 items-center justify-center rounded-full bg-emerald-600 text-white">
                          <Plus className="size-2.5" />
                        </span>
                        Include
                      </button>
                      <button type="button" className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-rose-600" onClick={() => add(item, "exclude")}>
                        <span className="inline-flex size-4 items-center justify-center rounded-full bg-rose-600 text-white">
                          <Minus className="size-2.5" />
                        </span>
                        Exclude
                      </button>
                    </li>
                  ))
                ) : (
                  <li className="px-3 py-3 text-sm text-muted-foreground">No matches</li>
                )}
              </ul>
              <div className="flex items-center justify-between gap-3 border-t border-border px-3 py-2 text-sm">
                <span className="text-muted-foreground">({count}) selected</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="font-medium text-primary"
                    onClick={() => {
                      if (onClear) onClear();
                      else onChange({ include: [], exclude: [] });
                      setQuery("");
                    }}
                  >
                    Clear Selection
                  </button>
                  <span className="text-muted-foreground">|</span>
                  <button
                    type="button"
                    className="font-medium text-primary"
                    onClick={() => {
                      setQuery("");
                      setDismissed(true);
                    }}
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function Chip({ item, mode, onRemove }: { item: string; mode: "include" | "exclude"; onRemove: () => void }) {
  return (
    <span
      className={
        mode === "include"
          ? "inline-flex max-w-full items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-800"
          : "inline-flex max-w-full items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs text-rose-800"
      }
    >
      <span className="max-w-[9rem] truncate">{item}</span>
      <button type="button" aria-label={`Remove ${item}`} onClick={onRemove} className="shrink-0">
        <X className="size-3" />
      </button>
    </span>
  );
}
