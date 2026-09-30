import { createFileRoute } from "@tanstack/react-router";
import { VerifyWorkspace } from "@/components/verify-workspace";

export const Route = createFileRoute("/_app/verify")({
  validateSearch: (s: Record<string, unknown>): { mode?: "one" | "list" } =>
    s.mode === "list" || s.mode === "one" ? { mode: s.mode } : {},
  component: VerifyRoute,
});

function VerifyRoute() {
  const { mode } = Route.useSearch();
  return <VerifyWorkspace mode={mode} />;
}
