import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, PageHeader, Panel } from "@/components/sr/primitives";
import { PublicShell } from "@/components/sr/PublicHeader";
import { useDemo } from "@/state/demo-store";
import type { CustodyJob } from "@/lib/types";

export const Route = createFileRoute("/book")({
  head: () => ({
    meta: [
      { title: "Direct booking — SentinelRoute demo" },
      { name: "description", content: "Submit a demonstration custody-verified delivery booking." },
      { property: "og:title", content: "Direct booking — SentinelRoute" },
      {
        property: "og:description",
        content: "Demonstration booking channel for SMEs and individuals.",
      },
    ],
  }),
  component: BookPage,
});

const schema = z.object({
  customerName: z.string().trim().min(2, "Enter a name").max(80),
  email: z.string().trim().email("Enter a valid email").max(120),
  collection: z.string().trim().min(5, "Enter a collection location").max(160),
  delivery: z.string().trim().min(5, "Enter a delivery location").max(160),
  itemDescription: z.string().trim().min(3, "Describe the item").max(200),
  collectionAt: z.string().min(1, "Choose a date and time"),
});

function BookPage() {
  const { createBooking } = useDemo();
  const empty = {
    customerName: "",
    email: "",
    collection: "",
    delivery: "",
    itemDescription: "",
    collectionAt: "",
  };
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState<CustodyJob | null>(null);
  const set =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [k]: e.target.value });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = schema.safeParse(form);
    if (!r.success) {
      setErrors(Object.fromEntries(r.error.issues.map((i) => [i.path[0], i.message])));
      return;
    }
    setErrors({});
    setDone(createBooking(r.data));
  };

  return (
    <PublicShell>
      <PageHeader
        title="Direct booking"
        description="Secondary booking channel for SMEs and individuals. Demonstration only — no driver is dispatched and no payment is taken."
      />
      {done ? (
        <Panel>
          <div className="flex flex-col items-center py-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-success" />
            <h2 className="mt-3 text-xl font-semibold">Demonstration booking received</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border px-5 py-3">
                <p className="text-xs text-muted-foreground">Booking reference</p>
                <p className="font-mono font-medium">{done.reference}</p>
              </div>
              <div className="rounded-lg border px-5 py-3">
                <p className="text-xs text-muted-foreground">Tracking reference</p>
                <p className="font-mono font-medium">{done.trackingRef}</p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Button asChild>
                <Link to="/track" search={{ ref: done.trackingRef }}>
                  Track this booking
                </Link>
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setDone(null);
                  setForm(empty);
                }}
              >
                New booking
              </Button>
            </div>
          </div>
        </Panel>
      ) : (
        <Panel>
          <form onSubmit={submit} className="grid gap-4 md:grid-cols-2" noValidate>
            <Field label="Customer name" error={errors.customerName}>
              <Input value={form.customerName} onChange={set("customerName")} />
            </Field>
            <Field label="Contact email" error={errors.email}>
              <Input type="email" value={form.email} onChange={set("email")} />
            </Field>
            <Field label="Collection location" error={errors.collection}>
              <Input
                value={form.collection}
                onChange={set("collection")}
                placeholder="e.g. 10 Baker St, London NW1"
              />
            </Field>
            <Field label="Delivery location" error={errors.delivery}>
              <Input
                value={form.delivery}
                onChange={set("delivery")}
                placeholder="e.g. 22 Fleet St, London EC4"
              />
            </Field>
            <div className="md:col-span-2">
              <Field label="Item description" error={errors.itemDescription}>
                <Textarea value={form.itemDescription} onChange={set("itemDescription")} rows={3} />
              </Field>
            </div>
            <Field label="Preferred collection date/time" error={errors.collectionAt}>
              <Input
                type="datetime-local"
                value={form.collectionAt}
                onChange={set("collectionAt")}
              />
            </Field>
            <div className="flex items-end">
              <Button type="submit" className="w-full md:w-auto">
                Submit booking
              </Button>
            </div>
          </form>
        </Panel>
      )}
    </PublicShell>
  );
}
