import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Award, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  EmptyState,
  JobStatusBadge,
  PageHeader,
  Panel,
  SealIndicator,
  VerificationBadge,
  fmt,
  selectClass,
} from "@/components/sr/primitives";
import { CustodyTimeline } from "@/components/sr/CustodyTimeline";
import { useDemo } from "@/state/demo-store";
import { certificateEligible } from "@/lib/rules";

export const Route = createFileRoute("/partner/jobs/$jobId")({
  head: () => ({
    meta: [
      { title: "Job details — SentinelRoute" },
      { name: "description", content: "Custody job overview and timeline." },
      { property: "og:title", content: "Job details — SentinelRoute" },
      { property: "og:description", content: "Custody job overview and timeline." },
    ],
  }),
  component: JobDetails,
});

function JobDetails() {
  const { jobId } = Route.useParams();
  const {
    jobs,
    drivers,
    seals,
    eventsFor,
    openAnomaliesFor,
    driverById,
    assignDriver,
    pairDevice,
  } = useDemo();
  const job = jobs.find((j) => j.id === jobId);
  if (!job)
    return (
      <EmptyState
        title="Job not found"
        action={
          <Button asChild variant="outline">
            <Link to="/partner/jobs" search={{}}>
              Back to jobs
            </Link>
          </Button>
        }
      />
    );
  const seal = seals.find((s) => s.id === job.sealId);
  const driver = driverById(job.driverId);
  const open = openAnomaliesFor(job.id);

  return (
    <>
      <Link
        to="/partner/jobs"
        search={{}}
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Custody jobs
      </Link>
      <PageHeader
        title={job.reference}
        description={job.itemDescription}
        action={
          certificateEligible(job, open.length) ? (
            <Button asChild variant="success">
              <Link to="/certificate" search={{ ref: job.trackingRef }}>
                <Award /> Certificate
              </Link>
            </Button>
          ) : undefined
        }
      />
      {open.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <p className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-destructive" /> {open.length} anomaly alert(s)
            require review. This does not by itself establish fraud.
          </p>
          <Button asChild size="sm" variant="outline">
            <Link to="/partner/anomalies" search={{ alert: open[0].id }}>
              Open review
            </Link>
          </Button>
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Job overview">
          <dl className="space-y-3 text-sm">
            <R k="Job reference">
              <span className="font-mono">{job.reference}</span>
            </R>
            <R k="Tracking reference">
              <span className="font-mono">{job.trackingRef}</span>
            </R>
            <R k="Item">{job.itemCategory}</R>
            <R k="Collection">{job.collection.label}</R>
            <R k="Delivery">{job.delivery.label}</R>
            <R k="Collection time">{fmt(job.collectionAt)}</R>
            <R k="Delivery window">{fmt(job.deliveryAt)}</R>
            <R k="Assigned driver">
              {job.status === "Booked" ? (
                <select
                  className={`${selectClass} h-8 text-xs max-w-xs`}
                  value={job.driverId ?? ""}
                  onChange={(e) => {
                    if (e.target.value) {
                      assignDriver(job.id, e.target.value);
                      const d = driverById(e.target.value);
                      toast.success(`Assigned to ${d?.name}`);
                    }
                  }}
                  aria-label="Assign driver"
                >
                  <option value="">Unassigned</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.ref})
                    </option>
                  ))}
                </select>
              ) : driver ? (
                `${driver.name} (${driver.ref})`
              ) : (
                "Unassigned"
              )}
            </R>
            <R k="Current custodian">{job.currentCustodian}</R>
            <R k="Smart-seal">
              {job.sealId ? (
                <SealIndicator
                  id={job.sealId}
                  status={
                    seal?.jobId === job.id
                      ? seal.status
                      : job.status === "Completed"
                        ? "Available"
                        : (seal?.status ?? "Available")
                  }
                />
              ) : job.status === "Booked" ? (
                <select
                  className={`${selectClass} h-8 text-xs max-w-xs`}
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) {
                      try {
                        pairDevice(e.target.value, job.id);
                        toast.success(`${e.target.value} paired`);
                      } catch (err) {
                        toast.error((err as Error).message);
                      }
                    }
                  }}
                  aria-label="Pair smart-seal"
                >
                  <option value="">Pair available seal…</option>
                  {seals
                    .filter((s) => s.status === "Available" && !s.jobId)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.id}
                      </option>
                    ))}
                </select>
              ) : (
                "Not assigned"
              )}
            </R>
            <R k="Job status">
              <JobStatusBadge status={job.status} />
            </R>
            <R k="Verification">
              <VerificationBadge status={job.verification} />
            </R>
          </dl>
          {!job.sealId && job.status === "Booked" && (
            <p className="mt-4 text-xs text-muted-foreground">
              Select an available seal above or pair from the Smart-Seal Inventory to begin custody
              capture.
            </p>
          )}
        </Panel>
        <Panel title="Custody timeline" className="lg:col-span-2">
          <CustodyTimeline events={eventsFor(job.id)} />
        </Panel>
      </div>
    </>
  );
}

const R = ({ k, children }: { k: string; children: React.ReactNode }) => (
  <div className="grid grid-cols-[120px_1fr] gap-2">
    <dt className="text-muted-foreground">{k}</dt>
    <dd>{children}</dd>
  </div>
);
