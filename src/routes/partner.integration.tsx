import { createFileRoute } from "@tanstack/react-router";
import { Code2, Smartphone, Cpu, CheckCircle2 } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader, Panel, Pill, fmt } from "@/components/sr/primitives";
import { useDemo } from "@/state/demo-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/partner/integration")({
  head: () => ({
    meta: [
      { title: "Integration & usage — SentinelRoute" },
      {
        name: "description",
        content: "Partner integration model, subscription tiers and verification usage.",
      },
      { property: "og:title", content: "Integration & usage — SentinelRoute" },
      { property: "og:description", content: "Partner integration model and verification usage." },
    ],
  }),
  component: IntegrationPage,
});

const usage = [
  { month: "May", events: 412 },
  { month: "Jun", events: 538 },
  { month: "Jul", events: 611 },
  { month: "Aug", events: 597 },
  { month: "Sep", events: 702 },
  { month: "Oct", events: 0 },
];

const tiers = [
  { name: "Starter", price: "£299" },
  { name: "Growth", price: "£699", current: true },
  { name: "Enterprise", price: "£1,499" },
];

const blocks = [
  {
    icon: Code2,
    title: "Verification API",
    body: "Operators submit and retrieve custody events and verification results from their own dispatch systems.",
  },
  {
    icon: Smartphone,
    title: "Mobile Capture SDK",
    body: "Embeds seal pairing, collection, handover and delivery evidence capture into the operator's driver app.",
  },
  {
    icon: Cpu,
    title: "Smart-Seal Hardware",
    body: "Reusable tamper-evident seals report pairing and integrity state against each custody job.",
  },
];

function IntegrationPage() {
  const { events, jobs } = useDemo();
  const octVerified = events.filter(
    (e) => e.verification === "Verified" && e.timestamp.startsWith("2026-10"),
  ).length;
  const data = usage.map((u) => (u.month === "Oct" ? { ...u, events: 640 + octVerified } : u));
  const recent = [...events].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 8);

  return (
    <>
      <PageHeader
        title="Partner integration & usage"
        description="Courier operators integrate SentinelRoute's verification infrastructure into their own applications. Partners keep responsibility for drivers, vehicles, customers and fulfilment."
      />
      <div className="grid gap-4 md:grid-cols-3">
        {blocks.map((b) => (
          <Panel key={b.title}>
            <b.icon className="h-5 w-5 text-success" />
            <h3 className="mt-3 font-semibold">{b.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{b.body}</p>
            <p className="mt-3 text-xs text-muted-foreground">
              Overview only — no live endpoints in this prototype.
            </p>
          </Panel>
        ))}
      </div>

      <h2 className="mb-3 mt-8 text-lg font-semibold">Proposed B2B partner subscriptions</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {tiers.map((t) => (
          <div
            key={t.name}
            className={cn(
              "rounded-xl border bg-card p-6 shadow-card",
              t.current && "border-success ring-1 ring-success",
            )}
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold">{t.name}</p>
              {t.current && <Pill tone="success">Current demonstration plan</Pill>}
            </div>
            <p className="mt-3 font-display text-3xl font-semibold">
              {t.price}
              <span className="text-sm font-normal text-muted-foreground"> / month</span>
            </p>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Indicative pricing from the business plan. No checkout or billing in this prototype.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <Panel title="Verified event usage (mock)" className="lg:col-span-3">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area
                  dataKey="events"
                  stroke="var(--chart-2)"
                  fill="var(--chart-2)"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {jobs.length} demonstration jobs · October includes {octVerified} verified events from
            this session's dataset.
          </p>
        </Panel>
        <Panel title="Recent verification activity" className="lg:col-span-2">
          <ul className="space-y-3 text-sm">
            {recent.map((e) => (
              <li key={e.id} className="flex items-start gap-2">
                <CheckCircle2
                  className={cn(
                    "mt-0.5 h-4 w-4 shrink-0",
                    e.verification === "Verified" ? "text-success" : "text-destructive",
                  )}
                />
                <div>
                  <p>
                    {e.type} ·{" "}
                    <span className="font-mono text-xs">
                      {jobs.find((j) => j.id === e.jobId)?.reference}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">{fmt(e.timestamp)}</p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
