import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Command } from "cmdk";
import {
  Building2,
  Code2,
  CreditCard,
  FileUp,
  KeyRound,
  LayoutDashboard,
  MailSearch,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";

export function CommandPalette({
  open,
  onOpenChange,
  onBuy,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onBuy: () => void;
}) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  const go = (
    to: "/" | "/verify" | "/find" | "/leads" | "/api" | "/usage" | "/billing" | "/welcome" | "/workspace",
  ) => {
    onOpenChange(false);
    void navigate({ to });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-ink/40"
        aria-label="Close command palette"
        onClick={() => onOpenChange(false)}
      />
      <div className="pointer-events-none absolute inset-x-0 top-[14vh] flex justify-center px-4">
        <Command
          className="pointer-events-auto w-full max-w-lg overflow-hidden rounded-xl bg-card shadow-pop"
          loop
        >
          <Command.Input
            autoFocus
            value={q}
            onValueChange={setQ}
            placeholder="Go somewhere, or paste an email…"
            className="h-12 w-full border-b border-border bg-transparent px-4 text-sm outline-none placeholder:text-muted-foreground"
          />
          <Command.List className="max-h-80 overflow-y-auto p-1">
            <Command.Empty className="px-3 py-6 text-center text-sm text-muted-foreground">
              Nothing matches
            </Command.Empty>
            <Command.Group heading="Work" className="px-1 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Item onSelect={() => go("/welcome")} icon={Sparkles} label="First steps" />
              <Item onSelect={() => go("/")} icon={LayoutDashboard} label="Dashboard" />
              <Item onSelect={() => go("/verify")} icon={FileUp} label="Verify Emails" />
              <Item onSelect={() => go("/find")} icon={MailSearch} label="Find Emails" />
              <Item
                onSelect={() => {
                  onOpenChange(false);
                  void navigate({ to: "/find", search: { mode: "list" } });
                }}
                icon={FileUp}
                label="Find emails from a list"
              />
              <Item onSelect={() => go("/leads")} icon={Users} label="Search Leads" />
              <Item
                onSelect={() => {
                  onOpenChange(false);
                  void navigate({ to: "/leads" });
                }}
                icon={Users}
                label="Lists"
              />
            </Command.Group>
            <Command.Group heading="Account" className="px-1 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Item onSelect={() => go("/api")} icon={KeyRound} label="API keys & docs" />
              <Item onSelect={() => go("/usage")} icon={Code2} label="Usage" />
              <Item onSelect={() => go("/billing")} icon={CreditCard} label="Pay as you go or Outreach" />
              <Item onSelect={() => go("/workspace")} icon={Building2} label="Workspace" />
              <Item
                onSelect={() => {
                  onOpenChange(false);
                  onBuy();
                }}
                icon={CreditCard}
                label="Buy credits"
              />
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}

function Item({
  icon: Icon,
  label,
  onSelect,
}: {
  icon: LucideIcon;
  label: string;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      value={label}
      onSelect={onSelect}
      className="flex min-h-12 cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground data-[selected=true]:bg-muted"
    >
      <Icon className="size-4 text-muted-foreground" />
      {label}
    </Command.Item>
  );
}
