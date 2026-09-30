import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { WelcomeScreen } from "@/components/welcome-screen";
import { useAppStore } from "@/lib/store";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const onboarded = useAppStore((s) => s.onboarded);
  const hydrated = useAppStore((s) => s.hydrated);

  // The saved "already onboarded" flag lives in the browser. Until that read
  // finishes, render the app. Otherwise the first paint is a dead welcome
  // screen while the rest of the bundle is still loading.
  if (hydrated && !onboarded) {
    return <WelcomeScreen />;
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
