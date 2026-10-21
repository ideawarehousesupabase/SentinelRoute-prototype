import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  PackageSearch,
  Truck,
  Building2,
  Lock,
  ListChecks,
  Link2,
  ScanEye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo, PrototypeBanner } from "@/components/sr/primitives";
import hero from "@/assets/hero-seal.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SentinelRoute — Custody verification for couriers (prototype)" },
      {
        name: "description",
        content:
          "Interactive prototype of the Custody Integrity Engine: smart seals, mobile capture, chained custody records and rule-based anomaly review.",
      },
      { property: "og:title", content: "SentinelRoute — Custody verification prototype" },
      {
        property: "og:description",
        content:
          "Smart-seal custody verification for high-consequence courier deliveries. Prototype demonstration.",
      },
    ],
  }),
  component: Index,
});

const pillars = [
  {
    icon: Lock,
    title: "Reusable smart seals",
    body: "Tamper-evident seal hardware paired to each custody job.",
  },
  {
    icon: ListChecks,
    title: "Mobile custody capture",
    body: "Drivers record collection, handover and delivery evidence.",
  },
  {
    icon: Link2,
    title: "Chained custody ledger",
    body: "Each event linked to the previous one to expose inconsistencies.",
  },
  {
    icon: ScanEye,
    title: "Rule-based anomaly checks",
    body: "Seal breaches, GPS and timing mismatches flagged for review.",
  },
];

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <section className="bg-hero text-navy-foreground">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
          <Logo light />
          <div className="flex gap-2">
            <Button asChild variant="heroOutline" size="sm">
              <Link to="/track">Track</Link>
            </Button>
            <Button asChild variant="hero" size="sm">
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </div>
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-8 md:grid-cols-2 md:pb-24">
          <div>
            <p className="text-sm font-medium uppercase tracking-widest text-success">
              Custody Integrity Engine
            </p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight md:text-5xl">
              Verifiable custody for deliveries that can't go wrong.
            </h1>
            <p className="mt-4 max-w-lg text-navy-muted">
              SentinelRoute gives UK courier operators the verification layer for property keys,
              signed agreements and confidential documents — integrated into their own operations.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="hero" size="lg">
                <Link to="/login">
                  Open the demo <ArrowRight />
                </Link>
              </Button>
              <Button asChild variant="heroOutline" size="lg">
                <Link to="/book">Book a delivery</Link>
              </Button>
            </div>
          </div>
          <img
            src={hero}
            alt="Smart seal attached to a sealed envelope and property keys"
            width={1280}
            height={960}
            className="rounded-2xl border border-navy-foreground/10 shadow-2xl"
          />
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-12">
        <PrototypeBanner className="mb-10" />
        <div className="grid gap-4 md:grid-cols-4">
          {pillars.map((p) => (
            <div key={p.title} className="rounded-xl border bg-card p-5 shadow-card">
              <p.icon className="h-5 w-5 text-success" />
              <h3 className="mt-3 font-semibold">{p.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.body}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-14 text-xl font-semibold">Explore the prototype</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <EntryCard
            to="/login"
            icon={Building2}
            title="Partner operator"
            body="Monitor jobs, seals, the custody ledger and anomaly alerts."
          />
          <EntryCard
            to="/login"
            icon={Truck}
            title="Courier driver"
            body="Mobile workflow to pair seals and capture custody evidence."
          />
          <EntryCard
            to="/track"
            icon={PackageSearch}
            title="Customer / recipient"
            body="Track a delivery or view a custody certificate — no account needed."
          />
        </div>
      </main>
    </div>
  );
}

function EntryCard({
  to,
  icon: Icon,
  title,
  body,
}: {
  to: "/login" | "/track";
  icon: typeof Truck;
  title: string;
  body: string;
}) {
  return (
    <Link
      to={to}
      className="group rounded-xl border bg-card p-6 shadow-card transition hover:border-success/50"
    >
      <Icon className="h-6 w-6 text-primary" />
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-success">
        Open <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
