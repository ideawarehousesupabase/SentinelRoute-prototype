import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { toast } from "sonner";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  EmptyState,
  PageHeader,
  Panel,
  Pill,
  SealIndicator,
  fmt,
} from "@/components/sr/primitives";
import { useDemo } from "@/state/demo-store";
import type { Anomaly } from "@/lib/types";

export const Route = createFileRoute("/partner/anomalies")({
  validateSearch: z.object({ alert: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Anomaly review — SentinelRoute" },
      { name: "description", content: "Rule-based custody anomaly alerts for review." },
      { property: "og:title", content: "Anomaly review — SentinelRoute" },
      { property: "og:description", content: "Rule-based custody anomaly alerts for review." },
    ],
  }),
  component: AnomaliesPage,
});

const sevTone = { Low: "neutral", Medium: "warning", High: "danger" } as const;
const revTone = { Open: "danger", Reviewed: "success", "Kept Flagged": "warning" } as const;

function AnomaliesPage() {
  const { alert } = Route.useSearch();
  const navigate = useNavigate({ from: "/partner/anomalies" });
  const { anomalies, jobs, events, reviewAnomaly } = useDemo();
  const sorted = [...anomalies].sort((a, b) => b.detectedAt.localeCompare(a.detectedAt));
  const current = anomalies.find((a) => a.id === alert);
  const job = current && jobs.find((j) => j.id === current.jobId);
  const event = current && events.find((e) => e.id === current.eventId);

  const act = (a: Anomaly, outcome: "Reviewed" | "Kept Flagged") => {
    reviewAnomaly(a.id, outcome);
    toast.success(outcome === "Reviewed" ? `${a.id} marked reviewed` : `${a.id} kept flagged`);
  };

  return (
    <>
      <PageHeader
        title="Anomaly review"
        description="Alerts raised by deterministic prototype rules. An anomaly means an event requires review — it does not establish fraud."
      />
      <div className="mb-6 flex items-start gap-2 rounded-xl border bg-muted/50 p-4 text-sm text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        Rules checked: unexpected seal breach, GPS mismatch (&gt;0.5 km from destination),
        out-of-order timestamps, missing delivery evidence and custody sequence order. A trained AI
        model is a future roadmap item and is not used here.
      </div>
      <Panel>
        {sorted.length === 0 ? (
          <EmptyState title="No anomalies" body="All custody events passed rule checks." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Alert ID</TableHead>
                  <TableHead>Related Job</TableHead>
                  <TableHead>Anomaly Type</TableHead>
                  <TableHead>Detected</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Review Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono text-xs font-medium">{a.id}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {jobs.find((j) => j.id === a.jobId)?.reference}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{a.type}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm">{fmt(a.detectedAt)}</TableCell>
                    <TableCell>
                      <Pill tone={sevTone[a.severity]}>{a.severity}</Pill>
                    </TableCell>
                    <TableCell>
                      <Pill tone={revTone[a.reviewStatus]}>{a.reviewStatus}</Pill>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate({ search: { alert: a.id } })}
                      >
                        Open
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Panel>

      <Sheet open={!!current} onOpenChange={(o) => !o && navigate({ search: {} })}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {current && (
            <>
              <SheetHeader>
                <SheetTitle>{current.type}</SheetTitle>
                <SheetDescription>
                  <span className="font-mono">{current.id}</span> · {job?.reference} · detected{" "}
                  {fmt(current.detectedAt)}
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-4 px-4 pb-6 text-sm">
                <div className="flex gap-2">
                  <Pill tone={sevTone[current.severity]}>{current.severity} severity</Pill>
                  <Pill tone={revTone[current.reviewStatus]}>{current.reviewStatus}</Pill>
                </div>
                {event && (
                  <div className="rounded-lg border p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Relevant custody event
                    </p>
                    <p className="mt-1 font-medium">
                      {event.type}{" "}
                      <span className="font-mono text-xs text-muted-foreground">{event.id}</span>
                    </p>
                    <p className="text-muted-foreground">
                      {fmt(event.timestamp)} · {event.location.label}
                    </p>
                    <p className="text-muted-foreground">Custodian: {event.custodian}</p>
                    <div className="mt-2">
                      <SealIndicator status={event.sealStatus} />
                    </div>
                  </div>
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-success/10 p-3">
                    <p className="text-xs font-medium text-success">Expected</p>
                    <p className="mt-1">{current.expected}</p>
                  </div>
                  <div className="rounded-lg bg-destructive/10 p-3">
                    <p className="text-xs font-medium text-destructive">Recorded</p>
                    <p className="mt-1">{current.recorded}</p>
                  </div>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Reason for flag
                  </p>
                  <p className="mt-1">{current.reason}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  This alert indicates the event requires review. It does not confirm fraud or
                  tampering.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="success"
                    disabled={current.reviewStatus === "Reviewed"}
                    onClick={() => act(current, "Reviewed")}
                  >
                    Mark Reviewed
                  </Button>
                  <Button
                    variant="outline"
                    disabled={current.reviewStatus !== "Open"}
                    onClick={() => act(current, "Kept Flagged")}
                  >
                    Keep Flagged
                  </Button>
                  {job && (
                    <Button variant="ghost" asChild>
                      <Link to="/partner/jobs/$jobId" params={{ jobId: job.id }}>
                        View job
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
