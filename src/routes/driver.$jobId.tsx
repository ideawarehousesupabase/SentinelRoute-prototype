import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Camera,
  Check,
  MapPin,
  ShieldAlert,
  PenLine,
  Link2,
  Truck,
  PackageCheck,
  Award,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  EmptyState,
  Field,
  JobStatusBadge,
  SealIndicator,
  VerificationBadge,
  fmt,
  selectClass,
} from "@/components/sr/primitives";
import { CustodyTimeline } from "@/components/sr/CustodyTimeline";
import { useDemo } from "@/state/demo-store";
import { cn } from "@/lib/utils";
import type { CustodyJob, JobStatus } from "@/lib/types";

export const Route = createFileRoute("/driver/$jobId")({
  head: () => ({
    meta: [
      { title: "Custody capture — SentinelRoute driver" },
      { name: "description", content: "Step-by-step simulated custody capture." },
      { property: "og:title", content: "Custody capture — SentinelRoute" },
      { property: "og:description", content: "Step-by-step simulated custody capture." },
    ],
  }),
  component: Capture,
});

const STEPS = ["Seal", "Collect", "Transit", "Deliver"] as const;
function stepFor(s: JobStatus): number {
  if (s === "Booked") return 0;
  if (s === "Awaiting Collection") return 1;
  if (s === "Collected" || s === "In Transit") return 2;
  return 3;
}

function Capture() {
  const { jobId } = Route.useParams();
  const { jobs, seals, eventsFor, openAnomaliesFor } = useDemo();
  const [showTimeline, setShowTimeline] = useState(false);
  const job = jobs.find((j) => j.id === jobId);
  if (!job)
    return (
      <EmptyState
        title="Job not found"
        action={
          <Button asChild variant="outline">
            <Link to="/driver">Back</Link>
          </Button>
        }
      />
    );
  const seal = seals.find((s) => s.id === job.sealId);
  const sealStatus =
    seal?.jobId === job.id
      ? seal.status
      : job.status === "Completed"
        ? "Available"
        : (seal?.status ?? "Available");
  const step = stepFor(job.status === "Flagged" ? (job.preFlagStatus ?? "In Transit") : job.status);
  const open = openAnomaliesFor(job.id);

  return (
    <div className="space-y-5">
      <Link to="/driver" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> My jobs
      </Link>
      <div className="rounded-xl border bg-card p-4 shadow-card">
        <div className="flex items-center justify-between">
          <span className="font-mono font-semibold">{job.reference}</span>
          <JobStatusBadge status={job.status} />
        </div>
        <p className="mt-1 font-medium">{job.itemDescription}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <SealIndicator id={job.sealId} status={sealStatus} />
          <VerificationBadge status={job.verification} />
        </div>
      </div>

      <ol className="grid grid-cols-4 gap-2">
        {STEPS.map((s, i) => {
          const done = job.status === "Completed" || i < step;
          return (
            <li key={s} className="text-center">
              <span
                className={cn(
                  "mx-auto grid h-9 w-9 place-items-center rounded-full border-2 text-sm font-semibold",
                  done
                    ? "border-success bg-success text-success-foreground"
                    : i === step
                      ? "border-primary text-primary"
                      : "text-muted-foreground",
                )}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span className="mt-1 block text-xs">{s}</span>
            </li>
          );
        })}
      </ol>

      {job.status === "Flagged" || open.length > 0 ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-5">
          <p className="flex items-center gap-2 font-semibold text-destructive">
            <ShieldAlert className="h-5 w-5" /> Review required
          </p>
          <p className="mt-2 text-sm">
            A verification issue was detected (
            {open.map((a) => a.type).join(", ") || "under review"}). The job cannot be completed
            until the partner operator resolves the review. This does not mean fraud has been
            established.
          </p>
        </div>
      ) : job.status === "Completed" ? (
        <div className="rounded-xl border border-success/40 bg-success/10 p-5 text-center">
          <PackageCheck className="mx-auto h-10 w-10 text-success" />
          <p className="mt-2 font-semibold">Delivery completed and verified</p>
          <Button asChild variant="success" className="mt-4">
            <Link to="/certificate" search={{ ref: job.trackingRef }}>
              <Award /> View certificate
            </Link>
          </Button>
        </div>
      ) : !job.sealId ? (
        <EmptyState
          title="No smart-seal assigned"
          body="Ask the partner operator to assign a seal to this job."
        />
      ) : step === 0 ? (
        <PairStep job={job} sealStatus={sealStatus} />
      ) : step === 1 ? (
        <CollectStep job={job} />
      ) : step === 2 ? (
        <TransitStep job={job} />
      ) : (
        <DeliverStep job={job} />
      )}

      <Button variant="outline" className="w-full" onClick={() => setShowTimeline((v) => !v)}>
        {showTimeline ? "Hide" : "Show"} custody events ({eventsFor(job.id).length})
      </Button>
      {showTimeline && (
        <div className="rounded-xl border bg-card p-4">
          <CustodyTimeline events={eventsFor(job.id)} />
        </div>
      )}
    </div>
  );
}

function Card({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Camera;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-card p-5 shadow-card">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
        <Icon className="h-5 w-5 text-success" />
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

const Kv = ({ k, v }: { k: string; v: React.ReactNode }) => (
  <div className="flex justify-between gap-3 text-sm">
    <span className="text-muted-foreground">{k}</span>
    <span className="text-right">{v}</span>
  </div>
);

function PhotoToggle({
  on,
  set,
  label,
}: {
  on: boolean;
  set: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => set(!on)}
      className={cn(
        "flex h-24 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed text-sm",
        on ? "border-success bg-success/10 text-success" : "text-muted-foreground",
      )}
    >
      <Camera className="h-6 w-6" />
      {on ? `${label} attached (demo)` : `Tap to add ${label.toLowerCase()} (demo)`}
    </button>
  );
}

function PairStep({ job, sealStatus }: { job: CustodyJob; sealStatus: string }) {
  const { pairSeal } = useDemo();
  return (
    <Card title="Step 1 — Smart-seal pairing" icon={Link2}>
      <Kv k="Job reference" v={<span className="font-mono">{job.reference}</span>} />
      <Kv k="Assigned smart-seal" v={<span className="font-mono">{job.sealId}</span>} />
      <Kv k="Initial seal status" v={sealStatus} />
      <p className="text-xs text-muted-foreground">
        Simulated pairing — no Bluetooth or NFC connection is made.
      </p>
      <Button
        size="xl"
        onClick={() => {
          try {
            pairSeal(job.id);
            toast.success("Seal paired");
          } catch (err) {
            toast.error((err as Error).message);
          }
        }}
      >
        Pair Seal
      </Button>
    </Card>
  );
}

function CollectStep({ job }: { job: CustodyJob }) {
  const { recordCollection } = useDemo();
  const [photo, setPhoto] = useState(false);
  const [note, setNote] = useState("");
  const [confirm, setConfirm] = useState(false);
  return (
    <Card title="Step 2 — Collection capture" icon={Camera}>
      <PhotoToggle on={photo} set={setPhoto} label="Collection photo" />
      <Kv
        k="GPS (mock)"
        v={
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {job.collection.lat.toFixed(4)}, {job.collection.lng.toFixed(4)}
          </span>
        }
      />
      <Kv k="Location" v={job.collection.label} />
      <Kv k="Timestamp" v="Recorded on confirmation" />
      <Field label="Collection note (optional)">
        <Textarea value={note} maxLength={240} onChange={(e) => setNote(e.target.value)} rows={2} />
      </Field>
      <label className="flex items-center gap-3 text-sm">
        <Switch checked={confirm} onCheckedChange={setConfirm} /> I confirm the item has been
        collected and sealed
      </label>
      <Button
        size="xl"
        disabled={!confirm || !photo}
        onClick={() => {
          recordCollection(job.id, { photo, note: note.trim() });
          toast.success("Collection recorded");
        }}
      >
        Confirm Collection
      </Button>
      {!photo && (
        <p className="text-center text-xs text-muted-foreground">Add the demo photo to continue.</p>
      )}
    </Card>
  );
}

function TransitStep({ job }: { job: CustodyJob }) {
  const { recordHandover, startTransit, simulateBreach, arrive, seals } = useDemo();
  const [newCustodian, setNewCustodian] = useState("");
  const [location, setLocation] = useState("");
  const [cond, setCond] = useState<"Intact" | "Damaged">("Intact");
  const seal = seals.find((s) => s.id === job.sealId);
  return (
    <>
      <Card title="Step 3 — Custody handover / transit" icon={Truck}>
        <Kv k="Existing custodian" v={job.currentCustodian} />
        <Field label="New custodian">
          <Input
            value={newCustodian}
            maxLength={80}
            onChange={(e) => setNewCustodian(e.target.value)}
            placeholder="e.g. Depot custodian J. Reid"
          />
        </Field>
        <Field label="Handover location">
          <Input
            value={location}
            maxLength={120}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Defaults to current location"
          />
        </Field>
        <Kv k="Event timestamp" v="Recorded on confirmation" />
        <Field label="Seal condition">
          <select
            className={`${selectClass} h-11`}
            value={cond}
            onChange={(e) => setCond(e.target.value as "Intact" | "Damaged")}
          >
            <option>Intact</option>
            <option>Damaged</option>
          </select>
        </Field>
        <Kv k="Evidence status" v="Photo + GPS + seal telemetry (simulated)" />
        <Button
          size="xl"
          variant="outline"
          disabled={newCustodian.trim().length < 2}
          onClick={() => {
            recordHandover(job.id, {
              newCustodian: newCustodian.trim(),
              location: location.trim(),
              sealCondition: cond,
            });
            setNewCustodian("");
            setLocation("");
            toast.success("Handover recorded");
          }}
        >
          Record Handover
        </Button>
        {job.status === "Collected" ? (
          <Button
            size="xl"
            onClick={() => {
              startTransit(job.id);
              toast.success("In transit");
            }}
          >
            Start Transit
          </Button>
        ) : (
          <Button
            size="xl"
            onClick={() => {
              arrive(job.id);
              toast.success("Arrival confirmed");
            }}
          >
            Confirm Arrival at Delivery
          </Button>
        )}
      </Card>
      <div className="rounded-xl border border-dashed p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Demo scenario control
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Simulate a seal-breach signal from {seal?.id} to demonstrate anomaly flagging.
        </p>
        <Button
          variant="destructive"
          className="mt-3 w-full"
          onClick={() => {
            simulateBreach(job.id);
            toast.error("Seal breach detected — job flagged for review");
          }}
        >
          Simulate Seal Breach
        </Button>
      </div>
    </>
  );
}

function DeliverStep({ job }: { job: CustodyJob }) {
  const { submitDelivery, arrive } = useDemo();
  const [photo, setPhoto] = useState(false);
  const [signature, setSignature] = useState(false);
  const [cond, setCond] = useState<"Intact" | "Damaged">("Intact");
  const [gps, setGps] = useState(false);
  const [timing, setTiming] = useState(false);
  const arrived = job.status === "At Delivery";
  return (
    <Card title="Step 4 — Delivery capture" icon={PackageCheck}>
      {!arrived ? (
        <Button size="xl" onClick={() => arrive(job.id)}>
          Confirm Arrival
        </Button>
      ) : (
        <>
          <PhotoToggle on={photo} set={setPhoto} label="Delivery photo" />
          <button
            type="button"
            onClick={() => setSignature(!signature)}
            className={cn(
              "flex h-24 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed text-sm",
              signature ? "border-success bg-success/10 text-success" : "text-muted-foreground",
            )}
          >
            <PenLine className="h-6 w-6" />
            {signature ? (
              <span className="font-display italic">Recipient signature captured (demo)</span>
            ) : (
              "Tap to capture recipient signature (demo)"
            )}
          </button>
          <Kv k="Delivery location" v={job.delivery.label} />
          <Field label="Seal condition">
            <select
              className={`${selectClass} h-11`}
              value={cond}
              onChange={(e) => setCond(e.target.value as "Intact" | "Damaged")}
            >
              <option>Intact</option>
              <option>Damaged</option>
            </select>
          </Field>
          <div className="space-y-2 rounded-lg border border-dashed p-3 text-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Demo scenario controls
            </p>
            <label className="flex items-center justify-between">
              Simulate GPS mismatch <Switch checked={gps} onCheckedChange={setGps} />
            </label>
            <label className="flex items-center justify-between">
              Simulate implausible timestamp <Switch checked={timing} onCheckedChange={setTiming} />
            </label>
          </div>
          <Button
            size="xl"
            variant="success"
            onClick={() => {
              const r = submitDelivery(job.id, {
                photo,
                signature,
                sealCondition: cond,
                simulateGpsMismatch: gps,
                simulateTimingIssue: timing,
              });
              if (r.flagged) toast.error(`Review required: ${r.reasons.join(", ")}`);
              else toast.success("Delivery verified and completed");
            }}
          >
            Submit Delivery Evidence
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Rule checks run on submission. Missing photo or signature will be flagged.
          </p>
          <p className="text-center text-xs text-muted-foreground">Due {fmt(job.deliveryAt)}</p>
        </>
      )}
    </Card>
  );
}
