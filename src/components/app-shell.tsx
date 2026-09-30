import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  CreditCard,
  LayoutGrid,
  Lock,
  LogOut,
  Mail,
  Menu,
  Search,
  Settings,
  User,
  UserSearch,
  Users,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/logo";
import { CommandPalette } from "@/components/command-palette";
import { BuyCreditsDialog } from "@/components/buy-credits";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { formatNumber, initials } from "@/lib/format";
import { pageMeta } from "@/lib/pages";
import { USER, useAppStore, usePlan } from "@/lib/store";
import { cn } from "@/lib/utils";

const MAIN = [
  { to: "/", label: "Dashboard", icon: LayoutGrid, exact: true },
  { to: "/verify", label: "Verify Emails", icon: Mail },
  { to: "/find", label: "Find Emails", icon: Search },
  { to: "/leads", label: "Search Leads", icon: UserSearch },
] as const;

const ACCOUNT = [
  { to: "/api", label: "API", icon: Settings },
  { to: "/usage", label: "Usage", icon: BarChart3 },
  { to: "/billing", label: "Billing", icon: CreditCard },
] as const;

const DOCK = [
  { to: "/", label: "Home", icon: LayoutGrid, exact: true },
  { to: "/verify", label: "Verify", icon: Mail },
  { to: "/find", label: "Find", icon: Search },
  { to: "/leads", label: "Leads", icon: UserSearch },
] as const;

function isActive(pathname: string, to: string, exact?: boolean) {
  if (exact) return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}

function NavItem({
  to,
  label,
  icon: Icon,
  exact,
  pathname,
  onNavigate,
}: {
  to: "/" | "/verify" | "/find" | "/leads" | "/usage" | "/api" | "/billing";
  label: string;
  icon: typeof Mail;
  exact?: boolean;
  pathname: string;
  onNavigate?: () => void;
}) {
  const plan = usePlan();
  const active = isActive(pathname, to, exact);
  const locked = to === "/leads" && !plan.features.leads;
  return (
    <Link
      to={to}
      onClick={onNavigate}
      className={cn(
        "flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors duration-150",
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className="size-[18px] shrink-0" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {locked ? <Lock className="size-3.5 shrink-0" /> : null}
    </Link>
  );
}

function NavList({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex min-h-0 flex-1 flex-col px-3 py-3">
      <div className="flex flex-col gap-1">
        {MAIN.map((item) => (
          <NavItem key={item.to} {...item} pathname={pathname} onNavigate={onNavigate} />
        ))}
      </div>
      <div className="mt-auto border-t border-border pt-3">
        <div className="flex flex-col gap-1">
          {ACCOUNT.map((item) => (
            <NavItem key={item.to} {...item} pathname={pathname} onNavigate={onNavigate} />
          ))}
        </div>
      </div>
    </nav>
  );
}

function SidebarBody({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col bg-card text-foreground">
      <div className="border-b border-border px-5 py-4">
        <Link to="/" onClick={onNavigate}>
          <Logo />
        </Link>
      </div>
      <NavList pathname={pathname} onNavigate={onNavigate} />
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const credits = useAppStore((s) => s.credits);
  const meta = pageMeta(pathname);
  const [cmd, setCmd] = useState(false);
  const [buy, setBuy] = useState(false);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmd(true);
      }
      if (e.key === "Escape") setCmd(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex min-h-dvh bg-background">
      <aside className="sticky top-0 hidden h-dvh w-[248px] shrink-0 flex-col border-r border-border bg-card lg:flex">
        <SidebarBody pathname={pathname} />
      </aside>

      <Sheet open={mobile} onOpenChange={setMobile}>
        <SheetContent side="left" className="p-0">
          <SidebarBody pathname={pathname} onNavigate={() => setMobile(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-border bg-card px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 lg:hidden"
              onClick={() => setMobile(true)}
              aria-label="Open menu"
            >
              <Menu />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-xl font-semibold tracking-tight">{meta.title}</h1>
              <p className="mt-0.5 hidden truncate text-sm text-muted-foreground sm:block">{meta.kicker}</p>
            </div>
            <div className="flex items-center rounded-lg bg-primary/10 px-3 py-2">
              <span className="hidden text-sm sm:inline">Available Credits:&nbsp;</span>
              <span className="text-sm font-semibold tabular-nums text-primary">{formatNumber(credits)}</span>
            </div>
            <Button onClick={() => setBuy(true)}>Buy Credits</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex h-12 shrink-0 items-center gap-1 rounded-full pl-0.5 pr-1 hover:bg-muted"
                  aria-label="Account"
                >
                  <span className="flex size-8 items-center justify-center rounded-full bg-ink text-xs font-medium text-ink-foreground">
                    {initials(USER.name)}
                  </span>
                  <ChevronDown className="size-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-56">
                <DropdownMenuLabel>
                  <div className="text-sm font-medium text-foreground">{USER.name}</div>
                  <div className="text-xs font-normal text-muted-foreground">{USER.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile">
                    <User className="size-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/workspace">
                    <Users className="size-4" />
                    Workspace
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => toast.message("You're on the demo account")}>
                  <LogOut className="size-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 px-3 py-6 pb-24 sm:px-6 lg:px-8 lg:pb-6">{children}</main>
      </div>

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      >
        <div className="grid grid-cols-4">
          {DOCK.map((item) => {
            const active = isActive(pathname, item.to, "exact" in item ? item.exact : false);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="size-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <CommandPalette open={cmd} onOpenChange={setCmd} onBuy={() => setBuy(true)} />
      <BuyCreditsDialog open={buy} onOpenChange={setBuy} />
    </div>
  );
}
