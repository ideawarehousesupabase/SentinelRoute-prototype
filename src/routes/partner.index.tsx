import { createFileRoute, Link } from "@tanstack/react-router";
import { Boxes, Activity, CheckCircle2, ShieldAlert, BadgeCheck } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { MetricCard, PageHeader, Panel } from "@/components/sr/primitives";
import { JobTable } from "@/components/sr/JobTable";
import { useDemo } from "@/state/demo-store";
import type { JobStatus } from "@/lib/types";

export const Route = createFileRoute("/partner/")({
  head: () => ({
    meta: [
      { title: "Partner dashboard — SentinelRoute" },
      { name: "description", content: "Custody-verification activity overview." },
      { property: "og:title", content: "Partner dashboard — SentinelRoute" },
      { property: "og:description", content: "Custody-verification activity overview." },
    ],
  }),
  component: Dashboard,
});

const ACTIVE: JobStatus[] = ["Awaiting Collection", "Collected", "In Transit", "At Delivery"];
const ORDER: JobStatus[] = [
  "Booked",
  "Awaiting Collection",
  "Collected",
  "In Transit",
  "At Delivery",
  "Completed",
  "Flagged",
];

function Dashboard() {
  const { jobs, events, anomalies } = useDemo();
  const flaggedEvents = events.filter((e) => e.verification === "Flagged").length;
  const verifiedEvents = events.filter((e) => e.verification === "Verified").length;
  const byStatus = ORDER.map((s) => ({
    status: s.replace("Awaiting ", "Await. "),
    count: jobs.filter((j) => j.status === s).length,
  }));
  const openAlerts = anomalies.filter((a) => a.reviewStatus !== "Reviewed").length;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Overview of custody-verification activity across your jobs."
        action={
          <Button asChild>
            <Link to="/partner/jobs" search={{ create: true }}>
              Create job
            </Link>
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          label="Total Custody Jobs"
          value={jobs.length}
          icon={<Boxes className="h-4 w-4" />}
        />
        <MetricCard
          label="Active Jobs"
          value={jobs.filter((j) => ACTIVE.includes(j.status)).length}
          icon={<Activity className="h-4 w-4" />}
        />
        <MetricCard
          label="Completed Jobs"
          value={jobs.filter((j) => j.status === "Completed").length}
          icon={<CheckCircle2 className="h-4 w-4" />}
          tone="success"
        />
        <MetricCard
          label="Flagged Events"
          value={flaggedEvents}
          icon={<ShieldAlert className="h-4 w-4" />}
          tone="danger"
          hint={`${openAlerts} alert(s) awaiting review`}
        />
        <MetricCard
          label="Verified Custody Events"
          value={verifiedEvents}
          icon={<BadgeCheck className="h-4 w-4" />}
          tone="success"
        />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Panel
          title="Recent jobs"
          className="xl:col-span-2"
          action={
            <Link
              to="/partner/jobs"
              search={{}}
              className="text-sm font-medium text-primary hover:underline"
            >
              All jobs
            </Link>
          }
        >
          <JobTable
            jobs={[...jobs].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6)}
          />
        </Panel>
        <Panel title="Jobs by status">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byStatus} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="status" width={92} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="var(--chart-2)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </>
  );
}
