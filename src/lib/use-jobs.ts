import { useEffect, useMemo } from "react";
import { useAppStore } from "./store";
import type { BulkJob } from "./types";

/** Stable job list by type. Never filter inside a Zustand selector — that
 *  allocates a new array every snapshot and infinite-loops React. */
export function useJobs(type: BulkJob["type"], batch = 5, ms = 240) {
  const jobs = useAppStore((s) => s.jobs);
  const tickJob = useAppStore((s) => s.tickJob);
  const list = useMemo(() => jobs.filter((j) => j.type === type), [jobs, type]);
  const runningKey = useMemo(
    () =>
      list
        .filter((j) => j.status === "processing")
        .map((j) => j.id)
        .join(","),
    [list],
  );

  useEffect(() => {
    if (!runningKey) return;
    const ids = runningKey.split(",");
    const t = window.setInterval(() => {
      for (const id of ids) tickJob(id, batch);
    }, ms);
    return () => window.clearInterval(t);
  }, [runningKey, tickJob, batch, ms]);

  return list;
}
