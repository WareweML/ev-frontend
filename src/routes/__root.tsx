import { useEffect } from "react";
import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { TooltipProvider } from "@/components/ui/tooltip";
import { seedSavedSearches, useAppStore } from "@/lib/store";
import { Toaster } from "sonner";
import appCss from "../styles.css?url";

const APP_NAME = "Email Verifier";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      { name: "theme-color", content: "#141413" },
      {
        name: "description",
        content: "Verify emails, find work addresses, and search leads.",
      },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Instrument+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap",
      },
    ],
  }),
  component: RootDocument,
});

function HydrateStore() {
  useEffect(() => {
    const result = useAppStore.persist.rehydrate();
    void Promise.resolve(result).then(() => {
      const searches = useAppStore.getState().savedSearches;
      const legacy =
        searches.length > 0 &&
        searches.every((item) => item.kind === "person" && ["ss1", "ss2", "ss3"].includes(item.id));
      if (legacy) useAppStore.setState({ savedSearches: seedSavedSearches() });
      const recent = useAppStore.getState().recentLeadQueries;
      if (recent.length === 1 && recent[0] === "CTOs at fintech") {
        useAppStore.setState({ recentLeadQueries: [] });
      }
      useAppStore.getState().setHydrated(true);
    });
  }, []);
  return null;
}

function RootDocument() {
  return (
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <PreviewHostBridge />
        <HydrateStore />
        <AuthProvider>
          <TooltipProvider delayDuration={250}>
            <Outlet />
          </TooltipProvider>
        </AuthProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            className: "font-sans",
            style: {
              background: "#fffcf7",
              border: "1px solid #e2e0d6",
              color: "#171717",
            },
          }}
        />
        <Scripts />
      </body>
    </html>
  );
}
