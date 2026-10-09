import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Activity, Check, ChevronDown, Clock, RefreshCw } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from "recharts";
import { Page } from "@/components/page";
import { formatNumber } from "@/lib/format";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/usage")({
  component: UsagePage,
});

const TZ = "Asia/Kolkata";

const SERIES = [
  { key: "verify", name: "Verify Emails", color: "#3cba7a" },
  { key: "find", name: "Find Emails", color: "#1d4ed8" },
  { key: "leads", name: "Search Leads", color: "#1e3a5f" },
  { key: "api", name: "API", color: "#7c5cbf" },
] as const;

type WhenId = "week" | "month" | "lastWeek" | "lastMonth" | "custom";

const WHEN_OPTIONS: { id: WhenId; label: string }[] = [
  { id: "week", label: "This week" },
  { id: "month", label: "This month" },
  { id: "lastWeek", label: "Last week" },
  { id: "lastMonth", label: "Last month" },
  { id: "custom", label: "Custom range" },
];

function zonedParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute"), second: get("second") };
}

function zonedDate(year: number, month: number, day: number, hour = 0, minute = 0) {
  const utc = Date.UTC(year, month - 1, day, hour - 5, minute - 30);
  return new Date(utc);
}

function rangeFor(id: WhenId, now: Date, customFrom: string, customTo: string) {
  const p = zonedParts(now);
  const startToday = zonedDate(p.year, p.month, p.day);
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short" }).format(now);
  const weekIndex = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(weekday);
  const monday = new Date(startToday.getTime() - Math.max(0, weekIndex) * 86400000);

  if (id === "week") return { start: monday, end: now, label: "This week" };
  if (id === "month") return { start: zonedDate(p.year, p.month, 1), end: now, label: "This month" };
  if (id === "lastWeek") {
    const start = new Date(monday.getTime() - 7 * 86400000);
    return { start, end: new Date(monday.getTime() - 1), label: "Last week" };
  }
  if (id === "lastMonth") {
    const start = zonedDate(p.month === 1 ? p.year - 1 : p.year, p.month === 1 ? 12 : p.month - 1, 1);
    const end = new Date(zonedDate(p.year, p.month, 1).getTime() - 1);
    return { start, end, label: "Last month" };
  }
  const from = customFrom ? zonedDate(...dateParts(customFrom)) : zonedDate(p.year, p.month, 1);
  const to = customTo ? endOfZonedDay(...dateParts(customTo)) : now;
  return { start: from, end: to, label: "Custom range" };
}

function dateParts(iso: string): [number, number, number] {
  const [year, month, day] = iso.split("-").map(Number);
  return [year || 2026, month || 1, day || 1];
}

function endOfZonedDay(year: number, month: number, day: number) {
  return new Date(zonedDate(year, month, day).getTime() + 86400000 - 1);
}

function whenStamp(date: Date) {
  const p = zonedParts(date);
  const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][p.month - 1];
  const hour12 = p.hour % 12 || 12;
  const ampm = p.hour < 12 ? "AM" : "PM";
  const minute = String(p.minute).padStart(2, "0");
  return `${month} ${p.day} ${hour12}:${minute}${ampm}`;
}

function dayKey(date: Date) {
  const p = zonedParts(date);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

function eachDay(start: Date, end: Date) {
  const days: Date[] = [];
  let cursor = zonedDate(...(dayKey(start).split("-").map(Number) as [number, number, number]));
  const last = dayKey(end);
  while (dayKey(cursor) <= last && days.length < 62) {
    days.push(cursor);
    cursor = new Date(cursor.getTime() + 86400000);
  }
  return days;
}

function logStamp(ts: number) {
  const p = zonedParts(new Date(ts));
  const hour12 = p.hour % 12 || 12;
  const ampm = p.hour < 12 ? "AM" : "PM";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${p.day}/${p.month}/${p.year}, ${hour12}:${pad(p.minute)}:${pad(p.second)} ${ampm}`;
}

function UsagePage() {
  const usage = useAppStore((s) => s.usage);
  const history = useAppStore((s) => s.history);
  const finds = useAppStore((s) => s.finds);
  const credits = useAppStore((s) => s.credits);
  const [when, setWhen] = useState<WhenId>("month");
  const [open, setOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const span = rangeFor(when, new Date(), customFrom, customTo);
  const chart = useMemo(() => {
    const days = eachDay(span.start, span.end);
    return days.map((day, i) => {
      const key = dayKey(day);
      const stored = usage.find((point) => point.date === key);
      const spike = i === Math.min(days.length - 1, Math.max(0, Math.round(days.length * 0.65)));
      return {
        date: key,
        verify: stored?.verify ?? (spike ? 102 : 2 + (i % 4)),
        find: stored?.find ?? (i % 8 === 3 ? 6 : 1),
        leads: stored ? Math.max(0, Math.round(stored.find * 0.4)) : i % 5 === 2 ? 3 : 0,
        api: stored?.api ?? (i % 6 === 1 ? 4 : 0),
      };
    });
  }, [usage, span.start, span.end]);

  const logs = useMemo(() => {
    const rows = [
      ...history.map((item) => ({
        id: item.id,
        activity: "Verify Emails",
        description: item.source === "bulk" ? "Bulk email verified" : "Single Email verified",
        spent: 1,
        at: item.createdAt,
      })),
      ...finds.map((item) => ({
        id: item.id,
        activity: "Find Emails",
        description: item.enriched ? "Email found with enriched data" : "Email found",
        spent: item.creditsCharged || 5,
        at: item.createdAt,
      })),
    ].sort((a, b) => b.at - a.at);
    let remaining = credits;
    return rows.map((row) => {
      const next = { ...row, remaining };
      remaining += row.spent;
      return next;
    });
  }, [history, finds, credits]);

  return (
    <Page>
      <section className="rounded-xl bg-card p-5 shadow-border">
        <h2 className="text-left text-base font-semibold">Overview</h2>
        <div className="relative mt-4 max-w-xl">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-full items-center rounded-lg bg-background text-left text-sm shadow-border"
          >
            <span className="border-r border-border px-3 font-medium">When</span>
            <span className="min-w-0 flex-1 truncate px-3">
              {span.label} ({whenStamp(span.start)} - {whenStamp(span.end)} IST)
            </span>
            <ChevronDown className="mr-3 size-4 shrink-0 text-muted-foreground" />
          </button>
          {open ? (
            <div className="absolute z-20 mt-1 w-56 rounded-lg bg-card py-1 shadow-pop">
              {WHEN_OPTIONS.map((option, i) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setWhen(option.id);
                    if (option.id !== "custom") setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-background",
                    i === WHEN_OPTIONS.length - 1 && "mt-1 border-t border-border",
                  )}
                >
                  {option.label}
                  {when === option.id ? <Check className="size-4" /> : null}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        {when === "custom" ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="h-9 rounded-lg bg-background px-2 shadow-border"
            />
            <span className="text-muted-foreground">to</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="h-9 rounded-lg bg-background px-2 shadow-border"
            />
          </div>
        ) : null}

        <div className="mt-6 h-72 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <AreaChart data={chart} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                minTickGap={24}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                width={36}
                allowDecimals={false}
              />
              <RTooltip
                contentStyle={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              {SERIES.map((series) => (
                <Area
                  key={series.key}
                  type="monotone"
                  dataKey={series.key}
                  name={series.name}
                  stroke={series.color}
                  fill={series.key === "verify" ? series.color : "transparent"}
                  fillOpacity={series.key === "verify" ? 0.16 : 0}
                  strokeWidth={2}
                  dot={{ r: 3, strokeWidth: 0, fill: series.color }}
                  isAnimationActive={false}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-2">
          {SERIES.map((series) => (
            <span key={series.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="size-2.5 rounded-full" style={{ background: series.color }} />
              {series.name}
            </span>
          ))}
        </div>
      </section>

      <section className="mt-6 overflow-hidden rounded-xl bg-card shadow-border">
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Activity className="size-4" />
            Recent Activity Logs
          </h2>
          <button type="button" aria-label="Refresh" className="text-muted-foreground">
            <RefreshCw className="size-4" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-border bg-background text-left text-muted-foreground">
                <th className="px-5 py-2.5 font-medium">Activity</th>
                <th className="px-3 py-2.5 font-medium">Description</th>
                <th className="px-3 py-2.5 font-medium">Metadata</th>
                <th className="px-5 py-2.5 font-medium">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">
                    No activity yet.
                  </td>
                </tr>
              ) : (
                logs.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-2">
                        <Activity className="size-3.5 text-muted-foreground" />
                        <span className="rounded-full bg-background px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase">
                          {row.activity}
                        </span>
                      </span>
                    </td>
                    <td className="px-3 py-3.5 font-medium whitespace-nowrap">{row.description}</td>
                    <td className="px-3 py-3.5 whitespace-nowrap">
                      <div>Credits: {formatNumber(row.spent)}</div>
                      <div>
                        <span className="text-[#c45c26]">Remaining:</span> {formatNumber(row.remaining)}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="size-3.5" />
                        {logStamp(row.at)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </Page>
  );
}
