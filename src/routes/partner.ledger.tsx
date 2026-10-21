import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowDown, Link2 } from "lucide-react";
import { PageHeader, Panel, Pill, fmt, selectClass } from "@/components/sr/primitives";
import { useDemo } from "@/state/demo-store";
import { illustrativeHash } from "@/lib/rules";

export const Route = createFileRoute("/partner/ledger")({
  head: () => ({
    meta: [
      { title: "Custody ledger — SentinelRoute" },
      { name: "description", content: "Illustrative chained custody records." },
      { property: "og:title", content: "Custody ledger — SentinelRoute" },
      { property: "og:description", content: "Illustrative chained custody records." },
    ],
  }),
  component: LedgerPage,
});

const GENESIS = "0".repeat(32);

function LedgerPage() {
  const { jobs, eventsFor } = useDemo();
  const [jobId, setJobId] = useState(jobs[0]?.id ?? "");
  const job = jobs.find((j) => j.id === jobId);
  const chain = useMemo(() => {
    let prev = GENESIS;
    return (job ? eventsFor(job.id) : []).map((e) => {
      const cur = illustrativeHash(
        `${prev}|${e.id}|${e.jobId}|${e.type}|${e.timestamp}|${e.location.lat},${e.location.lng}|${e.sealStatus}`,
      );
      const row = { e, prev, cur };
      prev = cur;
      return row;
    });
  }, [job, eventsFor]);

  return (
    <>
      <PageHeader
        title="Custody ledger"
        description="Read-only visual of SentinelRoute's proposed chained custody records."
      />
      <div className="mb-6 rounded-xl border bg-accent/50 p-4 text-sm">
        <p className="flex items-start gap-2">
          <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-accent-foreground" />
          Each custody event is intended to be linked to the previous event, helping identify
          changes or inconsistencies in the recorded custody history.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Simulated / illustrative records. Hash values are generated for demonstration and are not
          a production cryptographically verified or externally anchored ledger.
        </p>
      </div>
      <Panel
        title="Chain for job"
        action={
          <select
            className={`${selectClass} w-64`}
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
            aria-label="Select job"
          >
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.reference} — {j.status}
              </option>
            ))}
          </select>
        }
      >
        <ol className="space-y-1">
          {chain.map(({ e, prev, cur }, i) => (
            <li key={e.id}>
              <div
                className={`rounded-lg border p-4 ${e.verification === "Flagged" ? "border-destructive/40 bg-destructive/5" : ""}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">
                    #{i + 1} · {e.type}
                  </p>
                  <Pill tone={e.verification === "Flagged" ? "danger" : "success"}>
                    {e.verification === "Flagged" ? "Inconsistency flagged" : "Link consistent"}
                  </Pill>
                </div>
                <div className="mt-2 grid gap-x-6 gap-y-1 text-xs sm:grid-cols-3">
                  <p>
                    <span className="text-muted-foreground">Event ID </span>
                    <span className="font-mono">{e.id}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Job </span>
                    <span className="font-mono">{job?.reference}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Timestamp </span>
                    {fmt(e.timestamp)}
                  </p>
                </div>
                <div className="mt-3 grid gap-2 font-mono text-[11px] sm:grid-cols-2">
                  <p className="truncate rounded bg-muted px-2 py-1" title={prev}>
                    <span className="text-muted-foreground">prev </span>
                    {prev}
                  </p>
                  <p className="truncate rounded bg-primary/10 px-2 py-1 text-primary" title={cur}>
                    <span className="opacity-70">hash </span>
                    {cur}
                  </p>
                </div>
              </div>
              {i < chain.length - 1 && (
                <div className="flex justify-center py-1 text-muted-foreground">
                  <ArrowDown className="h-4 w-4" />
                </div>
              )}
            </li>
          ))}
        </ol>
      </Panel>
    </>
  );
}
