import { createFileRoute } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Page } from "@/components/page";
import { formatNumber } from "@/lib/format";
import { useAppStore } from "@/lib/store";

export const Route = createFileRoute("/_app/usage")({
  component: UsagePage,
});

function UsagePage() {
  const usage = useAppStore((s) => s.usage);
  const history = useAppStore((s) => s.history);
  const credits = useAppStore((s) => s.credits);
  const keys = useAppStore((s) => s.keys);

  const totals = usage.reduce(
    (a, d) => ({
      verify: a.verify + d.verify,
      find: a.find + d.find,
      api: a.api + d.api,
    }),
    { verify: 0, find: 0, api: 0 },
  );

  const byResult = history.reduce<Record<string, number>>((a, r) => {
    a[r.result] = (a[r.result] ?? 0) + 1;
    return a;
  }, {});
  const resultBars = Object.entries(byResult).map(([name, value]) => ({ name, value }));

  return (
    <Page>
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Verified" value={formatNumber(totals.verify)} />
        <Stat label="Found" value={formatNumber(totals.find)} />
        <Stat label="API calls" value={formatNumber(totals.api + keys.reduce((a, k) => a + k.requests, 0))} />
        <Stat label="Credits left" value={formatNumber(credits)} />
      </div>

      <section className="mt-6 rounded-xl bg-card p-5 shadow-border">
        <h2 className="text-sm font-semibold">Daily volume</h2>
        <div className="mt-4 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={usage}>
              <XAxis
                dataKey="date"
                tickFormatter={(v) => String(v).slice(5)}
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <RTooltip
                contentStyle={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Area type="monotone" dataKey="verify" name="Verify" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.15} strokeWidth={1.5} />
              <Area type="monotone" dataKey="api" name="API" stroke="var(--color-ink)" fill="transparent" strokeWidth={1.5} />
              <Area type="monotone" dataKey="find" name="Find" stroke="var(--color-safe)" fill="transparent" strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl bg-card p-5 shadow-border">
          <h2 className="text-sm font-semibold">By result</h2>
          <div className="mt-4 h-48">
            {resultBars.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={resultBars} layout="vertical" margin={{ left: 16 }}>
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={80}
                    tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Bar dataKey="value" fill="var(--color-primary)" radius={[4, 4, 4, 4]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">Verify an email to see this</p>
            )}
          </div>
        </section>

        <section className="rounded-xl bg-card p-5 shadow-border">
          <h2 className="text-sm font-semibold">Keys</h2>
          <ul className="mt-3 divide-y divide-border">
            {keys.map((k) => (
              <li key={k.id} className="flex items-center justify-between py-3 text-sm">
                <span>{k.name}</span>
                <span className="tabular-nums text-muted-foreground">{formatNumber(k.requests)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Page>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-card px-5 py-4 shadow-border">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{value}</div>
    </div>
  );
}
