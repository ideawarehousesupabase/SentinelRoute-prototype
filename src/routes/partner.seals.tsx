import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Field,
  MetricCard,
  PageHeader,
  Panel,
  Pill,
  SealIndicator,
  selectClass,
} from "@/components/sr/primitives";
import { useDemo } from "@/state/demo-store";
import { Lock, LockOpen, ShieldAlert, Archive } from "lucide-react";

export const Route = createFileRoute("/partner/seals")({
  head: () => ({
    meta: [
      { title: "Smart-seal inventory — SentinelRoute" },
      { name: "description", content: "Simulated smart-seal device records." },
      { property: "og:title", content: "Smart-seal inventory — SentinelRoute" },
      { property: "og:description", content: "Simulated smart-seal device records." },
    ],
  }),
  component: SealsPage,
});

function SealsPage() {
  const { seals, jobs, driverById, pairDevice, retireSeal } = useDemo();
  const [pairing, setPairing] = useState<string | null>(null);
  const [retiring, setRetiring] = useState<string | null>(null);
  const [jobChoice, setJobChoice] = useState("");
  const pairable = jobs.filter(
    (j) =>
      j.status === "Booked" &&
      (!j.sealId || seals.find((s) => s.id === j.sealId)?.status === "Available"),
  );
  const count = (st: string) => seals.filter((s) => s.status === st).length;

  return (
    <>
      <PageHeader
        title="Smart-seal inventory"
        description="Simulated device records. Actions update the demonstration state only — no hardware is controlled."
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <MetricCard
          label="Available"
          value={count("Available")}
          icon={<LockOpen className="h-4 w-4" />}
          tone="neutral"
        />
        <MetricCard
          label="Paired / Active"
          value={count("Paired") + count("Active")}
          icon={<Lock className="h-4 w-4" />}
          tone="success"
        />
        <MetricCard
          label="Breach Detected"
          value={count("Breach Detected")}
          icon={<ShieldAlert className="h-4 w-4" />}
          tone="danger"
        />
        <MetricCard
          label="Retired"
          value={count("Retired")}
          icon={<Archive className="h-4 w-4" />}
          tone="neutral"
        />
      </div>
      <Panel>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Smart-Seal ID</TableHead>
                <TableHead>Device Status</TableHead>
                <TableHead>Assigned Job</TableHead>
                <TableHead>Paired Driver</TableHead>
                <TableHead>Last Recorded Event</TableHead>
                <TableHead>Seal Integrity</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {seals.map((s) => {
                const job = jobs.find((j) => j.id === s.jobId);
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs font-medium">{s.id}</TableCell>
                    <TableCell>
                      <SealIndicator status={s.status} />
                    </TableCell>
                    <TableCell className="font-mono text-xs">{job?.reference ?? "—"}</TableCell>
                    <TableCell>{driverById(s.driverId)?.name ?? "—"}</TableCell>
                    <TableCell
                      className="max-w-56 truncate text-sm text-muted-foreground"
                      title={s.lastEvent}
                    >
                      {s.lastEvent}
                    </TableCell>
                    <TableCell>
                      <Pill
                        tone={
                          s.integrity === "Intact"
                            ? "success"
                            : s.integrity === "Breach"
                              ? "danger"
                              : "neutral"
                        }
                      >
                        {s.integrity}
                      </Pill>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1.5">
                        {s.status === "Available" && !s.jobId && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setPairing(s.id);
                              setJobChoice("");
                            }}
                          >
                            Pair Device
                          </Button>
                        )}
                        {job && (
                          <Button size="sm" variant="ghost" asChild>
                            <Link to="/partner/jobs/$jobId" params={{ jobId: job.id }}>
                              View Job
                            </Link>
                          </Button>
                        )}
                        {(s.status === "Available" || s.status === "Breach Detected") &&
                          !(
                            s.status === "Breach Detected" &&
                            job &&
                            job.status !== "Completed"
                          ) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() => setRetiring(s.id)}
                            >
                              Retire
                            </Button>
                          )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Panel>

      <Dialog open={!!pairing} onOpenChange={(o) => !o && setPairing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pair {pairing}</DialogTitle>
            <DialogDescription>
              Simulated pairing to a booked job. No Bluetooth or NFC is used.
            </DialogDescription>
          </DialogHeader>
          {pairable.length === 0 ? (
            <p className="text-sm text-muted-foreground">No booked jobs are awaiting a seal.</p>
          ) : (
            <Field label="Booked job">
              <select
                className={selectClass}
                value={jobChoice}
                onChange={(e) => setJobChoice(e.target.value)}
              >
                <option value="">Select a job…</option>
                {pairable.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.reference} — {j.itemDescription}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPairing(null)}>
              Cancel
            </Button>
            <Button
              disabled={!jobChoice}
              onClick={() => {
                try {
                  pairDevice(pairing!, jobChoice);
                  toast.success(`${pairing} paired`);
                  setPairing(null);
                } catch (err) {
                  toast.error((err as Error).message);
                }
              }}
            >
              Pair device
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!retiring} onOpenChange={(o) => !o && setRetiring(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retire {retiring}?</AlertDialogTitle>
            <AlertDialogDescription>
              The device will no longer be available for pairing in this demonstration.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                try {
                  retireSeal(retiring!);
                  toast.success(`${retiring} retired`);
                } catch (err) {
                  toast.error((err as Error).message);
                }
              }}
            >
              Retire device
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
