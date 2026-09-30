import { createFileRoute } from "@tanstack/react-router";
import { Page } from "@/components/page";
import { initials } from "@/lib/format";
import { USER } from "@/lib/store";

export const Route = createFileRoute("/_app/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <Page className="max-w-xl">
      <section className="rounded-xl bg-card p-5 shadow-border sm:p-6">
        <div className="flex items-center gap-4">
          <span className="flex size-14 items-center justify-center rounded-full bg-ink text-lg font-medium text-ink-foreground">
            {initials(USER.name)}
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-xl font-semibold tracking-tight">{USER.name}</h2>
            <p className="truncate text-sm text-muted-foreground">{USER.email}</p>
          </div>
        </div>
        <dl className="mt-6 divide-y divide-border border-t border-border text-sm">
          <Row label="Name" value={USER.name} />
          <Row label="Email" value={USER.email} />
          <Row label="Company" value={USER.company} />
        </dl>
      </section>
    </Page>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="truncate font-medium">{value}</dd>
    </div>
  );
}
