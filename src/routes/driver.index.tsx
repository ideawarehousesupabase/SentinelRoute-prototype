import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, MapPin, Clock } from "lucide-react";
import { EmptyState, JobStatusBadge, fmt, selectClass } from "@/components/sr/primitives";
import { useDemo } from "@/state/demo-store";
import { useDriverProfile } from "@/lib/use-driver-profile";
import type { CustodyJob } from "@/lib/types";

export const Route = createFileRoute("/driver/")({
  head: () => ({
    meta: [
      { title: "My jobs — SentinelRoute driver" },
      { name: "description", content: "Assigned custody jobs for the demo driver." },
      { property: "og:title", content: "My jobs — SentinelRoute driver" },
      { property: "og:description", content: "Assigned custody jobs for the demo driver." },
    ],
  }),
  component: DriverJobs,
});

function DriverJobs() {
  const { jobs, drivers } = useDemo();
  const { driver, choose } = useDriverProfile();
  const mine = jobs.filter((j) => j.driverId === driver.id);
  const assigned = mine.filter((j) => j.status === "Booked");
  const active = mine.filter((j) => !["Booked", "Completed"].includes(j.status));
  const done = mine.filter((j) => j.status === "Completed");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">My jobs</h1>
        <label className="mt-3 block text-xs text-muted-foreground">
          Demo driver profile
          <select
            className={`${selectClass} mt-1 h-11`}
            value={driver.id}
            onChange={(e) => choose(e.target.value)}
          >
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.ref})
              </option>
            ))}
          </select>
        </label>
      </div>
      <Section title="Active" jobs={active} />
      <Section title="Assigned" jobs={assigned} />
      <Section title="Completed" jobs={done} />
    </div>
  );
}

function Section({ title, jobs }: { title: string; jobs: CustodyJob[] }) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title} · {jobs.length}
      </h2>
      {jobs.length === 0 ? (
        <EmptyState title={`No ${title.toLowerCase()} jobs`} />
      ) : (
        <div className="space-y-3">
          {jobs.map((j) => (
            <Link
              key={j.id}
              to="/driver/$jobId"
              params={{ jobId: j.id }}
              className="block rounded-xl border bg-card p-4 shadow-card active:scale-[0.99]"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-semibold">{j.reference}</span>
                <JobStatusBadge status={j.status} />
              </div>
              <p className="mt-1 font-medium">{j.itemDescription}</p>
              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                <p className="flex gap-1.5">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                  {j.collection.label} → {j.delivery.label}
                </p>
                <p className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {fmt(j.collectionAt)}
                </p>
              </div>
              <span className="mt-2 flex items-center justify-end text-sm font-medium text-primary">
                Open <ChevronRight className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
