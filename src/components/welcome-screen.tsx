import { useNavigate } from "@tanstack/react-router";
import { Code2, MailSearch, Sparkles, ShieldCheck, type LucideIcon } from "lucide-react";
import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { USER, useAppStore } from "@/lib/store";

type Job = {
  id: string;
  title: string;
  body: string;
  icon: LucideIcon;
  popular?: boolean;
  to: "/" | "/verify" | "/find" | "/leads" | "/api";
};

const JOBS: Job[] = [
  {
    id: "verify",
    title: "Verify emails",
    body: "Clean your list so more of your emails land in the inbox.",
    icon: ShieldCheck,
    popular: true,
    to: "/verify",
  },
  {
    id: "find",
    title: "Find emails",
    body: "Get the work email for anyone you want to reach.",
    icon: MailSearch,
    to: "/find",
  },
  {
    id: "leads",
    title: "Find new leads",
    body: "Search for the people you want to contact, then save the list.",
    icon: Sparkles,
    to: "/leads",
  },
  {
    id: "api",
    title: "Automate with the API",
    body: "Run verify, find, and leads from the tools you already use.",
    icon: Code2,
    to: "/api",
  },
];

export function WelcomeScreen() {
  const navigate = useNavigate();
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);

  function go(to: Job["to"]) {
    completeOnboarding();
    void navigate({ to });
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <div className="px-5 py-4 sm:px-8">
        <Logo />
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-10 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight">Welcome, {USER.firstName}</h1>
        <p className="mt-1.5 text-base text-muted-foreground">What do you want to do first? Pick one and we'll open it.</p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {JOBS.map((job) => {
            const Icon = job.icon;
            return (
              <button
                key={job.id}
                type="button"
                onClick={() => go(job.to)}
                className="relative flex items-start gap-3 rounded-xl bg-card p-5 text-left shadow-border transition-[box-shadow,background-color] duration-150 hover:shadow-border-hover"
              >
                {job.popular ? (
                  <span className="absolute -top-2.5 right-4">
                    <Badge variant="primary">Most popular</Badge>
                  </span>
                ) : null}
                <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-base font-semibold tracking-tight">{job.title}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{job.body}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}