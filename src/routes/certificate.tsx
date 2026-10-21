import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Download, Search, ShieldCheck, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, PageHeader, fmt } from "@/components/sr/primitives";
import { PublicShell } from "@/components/sr/PublicHeader";
import { useDemo } from "@/state/demo-store";
import { certificateEligible } from "@/lib/rules";
import { certificateRefFor } from "@/data/mockCertificates";

export const Route = createFileRoute("/certificate")({
  validateSearch: z.object({ ref: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Custody certificate — SentinelRoute demo" },
      {
        name: "description",
        content: "View and download a demonstration custody certificate for a completed delivery.",
      },
      { property: "og:title", content: "Custody certificate — SentinelRoute" },
      {
        property: "og:description",
        content: "Prototype custody certificate — not independently verified.",
      },
    ],
  }),
  component: CertificatePage,
});

function CertificatePage() {
  const { ref } = Route.useSearch();
  const navigate = useNavigate({ from: "/certificate" });
  const [input, setInput] = useState(ref ?? "");
  const { jobs, eventsFor, openAnomaliesFor, driverById } = useDemo();
  const q = ref?.trim().toLowerCase();
  const job = q
    ? jobs.find((j) => j.trackingRef.toLowerCase() === q || j.reference.toLowerCase() === q)
    : undefined;
  const eligible = job ? certificateEligible(job, openAnomaliesFor(job.id).length) : false;
  const events = job ? eventsFor(job.id) : [];
  const driver = job ? driverById(job.driverId) : undefined;
  const collected = events.find((e) => e.type === "Item Collected");
  const delivered = events.find((e) => e.type === "Delivery Completed");
  const breach = events.some((e) => e.sealStatus === "Breach Detected");

  return (
    <PublicShell>
      <div className="no-print">
        <PageHeader
          title="Custody certificate"
          description="Enter a tracking or job reference for a completed delivery, e.g. TRK-7Q41-KEYS."
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
            placeholder="Tracking or job reference"
            aria-label="Reference"
          />
          <Button type="submit">
            <Search /> Find
          </Button>
        </form>
      </div>

      {!ref ? (
        <EmptyState
          title="Enter a reference"
          body="Certificates are available only for completed, clean custody records."
        />
      ) : !job ? (
        <EmptyState title="No record found" body={`No demonstration record matches “${ref}”.`} />
      ) : !eligible ? (
        <div className="flex max-w-xl gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-sm">
          <ShieldAlert className="h-5 w-5 shrink-0 text-destructive" />
          <p>
            {job.status === "Flagged" || job.verification === "Flagged"
              ? "This custody record contains an inconsistency under review or was flagged during delivery. A clean certificate cannot be issued for flagged deliveries."
              : `Job ${job.reference} is not yet completed. A certificate becomes available after verified delivery.`}
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4 flex justify-end no-print">
            <Button onClick={() => window.print()}>
              <Download /> Download Certificate
            </Button>
          </div>
          <article className="mx-auto max-w-3xl rounded-2xl border-2 border-primary/20 bg-card p-8 shadow-card md:p-12">
            <header className="flex items-start justify-between border-b pb-6">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground">
                  <ShieldCheck className="h-6 w-6" />
                </span>
                <div>
                  <p className="font-display text-lg font-semibold">SentinelRoute</p>
                  <p className="text-xs text-muted-foreground">Custody Verification Certificate</p>
                </div>
              </div>
              <div className="text-right text-xs">
                <p className="text-muted-foreground">Certificate reference</p>
                <p className="font-mono text-sm font-medium">{certificateRefFor(job)}</p>
              </div>
            </header>
            <p className="mt-4 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider text-warning-foreground">
              Prototype Demonstration — Not Independently Verified
            </p>
            <dl className="mt-6 grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
              <Item k="Job reference" v={job.reference} mono />
              <Item k="Item description" v={job.itemDescription} />
              <Item
                k="Collection date and time"
                v={collected ? fmt(collected.timestamp) : fmt(job.collectionAt)}
              />
              <Item
                k="Delivery date and time"
                v={
                  delivered
                    ? fmt(delivered.timestamp)
                    : job.completedAt
                      ? fmt(job.completedAt)
                      : "—"
                }
              />
              <Item k="Driver / custodian reference" v={driver?.ref ?? "—"} mono />
              <Item k="Smart-seal reference" v={job.sealId ?? "—"} mono />
              <Item
                k="Seal integrity summary"
                v={
                  breach
                    ? "Breach signal recorded and reviewed by operator"
                    : "No breach signal recorded between pairing and delivery"
                }
              />
              <Item
                k="Custody event summary"
                v={`${events.length} events recorded · ${events.filter((e) => e.verification === "Verified").length} passed rule checks`}
              />
            </dl>
            <div className="mt-8 flex items-center justify-between rounded-xl bg-success/10 p-4">
              <div>
                <p className="text-xs text-muted-foreground">Final verification result</p>
                <p className="font-display text-lg font-semibold text-success">
                  {job.verification === "Verified"
                    ? "Custody chain consistent"
                    : "Consistent after operator review"}
                </p>
              </div>
              <ShieldCheck className="h-10 w-10 text-success" />
            </div>
            <p className="mt-6 text-xs text-muted-foreground">
              This demonstration certificate summarises simulated custody records. It does not claim
              legal admissibility, guaranteed authenticity or an external cryptographic verification
              result.
            </p>
          </article>
        </>
      )}
    </PublicShell>
  );
}

const Item = ({ k, v, mono }: { k: string; v: string; mono?: boolean }) => (
  <div>
    <dt className="text-xs text-muted-foreground">{k}</dt>
    <dd className={mono ? "font-mono" : "font-medium"}>{v}</dd>
  </div>
);
