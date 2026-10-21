import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, PageHeader, Panel, selectClass } from "@/components/sr/primitives";
import { JobTable } from "@/components/sr/JobTable";
import { useDemo } from "@/state/demo-store";
import type { ItemCategory, JobStatus, VerificationStatus } from "@/lib/types";

const search = z.object({
  create: z.boolean().optional(),
  status: z.string().optional(),
  verification: z.string().optional(),
  driver: z.string().optional(),
});

export const Route = createFileRoute("/partner/jobs/")({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "Custody jobs — SentinelRoute" },
      { name: "description", content: "All demonstration custody jobs." },
      { property: "og:title", content: "Custody jobs — SentinelRoute" },
      { property: "og:description", content: "All demonstration custody jobs." },
    ],
  }),
  component: JobsPage,
});

const STATUSES: JobStatus[] = [
  "Booked",
  "Awaiting Collection",
  "Collected",
  "In Transit",
  "At Delivery",
  "Completed",
  "Flagged",
];
const VERIF: VerificationStatus[] = ["Pending", "Verified", "Flagged", "Review Cleared"];
const CATS: ItemCategory[] = [
  "Property Keys",
  "Signed Agreement",
  "Confidential Documents",
  "Legal Papers",
  "Other Sensitive Item",
];

function JobsPage() {
  const s = Route.useSearch();
  const navigate = useNavigate({ from: "/partner/jobs/" });
  const { jobs, drivers } = useDemo();
  const setFilter = (k: "status" | "verification" | "driver", v: string) =>
    navigate({ search: (p) => ({ ...p, [k]: v || undefined }) });

  const filtered = jobs.filter(
    (j) =>
      (!s.status || j.status === s.status) &&
      (!s.verification || j.verification === s.verification) &&
      (!s.driver || (s.driver === "none" ? !j.driverId : j.driverId === s.driver)),
  );

  return (
    <>
      <PageHeader
        title="Custody jobs"
        description="All demonstration custody jobs. Job data is held in this browser only."
        action={
          <Button onClick={() => navigate({ search: (p) => ({ ...p, create: true }) })}>
            <Plus /> Create Job
          </Button>
        }
      />
      <Panel>
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <select
            className={selectClass}
            value={s.status ?? ""}
            onChange={(e) => setFilter("status", e.target.value)}
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            {STATUSES.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
          <select
            className={selectClass}
            value={s.verification ?? ""}
            onChange={(e) => setFilter("verification", e.target.value)}
            aria-label="Filter by verification"
          >
            <option value="">All verification</option>
            {VERIF.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
          <select
            className={selectClass}
            value={s.driver ?? ""}
            onChange={(e) => setFilter("driver", e.target.value)}
            aria-label="Filter by driver"
          >
            <option value="">All drivers</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
            <option value="none">Unassigned</option>
          </select>
        </div>
        <JobTable jobs={filtered} />
      </Panel>
      <CreateJobDialog
        open={!!s.create}
        onClose={() => navigate({ search: (p) => ({ ...p, create: undefined }) })}
      />
    </>
  );
}

const schema = z
  .object({
    reference: z
      .string()
      .trim()
      .regex(/^SR-[A-Z0-9-]{3,12}$/i, "Use the format SR-1234"),
    itemDescription: z.string().trim().min(3, "Describe the item").max(200),
    itemCategory: z.enum(CATS as [ItemCategory, ...ItemCategory[]], {
      errorMap: () => ({ message: "Choose a category" }),
    }),
    collection: z.string().trim().min(5, "Enter a collection location").max(160),
    delivery: z.string().trim().min(5, "Enter a delivery location").max(160),
    driverId: z.string().min(1, "Assign a driver"),
    sealId: z.string().min(1, "Assign a smart-seal"),
    collectionAt: z.string().min(1, "Required"),
    deliveryAt: z.string().min(1, "Required"),
  })
  .refine((d) => new Date(d.deliveryAt) > new Date(d.collectionAt), {
    path: ["deliveryAt"],
    message: "Delivery must be after collection",
  });

function CreateJobDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { jobs, drivers, seals, createJob } = useDemo();
  const next = `SR-${1049 + jobs.filter((j) => j.source === "partner").length - 8}`;
  const empty = {
    reference: "",
    itemDescription: "",
    itemCategory: "",
    collection: "",
    delivery: "",
    driverId: "",
    sealId: "",
    collectionAt: "",
    deliveryAt: "",
  };
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const free = seals.filter((x) => x.status === "Available" && !x.jobId);
  const set =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm({ ...form, [k]: e.target.value });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...form, reference: form.reference || next };
    const r = schema.safeParse(data);
    const errs: Record<string, string> = r.success
      ? {}
      : Object.fromEntries(r.error.issues.map((i) => [i.path[0], i.message]));
    if (jobs.some((j) => j.reference.toLowerCase() === data.reference.toLowerCase()))
      errs.reference = "Reference already exists";
    if (Object.keys(errs).length || !r.success) {
      setErrors(errs);
      return;
    }
    try {
      const job = createJob(r.data);
      toast.success(
        `${job.reference} created and assigned to ${drivers.find((d) => d.id === job.driverId)?.name}`,
      );
      setForm(empty);
      setErrors({});
      onClose();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create custody job</DialogTitle>
          <DialogDescription>
            The job is created with status Booked and appears in the assigned driver's job list.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
          <Field label="Job reference" error={errors.reference} hint={`Leave blank to use ${next}`}>
            <Input value={form.reference} placeholder={next} onChange={set("reference")} />
          </Field>
          <Field label="Item category" error={errors.itemCategory}>
            <select
              className={selectClass}
              value={form.itemCategory}
              onChange={set("itemCategory")}
            >
              <option value="">Select…</option>
              {CATS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Item description" error={errors.itemDescription}>
              <Input value={form.itemDescription} onChange={set("itemDescription")} />
            </Field>
          </div>
          <Field label="Collection location" error={errors.collection}>
            <Input value={form.collection} onChange={set("collection")} />
          </Field>
          <Field label="Delivery location" error={errors.delivery}>
            <Input value={form.delivery} onChange={set("delivery")} />
          </Field>
          <Field label="Assigned driver" error={errors.driverId}>
            <select className={selectClass} value={form.driverId} onChange={set("driverId")}>
              <option value="">Select…</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.ref})
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Assigned smart-seal"
            error={errors.sealId}
            hint={`${free.length} seal(s) available`}
          >
            <select className={selectClass} value={form.sealId} onChange={set("sealId")}>
              <option value="">Select…</option>
              {free.map((x) => (
                <option key={x.id}>{x.id}</option>
              ))}
            </select>
          </Field>
          <Field label="Collection date/time" error={errors.collectionAt}>
            <Input type="datetime-local" value={form.collectionAt} onChange={set("collectionAt")} />
          </Field>
          <Field label="Delivery date/time" error={errors.deliveryAt}>
            <Input type="datetime-local" value={form.deliveryAt} onChange={set("deliveryAt")} />
          </Field>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Create job</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
