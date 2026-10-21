import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Search, ShieldAlert, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  EmptyState,
  JobStatusBadge,
  PageHeader,
  Panel,
  SealIndicator,
  VerificationBadge,
} from "@/components/sr/primitives";
import { PublicShell } from "@/components/sr/PublicHeader";
import { CustodyTimeline } from "@/components/sr/CustodyTimeline";
import { useDemo } from "@/state/demo-store";
import { certificateEligible } from "@/lib/rules";

export const Route = createFileRoute("/track")({
  validateSearch: z.object({ ref: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Track a delivery — SentinelRoute demo" },
      {
        name: "description",
        content: "Check custody status, seal integrity and verification for a demo delivery.",
      },
      { property: "og:title", content: "Track a delivery — SentinelRoute" },
      {
        property: "og:description",
        content: "Public custody tracking for demonstration deliveries.",
      },
    ],
  }),
  component: TrackPage,
});

function TrackPage() {
  const { ref } = Route.useSearch();
  const navigate = useNavigate({ from: "/track" });
  const [input, setInput] = useState(ref ?? "");
  const { jobs, seals, eventsFor, openAnomaliesFor } = useDemo();
  const job = ref
    ? jobs.find(
        (j) =>
          j.trackingRef.toLowerCase() === ref.trim().toLowerCase() ||
          j.reference.toLowerCase() === ref.trim().toLowerCase(),
      )
    : undefined;
  const seal = job ? seals.find((s) => s.id === job.sealId) : undefined;

  return (
    <PublicShell>
      <PageHeader
        title="Track a delivery"
        description="Enter a tracking reference, e.g. TRK-7Q41-KEYS or TRK-5B44-KEYS."
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          navigate({ search: { ref: input.trim() || undefined } });
        }}
        className="mb-6 flex max-w-xl gap-2"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tracking reference"
          aria-label="Tracking reference"
        />
        <Button type="submit">
          <Search /> Track
        </Button>
      </form>

      {!ref ? (
        <EmptyState
          title="Enter a tracking reference"
          body="Demonstration references are shown on booking confirmations."
        />
      ) : !job ? (
        <EmptyState
          title="No delivery found"
          body={`We couldn't find a demonstration record for “${ref}”.`}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-1">
            <Panel title={<span className="font-mono">{job.reference}</span>}>
              <dl className="space-y-3 text-sm">
                <Row k="Status">
                  <JobStatusBadge status={job.status} />
                </Row>
                <Row k="Verification">
                  <VerificationBadge status={job.verification} />
                </Row>
                <Row k="Seal integrity">
                  {job.status === "Completed" ? (
                    eventsFor(job.id).some((e) => e.sealStatus === "Breach Detected") ? (
                      <SealIndicator status="Breach Detected" />
                    ) : (
                      <Pill tone="success">Intact at Delivery</Pill>
                    )
                  ) : seal || job.sealId ? (
                    <SealIndicator status={seal?.status ?? "Available"} />
                  ) : (
                    <span className="text-muted-foreground">Seal not yet assigned</span>
                  )}
                </Row>
                <Row k="Collection">{job.collection.label.split(",").slice(-1)[0]}</Row>
                <Row k="Destination">{job.delivery.label.split(",").slice(-1)[0]}</Row>
              </dl>
            </Panel>
            {job.status === "Flagged" ||
            job.verification === "Flagged" ||
            openAnomaliesFor(job.id).length > 0 ? (
              <div className="flex gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
                <ShieldAlert className="h-5 w-5 shrink-0 text-destructive" />
                <p>
                  This custody record contains an inconsistency under review or flagged custody
                  events. A clean custody certificate cannot be issued.
                </p>
              </div>
            ) : certificateEligible(job, openAnomaliesFor(job.id).length) ? (
              <Button asChild variant="success" className="w-full">
                <Link to="/certificate" search={{ ref: job.trackingRef }}>
                  <Award /> View Custody Certificate
                </Link>
              </Button>
            ) : null}
          </div>
          <Panel title="Custody timeline" className="lg:col-span-2">
            <CustodyTimeline events={eventsFor(job.id)} publicView />
          </Panel>
        </div>
      )}
    </PublicShell>
  );
}

const Row = ({ k, children }: { k: string; children: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-3">
    <dt className="text-muted-foreground">{k}</dt>
    <dd className="text-right">{children}</dd>
  </div>
);
