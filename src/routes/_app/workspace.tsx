import { useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { MoreHorizontal, Plus } from "lucide-react";
import { toast } from "sonner";
import { Page } from "@/components/page";
import { Segmented } from "@/components/segmented";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initials } from "@/lib/format";
import { useAppStore, usePlan } from "@/lib/store";
import type { TeamRole } from "@/lib/types";

export const Route = createFileRoute("/_app/workspace")({
  component: WorkspacePage,
});

function WorkspacePage() {
  const workspaceName = useAppStore((s) => s.workspaceName);
  const members = useAppStore((s) => s.members);
  const renameWorkspace = useAppStore((s) => s.renameWorkspace);
  const inviteMember = useAppStore((s) => s.inviteMember);
  const removeMember = useAppStore((s) => s.removeMember);
  const setMemberRole = useAppStore((s) => s.setMemberRole);
  const plan = usePlan();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>("member");
  const [nameDraft, setNameDraft] = useState(workspaceName);

  const active = members.filter((m) => m.status === "active").length;
  const pending = members.filter((m) => m.status === "invited").length;

  function invite() {
    if (!plan.features.team) {
      toast.message("Team is on Outreach");
      return;
    }
    const result = inviteMember(email, role);
    if (result === "ok") {
      toast.success("Invite sent");
      setEmail("");
      setRole("member");
      setInviteOpen(false);
      return;
    }
    if (result === "plan") toast.message("Team is on Outreach");
    else if (result === "exists") toast.message("Already on this workspace");
    else toast.message("Enter a work email");
  }

  return (
    <Page>
      <section className="rounded-xl bg-card p-5 shadow-border sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs text-muted-foreground">Workspace</div>
            <h2 className="mt-1 text-3xl font-semibold tracking-tight">{workspaceName}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {active} {active === 1 ? "person" : "people"}
              {pending ? ` · ${pending} invited` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setNameDraft(workspaceName);
                setRenameOpen(true);
              }}
            >
              Rename
            </Button>
            {plan.features.team ? (
              <Button onClick={() => setInviteOpen(true)}>
                <Plus />
                Invite
              </Button>
            ) : (
              <Button asChild>
                <Link to="/billing">On Outreach</Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-xl bg-card shadow-border">
        <div className="px-5 py-4 text-sm font-semibold">People</div>
        <ul className="divide-y divide-border">
          {members.map((m) => (
            <li key={m.id} className="flex items-center gap-3 px-5 py-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                {initials(m.name)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-medium">{m.name}</span>
                  {m.you ? <Badge variant="primary">You</Badge> : null}
                  {m.status === "invited" ? <Badge variant="outline">Pending</Badge> : null}
                </div>
                <div className="truncate text-xs text-muted-foreground">{m.email}</div>
              </div>
              <span className="hidden text-sm text-muted-foreground sm:block">
                {m.role === "admin" ? "Admin" : "Member"}
              </span>
              {m.you ? null : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Member actions">
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onSelect={() => {
                        if (!setMemberRole(m.id, "admin")) toast.message("Keep at least one admin");
                      }}
                    >
                      Make admin
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => {
                        if (!setMemberRole(m.id, "member")) toast.message("Keep at least one admin");
                      }}
                    >
                      Make member
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => {
                        removeMember(m.id);
                        toast.success(m.status === "invited" ? "Invite cancelled" : "Removed");
                      }}
                    >
                      {m.status === "invited" ? "Cancel invite" : "Remove"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </li>
          ))}
        </ul>
      </section>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite to {workspaceName}</DialogTitle>
          </DialogHeader>
          <div>
            <Label htmlFor="invite-email">Work email</Label>
            <Input
              id="invite-email"
              className="mt-1.5"
              type="email"
              value={email}
              placeholder="name@company.com"
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") invite();
              }}
            />
          </div>
          <div>
            <Label>Role</Label>
            <Segmented
              className="mt-1.5 w-full"
              value={role}
              onChange={setRole}
              options={[
                { value: "member", label: "Member" },
                { value: "admin", label: "Admin" },
              ]}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>
              Not now
            </Button>
            <Button onClick={invite}>Invite</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename workspace</DialogTitle>
          </DialogHeader>
          <div>
            <Label htmlFor="ws-name">Name</Label>
            <Input
              id="ws-name"
              className="mt-1.5"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  renameWorkspace(nameDraft);
                  setRenameOpen(false);
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>
              Not now
            </Button>
            <Button
              onClick={() => {
                renameWorkspace(nameDraft);
                setRenameOpen(false);
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Page>
  );
}
