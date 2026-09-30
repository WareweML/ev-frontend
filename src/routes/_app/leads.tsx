import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowUp,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Folder,
  Download,
  ExternalLink,
  List,
  Mail,
  MapPin,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Page } from "@/components/page";
import { PlanGate } from "@/components/plan-gate";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { CopyButton } from "@/components/copy-button";
import { IncludeExcludeField, type IncludeExcludeValue } from "@/components/include-exclude-field";
import {
  applyCompanyFilters,
  applyLeadFilters,
  applyLocalFilters,
  COMPANY_BY_ID,
  COMPANIES,
  CITIES,
  COUNTRIES,
  DEPT_LABEL,
  hasActiveFilters,
  INDUSTRIES,
  inferLeadKind,
  listMemberIds,
  parseLeadQuery,
  peopleAtCompany,
  PEOPLE,
  queryFromFilters,
  resultUnit,
  SENIORITY_LABEL,
  SIZE_BUCKETS,
  SUGGESTED_BY_KIND,
  type LocalPlace,
} from "@/lib/leads-data";
import {
  FUNDING_OPTIONS,
  FUNCTION_OPTIONS,
  HEADCOUNT_OPTIONS,
  HEADCOUNT_RANGES,
  INDUSTRY_OPTIONS,
  JOB_TITLES,
  LANGUAGE_OPTIONS,
  LOCATIONS,
  REVENUE_OPTIONS,
  REVENUE_STREAMS,
  SCHOOL_OPTIONS,
  SENIORITY_OPTIONS,
  SKILL_OPTIONS,
  BUSINESS_TYPES,
  CERTIFICATION_OPTIONS,
  COMPANY_TYPES,
  EXPERIENCE_OPTIONS,
} from "@/lib/filter-options";
import { emailFromPerson } from "@/lib/engine";
import { formatDate, formatNumber, initials } from "@/lib/format";
import { downloadList } from "@/lib/export-list";
import { useAppStore, usePlan } from "@/lib/store";
import {
  asLeadKind,
  LEAD_KIND_META,
  type Company,
  type LeadFilters,
  type LeadFilterFacets,
  type LeadKind,
  type Person,
  type SavedSearch,
} from "@/lib/types";
import { cn } from "@/lib/utils";

type LeadsSearch = { q?: string; kind?: LeadKind; list?: string };

export const Route = createFileRoute("/_app/leads")({
  validateSearch: (s: Record<string, unknown>): LeadsSearch => {
    const out: LeadsSearch = {};
    if (typeof s.q === "string" && s.q.trim()) out.q = s.q;
    if (s.kind === "person" || s.kind === "company" || s.kind === "local") out.kind = s.kind;
    if (typeof s.list === "string" && s.list.trim()) out.list = s.list;
    return out;
  },
  component: LeadsPage,
});

type Active =
  | { type: "person"; person: Person }
  | { type: "company"; company: Company }
  | { type: "place"; place: LocalPlace }
  | null;

type NameDialog =
  | { mode: "create" }
  | { mode: "save-results" }
  | { mode: "add-new" }
  | { mode: "rename"; id: string; name: string }
  | null;

type ConfirmAction =
  | { kind: "delete"; id: string; name: string; count: number }
  | { kind: "enrich"; listId: string; listName: string; ids: string[] }
  | { kind: "reveal"; people: Person[] };

const REVEAL_CREDITS = 5;
const ENRICH_CREDITS = 20;

function LeadsPage() {
  const search = Route.useSearch();
  const [kind, setKind] = useState<LeadKind>(() => asLeadKind(search.kind));
  const [query, setQuery] = useState(search.q ?? "");
  const [draft, setDraft] = useState<LeadFilters>(() => (search.q ? parseLeadQuery(search.q) : {}));
  const [applied, setApplied] = useState<LeadFilters | null>(() => (search.q ? parseLeadQuery(search.q) : null));
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [active, setActive] = useState<Active>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [railOpen, setRailOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [nameDialog, setNameDialog] = useState<NameDialog>(null);
  const [expandedPlace, setExpandedPlace] = useState<string | null>(null);
  const [activeListId, setActiveListId] = useState<string | null>(() => search.list ?? null);
  const [mode, setMode] = useState<"search" | "list">(() => (search.list ? "list" : "search"));
  const [listsOpen, setListsOpen] = useState(false);
  const [pendingIds, setPendingIds] = useState<string[] | null>(null);
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null);

  const credits = useAppStore((s) => s.credits);
  const revealed = useAppStore((s) => s.revealed);
  const revealLead = useAppStore((s) => s.revealLead);
  const spendCredits = useAppStore((s) => s.spendCredits);
  const remember = useAppStore((s) => s.rememberLeadQuery);
  const recentQueries = useAppStore((s) => s.recentLeadQueries);
  const saved = useAppStore((s) => s.savedSearches);
  const saveSearch = useAppStore((s) => s.saveSearch);
  const createList = useAppStore((s) => s.createList);
  const addToList = useAppStore((s) => s.addToList);
  const removeFromList = useAppStore((s) => s.removeFromList);
  const renameSearch = useAppStore((s) => s.renameSearch);
  const deleteSearch = useAppStore((s) => s.deleteSearch);
  const plan = usePlan();

  const activeList = saved.find((item) => item.id === activeListId) ?? null;

  const people = useMemo(() => (applied ? applyLeadFilters(applied) : []), [applied]);
  const companies = useMemo(() => (applied ? applyCompanyFilters(applied) : []), [applied]);
  const places = useMemo(() => (applied ? applyLocalFilters(applied) : []), [applied]);

  const listPeople = useMemo(() => {
    if (!activeList || asLeadKind(activeList.kind) !== "person") return [];
    const ids = new Set(listMemberIds(activeList));
    return PEOPLE.filter((p) => ids.has(p.id));
  }, [activeList]);
  const listCompanies = useMemo(() => {
    if (!activeList || asLeadKind(activeList.kind) !== "company") return [];
    const ids = new Set(listMemberIds(activeList));
    return COMPANIES.filter((c) => ids.has(c.id));
  }, [activeList]);
  const listPlaces = useMemo(() => {
    if (!activeList || asLeadKind(activeList.kind) !== "local") return [];
    const ids = new Set(listMemberIds(activeList));
    return applyLocalFilters({}).filter((p) => ids.has(p.id));
  }, [activeList]);

  const viewingList = mode === "list" && !!activeList;
  const shownPeople = viewingList ? listPeople : people;
  const shownCompanies = viewingList ? listCompanies : companies;
  const shownPlaces = viewingList ? listPlaces : places;

  function applySearch(nextKind: LeadKind, nextFilters: LeadFilters, nextQuery: string, rememberQ = true) {
    setKind(nextKind);
    setDraft(nextFilters);
    setApplied(nextFilters);
    setQuery(nextQuery);
    setSelected(new Set());
    setExpandedPlace(null);
    setFilterOpen(false);
    setRailOpen(false);
    setPage(0);
    setMode("search");
    if (rememberQ && nextQuery.trim()) remember(nextQuery.trim());
  }

  function runFilters() {
    const q = query.trim() || queryFromFilters(draft, kind);
    applySearch(kind, draft, q);
  }

  function runAi(text: string) {
    const next = parseLeadQuery(text);
    const nextKind = inferLeadKind(text, next);
    applySearch(nextKind, next, text);
  }

  function openList(item: SavedSearch) {
    const nextKind = asLeadKind(item.kind);
    setActiveListId(item.id);
    setKind(nextKind);
    setMode("list");
    setListsOpen(false);
    setSelected(new Set());
    setActive(null);
    setApplied(null);
    setQuery(item.query);
    setDraft(item.filters ?? (item.query ? parseLeadQuery(item.query) : {}));
    setExpandedPlace(null);
  }

  function addMoreToList() {
    setMode("search");
    setApplied(null);
    setSelected(new Set());
    setQuery("");
    setDraft({});
  }

  function currentResultIds() {
    if (kind === "company") return companies.map((c) => c.id);
    if (kind === "local") return places.map((p) => p.id);
    return people.map((p) => p.id);
  }

  function idsToAdd() {
    if (selected.size) return [...selected];
    return currentResultIds();
  }

  function addIds(listId: string, ids: string[]) {
    if (!ids.length) {
      toast.message("Nothing to add");
      return;
    }
    const n = addToList(listId, ids);
    const list = useAppStore.getState().savedSearches.find((x) => x.id === listId);
    const unit = resultUnit(kind, n);
    toast.success(n ? `Added ${formatNumber(n)} ${unit} to ${list?.name ?? "list"}` : "Already in this list", {
      action: list
        ? {
            label: "Open",
            onClick: () => openList(list),
          }
        : undefined,
    });
  }

  function persistNamedList(name: string) {
    if (nameDialog?.mode === "save-results") {
      const ids = currentResultIds();
      const q = query.trim() || queryFromFilters(draft, kind);
      const id = saveSearch(name, q, kind, applied ?? draft, ids);
      const item = useAppStore.getState().savedSearches.find((x) => x.id === id);
      toast.success("List saved", {
        action: item ? { label: "Open", onClick: () => openList(item) } : undefined,
      });
      return;
    }
    if (nameDialog?.mode === "add-new") {
      const ids = pendingIds ?? [];
      if (kind === "person" && ids.length) {
        const cost = ids.length * ENRICH_CREDITS;
        if (!spendCredits(cost)) {
          toast.error("Not enough credits");
          return false;
        }
      }
      const q = query.trim() || queryFromFilters(draft, kind);
      const id = saveSearch(name, q, kind, applied ?? draft, ids);
      setActiveListId(id);
      setPendingIds(null);
      toast.success("List saved");
      return true;
    }
    const id = createList(name, kind);
    const item = useAppStore.getState().savedSearches.find((x) => x.id === id);
    if (item) openList(item);
  }

  useEffect(() => {
    if (!search.q) return;
    const next = parseLeadQuery(search.q);
    const nextKind = search.kind ?? inferLeadKind(search.q, next);
    applySearch(nextKind, next, search.q);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- URL seed once per q/kind
  }, [search.q, search.kind]);

  useEffect(() => {
    if (!search.list) return;
    const item = useAppStore.getState().savedSearches.find((x) => x.id === search.list);
    if (item) openList(item);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- URL seed once per list
  }, [search.list]);

  function freshIds(listId: string | null, ids: string[]) {
    if (!listId) return ids;
    const list = useAppStore.getState().savedSearches.find((x) => x.id === listId);
    const have = new Set(list ? listMemberIds(list) : []);
    return ids.filter((id) => !have.has(id));
  }

  function askEnrich(listId: string, ids: string[]) {
    if (kind !== "person") {
      addIds(listId, ids);
      return;
    }
    const next = freshIds(listId, ids);
    if (!next.length) {
      toast.message(ids.length ? "Already in this list" : "Nothing to add");
      return;
    }
    const list = saved.find((item) => item.id === listId);
    setConfirm({ kind: "enrich", listId, listName: list?.name ?? "this list", ids: next });
  }

  function askReveal(rows: Person[]) {
    const next = rows.filter((p) => !revealed[p.id]);
    if (!next.length) {
      toast.message(rows.length ? "Already revealed" : "Nothing selected");
      return;
    }
    setConfirm({ kind: "reveal", people: next });
  }

  function askDelete(id: string) {
    const item = saved.find((row) => row.id === id);
    if (!item) return;
    setConfirm({ kind: "delete", id, name: item.name, count: listMemberIds(item).length });
  }

  function runConfirm() {
    if (!confirm) return;
    if (confirm.kind === "delete") {
      if (activeListId === confirm.id) {
        setActiveListId(null);
        setMode("search");
      }
      deleteSearch(confirm.id);
      toast.success("List deleted");
      setConfirm(null);
      return;
    }
    if (confirm.kind === "enrich") {
      const cost = confirm.ids.length * ENRICH_CREDITS;
      if (!spendCredits(cost)) {
        toast.error("Not enough credits");
        return;
      }
      addIds(confirm.listId, confirm.ids);
      setConfirm(null);
      return;
    }
    let revealedCount = 0;
    let last = "";
    for (const person of confirm.people) {
      const email = revealLead(person.id, person.firstName, person.lastName, person.companyId);
      if (!email) break;
      revealedCount += 1;
      last = email;
    }
    if (!revealedCount) toast.error("Not enough credits");
    else toast.success(revealedCount === 1 ? last : `${formatNumber(revealedCount)} emails revealed`);
    setConfirm(null);
  }

  function changeKind(next: LeadKind) {
    if (next === kind) return;
    const nextFilters = next === "person" ? draft : companyFilters(draft);
    setKind(next);
    setDraft(nextFilters);
    setSelected(new Set());
    setActive(null);
    setExpandedPlace(null);
    setPage(0);
    setMode("search");
    if (applied) setApplied(nextFilters);
  }

  function resetFilters() {
    setDraft({});
    setApplied(null);
    setSelected(new Set());
    setQuery("");
    setExpandedPlace(null);
  }

  const kindMeta = LEAD_KIND_META[kind];
  const resultCount = viewingList
    ? kind === "company"
      ? shownCompanies.length
      : kind === "local"
        ? shownPlaces.length
        : shownPeople.length
    : kind === "company"
      ? companies.length
      : kind === "local"
        ? places.length
        : people.length;

  const matchingLists = saved.filter((item) => asLeadKind(item.kind) === kind);
  const pageSize = 50;
  const pageCount = Math.max(1, Math.ceil(resultCount / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const pageStart = safePage * pageSize;
  const pageEnd = Math.min(pageStart + pageSize, resultCount);
  const pagePeople = people.slice(pageStart, pageEnd);
  const pageCompanies = companies.slice(pageStart, pageEnd);
  const pagePlaces = places.slice(pageStart, pageEnd);
  const searchLabel = query.trim() || queryFromFilters(applied ?? draft, kind);

  const filterPanel = (
    <FilterRail
      kind={kind}
      onKind={changeKind}
      filters={draft}
      onChange={setDraft}
      onSearch={runFilters}
      onReset={resetFilters}
      canReset={hasActiveFilters(draft) || applied !== null}
    />
  );

  const searchToolbar =
    resultCount > 0 ? (
      <>
        {activeList && asLeadKind(activeList.kind) === kind ? (
          <Button type="button" onClick={() => askEnrich(activeList.id, idsToAdd())}>
            Enrich emails to {activeList.name}
          </Button>
        ) : (
          <AddToListMenu
            lists={matchingLists}
            onPick={(id) => askEnrich(id, idsToAdd())}
            onNew={() => {
              const ids = kind === "person" ? freshIds(null, idsToAdd()) : idsToAdd();
              if (!ids.length) {
                toast.message("Nothing to add");
                return;
              }
              setPendingIds(ids);
              setNameDialog({ mode: "add-new" });
            }}
          />
        )}
      </>
    ) : null;

  const listToolbar =
    viewingList && selected.size ? (
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          if (!activeList) return;
          removeFromList(activeList.id, [...selected]);
          setSelected(new Set());
          toast.success("Removed from list");
        }}
      >
        Remove from list
      </Button>
    ) : null;

  if (!plan.features.leads) {
    return (
      <Page className="max-w-[88rem]">
        <PlanGate title="Search Leads" />
      </Page>
    );
  }

  return (
    <Page className="max-w-[88rem]">
      {mode === "search" && activeList ? (
        <div className="mb-3 flex min-h-12 items-center gap-2">
          <span className="inline-flex min-h-10 max-w-full items-center gap-2 rounded-lg bg-card px-3 text-sm shadow-border">
            <span className="truncate">
              Adding to <span className="font-medium">{activeList.name}</span>
            </span>
            <button
              type="button"
              className="shrink-0 text-muted-foreground hover:text-foreground"
              onClick={() => setActiveListId(null)}
              aria-label="Stop adding to this list"
            >
              <X className="size-3.5" />
            </button>
          </span>
        </div>
      ) : null}

      {viewingList && activeList ? (
        <section className="mt-4">
          <ListBanner
            list={activeList}
            count={resultCount}
            onRename={() => setNameDialog({ mode: "rename", id: activeList.id, name: activeList.name })}
            onDelete={() => askDelete(activeList.id)}
            onAddMore={addMoreToList}
            onLists={() => setListsOpen(true)}
            onBack={() => {
              setMode("search");
              setActiveListId(null);
              setSelected(new Set());
            }}
          />
          {resultCount === 0 ? (
            <EmptyList kind={asLeadKind(activeList.kind)} onAdd={addMoreToList} />
          ) : (
            <>
            <div className="mb-3 flex justify-end">{listToolbar}</div>
            <ResultsPane
              kind={asLeadKind(activeList.kind)}
              people={shownPeople}
              companies={shownCompanies}
              places={shownPlaces}
              selected={selected}
              setSelected={setSelected}
              revealed={revealed}
              onReveal={(p) => askReveal([p])}
              onOpen={setActive}
              expandedPlace={expandedPlace}
              onTogglePlace={(id) => setExpandedPlace((cur) => (cur === id ? null : id))}
            />
            </>
          )}
        </section>
      ) : (
        <>
          <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
            <SheetContent side="left" className="w-[min(22rem,92vw)] overflow-y-auto bg-card text-card-foreground">
              <div className="flex h-full min-h-0 flex-col pt-3">{filterPanel}</div>
            </SheetContent>
          </Sheet>

          {!applied ? (
            <EmptySearch
              kind={kind}
              onKind={changeKind}
              query={query}
              onQuery={setQuery}
              onSubmit={() => {
                if (query.trim()) runAi(query);
              }}
              suggestions={SUGGESTED_BY_KIND[kind]}
              recent={recentQueries}
              onSuggest={(q) => runAi(q)}
              onFilters={() => setFilterOpen(true)}
              onLists={() => setListsOpen(true)}
              listCount={saved.length}
            />
          ) : (
            <>
              <div className={cn("mt-4 grid gap-4 lg:items-stretch", railOpen && "lg:grid-cols-[280px_minmax(0,1fr)]")}>
                {railOpen ? (
                  <aside className="sticky top-20 hidden max-h-[calc(100dvh-10.5rem)] lg:block">
                    <div className="flex h-[calc(100dvh-10.5rem)] flex-col overflow-hidden rounded-xl bg-card shadow-border">
                      {filterPanel}
                    </div>
                  </aside>
                ) : null}
                <section className="flex min-h-0 flex-col">
                  <div className="mb-3 flex flex-nowrap items-center gap-3">
                    <Button type="button" variant="outline" className="hidden lg:inline-flex" onClick={() => setRailOpen((v) => !v)}>
                      <SlidersHorizontal />
                      {railOpen ? "Hide filters" : "Filters"}
                    </Button>
                    <Button type="button" variant="outline" className="lg:hidden" onClick={() => setFilterOpen(true)}>
                      <SlidersHorizontal />
                      Filters
                    </Button>
                    <p className="text-lg font-semibold tracking-tight">
                      {formatNumber(Math.max(pageEnd - pageStart, 0))} of {formatNumber(resultCount)}{" "}
                      {resultUnit(kind, resultCount)}
                    </p>
                    {searchLabel ? (
                      <EditableSearch value={query || searchLabel} onSearch={(q) => runAi(q)} />
                    ) : null}
                    <div className="ml-auto flex shrink-0 items-center gap-3">
                      {kind === "person" ? (
                        <p className="whitespace-nowrap text-sm text-muted-foreground">~20 credits per email</p>
                      ) : null}
                      {searchToolbar}
                      <Button type="button" variant="outline" size="sm" aria-label="Lists" onClick={() => setListsOpen(true)}>
                        <List />
                        <span className="tabular-nums text-muted-foreground">{formatNumber(saved.length)}</span>
                      </Button>
                    </div>
                  </div>
                  {(() => {
                    const current = (query || searchLabel).trim();
                    const earlier = recentQueries.filter((item) => item.trim() && item.trim() !== current).slice(0, 6);
                    if (!earlier.length) return null;
                    return (
                      <div className="mb-3 flex items-center gap-2 overflow-x-auto">
                        <span className="shrink-0 text-xs text-muted-foreground">Earlier</span>
                        {earlier.map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => runAi(item)}
                            className="max-w-64 shrink-0 truncate rounded-full bg-card px-3 py-1.5 text-left text-xs shadow-border hover:bg-muted"
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                  <div className="min-h-0 flex-1">
                    <ResultsPane
                      kind={kind}
                      people={pagePeople}
                      companies={pageCompanies}
                      places={pagePlaces}
                      rowOffset={pageStart}
                      selected={selected}
                      setSelected={setSelected}
                      revealed={revealed}
                      onReveal={(p) => askReveal([p])}
                      onOpen={setActive}
                      expandedPlace={expandedPlace}
                      onTogglePlace={(id) => setExpandedPlace((cur) => (cur === id ? null : id))}
                    />
                    {resultCount > 0 ? (
                      <div className="mt-3 flex items-center justify-end gap-3">
                        {kind === "person" && selected.size > 0 ? (
                          <Button
                            type="button"
                            onClick={() => askReveal(people.filter((p) => selected.has(p.id)))}
                          >
                            Get Selected Emails
                          </Button>
                        ) : null}
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon-sm"
                            aria-label="Previous page"
                            disabled={safePage === 0}
                            onClick={() => setPage(safePage - 1)}
                          >
                            <ChevronLeft />
                          </Button>
                          <p className="min-w-[5.5rem] px-1 text-center text-sm tabular-nums text-muted-foreground">
                            {formatNumber(pageStart + 1)}–{formatNumber(pageEnd)} of {formatNumber(resultCount)}
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon-sm"
                            aria-label="Next page"
                            disabled={safePage >= pageCount - 1}
                            onClick={() => setPage(safePage + 1)}
                          >
                            <ChevronRight />
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </section>
              </div>
            </>
          )}
        </>
      )}

      <Sheet open={!!active} onOpenChange={(v) => !v && setActive(null)}>
        <SheetContent side="right" className="overflow-y-auto p-6">
          {active?.type === "person" ? (
            <PersonPanel
              person={active.person}
              company={COMPANY_BY_ID[active.person.companyId]!}
              email={revealed[active.person.id]}
              onReveal={() => askReveal([active.person])}
            />
          ) : null}
          {active?.type === "company" ? (
            <CompanyPanel
              company={active.company}
              revealed={revealed}
              onReveal={(p) => askReveal([p])}
              onOpenPerson={(p) => setActive({ type: "person", person: p })}
            />
          ) : null}
          {active?.type === "place" ? (
            <PlacePanel
              place={active.place}
              revealed={revealed}
              onReveal={(p) => askReveal([p])}
              onOpenPerson={(p) => setActive({ type: "person", person: p })}
              onOpenCompany={(c) => setActive({ type: "company", company: c })}
            />
          ) : null}
        </SheetContent>
      </Sheet>

      <ListsManager
        open={listsOpen}
        onClose={() => setListsOpen(false)}
        items={saved}
        activeId={activeListId}
        onOpen={openList}
        onRename={(item) => {
          setListsOpen(false);
          setNameDialog({ mode: "rename", id: item.id, name: item.name });
        }}
        onDelete={(id) => askDelete(id)}
        onNew={() => {
          setListsOpen(false);
          setNameDialog({ mode: "create" });
        }}
        onRun={(item) => {
          const nextKind = asLeadKind(item.kind);
          const nextFilters = item.filters ?? parseLeadQuery(item.query);
          setActiveListId(item.id);
          setListsOpen(false);
          applySearch(nextKind, nextFilters, item.query, false);
        }}
      />

      <NameListDialog
        state={nameDialog}
        onClose={() => {
          setNameDialog(null);
          setPendingIds(null);
        }}
        defaultName={
          nameDialog?.mode === "create"
            ? ""
            : query.trim()
              ? query.trim().slice(0, 48)
              : `${kindMeta.label} list`
        }
        onSubmit={persistNamedList}
        onRename={(id, name) => {
          renameSearch(id, name);
          toast.success("List name updated");
        }}
        note={
          nameDialog?.mode === "add-new" && kind === "person" && pendingIds?.length
            ? `${formatNumber(pendingIds.length)} ${resultUnit(kind, pendingIds.length)} · ${formatNumber(pendingIds.length * ENRICH_CREDITS)} credits at 20 each. You have ${formatNumber(credits)}.`
            : undefined
        }
      />

      <ActionConfirm
        state={confirm}
        credits={credits}
        onClose={() => setConfirm(null)}
        onConfirm={runConfirm}
      />
    </Page>
  );
}

function ListsManager({
  open,
  onClose,
  items,
  activeId,
  onOpen,
  onRename,
  onDelete,
  onNew,
  onRun,
}: {
  open: boolean;
  onClose: () => void;
  items: SavedSearch[];
  activeId: string | null;
  onOpen: (item: SavedSearch) => void;
  onRename: (item: SavedSearch) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  onRun: (item: SavedSearch) => void;
}) {
  const [find, setFind] = useState("");
  const q = find.trim().toLowerCase();
  const shown = [...items]
    .sort((a, b) => (b.updatedAt ?? b.createdAt) - (a.updatedAt ?? a.createdAt))
    .filter((item) => !q || item.name.toLowerCase().includes(q));

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="bg-card text-card-foreground">
        <div className="flex h-full flex-col px-5 pb-5 pt-14">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold tracking-tight">Lists</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {formatNumber(items.length)} {items.length === 1 ? "list" : "lists"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Any list inactive for 30 days will be deleted.</p>
            </div>
            <Button type="button" onClick={onNew}>
              <Plus />
              New list
            </Button>
          </div>
          {items.length > 0 ? (
            <Input
              value={find}
              onChange={(e) => setFind(e.target.value)}
              placeholder="Find a list"
              aria-label="Find a list"
              className="mt-4"
            />
          ) : null}
          {items.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">No lists yet</p>
          ) : shown.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">No lists match</p>
          ) : (
            <ul className="mt-3 min-h-0 flex-1 divide-y divide-border overflow-y-auto">
              {shown.map((item) => {
                const kind = asLeadKind(item.kind);
                const n = listMemberIds(item).length;
                const unit = resultUnit(kind, n);
                const on = item.id === activeId;
                return (
                  <li key={item.id} className={cn("flex items-center gap-1", on && "bg-primary/5")}>
                    <button type="button" onClick={() => onOpen(item)} className="min-h-14 min-w-0 flex-1 px-1 py-2 text-left">
                      <span className="block truncate text-sm font-medium">{item.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {formatNumber(n)} {unit} · {LEAD_KIND_META[kind].label} · Created {formatDate(item.createdAt)}
                      </span>
                    </button>
                    <Button type="button" variant="outline" size="sm" onClick={() => downloadList(item)}>
                      <Download />
                      Download
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type="button" variant="ghost" size="icon" aria-label={`More for ${item.name}`}>
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => onRename(item)}>Rename</DropdownMenuItem>
                        {item.query ? (
                          <DropdownMenuItem onSelect={() => onRun(item)}>Run this search</DropdownMenuItem>
                        ) : null}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => onDelete(item.id)}>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ListBanner({
  list,
  count,
  onRename,
  onDelete,
  onAddMore,
  onLists,
  onBack,
}: {
  list: SavedSearch;
  count: number;
  onRename: () => void;
  onDelete: () => void;
  onAddMore: () => void;
  onLists: () => void;
  onBack: () => void;
}) {
  const kind = asLeadKind(list.kind);
  const unit = resultUnit(kind, count);
  return (
    <div className="mb-4 flex flex-col gap-3 rounded-xl bg-card p-4 shadow-border sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <button type="button" onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground">
          Back to search
        </button>
        <h2 className="mt-1 truncate text-base font-semibold tracking-tight">{list.name}</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {formatNumber(count)} {unit} · Created {formatDate(list.createdAt)}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={onAddMore}>
          Add more
        </Button>
        <Button type="button" variant="outline" onClick={() => downloadList(list)}>
          <Download />
          Download
        </Button>
        <Button type="button" variant="outline" onClick={onLists}>
          <Folder />
          All lists
        </Button>
        <Button type="button" variant="outline" onClick={onRename}>
          Rename
        </Button>
        <Button type="button" variant="outline" onClick={onDelete}>
          Delete
        </Button>
      </div>
    </div>
  );
}

function EmptyList({ kind, onAdd }: { kind: LeadKind; onAdd: () => void }) {
  const label = kind === "company" ? "Add companies" : kind === "local" ? "Add places" : "Add people";
  return (
    <div className="flex min-h-80 flex-col items-center justify-center rounded-xl bg-card px-6 py-12 text-center shadow-border">
      <span className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Folder className="size-7" />
      </span>
      <h2 className="mt-5 text-xl font-semibold tracking-tight">Nothing in this list yet</h2>
      <Button type="button" className="mt-6" onClick={onAdd}>
        {label}
      </Button>
    </div>
  );
}

function AddToListMenu({
  lists,
  onPick,
  onNew,
}: {
  lists: SavedSearch[];
  onPick: (id: string) => void;
  onNew: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button">
          Enrich emails to a list
          <ChevronDown />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuItem onSelect={onNew}>
          <Plus className="size-4" />
          New list
        </DropdownMenuItem>
        {lists.length ? <DropdownMenuSeparator /> : null}
        {lists.map((item) => (
          <DropdownMenuItem key={item.id} onSelect={() => onPick(item.id)}>
            <span className="truncate">{item.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NameListDialog({
  state,
  onClose,
  defaultName,
  onSubmit,
  onRename,
  note,
}: {
  state: NameDialog;
  onClose: () => void;
  defaultName: string;
  onSubmit: (name: string) => boolean | void;
  onRename: (id: string, name: string) => void;
  note?: string;
}) {
  const open = !!state;
  const [name, setName] = useState("");

  useEffect(() => {
    if (!state) return;
    setName(state.mode === "rename" ? state.name : defaultName);
  }, [state, defaultName]);

  function submit(e: FormEvent) {
    e.preventDefault();
    const next = name.trim();
    if (!next || !state) return;
    if (state.mode === "rename") onRename(state.id, next);
    else if (onSubmit(next) === false) return;
    onClose();
  }

  const title =
    state?.mode === "rename" ? "Rename list" : state?.mode === "create" ? "New list" : "Name this list";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <Label htmlFor="list-name">List name</Label>
            <Input
              id="list-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              placeholder="Q4 outbound"
              className="mt-1.5"
            />
            {note ? <p className="mt-3 text-sm text-muted-foreground">{note}</p> : null}
          </div>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              {note ? "Enrich emails" : state?.mode === "create" ? "Create" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ActionConfirm({
  state,
  credits,
  onClose,
  onConfirm,
}: {
  state: ConfirmAction | null;
  credits: number;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const cost =
    state?.kind === "enrich"
      ? state.ids.length * ENRICH_CREDITS
      : state?.kind === "reveal"
        ? state.people.length * REVEAL_CREDITS
        : 0;
  const short = cost > credits;
  const title =
    state?.kind === "delete" ? "Delete this list?" : state?.kind === "enrich" ? "Enrich these emails?" : "Get these emails?";
  const confirmLabel = state?.kind === "delete" ? "Delete list" : state?.kind === "enrich" ? "Enrich emails" : "Get emails";

  return (
    <Dialog open={!!state} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {state?.kind === "delete" ? (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{state.name}</span> and its {formatNumber(state.count)}{" "}
            {state.count === 1 ? "record" : "records"} will be deleted. This cannot be undone.
          </p>
        ) : null}
        {state?.kind === "enrich" ? (
          <div className="text-sm text-muted-foreground">
            <p>
              {formatNumber(state.ids.length)} {state.ids.length === 1 ? "person" : "people"} will be added to{" "}
              <span className="font-medium text-foreground">{state.listName}</span>.
            </p>
            <p className="mt-2">
              {formatNumber(cost)} credits at {ENRICH_CREDITS} each. You have {formatNumber(credits)}.
            </p>
          </div>
        ) : null}
        {state?.kind === "reveal" ? (
          <p className="text-sm text-muted-foreground">
            {formatNumber(state.people.length)} {state.people.length === 1 ? "email" : "emails"} · {formatNumber(cost)}{" "}
            credits at {REVEAL_CREDITS} each. You have {formatNumber(credits)}.
          </p>
        ) : null}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant={state?.kind === "delete" ? "destructive" : "default"} disabled={short} onClick={onConfirm}>
            {short ? "Not enough credits" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function companyFilters(d: LeadFilters): LeadFilters {
  const f = d.facets;
  const keywordPins = pickPins(d.keywordPins, [
    "company",
    "domain",
    "location",
    "industry",
    "skills",
    "headcount",
    "revenue",
    "funding",
    "companyType",
    "businessType",
    "revenueStream",
  ]);
  const include: string[] = [];
  const exclude: string[] = [];
  for (const pin of Object.values(keywordPins ?? {})) {
    include.push(...(pin.include ?? []));
    exclude.push(...(pin.exclude ?? []));
  }
  return {
    companyQuery: d.companyQuery,
    sizeMin: d.sizeMin,
    sizeMax: d.sizeMax,
    funding: d.funding,
    industry: d.industry,
    location: d.location,
    tech: d.tech,
    keywords: d.keywords,
    revenue: d.revenue,
    keywordPins,
    facets: f
      ? {
          location: f.location,
          industry: f.industry,
          skills: f.skills,
          company: f.company,
          domain: f.domain,
          headcount: f.headcount,
          revenue: f.revenue,
          funding: f.funding,
          companyType: f.companyType,
          businessType: f.businessType,
          revenueStream: f.revenueStream,
          keywords: { include, exclude },
        }
      : undefined,
  };
}

function pickPins(pins: LeadFilters["keywordPins"], keys: string[]) {
  if (!pins) return undefined;
  const next: NonNullable<LeadFilters["keywordPins"]> = {};
  for (const key of keys) {
    if (pins[key]) next[key] = pins[key];
  }
  return next;
}

function aiPlaceholder(kind: LeadKind) {
  if (kind === "company") return "Describe what you're looking for — e.g. Series B SaaS companies in New York";
  if (kind === "local") return "Describe what you're looking for — e.g. fintech companies in London";
  return "Describe who you're looking for — e.g. Heads of Sales at SaaS companies in California";
}

function EditableSearch({ value, onSearch }: { value: string; onSearch: (q: string) => void }) {
  const [text, setText] = useState(value);
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => setText(value), [value]);
  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);
  function search() {
    const next = text.trim();
    setEditing(false);
    if (next && next !== value.trim()) onSearch(next);
    else setText(value);
  }
  return (
    <form
      className="flex min-w-0 max-w-md flex-1 items-center gap-1.5 rounded-full bg-primary/10 px-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (editing) search();
      }}
    >
      <Sparkles className="size-3.5 shrink-0 text-primary" />
      {editing ? (
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setText(value);
              setEditing(false);
            }
          }}
          aria-label="Edit search"
          className="h-8 min-w-0 flex-1 bg-transparent text-sm text-primary outline-none"
        />
      ) : (
        <span className="truncate py-1.5 text-sm text-primary">{value}</span>
      )}
      <button
        type="button"
        aria-label={editing ? "Search again" : "Edit search"}
        className="inline-flex size-6 shrink-0 items-center justify-center rounded-full text-primary hover:bg-primary/10"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => (editing ? search() : setEditing(true))}
      >
        {editing ? <Search className="size-3.5" /> : <Pencil className="size-3.5" />}
      </button>
    </form>
  );
}

function AiSearchBar({
  query,
  kind,
  onQuery,
  onSubmit,
  onFilters,
  onLists,
  listCount = 0,
  hero = false,
}: {
  query: string;
  kind: LeadKind;
  onQuery: (v: string) => void;
  onSubmit: () => void;
  onFilters?: () => void;
  onLists?: () => void;
  listCount?: number;
  hero?: boolean;
}) {
  return (
    <div className={hero ? "w-full" : undefined}>
      <form
        className={cn(
          hero
            ? "relative w-full rounded-2xl bg-card shadow-border"
            : "flex flex-col gap-2 rounded-xl bg-card p-2 shadow-border sm:flex-row sm:items-center",
        )}
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        {hero ? (
          <>
            <textarea
              id="lead-search"
              value={query}
              rows={3}
              onChange={(e) => onQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSubmit();
                }
              }}
              placeholder={aiPlaceholder(kind)}
              aria-label="Describe what you're looking for"
              className="min-h-28 w-full resize-none rounded-2xl bg-transparent px-4 py-4 pr-16 text-base outline-none placeholder:text-muted-foreground"
            />
            <Button
              type="submit"
              size="icon-sm"
              disabled={!query.trim()}
              aria-label="Search"
              className="absolute bottom-3 right-3"
            >
              <ArrowUp />
            </Button>
          </>
        ) : (
          <>
            <div className="flex min-w-0 flex-1 items-center gap-3 px-3">
              <Sparkles className="size-4 shrink-0 text-primary" />
              <input
                value={query}
                onChange={(e) => onQuery(e.target.value)}
                placeholder={aiPlaceholder(kind)}
                aria-label="AI Search"
                className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex gap-2">
              {onFilters ? (
                <Button type="button" variant="outline" className="lg:hidden" onClick={onFilters}>
                  Filters
                </Button>
              ) : null}
              {onLists ? (
                <Button type="button" variant="outline" onClick={onLists}>
                  <Folder />
                  Lists
                  <span className="tabular-nums text-muted-foreground">{formatNumber(listCount)}</span>
                </Button>
              ) : null}
              <Button type="submit" className="sm:min-w-32">
                AI Search
              </Button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}

function PromptRow({
  suggestions,
  recent,
  onSuggest,
}: {
  suggestions: string[];
  recent: string[];
  onSuggest: (q: string) => void;
}) {
  const hasRecent = recent.length > 0;
  const items = (hasRecent ? recent : suggestions).slice(0, 3);
  return (
    <div className="mt-4">
      <p className="text-sm text-muted-foreground">{hasRecent ? "Recent" : "Suggested"}</p>
      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {items.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSuggest(s)}
            className="flex min-h-16 items-start gap-2 rounded-lg bg-card px-3 py-3 text-left text-sm leading-5 shadow-border hover:bg-muted/40"
          >
            {hasRecent ? null : <Sparkles className="mt-0.5 size-4 shrink-0 text-muted-foreground" />}
            <span>{s}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function EmptySearch({
  kind,
  onKind,
  query,
  onQuery,
  onSubmit,
  suggestions,
  recent,
  onSuggest,
  onFilters,
  onLists,
  listCount,
}: {
  kind: LeadKind;
  onKind: (k: LeadKind) => void;
  query: string;
  onQuery: (v: string) => void;
  onSubmit: () => void;
  suggestions: string[];
  recent: string[];
  onSuggest: (q: string) => void;
  onFilters: () => void;
  onLists: () => void;
  listCount: number;
}) {
  return (
    <div className="flex min-h-[calc(100dvh-16rem)] flex-col items-center justify-center px-2 py-10">
      <div className="flex w-full max-w-2xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Find Prospects with AI</h2>
        <div className="w-full rounded-xl bg-card p-1 shadow-border sm:w-[280px] sm:shrink-0">
          <KindTabs value={kind} onChange={onKind} />
        </div>
      </div>
      <div className="mt-8 w-full max-w-2xl">
        <AiSearchBar query={query} kind={kind} onQuery={onQuery} onSubmit={onSubmit} hero />
        <PromptRow suggestions={suggestions} recent={recent} onSuggest={onSuggest} />
      </div>
      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={onLists}
          className="inline-flex h-12 items-center gap-2 rounded-xl bg-card px-4 text-sm font-medium shadow-border"
        >
          <List className="size-4" />
          Lists
          <span className="flex size-6 items-center justify-center rounded-full bg-muted text-xs tabular-nums text-muted-foreground">
            {formatNumber(listCount)}
          </span>
        </button>
        <button
          type="button"
          onClick={onFilters}
          className="inline-flex h-12 items-center gap-2 rounded-xl bg-card px-4 text-sm font-medium shadow-border"
        >
          <SlidersHorizontal className="size-4" />
          Filters
        </button>
      </div>
    </div>
  );
}

function ResultsPane({
  kind,
  people,
  companies,
  places,
  rowOffset = 0,
  selected,
  setSelected,
  revealed,
  onReveal,
  onOpen,
  expandedPlace,
  onTogglePlace,
}: {
  kind: LeadKind;
  people: Person[];
  companies: Company[];
  places: LocalPlace[];
  rowOffset?: number;
  selected: Set<string>;
  setSelected: (s: Set<string>) => void;
  revealed: Record<string, string>;
  onReveal: (p: Person) => void;
  onOpen: (a: Active) => void;
  expandedPlace: string | null;
  onTogglePlace: (id: string) => void;
}) {
  return (
    <>
      {kind === "person" ? (
        <PeopleTable
          people={people}
          selected={selected}
          setSelected={setSelected}
          revealed={revealed}
          onReveal={onReveal}
          onOpen={(p) => onOpen({ type: "person", person: p })}
          rowOffset={rowOffset}
        />
      ) : kind === "company" ? (
        <CompanyTable companies={companies} onOpen={(c) => onOpen({ type: "company", company: c })} />
      ) : (
        <PlaceTable
          places={places}
          expanded={expandedPlace}
          onToggle={onTogglePlace}
          onOpenPlace={(place) => onOpen({ type: "place", place })}
          onOpenPerson={(p) => onOpen({ type: "person", person: p })}
          revealed={revealed}
          onReveal={onReveal}
        />
      )}
    </>
  );
}

function PeopleTable({
  people,
  selected,
  setSelected,
  revealed,
  onReveal,
  onOpen,
  rowOffset = 0,
}: {
  people: Person[];
  selected: Set<string>;
  setSelected: (s: Set<string>) => void;
  revealed: Record<string, string>;
  onReveal: (p: Person) => void;
  onOpen: (p: Person) => void;
  rowOffset?: number;
}) {
  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-border">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="w-10 px-3 py-3">
                <Checkbox
                  checked={people.length > 0 && selected.size === people.length}
                  onCheckedChange={(v) => {
                    setSelected(v ? new Set(people.map((p) => p.id)) : new Set());
                  }}
                />
              </th>
              <th className="w-10 px-2 py-3 font-medium">#</th>
              <th className="px-2 py-3 font-medium">Name</th>
              <th className="px-2 py-3 font-medium">Experiences</th>
              <th className="px-2 py-3 font-medium">Location</th>
              <th className="px-2 py-3 font-medium">LinkedIn URL</th>
              <th className="px-3 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {people.map((p, index) => {
              const c = COMPANY_BY_ID[p.companyId]!;
              const email = revealed[p.id];
              const linkedin = `https://www.linkedin.com/in/${`${p.firstName}-${p.lastName}`.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
              return (
                <tr
                  key={p.id}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/40"
                  onClick={() => onOpen(p)}
                >
                  <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selected.has(p.id)}
                      onCheckedChange={(v) => {
                        const next = new Set(selected);
                        if (v) next.add(p.id);
                        else next.delete(p.id);
                        setSelected(next);
                      }}
                    />
                  </td>
                  <td className="px-2 py-3 tabular-nums text-muted-foreground">{rowOffset + index + 1}</td>
                  <td className="px-2 py-3 font-medium whitespace-nowrap">
                    {p.firstName} {p.lastName}
                  </td>
                  <td className="px-2 py-3 text-muted-foreground">
                    {p.title} · {c.name}
                  </td>
                  <td className="px-2 py-3 text-muted-foreground">{p.location || p.city}</td>
                  <td className="px-2 py-3" onClick={(e) => e.stopPropagation()}>
                    <a
                      href={linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex max-w-[220px] items-center gap-1 truncate text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="size-3.5 shrink-0" />
                      <span className="truncate">{linkedin.replace("https://", "")}</span>
                    </a>
                  </td>
                  <td className="px-3 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    {email ? (
                      <span className="font-mono text-xs">{email}</span>
                    ) : (
                      <Button variant="outline" onClick={() => onReveal(p)}>
                        <Mail />
                        Reveal email
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {people.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">No people match</p>
      ) : null}
    </div>
  );
}

function CompanyTable({
  companies,
  onOpen,
}: {
  companies: Company[];
  onOpen: (c: Company) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-border">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Company</th>
              <th className="px-2 py-3 font-medium">Industry</th>
              <th className="px-2 py-3 font-medium">Size</th>
              <th className="px-2 py-3 font-medium">Funding</th>
              <th className="px-2 py-3 font-medium">Location</th>
              <th className="px-4 py-3 font-medium">People</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((c) => {
              const headcount = peopleAtCompany(c.id).length;
              return (
                <tr
                  key={c.id}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/40"
                  onClick={() => onOpen(c)}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">{c.name}</div>
                    <div className="font-mono text-[11px] text-muted-foreground">{c.domain}</div>
                  </td>
                  <td className="px-2 py-3 text-muted-foreground">{c.industry}</td>
                  <td className="px-2 py-3 tabular-nums text-muted-foreground">{c.sizeLabel}</td>
                  <td className="px-2 py-3 text-muted-foreground">{c.funding}</td>
                  <td className="px-2 py-3 text-muted-foreground">{c.city}</td>
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">{headcount}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {companies.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">No companies match</p>
      ) : null}
    </div>
  );
}

function PlaceTable({
  places,
  expanded,
  onToggle,
  onOpenPlace,
  onOpenPerson,
  revealed,
  onReveal,
}: {
  places: LocalPlace[];
  expanded: string | null;
  onToggle: (id: string) => void;
  onOpenPlace: (place: LocalPlace) => void;
  onOpenPerson: (p: Person) => void;
  revealed: Record<string, string>;
  onReveal: (p: Person) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-border">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Place</th>
              <th className="px-2 py-3 font-medium">People</th>
              <th className="px-2 py-3 font-medium">Companies</th>
              <th className="px-4 py-3 font-medium">Industries</th>
            </tr>
          </thead>
          <tbody>
            {places.map((place) => {
              const industries = [...new Set(place.companies.map((c) => c.industry))].slice(0, 3);
              const open = expanded === place.id;
              return (
                <FragmentRow key={place.id}>
                  <tr className="cursor-pointer border-b border-border hover:bg-muted/40" onClick={() => onToggle(place.id)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ChevronDown
                          className={cn("size-3.5 text-muted-foreground transition-transform", open && "rotate-180")}
                        />
                        <div>
                          <div className="font-medium">{place.city}</div>
                          <div className="text-[11px] text-muted-foreground">{place.country}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3 tabular-nums text-muted-foreground">{place.people.length}</td>
                    <td className="px-2 py-3 tabular-nums text-muted-foreground">{place.companies.length}</td>
                    <td className="px-4 py-3 text-muted-foreground">{industries.join(" · ")}</td>
                  </tr>
                  {open
                    ? place.people.slice(0, 6).map((p) => {
                        const c = COMPANY_BY_ID[p.companyId];
                        const email = revealed[p.id];
                        return (
                          <tr
                            key={p.id}
                            className="cursor-pointer border-b border-border bg-muted/20 hover:bg-muted/40"
                            onClick={() => onOpenPerson(p)}
                          >
                            <td className="px-4 py-2.5 pl-12" colSpan={2}>
                              <span className="font-medium">
                                {p.firstName} {p.lastName}
                              </span>
                              <span className="ml-2 text-muted-foreground">{p.title}</span>
                            </td>
                            <td className="px-2 py-2.5 text-muted-foreground">{c?.name}</td>
                            <td className="px-4 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                              {email ? (
                                <span className="font-mono text-xs">{email}</span>
                              ) : (
                                <Button variant="outline" size="sm" onClick={() => onReveal(p)}>
                                  <Mail />
                                  Reveal
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    : null}
                  {open ? (
                    <tr className="border-b border-border">
                      <td colSpan={4} className="px-4 py-2">
                        <button
                          type="button"
                          className="text-sm font-medium text-primary hover:underline"
                          onClick={() => onOpenPlace(place)}
                        >
                          Open {place.city}
                        </button>
                      </td>
                    </tr>
                  ) : null}
                </FragmentRow>
              );
            })}
          </tbody>
        </table>
      </div>
      {places.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">No places match</p>
      ) : null}
    </div>
  );
}

function FragmentRow({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

function PersonPanel({
  person,
  company,
  email,
  onReveal,
}: {
  person: Person;
  company: Company;
  email?: string;
  onReveal: () => void;
}) {
  const guessed = emailFromPerson(person.firstName, person.lastName, company.domain);
  return (
    <div className="pt-6">
      <div className="flex size-14 items-center justify-center rounded-full bg-muted text-lg font-semibold">
        {initials(`${person.firstName} ${person.lastName}`)}
      </div>
      <h2 className="mt-4 text-xl font-semibold tracking-tight">
        {person.firstName} {person.lastName}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {person.title} · {company.name}
      </p>
      <dl className="mt-6 space-y-2 text-sm">
        <Row k="Company" v={company.name} />
        <Row k="Domain" v={company.domain} mono />
        <Row k="Industry" v={company.industry} />
        <Row k="Size" v={company.sizeLabel} />
        <Row k="Funding" v={company.funding} />
        <Row k="Location" v={person.location} />
        <Row k="Seniority" v={SENIORITY_LABEL[person.seniority]} />
        <Row k="Department" v={DEPT_LABEL[person.department]} />
      </dl>
      <div className="mt-6 rounded-lg bg-muted p-4">
        {email ? (
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-sm">{email}</span>
            <CopyButton value={email} size="icon-sm" />
          </div>
        ) : (
          <div>
            <div className="font-mono text-sm text-muted-foreground">{guessed.replace(/^(.).+@/, "$1•••@")}</div>
            <Button className="mt-3 w-full" size="lg" onClick={onReveal}>
              Reveal email — 5 credits
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function CompanyPanel({
  company,
  revealed,
  onReveal,
  onOpenPerson,
}: {
  company: Company;
  revealed: Record<string, string>;
  onReveal: (p: Person) => void;
  onOpenPerson: (p: Person) => void;
}) {
  const roster = peopleAtCompany(company.id);
  return (
    <div className="pt-6">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-lg font-semibold">
        {initials(company.name)}
      </div>
      <h2 className="mt-4 text-xl font-semibold tracking-tight">{company.name}</h2>
      <p className="mt-1 font-mono text-sm text-muted-foreground">{company.domain}</p>
      <dl className="mt-6 space-y-2 text-sm">
        <Row k="Industry" v={company.industry} />
        <Row k="Size" v={company.sizeLabel} />
        <Row k="Funding" v={company.funding} />
        <Row k="Revenue" v={company.revenue} />
        <Row k="Location" v={company.location} />
        <Row k="Tech" v={company.tech.join(", ")} />
      </dl>
      <h3 className="mt-8 text-sm font-semibold">People</h3>
      <ul className="mt-2 divide-y divide-border">
        {roster.map((p) => {
          const email = revealed[p.id];
          return (
            <li key={p.id} className="flex items-center gap-2 py-3">
              <button type="button" className="min-w-0 flex-1 text-left" onClick={() => onOpenPerson(p)}>
                <div className="truncate text-sm font-medium">
                  {p.firstName} {p.lastName}
                </div>
                <div className="truncate text-xs text-muted-foreground">{p.title}</div>
              </button>
              {email ? (
                <span className="font-mono text-xs">{email}</span>
              ) : (
                <Button variant="outline" size="sm" onClick={() => onReveal(p)}>
                  <Mail />
                  Reveal
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function PlacePanel({
  place,
  revealed,
  onReveal,
  onOpenPerson,
  onOpenCompany,
}: {
  place: LocalPlace;
  revealed: Record<string, string>;
  onReveal: (p: Person) => void;
  onOpenPerson: (p: Person) => void;
  onOpenCompany: (c: Company) => void;
}) {
  return (
    <div className="pt-6">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
        <MapPin className="size-6" />
      </div>
      <h2 className="mt-4 text-xl font-semibold tracking-tight">{place.city}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{place.location}</p>
      <dl className="mt-6 space-y-2 text-sm">
        <Row k="People" v={String(place.people.length)} />
        <Row k="Companies" v={String(place.companies.length)} />
      </dl>
      <h3 className="mt-8 text-sm font-semibold">Companies</h3>
      <ul className="mt-2 divide-y divide-border">
        {place.companies.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              className="flex min-h-12 w-full items-center justify-between py-3 text-left"
              onClick={() => onOpenCompany(c)}
            >
              <span className="text-sm font-medium">{c.name}</span>
              <span className="text-xs text-muted-foreground">{c.industry}</span>
            </button>
          </li>
        ))}
      </ul>
      <h3 className="mt-8 text-sm font-semibold">People</h3>
      <ul className="mt-2 divide-y divide-border">
        {place.people.map((p) => {
          const email = revealed[p.id];
          const c = COMPANY_BY_ID[p.companyId];
          return (
            <li key={p.id} className="flex items-center gap-2 py-3">
              <button type="button" className="min-w-0 flex-1 text-left" onClick={() => onOpenPerson(p)}>
                <div className="truncate text-sm font-medium">
                  {p.firstName} {p.lastName}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {p.title}
                  {c ? ` · ${c.name}` : ""}
                </div>
              </button>
              {email ? (
                <span className="font-mono text-xs">{email}</span>
              ) : (
                <Button variant="outline" size="sm" onClick={() => onReveal(p)}>
                  <Mail />
                  Reveal
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className={mono ? "font-mono text-xs" : ""}>{v}</dd>
    </div>
  );
}

function FilterRail({
  kind,
  onKind,
  filters,
  onChange,
  onSearch,
  onReset,
  canReset,
}: {
  kind: LeadKind;
  onKind: (k: LeadKind) => void;
  filters: LeadFilters;
  onChange: (f: LeadFilters) => void;
  onSearch: () => void;
  onReset: () => void;
  canReset: boolean;
}) {
  const patch = (p: Partial<LeadFilters>) => onChange({ ...filters, ...p });
  const toggle = <T,>(key: keyof LeadFilters, value: T, list: T[] | undefined) => {
    const cur = list ?? [];
    const next = cur.includes(value) ? cur.filter((x) => x !== value) : [...cur, value];
    patch({ [key]: next } as Partial<LeadFilters>);
  };
  const meta = LEAD_KIND_META[kind];
  const titleOptions = [...new Set([...JOB_TITLES, ...PEOPLE.map((p) => p.title)])].sort((a, b) => a.localeCompare(b));
  const companyOptions = COMPANIES.map((c) => c.name).sort((a, b) => a.localeCompare(b));
  const domainOptions = COMPANIES.map((c) => c.domain).sort((a, b) => a.localeCompare(b));
  function readFacet(key: keyof LeadFilterFacets, legacy: string[]): IncludeExcludeValue {
    const f = filters.facets?.[key];
    if ((f?.include?.length ?? 0) + (f?.exclude?.length ?? 0) > 0) {
      return { include: f?.include ?? [], exclude: f?.exclude ?? [] };
    }
    return { include: legacy, exclude: [] };
  }
  function writeFacet(key: keyof LeadFilterFacets, next: IncludeExcludeValue, clear: Partial<LeadFilters> = {}) {
    onChange({ ...filters, ...clear, facets: { ...filters.facets, [key]: next } });
  }
  function pinValue(field: string): IncludeExcludeValue {
    const pin = filters.keywordPins?.[field];
    return { include: pin?.include ?? [], exclude: pin?.exclude ?? [] };
  }
  function keywordFacet(pins: LeadFilters["keywordPins"]) {
    const include: string[] = [];
    const exclude: string[] = [];
    for (const pin of Object.values(pins ?? {})) {
      include.push(...(pin.include ?? []));
      exclude.push(...(pin.exclude ?? []));
    }
    return { include, exclude };
  }
  function addKeyword(field: string, item: string, mode: "include" | "exclude") {
    const cur = pinValue(field);
    const include = cur.include.filter((v) => v !== item);
    const exclude = cur.exclude.filter((v) => v !== item);
    if (mode === "include") include.push(item);
    else exclude.push(item);
    const keywordPins = { ...filters.keywordPins, [field]: { include, exclude } };
    onChange({
      ...filters,
      keywords: undefined,
      keywordPins,
      facets: { ...filters.facets, keywords: keywordFacet(keywordPins) },
    });
  }
  function removeKeyword(field: string, item: string) {
    const cur = pinValue(field);
    const keywordPins = {
      ...filters.keywordPins,
      [field]: { include: cur.include.filter((v) => v !== item), exclude: cur.exclude.filter((v) => v !== item) },
    };
    onChange({
      ...filters,
      keywords: undefined,
      keywordPins,
      facets: { ...filters.facets, keywords: keywordFacet(keywordPins) },
    });
  }
  function clearField(field: keyof LeadFilterFacets, clear: Partial<LeadFilters> = {}) {
    const keywordPins = { ...filters.keywordPins, [field]: { include: [], exclude: [] } };
    onChange({
      ...filters,
      ...clear,
      keywords: undefined,
      keywordPins,
      facets: { ...filters.facets, [field]: { include: [], exclude: [] }, keywords: keywordFacet(keywordPins) },
    });
  }
  function Facet({
    field,
    label,
    options,
    legacy = [],
    clear,
  }: {
    field: keyof LeadFilterFacets;
    label: string;
    options: readonly string[];
    legacy?: string[];
    clear?: Partial<LeadFilters>;
  }) {
    return (
      <Field label={label}>
        <IncludeExcludeField
          options={[...options]}
          value={readFacet(field, legacy)}
          keywords={pinValue(field)}
          onChange={(next) => writeFacet(field, next, clear)}
          onKeyword={(item, mode) => addKeyword(field, item, mode)}
          onRemoveKeyword={(item) => removeKeyword(field, item)}
          onClear={() => clearField(field, clear)}
        />
      </Field>
    );
  }
  const headcountLegacy = HEADCOUNT_RANGES.filter((b) => {
    if (filters.sizeMin == null && filters.sizeMax == null) return false;
    const fmin = filters.sizeMin ?? b.min;
    const fmax = filters.sizeMax ?? b.max;
    const overlap = Math.min(fmax, b.max) - Math.max(fmin, b.min);
    const span = Math.max(fmax - fmin, 1);
    return overlap > 0 && overlap / span >= 0.5;
  }).map((b) => b.label);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <h2 className="flex h-12 items-center px-3 pr-12 text-base font-semibold tracking-tight">
        {kind === "company" ? "Find Companies" : kind === "local" ? "Find Local Businesses" : "Find People"}
      </h2>
      <KindTabs value={kind} onChange={onKind} />
      <div className="px-3 pt-2">
        <Button type="button" variant="outline" className="w-full" onClick={onReset} disabled={!canReset}>
          <RotateCcw />
          Reset all
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3">
        {kind === "person" ? (
          <div>
            <FilterGroup title="Popular" defaultOpen>
              <Facet
                field="title"
                label="Job title"
                options={titleOptions}
                legacy={[...(filters.titles ?? []), ...(filters.titleQuery ? [filters.titleQuery] : [])]}
                clear={{ titles: undefined, titleQuery: undefined }}
              />
              <Facet
                field="location"
                label="Location"
                options={LOCATIONS}
                legacy={filters.location ? [filters.location] : []}
                clear={{ location: undefined }}
              />
            </FilterGroup>
            <FilterGroup title="Person > Profile attribute">
              <Facet
                field="seniority"
                label="Seniority"
                options={SENIORITY_OPTIONS}
                legacy={(filters.seniority ?? []).map((s) => SENIORITY_LABEL[s])}
                clear={{ seniority: undefined }}
              />
              <Facet
                field="department"
                label="Department"
                options={FUNCTION_OPTIONS}
                legacy={(filters.department ?? []).map((d) => DEPT_LABEL[d])}
                clear={{ department: undefined }}
              />
              <Facet field="skills" label="Skills" options={SKILL_OPTIONS} legacy={filters.tech ?? []} clear={{ tech: undefined }} />
              <Facet field="experience" label="Experience" options={EXPERIENCE_OPTIONS} />
              <Facet field="language" label="Languages" options={LANGUAGE_OPTIONS} />
              <Facet field="certification" label="Certifications" options={CERTIFICATION_OPTIONS} />
              <Facet field="education" label="Education" options={SCHOOL_OPTIONS} />
            </FilterGroup>
            <FilterGroup title="Person > Company attribute">
              <Facet field="industry" label="Company industry" options={INDUSTRY_OPTIONS} legacy={filters.industry ?? []} clear={{ industry: undefined }} />
              <Facet
                field="company"
                label="Current company"
                options={companyOptions}
                legacy={filters.companyQuery ? [filters.companyQuery] : []}
                clear={{ companyQuery: undefined }}
              />
              <Facet
                field="headcount"
                label="Headcount"
                options={HEADCOUNT_OPTIONS}
                legacy={headcountLegacy}
                clear={{ sizeMin: undefined, sizeMax: undefined }}
              />
              <Facet field="revenue" label="Revenue" options={REVENUE_OPTIONS} legacy={filters.revenue ?? []} clear={{ revenue: undefined }} />
              <Facet field="funding" label="Funding" options={FUNDING_OPTIONS} legacy={filters.funding ?? []} clear={{ funding: undefined }} />
              <Facet field="companyType" label="Company type" options={COMPANY_TYPES} />
              <Facet field="businessType" label="Business type" options={BUSINESS_TYPES} />
              <Facet field="revenueStream" label="Revenue stream" options={REVENUE_STREAMS} />
            </FilterGroup>
            <ComingSoon title="Person > Signal" />
          </div>
        ) : null}

        {kind === "company" ? (
          <div>
            <FilterGroup title="Popular" defaultOpen>
              <Facet
                field="company"
                label="Company"
                options={companyOptions}
                legacy={filters.companyQuery ? [filters.companyQuery] : []}
                clear={{ companyQuery: undefined }}
              />
              <Facet
                field="location"
                label="Location"
                options={LOCATIONS}
                legacy={filters.location ? [filters.location] : []}
                clear={{ location: undefined }}
              />
            </FilterGroup>
            <FilterGroup title="Company attribute">
              <Facet field="domain" label="Domain" options={domainOptions} />
              <Facet field="industry" label="Industry" options={INDUSTRY_OPTIONS} legacy={filters.industry ?? []} clear={{ industry: undefined }} />
              <Facet
                field="headcount"
                label="Headcount"
                options={HEADCOUNT_OPTIONS}
                legacy={headcountLegacy}
                clear={{ sizeMin: undefined, sizeMax: undefined }}
              />
              <Facet field="funding" label="Funding" options={FUNDING_OPTIONS} legacy={filters.funding ?? []} clear={{ funding: undefined }} />
              <Facet field="skills" label="Technology" options={SKILL_OPTIONS} legacy={filters.tech ?? []} clear={{ tech: undefined }} />
              <Facet field="revenue" label="Revenue" options={REVENUE_OPTIONS} legacy={filters.revenue ?? []} clear={{ revenue: undefined }} />
              <Facet field="companyType" label="Company type" options={COMPANY_TYPES} />
              <Facet field="businessType" label="Business type" options={BUSINESS_TYPES} />
              <Facet field="revenueStream" label="Revenue stream" options={REVENUE_STREAMS} />
            </FilterGroup>
            <ComingSoon title="Company > Signal" />
          </div>
        ) : null}

        {kind === "local" ? (
          <>
            <FilterGroup title="Location" defaultOpen>
              <Input
                value={filters.location ?? ""}
                placeholder="City or country"
                onChange={(e) => patch({ location: e.target.value || undefined })}
              />
            </FilterGroup>
            <FilterGroup title="City">
              {CITIES.map((city) => (
                <CheckRow
                  key={city}
                  label={city}
                  checked={(filters.location ?? "").toLowerCase() === city.toLowerCase()}
                  onChange={() =>
                    patch({
                      location: (filters.location ?? "").toLowerCase() === city.toLowerCase() ? undefined : city,
                    })
                  }
                />
              ))}
            </FilterGroup>
            <FilterGroup title="Country">
              {COUNTRIES.map((country) => (
                <CheckRow
                  key={country}
                  label={country}
                  checked={(filters.location ?? "").toLowerCase() === country.toLowerCase()}
                  onChange={() =>
                    patch({
                      location:
                        (filters.location ?? "").toLowerCase() === country.toLowerCase() ? undefined : country,
                    })
                  }
                />
              ))}
            </FilterGroup>
            <FilterGroup title="Industry">
              {INDUSTRIES.map((i) => (
                <CheckRow
                  key={i}
                  label={i}
                  checked={!!filters.industry?.includes(i)}
                  onChange={() => toggle("industry", i, filters.industry)}
                />
              ))}
            </FilterGroup>
            <FilterGroup title="Size">
              {SIZE_BUCKETS.map((b) => (
                <CheckRow
                  key={b.label}
                  label={b.label}
                  checked={filters.sizeMin === b.min && filters.sizeMax === b.max}
                  onChange={() =>
                    filters.sizeMin === b.min && filters.sizeMax === b.max
                      ? patch({ sizeMin: undefined, sizeMax: undefined })
                      : patch({ sizeMin: b.min, sizeMax: b.max })
                  }
                />
              ))}
            </FilterGroup>
          </>
        ) : null}
      </div>

      <div className="shrink-0 border-t border-border p-3">
        <Button type="button" className="w-full" onClick={onSearch}>
          <Search />
          {meta.search}
        </Button>
      </div>
    </div>
  );
}

function KindTabs({ value, onChange }: { value: LeadKind; onChange: (v: LeadKind) => void }) {
  const opts: { value: LeadKind; label: string; icon: LucideIcon }[] = [
    { value: "person", label: "Person", icon: Users },
    { value: "company", label: "Company", icon: Building2 },
    { value: "local", label: "Local", icon: MapPin },
  ];
  return (
    <div className="grid grid-cols-3 gap-1 p-2">
      {opts.map((opt) => {
        const Icon = opt.icon;
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg px-1 text-xs font-medium",
              active ? "bg-background text-foreground shadow-border" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="text-sm font-medium">{label}</div>
      {children}
    </div>
  );
}

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex h-11 items-center justify-between border-b border-border text-sm font-medium text-muted-foreground">
      <span>{title}</span>
      <span className="text-xs font-normal">Coming soon</span>
    </div>
  );
}

function FilterGroup({
  title,
  children,
  defaultOpen,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <Collapsible defaultOpen={defaultOpen} className="border-b border-border">
      <CollapsibleTrigger className="flex h-11 w-full items-center justify-between text-sm font-medium">
        {title}
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 pb-3">{children}</CollapsibleContent>
    </Collapsible>
  );
}

function CheckRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex min-h-12 cursor-pointer items-center gap-2 py-1 text-sm">
      <Checkbox checked={checked} onCheckedChange={() => onChange()} />
      <span className={cn(checked ? "text-foreground" : "text-muted-foreground")}>{label}</span>
    </label>
  );
}
